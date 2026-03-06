import Pricing from "../model/pricingModel.js";
import { isAdmin } from "./adminController.js";


export async  function createPricing(req, res) {
    if(!isAdmin) {
        res.status(401).json({message: "Unauthorized access"});
        return;
    }
    console.log("this is pricing controller")
    try{
        const { institute, batch, fullPayment, halfPayment, freePayment } = req.body;

        if(!institute || !batch || fullPayment == undefined || halfPayment == undefined || freePayment==undefined) {
            res.status(400).json({message: "All fields are required"});
            return;
        }

        const newPricing = new Pricing({
            institute,
            batch,
            fullPayment,
            halfPayment,
            freePayment
        });

        const savedPricing = await newPricing.save();
        res.status(201).json({message: "Pricing created successfully", pricing: savedPricing});

    }catch(err) {
        res.status(500).json({message: "Error creating pricing", error: err.message});
    }

    

}


export async function getPricing(req, res) {
  try {
    const { institute, batch } = req.query;

    console.log("Institute:", institute);
    console.log("Batch:", batch);

    if (!institute || !batch) {
      return res.status(400).json({ message: "Institute and batch required" });
    }

    const pricing = await Pricing.findOne({
      institute: institute.trim(),
      batch: batch.trim(),
    });

    if (!pricing) {
      return res.status(404).json({ message: "Pricing not found" });
    }

    res.json(pricing);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

