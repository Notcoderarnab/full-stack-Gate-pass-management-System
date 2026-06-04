import jwt from 'jsonwebtoken';

interface TokenPayload {

  id: string;

  email: string;

  role: string;
}

export const generateAccessToken = (user: TokenPayload): string => {

  return jwt.sign(

    {
      id: user.id,
      email: user.email,
      role: user.role
    },

    process.env.JWT_SECRET!,

    {
      expiresIn: '15m'
    }
  );
};

export const generateRefreshToken = (userId: string): string => {

  return jwt.sign(

    { userId },

    process.env.JWT_REFRESH_SECRET!,

    {
      expiresIn: '7d'
    }
  );
};

export const verifyRefreshToken = (
  token: string
): { userId: string } => {

  return jwt.verify(

    token,

    process.env.JWT_REFRESH_SECRET!

  ) as { userId: string };

};