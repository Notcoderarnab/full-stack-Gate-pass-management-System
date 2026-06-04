import {

  Request,
  Response,
  NextFunction

} from 'express';

export const errorMiddleware = (

  err: Error,

  req: Request,

  res: Response,

  next: NextFunction

) => {

  console.error(' Error:', err.stack);

  res.status(500).json({

    success: false,

    message:
      process.env.NODE_ENV === 'production'

        ? 'Internal server error'

        : err.message,

  });

};