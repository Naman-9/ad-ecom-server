import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User.js';
import { newUserRequesstBody } from '../types/types.js';
import { ErrorHandler } from '../utils/utility-class.js';
import { TryCatch } from '../middlewares/error.js';

export const newUser = TryCatch(
  async (req: Request<{}, {}, newUserRequesstBody>, res: Response, next: NextFunction) => {
    const { _id, name, email, gender, photo, dob } = req.body;

    let user = await User.findById(_id);

    if (user)
      return res.status(200).json({
        success: true,
        message: `Welcome, ${user.name}`,
      });

    if (!_id || !name || !email || !gender || !photo || !dob) {
      return next(new ErrorHandler('Please add all Feilds.', 400));
    }

    user = await User.create({
      _id,
      name,
      email,
      gender,
      photo,
      dob: new Date(dob),
    });

    return res.status(200).json({
      success: true,
      message: `Welcome, ${user.name}`,
    });
  },
);

export const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find({});

  return res.status(201).json({
    success: true,
    users,
  });
});

export const getUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler('Invalid User Id.', 500));
  return res.status(200).json({
    success: true,
    user,
  });
});

export const deleteUser = TryCatch(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler('Invalid User Id.', 500));
  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: 'User Deleted Successfully.',
  });
});

