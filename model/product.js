import mongoose from "mongoose";

const productModel = new mongoose.Schema(
    {
        product_Id:{
            type:String,
            require:true,
            unique:true,
        },
        product_Name:{
            type:String,
            require:true,
        },
        product_category:{
            type:String,
            require:true,
        },
        product_price:{
            type:Number,
            require:true,
        },
        product_quantity:{
            type:Number,
            require:true,
        }

    }
)

const Product =mongoose.moel("product",productModel);
export default Product;