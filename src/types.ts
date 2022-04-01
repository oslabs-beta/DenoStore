import type { Redis, SetOpts } from 'https://deno.land/x/redis@v0.25.3/mod.ts';
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
  defaultEx?: number | null;
}

type Maybe<T> = null | undefined | T;
export interface QueryObjType {
  readonly name: string;
  readonly arguments?: ReadonlyArray<ArgumentNode>;
  // deno-lint-ignore no-explicit-any
  readonly variables?: Maybe<{ [key: string]: any }>;
}

export type {
  Redis,
  GraphQLSchema,
  GraphQLResolveInfo,
  Middleware,
  Context,
  FieldNode,
  SetOpts,
};
