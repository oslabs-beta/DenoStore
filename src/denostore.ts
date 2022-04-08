import { Router } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { renderPlaygroundPage } from 'https://deno.land/x/oak_graphql@0.6.3/graphql-playground-html/render-playground-html.ts';
import { graphql } from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';
import { makeExecutableSchema } from 'https://deno.land/x/graphql_tools@0.0.2/mod.ts';
import { queryExtract } from './utils.ts';

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

    this.setSchemaProperty(schema);
    this.setRedisClientProperty(redisClient, redisPort);
    this.#usePlayground = usePlayground;
    this.#router = new Router();
    this.#route = route;
    this.#defaultEx = defaultEx;
  }

  async setRedisClientProperty(
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

  setSchemaProperty(schema: userSchemaArg): void {
    // takes in schema as an argument
    // checks if typedefs or resolver property is in schema
    if ('typeDefs' in schema || 'resolvers' in schema) {
      // set class property #schema with the schema that comes out of makeExecutableSchema function
      this.#schema = makeExecutableSchema({
        typeDefs: schema.typeDefs,
        resolvers: schema.resolvers || {},
      });
    } else {
      // set class property #schema with the pass passed in
      this.#schema = schema;
    }
  }

  async cache({ info, ex }: cacheArgs, callback: cacheCallbackArg) {
    // extract query name from info object
    const queryExtractName = queryExtract(info);
    // check cache if query name exists
    const value = await this.#redisClient.get(queryExtractName);

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

    // declare opts variable
    let opts: optsVariable;

    // if positive expire argument specified, set expire in options
    if (ex) {
      if (ex > 0) opts = { ex: ex };
      // if expire arg not specified look for default expiration
    } else if (this.#defaultEx) {
      opts = { ex: this.#defaultEx };
    }

    // set cache with options if specified
    if (opts) {
      await this.#redisClient.set(
        queryExtractName,
        JSON.stringify(results),
        opts
      );
      // if negative expire argument specified or if no options specified set cache with no expiration
    } else {
      await this.#redisClient.set(queryExtractName, JSON.stringify(results));
    }

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
          throw err;
        }
      });
    }

    //handles posted query and responds
    this.#router.post(this.#route, async (ctx: Context): Promise<void> => {
      const { response, request } = ctx;
      try {
        const body = request.body();
        const { query, variables } = await body.value;

        //caching happens inside of resolvers (nested within schema, so graphql func invocation)
        const results = await graphql({
          schema: this.#schema,
          source: query,
          contextValue: { denostore: this },
          variableValues: variables,
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
