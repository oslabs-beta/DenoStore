import { Router } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { renderPlaygroundPage } from 'https://deno.land/x/oak_graphql@0.6.3/graphql-playground-html/render-playground-html.ts';
import { graphql } from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import { queryParser } from './utils.ts';

import type {
  Redis,
  GraphQLSchema,
  GraphQLResolveInfo,
  DenostoreArgs,
  Middleware,
  Context,
} from './types.ts';

export default class Denostore {
  #usePlayground: boolean;
  #redisClient: Redis;
  #schema: GraphQLSchema;
  #router: Router;
  #route: string;

  constructor(args: DenostoreArgs) {
    const {
      schema,
      usePlayground = false,
      redisClient,
      route = '/graphql',
    } = args;
    this.#usePlayground = usePlayground;
    this.#redisClient = redisClient;
    this.#schema = schema;
    this.#router = new Router();
    this.#route = route;
  }

  async cache(
    { info }: { info: GraphQLResolveInfo },
    // deno-lint-ignore ban-types
    callback: { (): Promise<{}> | {} }
  ) {
    // error check here for missing query on info obj
    const queryString = info.operation.selectionSet.loc
      ? info.operation.selectionSet.loc.source.body
      : '';

    // parses the query string to determine if mutation or query
    // checks if the query is already cached
    const queryName = queryParser(queryString);

    const value = await this.#redisClient.get(queryName);

    // cache hit: respond with parsed data
    let results;
    if (value) {
      console.log('Returning cached result');
      results = JSON.parse(value);
      return results;
    }

    //cache miss: set cache and respond with results
    results = await callback();
    if (results === null || results === undefined) {
      console.error(
        '%cError: result of callback provided to Denostore cache function cannot be undefined or null',
        'font-weight: bold; color: white; background-color: red;'
      );
      throw new Error('Error: Query error. See server console.');
    }
    console.log('cache miss');
    await this.#redisClient.set(queryName, JSON.stringify(results)); //this would be setex for expiration
    return results;
  }

  async clear(): Promise<void> {
    // clears the cache completely of all data
    await this.#redisClient.flushall();
    console.log('cleared cache');
  }

  routes(): Middleware {
    // check if usePlayground is passed in truthy and render playground
    if (this.#usePlayground) {
      // renders pseudo-graphiql using playground IDE
      this.#router.get(this.#route, (ctx: Context): void => {
        const { request, response } = ctx;
        try {
          const playground = renderPlaygroundPage({
            endpoint: request.url.origin + this.#route,
          });
          response.status = 200;
          response.body = playground;
          return;
        } catch (err) {
          console.log(
            `%cError: ${err}`,
            'font-weight: bold; color: white; background-color: red;'
          );
          response.status = 500;
          response.body = 'Problem rendering GraphQL Playground IDE';
        }
      });
    }

    //handles posted query and responds
    this.#router.post(this.#route, async (ctx: Context): Promise<void> => {
      const { response, request } = ctx;
      try {
        const body = await request.body();
        const { query } = await body.value;
        //caching happens inside of resolvers (nested within schema, so graphql func invocation)
        const results = await graphql({
          schema: this.#schema,
          source: query,
          contextValue: { denostore: this },
        });
        // if errors delete results data
        results.errors ? delete results.data : null;
        response.status = results.errors ? 500 : 200;
        response.body = results;
        return;
      } catch (err) {
        console.error(
          `%cError: error finding query on provided route.
        \nReceived error: ${err}`,
          'font-weight: bold; color: white; background-color: red;'
        );
        throw err;
      }
    });

    // update/remove later for security
    this.#router.delete('/delete', async (ctx: Context): Promise<void> => {
      await this.#redisClient.flushall();

      console.log('Deleted Cache');

      ctx.response.status = 202;
      ctx.response.body = 'Cleared Cache';
      return;
    });

    // gives our class the imported router's routes method
    return this.#router.routes();
  }

  // gives our class the imported router's allowedMethods method
  allowedMethods(): Middleware {
    return this.#router.allowedMethods();
  }
}
