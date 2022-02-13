import { Router } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { renderPlaygroundPage } from 'https://deno.land/x/oak_graphql@0.6.3/graphql-playground-html/render-playground-html.ts';
import { graphql } from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import schema from './schema.ts';

const router = new Router();

router.get('/', (ctx) => {
  const { response } = ctx;
  response.redirect('/graphql');
  return;
});

router.get('/graphql', (ctx) => {
  const { request, response } = ctx;
  const playground = renderPlaygroundPage({
    endpoint: request.url.origin + '/graphql',
  });
  response.status = 200;
  response.body = playground;
  return;
});

router.post('/graphql', async (ctx) => {
  const { response, request } = ctx;
  const body = await request.body();
  const value = await body.value;
  const results = await graphql(schema, value.query);
  // console.log(results);
  response.status = 200;
  response.body = results;
  return;
});

export default router;
