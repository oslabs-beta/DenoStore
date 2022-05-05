// deno-lint-ignore-file no-explicit-any
export const resolvers = {
  Query: {
    rockets: async (_p: any, _a: any, { ds }: any, info: any) => {
      return await ds.cache({ info, ex: -1 }, async () => {
        return await fetch(`https://api.spacexdata.com/v3/rockets`).then(
          (res) => res.json()
        );
      });
    },
    oneRocket: async (_p: any, { id }: any, { ds }: any, info: any) => {
      return await ds.cache({ info, ex: -1 }, async () => {
        return await fetch(`https://api.spacexdata.com/v3/rockets/${id}`).then(
          (res) => res.json()
        );
      });
    },
  },
};
