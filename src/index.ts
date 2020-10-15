import auth from "./middlewares/auth";
import { addRoute, createServer } from "./s-express";

createServer({
  doc: {
    title: "saluttttt",
    description: "testt description",
  },
});

addRoute<{ helo: string }, { dd: "aa" }>(
  ({ data, params }) => {
    return { salut: "wooooo" };
  },
  { secure: false },
);

addRoute(({ data }) => ({ leBodyDuPost: { dsad: "dasdsa" } }), {
  method: "POST",
});

addRoute(
  ({ data }) => {
    return { id: "dasdasdas", nom: "dsadasdasdas", prenom: "test" };
  },
  {
    method: "GET",
    path: "/me",
  },
);

addRoute(
  ({ data }) => {
    return { id: "dasdasdas", nom: "dsadasdasdas", prenom: "test" };
  },
  {
    method: "GET",
    path: "/me/:params1/kiki/:params2",
  },
);

addRoute(
  ({ data }) => {
    return {
      id: "dasdasdas",
      picture: "dsadasdasdas",
      id2: "test",
      ide3: ";dad",
    };
  },
  {
    method: "GET",
    path: "/moi/:params1/kiki/:params2",
    fields: [
      "trainerId",
      "trainerAge!",
      { name: "yolofield", type: "string", enum: ["enume1", "enume3"] },
    ],
    summary: "je suis un resume",
    description: "Cette route ne vaut pas dla marde.",
  },
);

addRoute(
  async () => {
    return await new Promise((resolve) => {
      setTimeout(() => resolve({ promeeeeseee: "foncitonne" }), 3000);
    });
  },
  { path: "/lolllll" },
);
