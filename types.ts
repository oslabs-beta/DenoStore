//interface for the shape of each test and types of key/values

export interface RouterArgs {
  schema: any;
  usePlayground?: boolean;
  defaultCacheExpire?: number | boolean;
  redisClient?: any;
}
