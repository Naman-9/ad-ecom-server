import { NextFunction, Request, Response } from 'express';

export interface newUserRequesstBody {
  name: string;
  email: string;
  photo: string;
  gender: 'male' | 'female';
  _id: string;
  dob: Date;
}

export interface newProductRequesstBody {
  name: string;
  category: string;
  price: number;
  stock: number;
}

export type controllerType = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response<any, Record<string, any>>>;

export type SearchRequestQuery = {
  search?: string;
  price?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export interface BaseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: {
    $lte: number;
  };
  category?: string;
}

export type InvalidateCacheTypeProps = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  userId?: string;
  productId?: string | string[];
  orderId?: string;
}

export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productId: string;
}

export type shippingInfoType = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: number;  
}

export interface NewOrderRequestBody {
  shippingInfo: shippingInfoType;
  user: string;
  subTotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: OrderItemType[];
} 