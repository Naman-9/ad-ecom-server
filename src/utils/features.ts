import mongoose, { Document } from 'mongoose';
import { InvalidateCacheTypeProps, OrderItemType } from '../types/types.js';
import { nodeCache } from '../app.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';

export const connectDB = async (uri: string) => {
  console.log('connectiog to Db...');
  await mongoose
    .connect(uri, {
      dbName: 'Ecom24',
    })
    .then((c) => console.log(`DB connected to ${c.connection.host}`));
};

export const inValidateCache = ({   
  product,
  admin,
  order,
  userId,
  orderId,
  productId,
}: InvalidateCacheTypeProps) => {
  if (product) {
    const productKeys: string[] = [
      'latest-products',
      'categories',
      'all-products',
      `product-detail-${productId}`,
    ];

    // if string push
    if (typeof productId === 'string') productKeys.push(`product-${productId}`);

    // if array then loop and push
    if (typeof productId === 'object') productId.forEach((i) => `product-${i}`);

    nodeCache.del(productKeys);
  }

  if (order) {
    const orderKeys: string[] = ['all-orders', `my-orders-${userId}`, `order-${orderId}`];
    const orders = Order.find({}).select('_id');

    nodeCache.del(orderKeys);
  }

  if (admin) {
    const adminKeys: string[] = [
      'admin-stats',
      'admin-pie-charts',
      'admin- bars-charts',
      'admin-line-charts',
    ];

    nodeCache.del(adminKeys);
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);

    if (!product) throw new Error('Product Not Found');

    product.stock -= order.quantity;

    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;

  return Number(percent.toFixed(0));
};

export const getInventory = async ({
  categories,
  productsCounts,
}: {
  categories: string[];
  productsCounts: number;
}) => {
  // count no of prod
  const categoriesCountPromise = categories.map((category) => Product.countDocuments({ category }));

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCounts) * 100),
    });
  });

  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: 'discount' | 'total';
};

export const getChartData = ({ length, docArr, today, property }: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      data[length - monthDiff - 1] += property ? i[property]! : 1;
    }
  });

  return data;
};
 