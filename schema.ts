// deno-lint-ignore-file no-explicit-any
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import { tests } from './dummyData.ts';

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
        // console.log('Context: ', context);
        console.log('Info: ', info.operation.selectionSet.loc.source.body);
        return tests;
      },
    },
    getOneTest: {
      type: TestType,
      args: {
        id: { type: GraphQLInt },
      },
      resolve: (_parent: any, args: any, _context: any, info: any) => {
        console.log('Info: ', info.operation.selectionSet.loc.source.body);

        return tests.find((el) => el.id === args.id);
      },
    },
  },
});

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
      resolve: (_parent: any, args: any, _context: any, info: any) => {
        console.log('Info: ', info.operation.selectionSet.loc.source.body);

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
