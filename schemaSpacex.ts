import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean,
  GraphQLFloat,
} from 'https://deno.land/x/graphql_deno@v15.0.0/mod.ts';

const RocketType = new GraphQLObjectType({
  name: 'Rocket',
  fields: () => ({
    id: { type: GraphQLInt },
    active: { type: GraphQLBoolean },
    stages: { type: GraphQLInt },
    first_flight: { type: GraphQLString },
    country: { type: GraphQLString },
    height: { type: HeightType },
    diameter: { type: DiameterType },
    wikipedia: { type: GraphQLString },
    description: { type: GraphQLString },
    rocket_id: { type: GraphQLString },
    rocket_name: { type: GraphQLString },
    rocket_type: { type: GraphQLString },
  }),
});

const HeightType = new GraphQLObjectType({
  name: 'Height',
  fields: () => ({
    meters: { type: GraphQLFloat },
    feet: { type: GraphQLFloat },
  }),
});

const DiameterType = new GraphQLObjectType({
  name: 'Diameter',
  fields: () => ({
    meters: { type: GraphQLFloat },
    feet: { type: GraphQLFloat },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    rocket: {
      type: GraphQLList(RocketType),
      resolve: async (_parent: any, _args: any, context: any, info: any) => {
        return await context.denostore.cache({ info }, async () => {
          return await fetch('https://api.spacexdata.com/v3/rockets').then(
            (res) => res.json()
          );
        });
      },
    },
    oneRocket: {
      type: RocketType,
      args: {
        id: { type: GraphQLString },
      },
      resolve: async (_parent: any, args: any, context: any, info: any) => {
        return await context.denostore.cache(
          { info: info, ex: 5 },
          async () => {
            // expire after 5 seconds
            const result = await fetch(
              `https://api.spacexdata.com/v3/rockets/${args.id}`
            ).then((res) => res.json());
            return result;
          }
        );
      },
    },
  },
});

const schema = new GraphQLSchema({ query: RootQuery });
export default schema;
