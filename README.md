# **DenoStore**
DenoStore brings modular and low latency caching of GraphQL queries to a Deno/Oak server. 

[![Tests Passing](https://img.shields.io/badge/tests-passing-green)](https://github.com/oslabs-beta/DenoStore)
[![deno version](https://img.shields.io/badge/deno.land/x-v1.0.0-lightgrey?logo=deno)](https://deno.land/x/denostore)
[![License](https://img.shields.io/badge/license-MIT-orange)](https://github.com/oslabs-beta/DenoStore/blob/main/LICENSE.md)
[![Contributions](https://img.shields.io/badge/contributions-welcome-blue)]()

**DenoStore Query Demo**

http://www.denostore.io

![](img/DenoStoreDemo.gif)

## Table of Contents
- [Description](#description)
- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
	- [Server Setup](#server-setup)
	- [Caching](#caching)
  - [Expiration](#expiration)
- [Contributions](#contributions)
- [Developers](#developers)
- [License](#license)

## <a name="description"></a> Description
When implementing caching of GraphQL queries there are a few main issues to consider:
- Cache becoming stale/cache invalidation
- More unique queries and results compared to REST due to granularity of GraphQL
- Lack of built-in caching support (especially for Deno)

DenoStore was built to address the above challenges and empowers users with a caching tool that is modular, efficient and quick to implement.

## <a name="features"></a> Features
- Seamlessly embeds caching functionality to only query types that need it by allowing the user to implement cache module at the query resolver level
- Caches resolver results rather than query results - so queries with different fields and formats can still use existing cached values
- Leverages *[Redis](https://redis.io/)* as an in-memory low latency server-side cache
- Integrates with *[Oak](https://oakserver.github.io/oak/)* middleware framework to handle GraphQL queries with error handling
- Provides global and resolver level expiration controls
- Makes *GraphQL Playground IDE* available for constructing and sending queries
- Supports all query options (e.g. arguments, directives, variables, fragments)

## <a name="installation"></a> Installation

### Redis

DenoStore uses Redis data store for caching
- If you do not yet have Redis installed, please follow the instructions for your operation system here: https://redis.io/docs/getting-started/installation/
- After installing, start the Redis server by running `redis-server`
- You can test that your Redis server is running by connecting with the Redis CLI:

```sh
redis-cli 
127.0.0.1:6379> ping
PONG
```

- To stop your Redis server:
`redis-cli shutdown`

- To restart your Redis server: 
`redis-server restart`

- Redis uses port `6379` by default

### DenoStore

DenoStore is hosted as a third-party module at https://deno.land/x/denostore and will be installed the first time you import it and run your server.

```ts
import { Denostore } from 'https://deno.land/x/denostore@v1.0.0/mod.ts';
```

### Oak

Denostore uses the popular middleware framework Oak https://deno.land/x/oak to set up routes for handling GraphQL queries and optionally using the *GraphQL Playground IDE*. Like DenoStore, Oak will be installed directly from deno.land the first time you run your server unless you already have it cached. 

**Using v10.2.0 is highly recommended**

```ts
import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
```

## <a name="getting-started"></a> Getting Started

Implementing DenoStore takes only a few steps and since it is modular you can implement caching to your query resolvers incrementally if desired.

### <a name="server-setup"></a> Server Setup

To set up your server:
- Import *Oak*, *Denostore* class and your *schema*
- Create a new instance of Denostore with your desired configuration
- Add the route to handle GraphQL queries (/graphql by default)

Below is a simple example of configuring DenoStore for your server file, but there are several configuration options. Please refer to the docs [here] for details

```ts
// imports
import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { Denostore } from 'https://deno.land/x/denostore@v0.1.0/mod.ts'
import { typeDefs, resolvers } from './yourSchema.ts';

const PORT = 3000;

const app = new Application();

// configure denostore
const denostore = new Denostore({
  route: '/graphql',
  usePlayground: true,
  schema: { typeDefs, resolvers },
  redisPort: 6379,
});

// add route
app.use(denostore.routes(), denostore.allowedMethods());
```
### <a name="caching"></a> Caching

**How do I set up caching?**

After your Denostore instance is configured in your server, all GraphQL resolvers have access to that DenoStore instance and its methods through the context object. Your schemas do not require any DenoStore imports.

#### Cache Implementation Example

Here is a simple example of a query resolver before and after adding the cache method from DenoStore. This is a query to pull information for a particular rocket from the SpaceX API.

**No DenoStore**

```ts
Query: {
    oneRocket: async (
      _parent: any,
      args: any,
	  context: any,
      info: any
    ) => {
        const results = await fetch(
          `https://api.spacexdata.com/v3/rockets/${args.id}`
        ).then((res) => res.json());

        return results;
    },
```
**DenoStore Caching**

```ts
Query: {
    oneRocket: async (
      _parent: any,
      args: any,
      { denostore }: any,
      info: any
    ) => {
      return await denostore.cache({ info }, async () => {
        const results = await fetch(
          `https://api.spacexdata.com/v3/rockets/${args.id}`
        ).then((res) => res.json());

        return results;
      });
    },
```

As you can see it only takes a couple lines of code to add caching where you need it.

**Cache Method**

```ts
denostore.cache({ info }, callback)
```

`cache` is an asynchronous method that takes two arguments:
- Cache arguments object where **info** is the only required property. Info must be passed as a property in this object as DenoStore parses the info AST for query information
- Your data store call to execute if the results are not in the cache

### <a name="expiration"></a> Expiration
Expiration time for cached results can be set for each resolver and/or globally. 

#### Setting expiration in the cache method

You can easily pass in cache expiration time in seconds as a value to the `ex` property to the cache arguments object:  
```ts
// cached value will expire in 5 seconds
denostore.cache({ info, ex: 5 }, callback)
```

#### Setting global expiration in DenoStore config

You can also add the `defaultEx` property with value expiration time in seconds when configuring the `denostore` instance on your server.

```ts
// configure denostore
const denostore = new Denostore({
  route: '/graphql',
  usePlayground: true,
  schema: { typeDefs, resolvers },
  redisPort: 6379,
  // default expiration set to 5 seconds
  defaultEx: 5
});
```

When determining expiration for a cached value, DenoStore will always prioritize expiration time in the following order:
1. `ex` property in resolver `cache` method
2. `defaultEx` property in DenoStore configuration
3. If no resolver or global expiration is set, cached values will **default to no expiration**. However, in the next section we discuss ways to clear the cache

### Clearing Cache

#### DenoStore Clear Method

There may be times when you want to clear the cache in resolver logic such as when you perform a mutation. In these cases you can invoke the DenoStore `clear` method.

```ts
Mutation: {
    cancelTrip: async (
      _parent: any,
      args: launchId,
      { denostore }: any
    ) => {
      const result = await dataSources.userAPI.cancelTrip({ launchId });
        if (!result)
          return {
            success: false,
            message: 'failed to cancel trip',
          };
			
        // clear/invalidate cache after successful mutation
        await denostore.clear();

        return result;
    },
```

#### Clearing with redis-cli

You can also clear the Redis cache at any time using the redis command line interface.

Clear keys from all databases on Redis instance
```sh
redis-cli flushall
```
Clear keys from all databases without blocking your server

```sh
redis-cli flushall async
```
Clear keys from currently selected database (if using same Redis client for other purposes aside from DenoStore)
```sh
redis-cli flushdb
```

## <a name="contributions"></a> Contributions

We welcome contributions to DenoStore as they are key to growing the Deno ecosystem and community

### Start Contributing

1. Fork and clone the repository
2. Ensure [Deno](https://deno.land/manual/getting_started/installation) and [Redis](https://redis.io/docs/getting-started/) are installed on your machine
3. Redis server must be [running](#installation) to use DenoStore
4. Checkout feature/issue branch off of *main* branch

### Running Testing
1. Make sure Redis server is [running](#installation) on port *6379* when testing
2. To run all tests run `deno test tests/ --allow-net`
3. If tests pass you can submit a PR to the DenoStore *main* branch 

## <a name="developers"></a> Developers

- [Jake Van Vorhis](https://github.com/jakedoublev)
- [James Kim](https://github.com/Jamesmjkim)
- [Jessica Wachtel](https://github.com/JessicaWachtel)
- [Scott Tatsuno](https://github.com/sktatsuno)
- [TX Ho](https://github.com/lawauditswe)

## <a name="license"></a> License

This product is licensed under the MIT License - see the LICENSE.md file for details.

This is an open source product.

This product is accelerated by [OS Labs](https://opensourcelabs.io/).
