import { Request } from "express";

export function required({ fields, req }: { fields: string[]; req: Request }) {
  if (
    req.route.methods.post ||
    req.route.methods.put ||
    req.route.methods.patch
  ) {
    fields.forEach((field) => {
      if (typeof req.body[field] === "undefined") {
        throw new Error(`Missing field "${field}"`);
      }
    });
  } else {
    fields.forEach((field) => {
      if (typeof req.query[field] === "undefined") {
        throw new Error(`Missing field "${field}"`);
      }
    });
  }
}

export default required;

export function isFieldRequired(field: string) {
  return field[field.length - 1] === "!";
}
