import { Document } from 'mongoose';
import { Request as ExpressRequest } from 'express';

export interface Request extends ExpressRequest {
  user?: any;
}

export interface UserDocument extends Document {
  email: string;
  password: string;
  comparePassword: (password: string) => Promise<boolean>;
}
