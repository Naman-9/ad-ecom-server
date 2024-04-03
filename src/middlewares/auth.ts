import { User } from "../models/User.js";
import { ErrorHandler } from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

// middleware to make sure admin is allowed
export const adminOnly = TryCatch(async (req, res, next) => {

    const {id} = req.query;

    if(!id) return next(new ErrorHandler("Unauthorized.", 401));

    const user = await User.findById(id);
    if(!user) return next(new ErrorHandler("Invalid User.", 401));

    if(user.role !== "admin") return next(new ErrorHandler("Unauthorized.", 401));

    next();
});

//  "/api/v1/user/id"   -- params
//  "/api/v1/user/id?key-245"   -- query(245)
