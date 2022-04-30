import { Router } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { renderPlaygroundPage } from 'https://deno.land/x/oak_graphql@0.6.3/graphql-playground-html/render-playground-html.ts';
import { graphql } from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';
import { makeExecutableSchema } from 'https://deno.land/x/graphql_tools@0.0.2/mod.ts';
import { buildCacheKey } from './utils.ts';

import type {
  Redis,
  GraphQLSchema,
  DenostoreArgs,
  Middleware,
  Context,
  defaultExArg,
  redisClientArg,
  redisPortArg,
  userSchemaArg,
  cacheArgs,
  cacheCallbackArg,
  optsVariable,
} from './types.ts';

export default class Denostore {
  #usePlayground: boolean;
  #redisClient!: Redis;
  #schema!: GraphQLSchema;
  #router: Router;
  #route: string;
  #defaultEx: defaultExArg;

  constructor(args: DenostoreArgs) {
    const {
      schema,
      usePlayground = false,
      redisClient,
      redisPort,
      route = '/graphql',
      defaultEx,
    } = args;

    this.#setSchemaProperty(schema);
    this.#setRedisClientProperty(redisClient, redisPort);
    this.#usePlayground = usePlayground;
    this.#router = new Router();
    this.#route = route;
    this.#defaultEx = defaultEx;
  }

  async #setRedisClientProperty(
    redisClient: redisClientArg,
    redisPort: redisPortArg
  ): Promise<void> {
    if (redisClient) {
      this.#redisClient = redisClient;
    } else {
      this.#redisClient = await connect({
        hostname: 'localhost',
        port: redisPort,
      });
    }
  }

  #setSchemaProperty(schema: userSchemaArg): void {
    if ('typeDefs' in schema || 'resolvers' in schema) {
      this.#schema = makeExecutableSchema({
        typeDefs: schema.typeDefs,
        resolvers: schema.resolvers || {},
      });
    } else {
      this.#schema = schema;
    }
  }

  /**
   ** Caching method to be invoked in the field resolver of queries user wants cached
   ** Creates cache key by accessing resolver 'info' AST for query information
   ** Accepts optional expire time in seconds argument
   ** Retrieves cached value using created cache key
   ** If cache key does not exist for a query, invokes provided callback and sets cache with results
   */
  async cache({ info, ex }: cacheArgs, callback: cacheCallbackArg) {
    const cacheKey = buildCacheKey(info);
    const cacheValue = await this.#redisClient.get(cacheKey);

    // cache hit: return cached data
    if (cacheValue) {
      console.log('Returning cached result');
      return JSON.parse(cacheValue);
    }

    // cache miss: invoke provided callback to fetch results
    const results = await callback();
    if (results === null || results === undefined) {
      console.error(
        '%cError: result of callback provided to Denostore cache function cannot be undefined or null',
        'font-weight: bold; color: white; background-color: red;'
      );
      throw new Error('Error: Query error. See server console.');
    }

    // redis caching options
    let opts: optsVariable;

    // if positive expire argument specified, set expire time in options
    if (ex) {
      if (ex > 0) opts = { ex: ex };
      // else set default expire time in options if provided
    } else if (this.#defaultEx) {
      opts = { ex: this.#defaultEx };
    }

    // set results in cache with options if specified
    if (opts) {
      await this.#redisClient.set(cacheKey, JSON.stringify(results), opts);
      /**
       * If negative expire argument provided or no expire specified, cache results with no expiration
       * Uses negative number to indicate no expiration to avoid adding unnecessary expire flag argument
       * while still fulfilling Redis type checks
       */
    } else {
      await this.#redisClient.set(cacheKey, JSON.stringify(results));
    }

    return results;
  }

  /**
   * Removes all keys and values from redis instance
   */
  async clear(): Promise<void> {
    await this.#redisClient.flushall();
  }

  routes(): Middleware {
    // render Playground IDE if enabled
    if (this.#usePlayground) {
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
          throw err;
        }
      });
    }

    // where GraphQL queries are handled
    this.#router.post(this.#route, async (ctx: Context): Promise<void> => {
      const { response, request } = ctx;
      try {
        const { query, variables } = await request.body().value;

        // resolve GraphQL query
        const graphqlResults = await graphql({
          schema: this.#schema,
          source: query,
          // pass denostore instance through context to use methods in resolvers
          contextValue: { denostore: this },
          variableValues: variables,
        });

        // if errors delete results data
        if (graphqlResults.errors) delete graphqlResults.data;
        // respond with resolved query results
        response.status = graphqlResults.errors ? 500 : 200;
        response.body = graphqlResults;
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

      ctx.response.status = 202;
      ctx.response.body = 'Cleared Cache';
      return;
    });

    return this.#router.routes();
  }

  allowedMethods(): Middleware {
    return this.#router.allowedMethods();
  }
}
