import {
  assertEquals,
  assertNotEquals,
} from 'https://deno.land/std@0.134.0/testing/asserts.ts';
import { superoak } from 'https://deno.land/x/superoak@4.7.0/mod.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';
import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { typeDefs } from './typeDefs.ts';
import { resolvers } from './resolver.ts';
import { Denostore } from '../mod.ts';

/**
 test application invocation worked
 test denostore function returned instance of denostore imported class
 test optional arguments working properly in denostore function
 test routes working
 test speed reduction of repeated query (aka cache worked)

 mock schemas
 mock queries
 */
// Compact form: name and function
// Deno.test('hello world #1', () => {
//   const x = 1 + 2;
//   assertEquals(x, 3);
// });

//test Redis connection and caching
// Deno.test('redisClient', async (t) => {
//   const redisClient = await connect({
//     hostname: 'localhost',
//     port: 6379,
//   });

//   await t.step('key/value saved to cache successfully', async () => {
//     await redisClient.set('key', 'value');
//     const test = await redisClient.get('key');
//     assertEquals('value', test);
//   });
//   await t.step('clear cache successfully', async () => {
//     await redisClient.flushdb();
//     const test = await redisClient.get('key');
//     assertNotEquals('value', test);
//   });
//   redisClient.quit();
// });

Deno.test('Denostore started', async (t) => {
  const redisClient = await connect({
    hostname: 'localhost',
    port: 6379,
  });
  const denostore = new Denostore({
    route: '/graphql',
    usePlayground: false,
    schema: { typeDefs, resolvers },
    redisClient,
  });

  const app = new Application();
  app.use(denostore.routes(), denostore.allowedMethods());
  await t.step('accept query and respond with correct query', async () => {
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
  redisClient.flushall();
  redisClient.close();
  // console.log(Deno.resources());
});
