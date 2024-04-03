import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { deleteProduct, getAllProducts, getAllProductsWithFilter, getCategories, getLatestProduct, getProductDetail, newProduct, updateProduct } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";

const app = express.Router();

// to create New Product  ----/api/v1/product/new
app.post("/new", singleUpload, newProduct);

// search Products  with filter   ----/api/v1/product/latest
app.get("/all", getAllProductsWithFilter);

// get latest Products    ----/api/v1/product/latest
app.get("/latest", getLatestProduct);

// get all categories     ----/api/v1/product/categories
app.get("/categories", getCategories);

// get all Products       -----/api/v1/product/admin-products
app.get("/admin-products", getAllProducts);

app.route("/:id")
    .get(getProductDetail)
    .put(singleUpload, updateProduct)
    .delete(deleteProduct);


export default app;   