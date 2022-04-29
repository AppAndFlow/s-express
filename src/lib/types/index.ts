import { RequestHandler } from "express";
import dotenv from "dotenv";
import morgan from "morgan";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * Source: https://github.com/isaacs/node-lru-cache
 */
export interface CacheOptions {
  ctxKey: string; // the unique key to generate from. The path i.e: 'user.id'

  // the number of most recently used items to keep.
  // note that we may store fewer items than this if maxSize is hit.

  max?: number; // <-- Technically optional, but see "Storage Bounds Safety" below

  // if you wish to track item size, you must provide a maxSize
  // note that we still will only keep up to max *actual items*,
  // so size tracking may cause fewer than max items to be stored.
  // At the extreme, a single item of maxSize size will cause everything
  // else in the cache to be dropped when it is added.  Use with caution!
  // Note also that size tracking can negatively impact performance,
  // though for most cases, only minimally.
  maxSize?: number;

  // function to calculate size of items.  useful if storing strings or
  // buffers or other items where memory size depends on the object itself.
  // also note that oversized items do NOT immediately get dropped from
  // the cache, though they will cause faster turnover in the storage.
  sizeCalculation?: (value: any, key: string) => number;

  // function to call when the item is removed from the cache
  // Note that using this can negatively impact performance.
  dispose?: (value: any, key: string) => void;

  // max time to live for items before they are considered stale
  // note that stale items are NOT preemptively removed by default,
  // and MAY live in the cache, contributing to its LRU max, long after
  // they have expired.
  // Also, as this cache is optimized for LRU/MRU operations, some of
  // the staleness/TTL checks will reduce performance, as they will incur
  // overhead by deleting items.
  // Must be a positive integer in ms, defaults to 0, which means "no TTL"
  ttl?: number;

  // return stale items from cache.get() before disposing of them
  // boolean, default false
  allowStale?: boolean;

  // update the age of items on cache.get(), renewing their TTL
  // boolean, default false
  updateAgeOnGet?: boolean;

  // update the age of items on cache.has(), renewing their TTL
  // boolean, default false
  updateAgeOnHas?: false;
}

export interface AddRoute {
  method?: HttpMethod;
  path?: string;
  middlewares?: RequestHandler[];
  secure?: boolean;
  fields?: Field[];
  summary?: string;
  description?: string;
  cache?: boolean;
}

export interface Config {
  port?: string | number;
  disableListening?: boolean;
  useCors?: boolean;
  readyMessage?: string;
  dotenvConfig?: dotenv.DotenvConfigOptions;
  auth?: {
    authMiddleware: RequestHandler;
    secureAllRoutes?: boolean;
  };
  doc?: {
    version?: string;
    title?: string;
    description?: string;
    servers?: DocServer[];
    headers?: any[];
  };
  morgan?: {
    format: string;
    options?: morgan.Options<any, any>;
  };
  // list of app.use stuff that you want when the app boot
  uses?: any[];
  generateDoc?: boolean;
  controllersPath?: string;
  cache?: CacheOptions;
}

export interface DocServer {
  url: string;
  description: string;
}

export type Field = string | fieldObject;

export interface RouteStore {
  path: string;
  method: HttpMethod;
  fields: Field[];
  summary: string;
  description: string;
}

export interface fieldObject {
  name: string;
  type?: "string" | "number" | "boolean";
  optional?: boolean;
  enum?: string[];
  description?: string;
}
