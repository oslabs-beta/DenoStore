import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';

import { dsRouter } from './routes.ts';
import schema from './schema.ts';

const PORT = 3000;

//set up Oak middleware for server and set server listening
const app = new Application();

import { connect } from 'https://deno.land/x/redis@v0.25.2/mod.ts';

//instantiate redis connection
const redisClient = await connect({
  hostname: 'localhost',
  port: 6379,
});

const wrapper = dsRouter({
  schema,
  usePlayground: true,
  redisClient,
});

app.use(wrapper.routes(), wrapper.allowedMethods());

app.use((ctx) => {
  ctx.response.body = 'hello world';
});

console.log(`Server Running on port ${PORT}`);
await app.listen({ port: PORT });
