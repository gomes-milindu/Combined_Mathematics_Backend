import mongoose from "mongoose";
const pricingModel = new mongoose.Schema({
  institute: {
    type: String,
    required: true,
  },
  batch: {
    type: String,
    required: true,
  },
  fullPayment: {
    type: String,
    required: true,
  },
  halfPayment: {
    type: String,
    required: true,
  },
  freePayment: {
    type: String,
    required: true,
  },
});
const Pricing = mongoose.model("Pricing", pricingModel);
export default Pricing;
