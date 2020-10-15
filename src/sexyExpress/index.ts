import express, {
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
// import createStore from 'data-store';

// // const store = createStore('store');

import store from './store';
import errorHandler from './errorHandler';
import { generateDocs } from './generator';

const DEFAULT_PORT = 8000;

export interface Config {
  port?: string | number;
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
  };
}

function init(config: Config | undefined = { useCors: true }): Express {
  require('express-async-errors');
  dotenv.config(config.dotenvConfig);
  const expressApp = express();

  store.set('expressApp', expressApp);
  store.set('config', config);
  store.set('routes', []);

  expressApp.use(express.json());
  expressApp.use(morgan('short'));

  if (config.useCors) {
    expressApp.use(cors());
  }

  expressApp.set('port', config?.port || process.env.PORT || DEFAULT_PORT);

  expressApp.listen(expressApp.get('port'), () => {
    console.log(
      config.readyMessage
        ? config.readyMessage
        : `Ready on http://localhost:${expressApp.get('port')}`,
    );
  });

  // The error handler needs to be declared last.
  setTimeout(() => {
    expressApp.use(errorHandler);
  }, 100);

  generateDocs();

  return expressApp;
}

export default init;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface AddRoute {
  method?: HttpMethod;
  path?: string;
  middlewares?: RequestHandler[];
  secure?: boolean;
}

export function addRoute<Data = unknown, Params = unknown>(
  cb: ({
    req,
    res,
    data,
    params,
  }: {
    req: Request;
    res: Response;
    data: Data;
    params: Params;
  }) => Record<string, any>,
  { method = 'GET', path = '/', middlewares = [], secure }: AddRoute = {
    method: 'GET',
    path: '/',
    middlewares: [],
  },
) {
  const expressFn = _getExpressMethodFn(method);
  const config = store.get('config') as Config;

  // ---Update routes list to our system.
  const routes = store.get('routes') as { path: string; method: HttpMethod }[];
  routes.push({ path, method });
  store.set('routes', routes);
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
      `Cannot use config.secure on route ${path} as authMiddleware is undefined.`,
    );
  } else if (typeof secure === 'boolean' && !secure) {
    authMiddleware = _placeholder;
  }

  expressFn(
    path,
    authMiddleware,
    ...middlewares,
    async (req: Request, res: Response) => {
      // todo add logic to handle openapi generation

      let params: any = {};
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

      let result: Record<string, any> = { error: null };

      // might be hacky, maybe there's a better way
      if (cb.constructor.name == 'AsyncFunction') {
        result = await cb({ req, res, data, params });
      } else {
        result = cb({ req, res, data, params });
      }

      if (!result) {
        result = { error: null };
      }

      // TODO add support to support other rest code then 200 for instance
      res.json(result);
    },
  );
}

export function getExpressApp() {
  const expressApp = store.get('expressApp') as Express;
  if (!expressApp) {
    throw new Error('expressApp not initialized.');
  }
  return expressApp;
}

function _getExpressMethodFn(method: HttpMethod) {
  const expressApp = store.get('expressApp') as Express;
  switch (method) {
    case 'GET':
      return expressApp.get.bind(expressApp);
    case 'POST':
      return expressApp.post.bind(expressApp);
    case 'DELETE':
      return expressApp.delete.bind(expressApp);
    case 'PUT':
      return expressApp.put.bind(expressApp);
    case 'PATCH':
      return expressApp.patch.bind(expressApp);
  }
}

function _placeholder(_: any, __: any, next: NextFunction) {
  next();
}
