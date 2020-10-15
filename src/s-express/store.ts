import { Config, HttpMethod } from "./index";

const store = new Map<string, any>();

export default store;

export type Field = string | fieldObject;

interface RouteStore {
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

export function getRoutes(): RouteStore[] {
  return store.get("routes");
}

export function updateRouteStore(routeStore: RouteStore[]) {
  store.set("routes", routeStore);
}

export function getConfig() {
  return store.get("config") as Config;
}
