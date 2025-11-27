import express from 'express';
import Product from '../model/product.js';
import { createProduct } from '../controller/productContrller.js';

const productRoute = express.Router();

productRoute.post("/", createProduct );


export default productRoute;
