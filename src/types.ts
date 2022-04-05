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
import type {
  ITypeDefinitions,
  IResolvers,
  ITypedef,
} from 'https://deno.land/x/graphql_tools@0.0.2/utils/interfaces.ts';

export interface DenostoreArgs {
  schema: GraphQLSchema | ExecutableSchemaArgs;
  redisClient: Redis;
  route?: string;
  usePlayground?: boolean;
  defaultEx?: number | undefined;
}

type ITypedefDS = (() => Array<ITypedefDS>) | string;

export interface ExecutableSchemaArgs<TContext = any> {
  typeDefs: ITypeDefinitions;
  // typeDefs: ITypedefDS | Array<ITypedefDS>;
  resolvers?: IResolvers<any, TContext> | Array<IResolvers<any, TContext>>;
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
