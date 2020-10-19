import { createServer, addRoute } from "@appandflow/s-express";

createServer();

addRoute(() => ({ user: { name: "salut", id: "hehe" } }), {
  path: "/user",
  fields: ["id!"],
});

addRoute(() => ({ users: [{ name: "salut", id: "hehe" }] }), {
  path: "/users",
  fields: ["limit"],
});

addRoute(() => ({ name: "salut" }), {
  path: "/me",
});

addRoute(() => ({ name: "salut" }), {
  path: "/me",
  method: "PUT",
  fields: ["name"],
});
