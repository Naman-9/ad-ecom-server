import express from 'express';
import { errorMiddleware } from './middlewares/error.js';
import { connectDB } from './utils/features.js';
import NodeCache from 'node-cache';
import { config } from 'dotenv';
import morgan from 'morgan';
import Stripe from 'stripe';
import cors from 'cors'; 

// routes
import userRoute from './routes/user.js';
import productRoute from './routes/product.js';
import orderRoute from './routes/order.js';
import paymentRoute from './routes/payment.js';
import dashboardRoute from './routes/stats.js';

config({
  path: './.env',
});

const PORT = process.env.PORT || 4000;   
connectDB(process.env.MONOG_URI || "");

// stripe -- payment
export const stripe = new Stripe(process.env.STRIPE_KEY || "");
// cache data in RAM
export const nodeCache = new NodeCache();


const app = express();
// middleware - to access data
app.use(express.json());
// registers requests  
app.use(morgan("dev"));
app.use(cors());
// when using form (not multiple)
// app.use(express.urlencoded);

// Routes
app.use('/api/v1/user', userRoute);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/order', orderRoute);
app.use('/api/v1/payment', paymentRoute);
app.use('/api/v1/dashboard', dashboardRoute);

app.use('/uploads', express.static('uploads'));
// middleware
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running at PORT: ${PORT}`);
});
