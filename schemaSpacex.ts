import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLEnumType,
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
    diameter(unit:GraphQLString): { type: DiameterType },
    wikipedia: { type: GraphQLString },
    description: { type: GraphQLString },
    rocket_id: { type: GraphQLString },
    rocket_name: { type: GraphQLString },
    rocket_type: { type: GraphQLString },
  }),
});
const UnitType = new GraphQLEnumType({
  name: 'Unit',
  values: {
    meters: { value: 0 },
    feet: { value: 1 },
  },
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
        unit: { type: UnitType },
      },
      resolve: async (_parent: any, args: any, context: any, info: any) => {
        return await context.denostore.cache({ info }, async () => {
          const result = await fetch(
            `https://api.spacexdata.com/v3/rockets/${args.id}`
          ).then((res) => res.json());
          console.log(args);
          if (args.unit) {
            if (args.unit === 'meters')
              result.diameter.meter = result.diameter.meter * 2;
            if (args.unit === 'feet')
              result.diameter.feet = result.diameter.feet * 2;
          }
          return result;
        });
      },
    },
  },
});

const schema = new GraphQLSchema({ query: RootQuery });
export default schema;
