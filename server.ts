import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';
import Denostore from './src/denostore.ts';
// import schema from './schema.ts';
// import { typeDefs, resolvers } from './schemaExecutable.ts';
import { schema } from './schemaExecutable.ts';
// import schema from './schemaSpacex.ts';

const PORT = 3000;

//set up Oak middleware for server and set server listening
const app = new Application();

//instantiate redis connection
const redisClient = await connect({
  hostname: 'localhost',
  port: 6379,
});

const denostore = new Denostore({
  route: '/graphql',
  usePlayground: true,
  schema,
  // schema: { typeDefs, resolvers },
  // schema: { typeDefs: schema },
  // schema: { typeDefs: resolvers, resolvers: typeDefs },
  redisClient,
  defaultEx: 10,
});

app.use(denostore.routes(), denostore.allowedMethods());

app.use((ctx) => {
  ctx.response.body = '404 Page Not Found';
  ctx.response.status = 404;
});

console.log(`Server Running on port ${PORT}`);
await app.listen({ port: PORT });
