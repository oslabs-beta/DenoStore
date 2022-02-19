import { Router } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { renderPlaygroundPage } from 'https://deno.land/x/oak_graphql@0.6.3/graphql-playground-html/render-playground-html.ts';
import { graphql } from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import { RouterArgs } from './types.ts';

let client: any;

//find a way to pass defaultCacheExpire into our resolver func dsCache?
function dsRouter(args: RouterArgs) {
  const { schema, usePlayground, redisClient } = args;
  const router = new Router();
  client = redisClient;

  //check if usePlayground is passed in truthy and render playground
  if (usePlayground) {
    //renders pseudo-graphiql using playground GUI
    router.get('/graphql', (ctx) => {
      const { request, response } = ctx;
      const playground = renderPlaygroundPage({
        endpoint: request.url.origin + '/graphql',
      });
      response.status = 200;
      response.body = playground;
      return;
    });
  }

  //handles posted query and responds
  router.post('/graphql', async (ctx) => {
    const { response, request } = ctx;
    const body = await request.body();
    const { query } = await body.value;
    //caching happens inside of resolvers (nested within schema, so graphql func invocation)
    const results = await graphql(schema, query);
    response.status = 200;
    response.body = results;
    return;
  });

  router.delete('/delete', (ctx) => {
    redisClient.flushall();

    console.log('Deleted Cache');

    ctx.response.status = 202;
    ctx.response.body = 'Cleared Cache';
    return;
  });

  return router;
}

function getRedisClient() {
  // console.log('getRedisClient-->',client);
  return client;
}

export { dsRouter, getRedisClient };
