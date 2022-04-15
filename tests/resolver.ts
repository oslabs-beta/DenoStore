export const resolvers = {
  Query: {
    rockets: async (_p: any, _a: any, { denostore }: any, info: any) => {
      return await denostore.cache({ info, ex: -1 }, async () => {
        return await fetch(`https://api.spacexdata.com/v3/rockets`).then(
          (res) => res.json()
        );
      });
    },
    oneRocket: async (_p: any, { id }: any, { denostore }: any, info: any) => {
      return await denostore.cache({ info, ex: -1 }, async () => {
        return await fetch(`https://api.spacexdata.com/v3/rockets/${id}`).then(
          (res) => res.json()
        );
      });
    },
  },
};
