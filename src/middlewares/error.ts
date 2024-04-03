import { NextFunction, Request, Response } from 'express';
import { ErrorHandler } from '../utils/utility-class.js';
import { controllerType } from '../types/types.js';

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.message ||= 'Internal error';
  err.statusCode ||= 500;

  if(err.name === "CastError") err.message = "Invalid Id.";
  
  return res.status(err.statusCode).json({
    success: true,
    message: err.message,
  });
};

//  a function returns arrow function
export const TryCatch =
  (func: controllerType) =>
  //   received from newUser,...any
  (req: Request, res: Response, next: NextFunction) => {
    return Promise
        .resolve(func(req, res, next))
        .catch(next);
  };
  