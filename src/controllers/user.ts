import { Response, NextFunction } from 'express';

import { Request } from '../types';
import { sign } from '../services/jwt';
import User from '../models/User';

const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(422).json({ message: 'Email is already in use' });
    }

    const user = new User({ email, password });

    await user.save();
    return res.status(201).json({});
  } catch (e) {
    next(e);
  }
};

const signIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }, '+password');

    if (!user) {
      return res
        .status(401)
        .json({ message: 'Username and/or password are incorrect' });
    }

    const match = await user.comparePassword(password);

    if (match) {
      const token = sign({ id: user.id, email });

      return res.status(200).json({ token });
    } else {
      return res
        .status(401)
        .json({ message: 'Username and/or password are incorrect' });
    }
  } catch (e) {
    next(e);
  }
};

const me = (req: Request, res: Response) => {
  return res.status(200).json({ ...req.user });
};

export { signUp, signIn, me };
