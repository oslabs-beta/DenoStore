import {
  // assertEquals,
  // assertNotEquals,
  assert,
} from 'https://deno.land/std@0.134.0/testing/asserts.ts';
import { superoak } from 'https://deno.land/x/superoak@4.7.0/mod.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';
import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { makeExecutableSchema } from 'https://deno.land/x/graphql_tools@0.0.2/mod.ts';
// import { renderPlaygroundPage } from 'https://deno.land/x/oak_graphql@0.6.3/graphql-playground-html/render-playground-html.ts';
import { Denostore } from '../mod.ts';
import { typeDefs } from './schema/typeDefs.ts';
import { resolvers } from './schema/resolver.ts';

/**
 test application invocation worked
 test denostore function returned instance of denostore imported class
 test optional arguments working properly in denostore function
 test routes working
 test speed reduction of repeated query (aka cache worked)

 mock schemas
 mock queries
 */

// Deno.test('Serving UI page on GET request', async () => {
//   const redisClient = await connect({
//     hostname: 'localhost',
//     port: 6379,
//   });

//   const denostore = new Denostore({
//     usePlayground: true,
//     schema: { typeDefs, resolvers },
//     redisClient,
//   });

//   const app = new Application();
//   app.use(denostore.routes(), denostore.allowedMethods());

//   const UI = renderPlaygroundPage({});
//   const request = await superoak(app, true);
//   await request.get('/graphql').expect(200).expect(UI);

//   await redisClient.flushdb();
//   await redisClient.close();
// });

Deno.test('Denostore started for standard setup', async (t) => {
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

  let firstCallTime: number;

  await t.step('Accept query and respond with correct query', async () => {
    const testQuery =
      '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

    const request = await superoak(app, true);
    const start = new Date().getMilliseconds();
    await request
      .post('/graphql')
      .type('json')
      .send({ query: testQuery })
      .expect(
        '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
      );
    firstCallTime = new Date().getMilliseconds() - start;
  });
  await t.step('Same exact query (Testing Caching ability)', async (t) => {
    const testQuery =
      '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

    const request = await superoak(app, true);
    const start = new Date().getMilliseconds();
    await request
      .post('/graphql')
      .type('json')
      .send({ query: testQuery })
      .expect(
        '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
      );

    await t.step('Speed of query is faster than first call', () => {
      const secondCallTime: number = new Date().getMilliseconds() - start;
      assert(firstCallTime > secondCallTime);
    });
  });

  await t.step(
    'Same query, but with different fields (Testing Caching ability)',
    async (t) => {
      const testQuery =
        '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n   country\n}\n}\n';

      const request = await superoak(app, true);
      const start = new Date().getMilliseconds();
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
          const thirdCallTime: number = new Date().getMilliseconds() - start;
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
  name: 'Denostore started using redis port',
  fn: async (t) => {
    const denostore = new Denostore({
      route: '/graphql',
      usePlayground: false,
      schema: { typeDefs, resolvers },
      redisPort: 6379,
    });

    const app = new Application();
    app.use(denostore.routes(), denostore.allowedMethods());

    let firstCallTime: number;

    await t.step('Accept query and respond with correct query', async () => {
      const testQuery =
        '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

      const request = await superoak(app, true);
      const start = new Date().getMilliseconds();
      await request
        .post('/graphql')
        .type('json')
        .send({ query: testQuery })
        .expect(
          '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
        );
      firstCallTime = new Date().getMilliseconds() - start;
    });
    await t.step('Same exact query (Testing Caching ability)', async (t) => {
      const testQuery =
        '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

      const request = await superoak(app, true);
      const start = new Date().getMilliseconds();
      await request
        .post('/graphql')
        .type('json')
        .send({ query: testQuery })
        .expect(
          '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
        );

      await t.step('Speed of query is faster than first call', () => {
        const secondCallTime: number = new Date().getMilliseconds() - start;
        assert(firstCallTime > secondCallTime);
      });
    });
    await t.step(
      'Same query, but with different fields (Testing Caching ability)',
      async (t) => {
        const testQuery =
          '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n   country\n}\n}\n';

        const request = await superoak(app, true);
        const start = new Date().getMilliseconds();
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
            const thirdCallTime: number = new Date().getMilliseconds() - start;
            assert(firstCallTime > thirdCallTime);
          }
        );
      }
    );
    await denostore.clear();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test('Denostore started passing in schema', async (t) => {
  const redisClient = await connect({
    hostname: 'localhost',
    port: 6379,
  });

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const denostore = new Denostore({
    route: '/graphql',
    usePlayground: false,
    schema,
    redisClient,
  });

  const app = new Application();
  app.use(denostore.routes(), denostore.allowedMethods());

  let firstCallTime: number;

  await t.step('Accept query and respond with correct query', async () => {
    const testQuery =
      '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

    const request = await superoak(app, true);
    const start = new Date().getMilliseconds();
    await request
      .post('/graphql')
      .type('json')
      .send({ query: testQuery })
      .expect(
        '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
      );
    firstCallTime = new Date().getMilliseconds() - start;
  });
  await t.step('Same exact query (Testing Caching ability)', async (t) => {
    const testQuery =
      '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

    const request = await superoak(app, true);
    const start = new Date().getMilliseconds();
    await request
      .post('/graphql')
      .type('json')
      .send({ query: testQuery })
      .expect(
        '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
      );

    await t.step('Speed of query is faster than first call', () => {
      const secondCallTime: number = new Date().getMilliseconds() - start;
      assert(firstCallTime > secondCallTime);
    });
  });
  await t.step(
    'Same query, but with different fields (Testing Caching ability)',
    async (t) => {
      const testQuery =
        '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n   country\n}\n}\n';

      const request = await superoak(app, true);
      const start = new Date().getMilliseconds();
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
          const thirdCallTime: number = new Date().getMilliseconds() - start;
          assert(firstCallTime > thirdCallTime);
        }
      );
    }
  );

  await redisClient.flushdb();
  await redisClient.close();
});
