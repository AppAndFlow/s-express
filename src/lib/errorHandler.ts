/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Response } from "express";

import { SystemError } from "./error";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "./restCodes";

export default function errorHandler(
  err: SystemError,
  _: any,
  res: Response,
  __: NextFunction,
) {
  let error = err.message;
  let data = err.data;
  let restCode = err.restCode;

  if (process.env.NODE_ENV === "production") {
    data = undefined;
    error = err.prodMessage || error;

    if (err instanceof SystemError !== true) {
      // prevent error leaking in prod.
      error = "INTERNAL SERVER ERROR";
      restCode = INTERNAL_SERVER_ERROR;
    }
  }
  res.status(restCode || BAD_REQUEST).json({ error, data });
}
