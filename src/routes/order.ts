import express from 'express';
import { allOrders, deleteOrder, myOrders, newOrder, processOrder, singleOrderDetails } from '../controllers/order.js';
import { adminOnly } from '../middlewares/auth.js';

const app = express.Router();

// route - /api/v1/order/new
app.post('/new', newOrder);

// route - /api/v1/order/myorder
app.get('/myorder', myOrders);

// route - /api/v1/order/all
app.get('/all', allOrders);

app.route("/:id")
    .get(singleOrderDetails)
    .put( processOrder)
    .delete( deleteOrder)
    ;

export default app;
