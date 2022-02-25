const queryParser = (queryString:string):string => {
    let queryName = '';
    let curlyCount = 0;
    for (let i = 0; i < queryString.length && curlyCount < 2; i++){
      if (queryString[i] === '{') curlyCount++;
      if (curlyCount === 1 && queryString[i] !== '{') {
        queryName += queryString[i];
      }
    }
    queryName = queryName.trim();
    return queryName;
  }

export { queryParser };