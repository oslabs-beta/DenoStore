// deno-lint-ignore-file no-explicit-any
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import { tests } from './dummyData.ts';
import { redisClient } from './cache.ts';

//defines the data shape of test (its graphQL type)
const TestType = new GraphQLObjectType({
  name: 'Test',
  fields: () => ({
    id: { type: GraphQLInt },
    message: { type: GraphQLString },
    text: { type: GraphQLString },
  }),
});

//root query with all queries inside (analogous to methods on object)
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    getAllTests: {
      type: new GraphQLList(TestType),
      resolve(_parent: any, _args: any, _context: any, info: any) {
        const query: string = info.operation.selectionSet.loc.source.body;
        redisClient.set(query, JSON.stringify(tests));
        return tests;
      },
    },
    getOneTest: {
      type: TestType,
      args: {
        id: { type: GraphQLInt },
      },
      resolve: (_parent: any, args: any, _context: any, info: any) => {
        // console.log('Info: ', info.operation.selectionSet.loc.source.body);
        const query: string = info.operation.selectionSet.loc.source.body;
        const result = tests.find((el) => el.id === args.id);
        redisClient.set(query, JSON.stringify(result));
        return result;
      },
    },
  },
});

//mutation queries including createTest which adds a new test
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createTest: {
      type: TestType,
      args: {
        id: { type: GraphQLInt },
        message: { type: GraphQLString },
        text: { type: GraphQLString },
      },
      resolve: (_parent: any, args: any, _context: any, _info: any) => {
        // console.log('Info: ', info.operation.selectionSet.loc.source.body);

        const test = {
          id: args.id,
          message: args.message,
          text: args.text,
        };
        tests.push(test);
        return test;
      },
    },
  },
});

const schema = new GraphQLSchema({ query: RootQuery, mutation: Mutation });
export default schema;
