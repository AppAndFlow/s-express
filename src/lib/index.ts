import express, { Express, NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import requireDir from "require-dir";

import required, { isFieldRequired } from "../utils/requiredFields";
import store, { getRoutes, updateRouteStore } from "./store";
import errorHandler from "./errorHandler";
import { generateDocs } from "./generator";
import { DEFAULT_PORT } from "./restCodes";
import { AddRoute, Config, HttpMethod } from "./types";
import { generateClient } from "./clientGenerator";
import {
  getCachedResponse,
  initCachedResponse,
  setCachedResponse,
} from "./cachedResponse";

export function createServer(
  config: Config | undefined = { useCors: true }
): Express {
  require("express-async-errors");
  dotenv.config(config.dotenvConfig);
  const expressApp = express();

  if (config.uses) {
    config.uses.forEach((use) => {
      expressApp.use(use);
    });
  }

  store.set("expressApp", expressApp);
  store.set("config", config);
  updateRouteStore([]);

  expressApp.use(express.json());

  if (config.morgan) {
    expressApp.use(morgan(config.morgan.format, config.morgan.options));
  } else {
    expressApp.use(morgan("short"));
  }

  if (config.useCors) {
    expressApp.use(cors());
  }

  if (!config.disableListening) {
    expressApp.set("port", config?.port || process.env.PORT || DEFAULT_PORT);

    expressApp.listen(expressApp.get("port"), () => {
      console.log(
        config.readyMessage
          ? config.readyMessage
          : `Ready on http://localhost:${expressApp.get("port")}`
      );
    });
  }

  setTimeout(() => {
    if (config.controllersPath) {
      requireDir(`${process.cwd()}/${config.controllersPath}`);
    }
    // The error handler needs to be declared last.
    expressApp.use(config.errorHandler || errorHandler);
  }, 100);

  generateDocs();
  generateClient();

  if (config.cache) {
    initCachedResponse(config.cache);
  }

  return expressApp;
}

export function addRoute<Data = unknown, Params = unknown, Ctx = unknown>(
  cb: ({
    req,
    res,
    data,
    params,
    ctx,
  }: {
    req: Request;
    res: Response;
    data: Data;
    params: Params;
    ctx: Ctx;
  }) => Record<string, any>,
  {
    method = "GET",
    path = "/",
    middlewares = [],
    secure,
    fields,
    summary = "",
    description = "",
    cache,
  }: AddRoute = {
    method: "GET",
    path: "/",
    middlewares: [],
    cache: undefined,
  }
) {
  const expressFn = _getExpressMethodFn(method);
  const config = store.get("config") as Config;

  // ---Update routes list to our system.
  const routes = getRoutes();
  routes.push({
    path,
    method,
    fields: fields || [],
    summary,
    description,
  });
  updateRouteStore(routes);
  // ----------

  let authMiddleware =
    config.auth && config.auth.secureAllRoutes
      ? config.auth.authMiddleware
      : _placeholder;
  if (
    secure &&
    (!config.auth || (config.auth && !config.auth.authMiddleware))
  ) {
    throw new Error(
      `Cannot use config.secure on route ${path} as authMiddleware is undefined.`
    );
  } else if (typeof secure === "boolean" && !secure) {
    authMiddleware = _placeholder;
  }

  expressFn(
    path,
    authMiddleware,
    ...middlewares,
    async (req: Request, res: Response) => {
      if (fields && fields.length) {
        const requiredFields: string[] = [];

        fields.forEach((field) => {
          if (typeof fields === "string" && isFieldRequired(field as string)) {
            requiredFields.push(field as string);
          } else if (typeof field === "object" && !field.optional) {
            requiredFields.push(field.name);
          }
        });

        if (requiredFields.length) {
          required({
            fields: requiredFields,
            req,
          });
        }
      }

      let params: any = {};
      let ctx: any = {};
      const data: any = {};
      if (req.params) {
        params = req.params;
      }
      if (req.body) {
        Object.assign(data, req.body);
      }
      if (req.query) {
        Object.assign(data, req.query);
      }
      // @ts-ignore
      if (req.ctx) {
        // @ts-ignore
        ctx = req.ctx;
      }

      let result: Record<string, any> | undefined;

      if (cache) {
        result = getCachedResponse({ req, ctx });
      }

      if (!result) {
        result = await cb({ req, res, data, params, ctx });
        if (cache) {
          setCachedResponse({
            ctx,
            req,
            responseData: result,
          });
        }
      }

      if (!result) {
        result = { error: null };
      }

      // TODO add support to support other rest code then 200 for instance
      if (!res.headersSent) {
        // Check to make sure that req.send has not been used yet.
        res.json(result);
      }
    }
  );
}

export function getExpressApp() {
  const expressApp = store.get("expressApp") as Express;
  if (!expressApp) {
    throw new Error("expressApp not initialized.");
  }
  return expressApp;
}

function _getExpressMethodFn(method: HttpMethod) {
  const expressApp = store.get("expressApp") as Express;
  switch (method) {
    case "GET":
      return expressApp.get.bind(expressApp);
    case "POST":
      return expressApp.post.bind(expressApp);
    case "DELETE":
      return expressApp.delete.bind(expressApp);
    case "PUT":
      return expressApp.put.bind(expressApp);
    case "PATCH":
      return expressApp.patch.bind(expressApp);
    default:
      return expressApp.get.bind(expressApp);
  }
}

function _placeholder(_: any, __: any, next: NextFunction) {
  next();
}
