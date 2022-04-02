import { QueryObjType, GraphQLResolveInfo } from './types.ts';

// const queryParser = (queryString: string): string => {
//   if (queryString === '') {
//     console.error(
//       '%cError finding query in the resolver.',
//       'font-weight: bold; color: white; background-color: red;'
//     );
//     throw new Error('Query error. See server console.');
//   }
//   if (queryString[0] === 'm') {
//     console.error(
//       '%cDenostore cache function does not allow caching of mutations.',
//       'font-weight: bold; color: white; background-color: red;'
//     );
//     throw new Error('Query error. See server console.');
//   }
//   let queryName = '';
//   let curlyCount = 0;

//   for (let i = 0; i < queryString.length && curlyCount < 2; i++) {
//     if (queryString[i] === '{') curlyCount++;
//     if (curlyCount === 1 && queryString[i] !== '{') {
//       queryName += queryString[i];
//     }
//   }
//   queryName = queryName.trim();
//   return queryName;
// };

const queryExtract = (info: GraphQLResolveInfo): string => {
  const node = info.fieldNodes[0];
  const queryObj: QueryObjType = {
    name: node.name.value,
    arguments: node.arguments,
    variables: info.variableValues,
  };

  //find node name value as one key, args on another key
  return JSON.stringify(queryObj);
};

export { queryExtract };
