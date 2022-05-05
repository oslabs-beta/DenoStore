import { assert } from 'https://deno.land/std@0.134.0/testing/asserts.ts';
import { superoak } from 'https://deno.land/x/superoak@4.7.0/mod.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';
import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { makeExecutableSchema } from 'https://deno.land/x/graphql_tools@0.0.2/mod.ts';
import { DenoStore } from '../mod.ts';
import { typeDefs } from './schema/typeDefs.ts';
import { resolvers } from './schema/resolver.ts';

/**
 test application invocation worked
 test DenoStore function returned instance of DenoStore imported class
 test optional arguments working properly in DenoStore function
 test routes working
 test speed reduction of repeated query (aka cache worked)

 mock schemas
 mock queries
 */

Deno.test('DenoStore started for standard setup', async (t) => {
  const redisClient = await connect({
    hostname: 'localhost',
    port: 6379,
  });
  const ds = new DenoStore({
    route: '/graphql',
    usePlayground: false,
    schema: { typeDefs, resolvers },
    redisClient,
  });

  const app = new Application();
  app.use(ds.routes(), ds.allowedMethods());

  let firstCallTime: number;

  await t.step('Accept query and respond with correct query', async () => {
    const testQuery =
      '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

    const request = await superoak(app, true);
    const start = Date.now();
    await request
      .post('/graphql')
      .type('json')
      .send({ query: testQuery })
      .expect(
        '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
      );
    firstCallTime = Date.now() - start;
  });
  await t.step('Same exact query (Testing Caching ability)', async (t) => {
    const testQuery =
      '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

    const request = await superoak(app, true);
    const start = Date.now();
    await request
      .post('/graphql')
      .type('json')
      .send({ query: testQuery })
      .expect(
        '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
      );

    await t.step('Speed of query is faster than first call', () => {
      const secondCallTime: number = Date.now() - start;
      assert(firstCallTime > secondCallTime);
    });
  });

  await t.step(
    'Same query, but with different fields (Testing Caching ability)',
    async (t) => {
      const testQuery =
        '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n   country\n}\n}\n';

      const request = await superoak(app, true);
      const start = Date.now();
      await request
        .post('/graphql')
        .type('json')
        .send({ query: testQuery })
        .expect(
          '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket","country":"United States"}}}'
        );

      await t.step(
        'Speed of query with different fields is faster than first call',
        () => {
          const thirdCallTime: number = Date.now() - start;
          assert(firstCallTime > thirdCallTime);
        }
      );
    }
  );

  await redisClient.flushdb();
  await redisClient.close();

  // console.log(Deno.resources());
});

Deno.test({
  name: 'DenoStore started using redis port',
  fn: async (t) => {
    const ds = new DenoStore({
      route: '/graphql',
      usePlayground: false,
      schema: { typeDefs, resolvers },
      redisPort: 6379,
    });

    const app = new Application();
    app.use(ds.routes(), ds.allowedMethods());

    let firstCallTime: number;

    await t.step('Accept query and respond with correct query', async () => {
      const testQuery =
        '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

      const request = await superoak(app, true);
      const start = Date.now();
      await request
        .post('/graphql')
        .type('json')
        .send({ query: testQuery })
        .expect(
          '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
        );
      firstCallTime = Date.now() - start;
    });
    await t.step('Same exact query (Testing Caching ability)', async (t) => {
      const testQuery =
        '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

      const request = await superoak(app, true);
      const start = Date.now();
      await request
        .post('/graphql')
        .type('json')
        .send({ query: testQuery })
        .expect(
          '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
        );

      await t.step('Speed of query is faster than first call', () => {
        const secondCallTime: number = Date.now() - start;
        assert(firstCallTime > secondCallTime);
      });
    });
    await t.step(
      'Same query, but with different fields (Testing Caching ability)',
      async (t) => {
        const testQuery =
          '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n   country\n}\n}\n';

        const request = await superoak(app, true);
        const start = Date.now();
        await request
          .post('/graphql')
          .type('json')
          .send({ query: testQuery })
          .expect(
            '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket","country":"United States"}}}'
          );

        await t.step(
          'Speed of query with different fields is faster than first call',
          () => {
            const thirdCallTime: number = Date.now() - start;
            assert(firstCallTime > thirdCallTime);
          }
        );
      }
    );
    await ds.clear();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test('DenoStore started passing in schema', async (t) => {
  const redisClient = await connect({
    hostname: 'localhost',
    port: 6379,
  });

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const ds = new DenoStore({
    route: '/graphql',
    usePlayground: false,
    schema,
    redisClient,
  });

  const app = new Application();
  app.use(ds.routes(), ds.allowedMethods());

  let firstCallTime: number;

  await t.step('Accept query and respond with correct query', async () => {
    const testQuery =
      '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

    const request = await superoak(app, true);
    const start = Date.now();
    await request
      .post('/graphql')
      .type('json')
      .send({ query: testQuery })
      .expect(
        '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
      );
    firstCallTime = Date.now() - start;
  });
  await t.step('Same exact query (Testing Caching ability)', async (t) => {
    const testQuery =
      '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

    const request = await superoak(app, true);
    const start = Date.now();
    await request
      .post('/graphql')
      .type('json')
      .send({ query: testQuery })
      .expect(
        '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
      );

    await t.step('Speed of query is faster than first call', () => {
      const secondCallTime: number = Date.now() - start;
      assert(firstCallTime > secondCallTime);
    });
  });
  await t.step(
    'Same query, but with different fields (Testing Caching ability)',
    async (t) => {
      const testQuery =
        '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n   country\n}\n}\n';

      const request = await superoak(app, true);
      const start = Date.now();
      await request
        .post('/graphql')
        .type('json')
        .send({ query: testQuery })
        .expect(
          '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket","country":"United States"}}}'
        );

      await t.step(
        'Speed of query with different fields is faster than first call',
        () => {
          const thirdCallTime: number = Date.now() - start;
          assert(firstCallTime > thirdCallTime);
        }
      );
    }
  );

  await redisClient.flushdb();
  await redisClient.close();
});
