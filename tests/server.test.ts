import {
  assertEquals,
  assertNotEquals,
} from 'https://deno.land/std@0.128.0/testing/asserts.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';

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
Deno.test('redisClient', async (t) => {
  const redisClient = await connect({
    hostname: 'localhost',
    port: 6379,
  });

  await t.step('key/value saved to cache successfully', async () => {
    await redisClient.set('key', 'value');
    const test = await redisClient.get('key');
    assertEquals('value', test);
  });
  await t.step('clear cache successfully', async () => {
    await redisClient.flushdb();
    const test = await redisClient.get('key');
    assertNotEquals('value', test);
  });
  redisClient.quit();
});
