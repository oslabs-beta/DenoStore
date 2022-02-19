// deno-lint-ignore-file no-explicit-any
import { getRedisClient } from './routes.ts';

//make sure we check for a mutation and other errors
let redisClient: any;
const dsCache = async ({ info }: { info: any }, callback: any) => {
  //sees if redisClient is already defined and if not assigns it to the client's passed in Redis
  if (!redisClient) redisClient = getRedisClient();
  const query = info.operation.selectionSet.loc.source.body;
  //reassign to function type later and take the query off of "info" for the user
  const value = await redisClient.get(query);
  // cache hit: respond with parsed data
  let results;
  if (value) {
    console.log('returning cached result');
    results = JSON.parse(value);
    return results;
  }

  //cache miss: set cache and respond with results
  results = await callback();
  await redisClient.set(query, JSON.stringify(results)); //this would be setex for expiration
  return results;
};

//clear the cache
const dsClear = async (): Promise<void> => {
  //sees if redisClient is already defined and if not assigns it to the client's passed in Redis
  if (!redisClient) redisClient = getRedisClient();
  await redisClient.flushall();
  console.log('cleared cache');
};

export { dsCache, dsClear };
