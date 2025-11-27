import Product from "../model/product";
import product from "../model/product";

export function createProduct(req, res){

    const product1 = new Product({

        product_Id: req.body.product_Id,
        product_Name: req.body.product_Name,
        product_category: req.body.product_category,
        product_price: req.body.product_price,
        product_quantity: req.body.product_quantity
    })
}