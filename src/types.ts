//interface for the shape of each test and types of key/values

export interface DenostoreArgs {
  schema: any;
  redisClient: any;
  route?: string;
  usePlayground?: boolean;
  defaultCacheExpire?: number | boolean;
}
