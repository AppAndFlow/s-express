import { addRoute } from "../..";
import * as testServices from "../services/test";
import { Ctx } from "../types";
// import { Act } from "../sharedTypes";

addRoute<void, void, Ctx>(
  async ({ ctx }) => {
    return testServices.getActor({ userId: ctx.user! });
  },
  {
    method: "GET",
    path: "/actor",
  }
);

addRoute<{ salute: string; ohoh: number }, void, Ctx>(
  async ({ data, ctx }) => {
    return testServices.editActor({ ...data, userId: ctx.user! });
  },
  {
    method: "PATCH",
    path: "/actor",
    fields: ["actId!"],
  }
);

addRoute<any, void, Ctx>(async ({ data, ctx }) => {
  return testServices.getSimpleActor({ ...data, userId: ctx.user! });
});
