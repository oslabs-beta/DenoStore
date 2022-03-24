// deno-lint-ignore-file no-explicit-any
import { makeExecutableSchema } from 'https://deno.land/x/graphql_tools@0.0.2/mod.ts';
import { gql } from 'https://deno.land/x/graphql_tag@0.0.1/mod.ts';
import Denostore from './src/denostore.ts';

const resolvers = {
  Query: {
    onePerson: async (
      _parent: any,
      args: any,
      { denostore }: any,
      info: any
    ) => {
      return await (denostore as Denostore).cache({ info }, async () => {
        const results = await fetch(
          `https://swapi.dev/api/people/${args.id}`
        ).then((res) => res.json());
        console.log('api call');
        return results;
      });
    },
  },
};
const typeDefs = gql`
  type PersonType {
    name: String
    height: String
    mass: String
    hair_color: String
    skin_color: String
    eye_color: String
    birth_year: String
    gender: String
    created: String
    edited: String
  }

  type Query {
    onePerson(id: ID): PersonType
  }
`;
// console.log('typedefs-->', typeDefs);

const schema = makeExecutableSchema({ typeDefs, resolvers });
// console.log('schema: ', schema);
export default schema;
