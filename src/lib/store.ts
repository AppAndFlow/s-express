import { Config, RouteStore } from "./types/index";

const store = new Map<string, any>();

export default store;

export function getRoutes(): RouteStore[] {
  return store.get("routes");
}

export function updateRouteStore(routeStore: RouteStore[]) {
  store.set("routes", routeStore);
}

export function getConfig() {
  return store.get("config") as Config;
}
