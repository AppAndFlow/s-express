import jwt from 'jsonwebtoken';

const JWT_OPTIONS = {
  issuer: 'api',
};

const sign = (payload: string | object) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT secret is not defined');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    ...JWT_OPTIONS,
    expiresIn: '1w',
  });
};

const verify = (token: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT secret is not defined');
  }

  return jwt.verify(token, process.env.JWT_SECRET, JWT_OPTIONS);
};

export { sign, verify };
