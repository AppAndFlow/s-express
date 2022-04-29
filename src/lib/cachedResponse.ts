import { Request } from "express";
import store from "./store";
import { CacheOptions, HttpMethod } from "./types";

const LRU = require("lru-cache");

let cache: any = undefined;

export function initCachedResponse(cacheOptions: CacheOptions) {
  cache = new LRU({
    ttl: 1000 * 60 * 10, // 10min
    max: 200,
    ...cacheOptions,
  } as Partial<CacheOptions>);
}

export function getCachedResponse({ req, ctx }: { req: Request; ctx: any }) {
  const config = store.get("config");
  const cacheOptions = config.cache as CacheOptions;
  try {
    const key = composeKey(req, ctx);
    return cache.get(key);
  } catch (e) {
    if (e === "not set") {
      console.error(`Using cache=true but cacheOptions is not configured.`);
    } else {
      console.error(
        `Could not retrieve cache using ctx[${cacheOptions.ctxKey}]`
      );
    }
  }

  return undefined;
}

export function setCachedResponse({
  req,
  ctx,
  responseData,
}: {
  req: Request;
  ctx: any;
  responseData: any;
}) {
  const config = store.get("config");
  const cacheOptions = config.cache as CacheOptions;
  try {
    const key = composeKey(req, ctx);
    cache.set(key, responseData);
  } catch (e) {
    if (e === "not set") {
      console.error(`Using cache=true but cacheOptions is not configured.`);
    } else {
      console.error(
        `Could not retrieve cache using ctx[${cacheOptions.ctxKey}]`
      );
    }
  }
}

function composeKey(req: Request, ctx: any) {
  const config = store.get("config");
  const cacheOptions = config.cache as CacheOptions;
  if (!cacheOptions) {
    throw "not set";
  }
  if (!cacheOptions.ctxKey) {
    throw "";
  }

  const ctxKeyPart = cacheOptions.ctxKey.split(".");

  let ctxKeyComposed = ctx;
  let index = 0;
  let exist: any;

  while (index < ctxKeyPart.length) {
    exist = ctxKeyComposed[ctxKeyPart[index]];
    if (exist) {
      index += 1;
      ctxKeyComposed = exist;
      if (typeof exist === "string" || typeof exist === "number") {
        break;
      }
    } else {
      break;
    }
  }

  const httpMethod = req.method;
  const routePath = req.path;
  const key = `${httpMethod}-${ctxKeyComposed}-${routePath}`;
  return key;
}
