import type { Redis, SetOpts } from 'https://deno.land/x/redis@v0.25.3/mod.ts';
import type {
  GraphQLSchema,
  GraphQLResolveInfo,
  FieldNode,
  ArgumentNode,
  DocumentNode,
  DefinitionNode,
  Source,
} from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import type {
  Middleware,
  Context,
} from 'https://deno.land/x/oak@v10.2.0/mod.ts';
import type { IResolvers } from 'https://deno.land/x/graphql_tools@0.0.2/utils/interfaces.ts';

export interface DenostoreArgs {
  schema: GraphQLSchema | ExecutableSchemaArgs;
  redisClient?: Redis;
  redisPort?: number;
  route?: string;
  usePlayground?: boolean;
  defaultEx?: number | undefined;
}

type ITypedefDS =
  | string
  | Source
  | DocumentNode
  | GraphQLSchema
  | DefinitionNode
  | Array<ITypedefDS>
  | (() => ITypedefDS);

export interface ExecutableSchemaArgs<TContext = any> {
  typeDefs: ITypedefDS; // type definitions used to make schema
  resolvers?: IResolvers<any, TContext> | Array<IResolvers<any, TContext>>; // resolvers for the type definitions
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
