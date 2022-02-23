import { Router } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { renderPlaygroundPage } from 'https://deno.land/x/oak_graphql@0.6.3/graphql-playground-html/render-playground-html.ts';
import { graphql } from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import { RouterArgs } from './types.ts';

export default class Denostore {
  #schema: any;
  #usePlayground?: boolean;
  #redisClient: any;
  #router: any;

  // prevent user from instantiating
  // #DsCache() {} 
  constructor(args: RouterArgs) {
    const { schema, usePlayground, redisClient } = args;
    this.#usePlayground = usePlayground;
    this.#redisClient = redisClient;
    this.#schema = schema;
    this.#router = new Router();
  }

  async cache({ info }: { info: any }, callback: any) {
    //sees if redisClient is already defined and if not assigns it to the client's passed in Redis
    const query = info.operation.selectionSet.loc.source.body;
    //reassign to function type later and take the query off of "info" for the user
    const value = await this.#redisClient.get(query);
    // cache hit: respond with parsed data
    let results;
    if (value) {
      console.log('returning cached result');
      results = JSON.parse(value);
      return results;
    }
  
    //cache miss: set cache and respond with results
    console.log('cache miss')
    results = await callback();
    await this.#redisClient.set(query, JSON.stringify(results)); //this would be setex for expiration
    return results;
  }

  async clear(): Promise<void> {
    //sees if redisClient is already defined and if not assigns it to the client's passed in Redis
    await this.#redisClient.flushall();
    console.log('cleared cache');
  }

  routes(): any {
      //check if usePlayground is passed in truthy and render playground
    if (this.#usePlayground) {
      //renders pseudo-graphiql using playground GUI
      this.#router.get('/graphql', (ctx: any) => {
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
    this.#router.post('/graphql', async (ctx: any) => {
      const { response, request } = ctx;
      const body = await request.body();
      const { query } = await body.value;
      //caching happens inside of resolvers (nested within schema, so graphql func invocation)
      const results = await graphql({
        schema: this.#schema, 
        source: query, 
        contextValue: { denostore: this },
        });
      response.status = 200;
      response.body = results;
      return;
    });

    this.#router.delete('/delete', (ctx: any) => {
      this.#redisClient.flushall();

      console.log('Deleted Cache');

      ctx.response.status = 202;
      ctx.response.body = 'Cleared Cache';
      return;
    });

    return this.#router.routes();

  }

  allowedMethods(): any {
    return this.#router.allowedMethods();
  }
  
}

