// import express from 'express';
// import morgan from 'morgan';
// import cors from 'cors';
// import 'dotenv/config';

// import { connect } from './services/mongoose';
// import auth from './middlewares/auth';
// import * as userController from './controllers/user';

// const app = express();

// connect();
// app.set('port', process.env.PORT);
// app.use(express.json());
// app.use(morgan('short'));
// app.use(cors());
// app.listen(app.get('port'), () => {
//   console.log(`Ready on http://localhost:${app.get('port')}`);
// });
// app.post('/sign-up', userController.signUp);
// app.post('/sign-in', userController.signIn);
// app.get('/me', auth, userController.me);

import auth from "./middlewares/auth";
import sexyExpress, { addRoute } from "./sexyExpress";

sexyExpress({
  // auth: {
  //   authMiddleware: auth,
  //   secureAllRoutes: true,
  // },
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
    fields: ["trainerId", "trainerAge!"],
    summary: "je suis un resume",
    description: "Cette route ne vaut pas dla marde.",
  },
);
