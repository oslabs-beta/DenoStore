const queryParser = (queryString: string): string => {
  if (queryString === '') {
    console.error(
      '%cError finding query in the resolver.',
      'font-weight: bold; color: white; background-color: red;'
    );
    throw new Error('Query error. See server console.');
  }
  if (queryString[0] === 'm') {
    console.error(
      '%cDenostore cache function does not allow caching of mutations.',
      'font-weight: bold; color: white; background-color: red;'
    );
    throw new Error('Query error. See server console.');
  }
  let queryName = '';
  let curlyCount = 0;

  for (let i = 0; i < queryString.length && curlyCount < 2; i++) {
    if (queryString[i] === '{') curlyCount++;
    if (curlyCount === 1 && queryString[i] !== '{') {
      queryName += queryString[i];
    }
  }
  queryName = queryName.trim();
  return queryName;
};

const queryExtract = (node: any): string => {
  let queryName = '';
  queryName += node.name.value;
  if (node.arguments.length) {
    queryName += '(';
    node.arguments.forEach((arg: any, i: number) => {
      if (i > 0) queryName += ',';
      queryName += arg.name.value + ':' + arg.value.value;
    });
    queryName += ')';
  }
  return queryName;
};

export { queryParser, queryExtract };
