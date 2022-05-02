import { gql } from 'https://deno.land/x/graphql_tag@0.0.1/mod.ts';

export const typeDefs = gql`
  type RocketType {
    id: Int
    active: Boolean
    stages: Int
    first_flight: String
    country: String
    height: HeightType
    diameter: DiameterType
    wikipedia: String
    description: String
    rocket_id: String
    rocket_name: String
    rocket_type: String
  }

  type HeightType {
    meters: Float
    feet: Float
  }

  type DiameterType {
    meters: Float
    feet: Float
  }

  type Query {
    rockets: [RocketType!]!
    oneRocket(id: String): RocketType
  }
`;
