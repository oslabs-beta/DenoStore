// deno-lint-ignore-file no-explicit-any
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
import Denostore from './denostore.ts';

//defines the data shape of test (its graphQL type)
const PersonType = new GraphQLObjectType({
  name: 'Person',
  fields: () => ({
    name: { type: GraphQLString },
    height: { type: GraphQLString },
    mass: { type: GraphQLString },
    hair_color: { type: GraphQLString },
    skin_color: { type: GraphQLString },
    eye_color: { type: GraphQLString },
    birth_year: { type: GraphQLString },
    gender: { type: GraphQLString },
    created: { type: GraphQLString },
    edited: { type: GraphQLString },
    films: { type: GraphQLList(GraphQLString) },
  }),
});

const FilmType = new GraphQLObjectType({
  name: 'Film',
  fields: () => ({
    title: { type: GraphQLString },
    episode_id: { type: GraphQLString },
    opening_crawl: { type: GraphQLString },
    director: { type: GraphQLString },
    producer: { type: GraphQLString },
    release_date: { type: GraphQLString },
    created: { type: GraphQLString },
    edited: { type: GraphQLString },
  }),
});
const obj = {
  id: 1,
};
const objType = new GraphQLObjectType({
  name: 'obj',
  fields: () => ({
    id: { type: GraphQLInt },
  }),
});

// const Mutation = new GraphQLObjectType({
//   name: 'MutationQueryType',
//   fields: {
//     banana: {
//       type: objType,
//       args: {
//         id: { type: GraphQLInt },
//       },
//       resolve: async (_parent: any, args: any) => {
//         await dsClear();
//         return obj;
//       },
//     },
//   },
// });

//root query with all queries inside (analogous to methods on object)
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    //person(id:2){name} => name, height, all info on type set in cache
    //if we receive person(id:2) again, but with {height} we could redis.get("person(id:2)")
    person: {
      type: GraphQLList(PersonType),
      resolve: async (_parent: any, _args: any, context: any, info: any) => {
        return await (context.denostore as Denostore).cache({ info }, async () => {
          const results = await fetch('https://swapi.dev/api/people').then(
            (res) => res.json()
          );
          return results.results;
        });
      },
    },
    onePerson: {
      type: PersonType,
      args: {
        id: { type: GraphQLInt },
      },
      resolve: async (_parent: any, args: any, context: any, info: any) => {
        return await (context.denostore as Denostore).cache({ info }, async () => {
          const results = await fetch(
            `https://swapi.dev/api/people/${args.id}`
          ).then((res) => res.json());
          console.log('api call');
          return results;
        });
      },
    },
    film: {
      type: FilmType,
      args: {
        id: { type: GraphQLInt },
      },
      resolve: async (_parent: any, args: any, context: any, info: any) => {
        return await (context.denostore as Denostore).cache({ info }, async () => {
          const results = await fetch(
            `https://swapi.dev/api/films/${args.id}`
          ).then((res) => res.json());
          return results;
        });
      },
    },
  },
});

const schema = new GraphQLSchema({ query: RootQuery });
export default schema;
