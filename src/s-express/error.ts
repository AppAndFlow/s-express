import { RestCodeEnum } from './restCodes';

/*
  Simple Wrapper arround node.js Errors
*/
export class SystemError extends Error {
  restCode?: RestCodeEnum;
  prodMessage?: string;
  data: any;
  constructor({
    message,
    restCode,
    prodMessage,
    data,
  }: {
    message?: string;
    restCode?: RestCodeEnum;
    prodMessage?: string;
    data?: any;
  }) {
    super(message);
    this.restCode = restCode;
    this.prodMessage = prodMessage || message;
    this.data = data;
  }
}
