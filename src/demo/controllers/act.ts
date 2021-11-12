import { addRoute } from "../..";
import * as actServices from "../services/act";
import { MM } from "../services/tesa";
import { deleteMe } from "../services/test";
import { Ctx } from "../types";
// import { Act } from "../sharedTypes";

addRoute<string, void, Ctx>(
  async ({ ctx }) => {
    return actServices.initAct({ userId: ctx.user! });
  },
  {
    method: "POST",
    path: "/me/artist/act",
  }
);

addRoute<MM, void, Ctx>(
  async ({ data, ctx }) => {
    return actServices.editMeAct({ ...data, userId: ctx.user! });
  },
  {
    method: "PUT",
    path: "/me/artist/act",
    fields: ["actId!"],
  }
);

addRoute<{ a: number; b: { c: string } }, void, Ctx>(
  async ({ data, ctx }) => {
    return deleteMe({ ...data, userId: ctx.user! });
  },
  {
    method: "POST",
    path: "/me",
    fields: ["actId!"],
  }
);
