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
      resolve() {
        return tests;
      },
    },
  },
});

const schema = new GraphQLSchema({ query: RootQuery });
export default schema;
