// deno-lint-ignore-file no-explicit-any
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';
// import { tests } from './dummyData.ts';
import { redisClient } from './cache.ts';

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

//root query with all queries inside (analogous to methods on object)
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    person: {
      type: GraphQLList(PersonType),
      resolve: async (_parent: any, _args: any, _context: any, info: any) => {
        const query = info.operation.selectionSet.loc.source.body;
        const cache = await exists(query);

        if (cache) {
          console.log('cached result');

          return cache;
        } else {
          const results = await fetch('https://swapi.dev/api/people').then(
            (res) => res.json()
          );
          console.log('api call');
          redisClient.set(query, JSON.stringify(results.results));
          return results.results;
        }
      },
    },
    onePerson: {
      type: PersonType,
      args: {
        id: { type: GraphQLInt },
      },
      resolve: async (_parent: any, args: any, _context: any, info: any) => {
        const query = info.operation.selectionSet.loc.source.body;
        const cache = await exists(query);

        if (cache) {
          console.log('cached result');

          return cache;
        } else {
          const results = await fetch(
            `https://swapi.dev/api/people/${args.id}`
          ).then((res) => res.json());
          console.log('api call');

          redisClient.set(query, JSON.stringify(results));

          return results;
        }
      },
    },
    film: {
      type: FilmType,
      args: {
        id: { type: GraphQLInt },
      },
      resolve: async (_parent: any, args: any, _context: any, info: any) => {
        const query = info.operation.selectionSet.loc.source.body;
        const cache = await exists(query);

        if (cache) {
          console.log('cached result');

          return cache;
        } else {
          const results = await fetch(
            `https://swapi.dev/api/films/${args.id}`
          ).then((res) => res.json());
          console.log('api call');

          redisClient.set(query, JSON.stringify(results));

          return results;
        }
      },
    },
  },
});

const exists = async (query: string) => {
  const value = await redisClient.get(query);
  // cache miss
  if (!value) return;
  // cache hit
  else {
    const results = JSON.parse(value);
    return results;
  }
};

const schema = new GraphQLSchema({ query: RootQuery });
export default schema;
