import { NextFunction, Response } from 'express';

// import { verify } from '../services/jwt';
import { Request } from '../types';

const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorizationHeader = req.get('Authorization');

    if (!authorizationHeader) {
      throw new Error();
    }

    const [prefix, token, ...rest] = authorizationHeader.split(' ');

    if (prefix !== 'Bearer' || rest.length) {
      throw new Error();
    }

    // const { id, email }: any = verify(token);

    throw 'a';

    next();
  } catch (e) {
    req.user = null;
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export default auth;
