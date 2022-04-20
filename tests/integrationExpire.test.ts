import { assert } from 'https://deno.land/std@0.134.0/testing/asserts.ts';
import { superoak } from 'https://deno.land/x/superoak@4.7.0/mod.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';
import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { Denostore } from '../mod.ts';
import { typeDefs } from './schema/typeDefs.ts';
import { resolvers } from './schema/resolver.ts';

// Deno.test('hello world #1', () => {
//   const x = 1 + 2;
//   assertEquals(x, 3);
// });
// Deno.test('Denostore started', async (t) => {
//   const redisClient = await connect({
//     hostname: 'localhost',
//     port: 6379,
//   });
//   const denostore = new Denostore({
//     route: '/graphql',
//     usePlayground: false,
//     schema: { typeDefs, resolvers },
//     redisClient,
//   });

//   const app = new Application();
//   app.use(denostore.routes(), denostore.allowedMethods());

//   let firstCallTime: number;

//   await t.step('Accept query and respond with correct query', async () => {
//     const testQuery =
//       '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

//     const request = await superoak(app, true);
//     const start = new Date().getMilliseconds();
//     await request
//       .post('/graphql')
//       .type('json')
//       .send({ query: testQuery })
//       .expect(
//         '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
//       );
//     firstCallTime = new Date().getMilliseconds() - start;
//   });
//   await t.step('Same exact query (Testing Caching ability)', async (t) => {
//     const testQuery =
//       '{\n  oneRocket(id: "falcon9") {\n    rocket_name\n    rocket_type\n  }\n}\n';

//     const request = await superoak(app, true);
//     const start = new Date().getMilliseconds();
//     await request
//       .post('/graphql')
//       .type('json')
//       .send({ query: testQuery })
//       .expect(
//         '{"data":{"oneRocket":{"rocket_name":"Falcon 9","rocket_type":"rocket"}}}'
//       );

//     await t.step('Speed of query is faster than first call', () => {
//       const secondCallTime: number = new Date().getMilliseconds() - start;
//       assert(firstCallTime > secondCallTime);
//     });
//   });

//   await redisClient.flushdb();
//   await redisClient.close();

//   // console.log(Deno.resources());
// });
