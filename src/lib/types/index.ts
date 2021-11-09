import { RequestHandler } from "express";
import dotenv from "dotenv";
import morgan from "morgan";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface AddRoute {
  method?: HttpMethod;
  path?: string;
  middlewares?: RequestHandler[];
  secure?: boolean;
  fields?: Field[];
  summary?: string;
  description?: string;
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
