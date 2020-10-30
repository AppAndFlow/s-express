# s-express

<img src="https://cdn.discordapp.com/attachments/688484592348561446/766241998868709406/unknown.png"
/>

[![npm (scoped)](https://img.shields.io/npm/v/@appandflow/s-express.svg)](https://www.npmjs.com/package/@appandflow/s-express)

## Features

- **Generates OpenApi documentation at runtime in .yaml, .json and .md**
- **Handles async errors globally out of the box**
- **Dead simple API and almost no config required**
- **Provides a simple wrapper around Error**
- **Fully backward compatible with exppres.js**
- **Enforce json response aka contentType: application/json**

It's basically express.js with a bit more sugar and opinionated stuff. I just wanted
something that would automatically generate openApi documentation based on my app
endpoints. I know there's a lot of solutions out there for that,
but I wanted something with almost no config and a super simple API not far from express. Hence why I made this little package.

### Installation

```
  npm i @appandflow/s-express
```

### API

**Creating a server (minimal example)**

You might wanna do this in your index.ts

`index.ts`

```TS
import { createServer } from '@appandflow/s-express'
const IamAnExpressAppBasically = createServer()


// Don't forget to require the files where you
// used "addRoute"
require('./controller');

```

The returned value is basically an Express app.
You can of course pass some configs to `createServer(config)`.

```TS
interface Config {
  port?: string | number;   // default is 1337
  useCors?: boolean;        // default is true
  readyMessage?: string;
  dotenvConfig?: dotenv.DotenvConfigOptions;
  auth?: {
    // You can provide a middleware
    // that will be use on each routes
    authMiddleware: RequestHandler;
    // You can specify if you want the middleware
    // to be active on each of your routes.
    secureAllRoutes?: boolean;
  };
  doc?: {
    // These infos will be use
    // for the openApi doc.
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
}

// the server object you wish to expose in your openApi doc.
interface DocServer {
  url: string;
  description: string;
}

```

**Adding a route to our server (minimal example)**

You can do this everywhere and the way you wish
but I'll suggest using a classic controller pattern.

`controller.ts`

```TS
import { addRoute } from '@appandflow/s-express'

// First you got your callback à la express.js
// but we slightly modificated signature

// As you can see you still have access to req and res from express
// if you really need them.
// However now, note that any data passed towards your api
// will be in `data`. Even if it's a GET, POST, PUT etc.., it doesn't matter
// it all goes into `data`.
// You can access the query params on `params` if needed.
addRoute(({ data, req, res, params }) => {
  // The returned value(s) is what will be send as a json response.
  return {any: object, you: wish, to: 'return to you client'}
}, config)


const config: AddRouteConfig = {...}

export interface AddRouteConfig {
  method?: HttpMethod; // default is GET

  path?: string;      // default is "/"

  middlewares?: RequestHandler[]; // any middleware you wish to add to this endpoint

  secure?: boolean; // if you provided an authMiddleware when you created the server, you can specify if it applies or not to this endpoint.

  fields?: Field[]; // any fields you expect for this endpoint
  // i.e: fields: ["id!", "firstName"]
  // You can add a "!" at the end of the name of the field, this means
  // that this field is mandatory. S-express will validate that the required fields
  // are not undefined. Also it will be use to generate the openApi Docs.

  summary?: string; // You can add a summary for this endpoint.
  // It will be use for the openApi Docs.

  description?: string; // You can add a description for this endpoint.
  // It will be use for the openApi Docs.
}

```

**SexpressError a basic Error wrapper.**

todo.

```TS
import { SexpressError } from '@appandflow/s-express'
throw new SexpressError({
    message: "Dev error msg, this will be remove when env === production if you specify a prodMessage,",
    restCode: 422,
    prodMessage: "If you wish to have another error for once env === production.",
    data: {msg: "any data you wish to add, this will be remove when env === production."}
})

```

**Generating OpenApi Doc**

You have to set the env variable `DOC_MODE` to `true`.
The app will then start in doc mode and every declared endpoint
throughout the app will be hit by a request and capturing it returned value(s)

Documentation will be generated under `/docs`.
You can see an example <a href="https://github.com/AppAndFlow/s-express/blob/master/openApiDocExample">Here</a>

I suggest adding this your scripts in your package.json

i.e: `openApiDoc: "rm -rf docs && tsc && DOC_MODE=true node dist/index.js"`

## Todo(s)

- **Write better documentation**
- **Add support for authenticated api calls when generating OpenApi Doc**

## This is an experimental package. Use at your own risk.

## Thanks

- Thanks to <a href="https://github.com/alexcrist/json-to-pretty-yaml">json-to-pretty-yaml<a/>

- Thanks to <a href="https://github.com/theBenForce/openapi-markdown">openapi-markdown<a/>

- And of course to any other open source libs used by my package.
