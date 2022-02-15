// deno-lint-ignore-file no-explicit-any
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';

//instantiate redis connection
const redisClient = await connect({
  hostname: 'localhost',
  port: 6379,
});

//caching middleware here (checks for mutation query, if it exists on cache or not,
//and responds with query result either way)
const checkCache = async (ctx: any, next: any) => {
  try {
    console.log('cache middleware running...');
    const { request, response } = ctx;
    const body = await request.body();
    const { query } = await body.value;
    const value = await redisClient.get(query);
    // cache miss
    if (!value) return next();
    // cache hit
    else {
      console.log('Returning cached data');
      const results = JSON.parse(value);
      response.status = 200;
      response.body = results;
      return;
    }
  } catch (err) {
    console.log(err);
  }
};

export { checkCache, redisClient };
