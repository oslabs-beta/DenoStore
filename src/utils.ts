import { FieldNode, CacheKeyObj, GraphQLResolveInfo } from './types.ts';


const buildCacheKey = (info: GraphQLResolveInfo): string => {
  if (info.operation.operation === 'mutation') {
    console.error(
      '%cDenostore cache function does not allow caching of mutations.',
      'font-weight: bold; color: white; background-color: red;'
    );
    throw new Error('Query error. See server console.');
  }
  const node: FieldNode = info.fieldNodes[0];
  const cacheKeyObj: CacheKeyObj = {
    name: node.name.value,
    arguments: node.arguments,
    variables: info.variableValues,
  };

  return JSON.stringify(cacheKeyObj);
};

export { buildCacheKey };
