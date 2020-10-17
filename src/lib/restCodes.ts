export type RestCodeEnum =
  | typeof BAD_REQUEST
  | typeof NOT_FOUND
  | typeof UNAUTHORIZED
  | typeof INTERNAL_SERVER_ERROR;

export const BAD_REQUEST = 400;
export const NOT_FOUND = 404;
export const UNAUTHORIZED = 401;
export const INTERNAL_SERVER_ERROR = 500;

export const DEFAULT_PORT = 8000;
