import { nodeCache } from '../app.js';
import { TryCatch } from '../middlewares/error.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { calculatePercentage, getChartData, getInventory } from '../utils/features.js';

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats = {};
  const key = 'admin-stats';

  if (nodeCache.has(key)) stats = JSON.parse(nodeCache.get(key) as string);
  else {
    const today = new Date();

    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth() - 1, 0),
    };

    // products created This month
    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    // products created last month
    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    // User created This month
    const thisMonthUserPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    // User created last month
    const lastMonthUserPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    // Order created This month
    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });

    // Order created last month
    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const lastSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    });

    const latestTransactionPromise = Order.find({})
      .select(['orderItems', 'discount', 'total', 'status'])
      .limit(4);

    const [
      thisMonthUser,
      thisMonthProducts,
      thisMonthOrders,
      lastMonthUser,
      lastMonthProducts,
      lastMonthOrders,
      productsCounts,
      userCounts,
      allOrders,
      lastSixMonthOrders,
      categories,
      femaleUsers,
      latestTransaction,
    ] = await Promise.all([
      thisMonthUserPromise,
      thisMonthProductsPromise,
      thisMonthOrdersPromise,
      lastMonthUserPromise,
      lastMonthProductsPromise,
      lastMonthOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select('total'),
      lastSixMonthOrdersPromise,
      Product.distinct('category'),
      User.countDocuments({ gender: 'female' }),
      latestTransactionPromise,
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0,
    );

    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0,
    );

    const changePercent = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),

      product: calculatePercentage(thisMonthProducts.length, lastMonthProducts.length),

      user: calculatePercentage(thisMonthUser.length, lastMonthUser.length),

      order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length),
    };

    const revenue = allOrders.reduce((total, order) => total + (order.total || 0), 0);

    const count = {
      revenue,
      user: userCounts,
      product: productsCounts,
      order: allOrders.length,
    };

    // const orderMonthCounts = getChartData({
    //     length: 6,
    //     today,
    //     docArr: lastSixMonthOrders,
    //   });

    // const orderMonthRevenue = getChartData({
    //     length: 6,
    //     today,
    //     docArr: lastSixMonthOrders,
    //     property: "total",
    //   });

    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthRevenue = new Array(6).fill(0);

    lastSixMonthOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

      if (monthDiff < 6) {
        // count
        orderMonthCounts[6 - monthDiff - 1] += 1;
        // revenur
        orderMonthRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    const categoriesCount: Record<string, number>[] = await getInventory({
      categories,
      productsCounts,
    });

    const usersRatio = {
      male: userCounts - femaleUsers,
      female: femaleUsers,
    };

    const modifyLatestTransaction = latestTransaction.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));

    stats = {
      latestTransaction: modifyLatestTransaction,
      usersRatio,
      categoriesCount,
      changePercent,
      count,
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthRevenue,
      },
    };

    nodeCache.set('admin-stats', JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    stats,
  });
});

export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = 'admin-pie-charts';

  const allOrderPromise = Order.find({}).select([
    'total',
    'discount',
    'subTotal',
    'tax',
    'shippingCharges',
  ]);

  if (nodeCache.has(key)) charts = JSON.parse(nodeCache.get(key) as string);
  else {
    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productsCounts,
      productsOutOfStock,
      allOrder,
      allUsers,
      adminUserCount,
      CustomerUserCount,
    ] = await Promise.all([
      Order.countDocuments({ status: 'Processing' }),
      Order.countDocuments({ status: 'Shipped' }),
      Order.countDocuments({ status: 'Delivered' }),
      Product.distinct('category'),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrderPromise,
      User.find({}).select(['dob']),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user' }),
    ]);

    const orderFullfillement = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };

    const productCategories: Record<string, number>[] = await getInventory({
      categories,
      productsCounts,
    });

    const stockAvailabality = {
      inStock: productsCounts - productsOutOfStock,
      outOfStock: productsOutOfStock,
    };

    const grossIncome = allOrder.reduce((prev, order) => prev + (order.total || 0), 0);

    const discount = allOrder.reduce((prev, order) => prev + (order.discount || 0), 0);

    const productionCost = allOrder.reduce((prev, order) => prev + (order.shippingCharges || 0), 0);

    const burnt = allOrder.reduce((prev, order) => prev + (order.tax || 0), 0);

    const marketingCost = Math.round(grossIncome * (30 / 100));

    const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;

    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
    };

    const usersAgeGroup = {
      teen: allUsers.filter((i) => i.age < 20).length,
      adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
      old: allUsers.filter((i) => i.age >= 40).length,
    };

    const adminCustomer = {
      admin: adminUserCount,
      customer: CustomerUserCount,
    };

    charts = {
      orderFullfillement,
      productCategories,
      stockAvailabality,
      revenueDistribution,
      usersAgeGroup,
      adminCustomer,
    };

    nodeCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getBarCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = 'admin-bars-charts';

  if (nodeCache.has(key)) charts = JSON.parse(nodeCache.get(key) as string);
  else {
    const today = new Date();

    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const twelveMonthAgo = new Date();
    twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);

    const sixMonthProductPromise = Product.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    }).select('createdAt');

    const sixMonthUserPromise = User.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today,
      },
    }).select('createdAt');

    const twelveMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthAgo,
        $lte: today,
      },
    }).select('createdAt');

    const [products, users, orders] = await Promise.all([
      sixMonthProductPromise,
      sixMonthUserPromise,
      twelveMonthOrdersPromise,
    ]);

    const productCounts = getChartData({
      length: 6,
      today,
      docArr: products,
    });
    const userCounts = getChartData({
      length: 6,
      today,
      docArr: users,
    });
    const orderCounts = getChartData({
      length: 12,
      today,
      docArr: orders,
    });

    charts = {
      users: userCounts,
      products: productCounts,
      order: orderCounts,
    };

    nodeCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getLineCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = 'admin-line-charts';

  if (nodeCache.has(key)) charts = JSON.parse(nodeCache.get(key) as string);
  else {
    const today = new Date();

    const twelveMonthAgo = new Date();
    twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthAgo,
        $lte: today,
      },
    };
    const twelveMonthProductPromise = Product.find(baseQuery).select('createdAt');

    const twelveMonthUserPromise = User.find(baseQuery).select('createdAt');

    const twelveMonthOrdersPromise = Order.find(baseQuery).select([
      'createdAt',
      'discount',
      'total',
    ]);

    const [products, users, orders] = await Promise.all([
      twelveMonthProductPromise,
      twelveMonthUserPromise,
      twelveMonthOrdersPromise,
    ]);

    const productCounts = getChartData({
      length: 12,
      today,
      docArr: products,
    });
    const userCounts = getChartData({
      length: 12,
      today,
      docArr: users,
    });
    const discount = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: 'discount',
    });
    const revenue = getChartData({
      length: 12,
      today,
      docArr: orders,
      property: 'total',
    });

    charts = {
      users: userCounts,
      products: productCounts,
      discount,
      revenue,
    };

    nodeCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts,
  });
});
