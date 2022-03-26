import type { Redis } from 'https://deno.land/x/redis@v0.25.3/mod.ts';
import type {
  GraphQLSchema,
  GraphQLResolveInfo,
  FieldNode,
  ArgumentNode,
} from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import type {
  Middleware,
  Context,
} from 'https://deno.land/x/oak@v10.2.0/mod.ts';

export interface DenostoreArgs {
  schema: GraphQLSchema;
  redisClient: Redis;
  route?: string;
  usePlayground?: boolean;
  defaultCacheExpire?: number | boolean;
}

export interface QueryObjType {
  readonly name: string;
  readonly arguments?: ReadonlyArray<ArgumentNode>;
}

export type {
  Redis,
  GraphQLSchema,
  GraphQLResolveInfo,
  Middleware,
  Context,
  FieldNode,
};
