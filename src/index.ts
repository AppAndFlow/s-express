import { addRoute, createServer, getExpressApp } from "./lib";
import SexpressError from "./lib/sexpressError";

export { addRoute, createServer, getExpressApp, SexpressError };

createServer({
  controllersPath: "dist/demo/controllers",
});
