import { Application } from 'https://deno.land/x/oak@v10.2.0/mod.ts';

// import { tests } from './dummyData.ts';
import router from './routes.ts';

const PORT = 3000;

//set up Oak middleware for server and set server listening
const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

app.use((ctx) => {
  ctx.response.body = 'hello world';
});

console.log(`Server Running on port ${PORT}`);
await app.listen({ port: PORT });
