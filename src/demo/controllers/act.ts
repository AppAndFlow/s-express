import { addRoute } from "../..";
import * as actServices from "../services/act";
import { deleteMe } from "../services/test";
import { Ctx } from "../types";
// import { Act } from "../sharedTypes";

addRoute<void, void, Ctx>(
  async ({ ctx }) => {
    return actServices.initAct({ userId: ctx.user! });
  },
  {
    method: "POST",
    path: "/me/artist/act",
  }
);

addRoute<any, void, Ctx>(
  async ({ data, ctx }) => {
    return actServices.editMeAct({ ...data, userId: ctx.user! });
  },
  {
    method: "PUT",
    path: "/me/artist/act",
    fields: ["actId!"],
  }
);

addRoute<any, void, Ctx>(
  async ({ data, ctx }) => {
    return deleteMe({ ...data, userId: ctx.user! });
  },
  {
    method: "POST",
    path: "/me",
    fields: ["actId!"],
  }
);
