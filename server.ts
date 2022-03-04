import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';
import { Denostore } from './mod.ts'; // our caching tool
import schema from './schema.ts'; // GraphQL schema

const PORT = 3000;

// set up Oak middleware for server and set server listening
const app = new Application();

// instantiate Redis connection
const redisClient = await connect({
  hostname: 'localhost',
  port: 6379,
});

// instantiate Denostore with required and optional arguments
const denostore = new Denostore({
  route: '/graphql', // optional
  usePlayground: true, // optional
  schema,
  redisClient,
});

// activate router
app.use(denostore.routes(), denostore.allowedMethods());

console.log(`Server Running on port ${PORT}`);
await app.listen({ port: PORT });
