import mongoose from 'mongoose';

const pricingModel = new mongoose.Schema({
    institute:{
        type: String,
        required: true,
            
    },

    batch:{
        type: String,
        required: true,
        
    },

    fullPayment: {
        type: Number,
        required: true,
    },

    halfPayment: {
        type: Number,
        required: true,
    },

    freePayment: {
        type: Number,
        required: true,
    },

});

const Pricing = mongoose.model('Pricing', pricingModel);
export default Pricing;