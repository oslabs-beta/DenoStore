import { QueryObjType, GraphQLResolveInfo } from './types.ts';

const queryExtract = (info: GraphQLResolveInfo): string => {
  if (info.operation.operation === 'mutation') {
    console.error(
      '%cDenostore cache function does not allow caching of mutations.',
      'font-weight: bold; color: white; background-color: red;'
    );
    throw new Error('Query error. See server console.');
  }
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
