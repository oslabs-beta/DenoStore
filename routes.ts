import { Router } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { renderPlaygroundPage } from 'https://deno.land/x/oak_graphql@0.6.3/graphql-playground-html/render-playground-html.ts';
import { graphql } from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import schema from './schema.ts';
import { checkCache, redisClient } from './cache.ts';

const router = new Router();

//redirects to /graphql
router.get('/', (ctx) => {
  const { response } = ctx;
  response.redirect('/graphql');
  return;
});

//renders pseudo-graphiql using playground gui
router.get('/graphql', (ctx) => {
  const { request, response } = ctx;
  const playground = renderPlaygroundPage({
    endpoint: request.url.origin + '/graphql',
  });
  response.status = 200;
  response.body = playground;
  return;
});

//handles posted query and responds
router.post('/graphql', checkCache, async (ctx) => {
  const { response, request } = ctx;
  const body = await request.body();
  const { query } = await body.value;
  // console.log(schema);
  const results = await graphql(schema, query);
  // console.log(results);
  response.status = 200;
  response.body = results;
  return;
});

router.get('/delete', (ctx) => {
  redisClient.flushall();
  ctx.response.status = 200;
  ctx.response.body = 'Cleared Cache';
  return;
});

export default router;
