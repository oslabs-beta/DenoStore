import {
  assert,
  assertEquals,
} from 'https://deno.land/std@0.134.0/testing/asserts.ts';
import { superoak } from 'https://deno.land/x/superoak@4.7.0/mod.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';
import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { DenoStore } from '../mod.ts';
import { typeDefs } from './schema/typeDefs.ts';
import { resolvers } from './schema/expireResolver.ts';
import { delay } from 'https://deno.land/std@0.137.0/async/mod.ts';

Deno.test('Expiration testing', async (t) => {
  const redisClient = await connect({
    hostname: 'localhost',
    port: 6379,
  });
  const DenoStoreCache = new DenoStore({
    route: '/graphql',
    usePlayground: false,
    schema: { typeDefs, resolvers },
    redisClient,
    defaultEx: 10,
  });

  const app = new Application();
  app.use(DenoStoreCache.routes(), DenoStoreCache.allowedMethods());

  await t.step('Accept query and respond with correct query', async () => {
    const testQuery =
      '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

    const request = await superoak(app, true);
    await request
      .post('/graphql')
      .type('json')
      .send({ query: testQuery })
      .expect(
        '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
      );
  });

  await t.step('Confirm result has been cached', async () => {
    const keys = await redisClient.keys('*');
    assertEquals(keys.length, 1);
  });

  await t.step('Confirm resolver level expiration working', async () => {
    // delay 5 seconds
    await delay(5000);
    const keysAfterExpire = await redisClient.keys('*');
    assertEquals(keysAfterExpire.length, 0);
  });

  await t.step('Accept query and confirm result has been cached', async () => {
    const testQuery =
      '{\n  rockets {\n    rocket_name\n    rocket_type\n  }\n}\n';

    const request = await superoak(app, true);
    await request.post('/graphql').type('json').send({ query: testQuery });

    const keys = await redisClient.keys('*');
    assertEquals(keys.length, 1);
  });

  await t.step('Confirm default expiration working', async () => {
    // delay 10 seconds
    await delay(10000);
    const keysAfterExpire = await redisClient.keys('*');
    assertEquals(keysAfterExpire.length, 0);
  });

  await redisClient.flushdb();
  await redisClient.close();
});
