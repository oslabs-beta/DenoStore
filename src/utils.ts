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

export { queryParser };
