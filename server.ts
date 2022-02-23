import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';

import Denostore from './denostore.ts';
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

const dsInstance = new Denostore({
  schema,
  usePlayground: true,
  redisClient,
});

app.use(dsInstance.routes(), dsInstance.allowedMethods());

app.use((ctx) => {
  ctx.response.body = '404 Page Not Found';
  ctx.response.status = 404;
});

console.log(`Server Running on port ${PORT}`);
await app.listen({ port: PORT });
