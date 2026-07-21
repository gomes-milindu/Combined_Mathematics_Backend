import Pricing from "../model/pricingModel.js";


export async  function createPricing(req, res) {
    req.log.debug("--> createPricing controller hit");
    
    try{
        const { institute, batch, fullPayment, halfPayment, freePayment } = req.body;

        if(!institute || !batch || fullPayment == undefined || halfPayment == undefined || freePayment==undefined) {
            req.log.warn({ user: req.user }, "Create pricing failed: Missing required fields");
            return res.status(400).json({message: "All fields are required"});
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
        req.log.info({ pricingId: savedPricing._id }, "Pricing created successfully");

    }catch(err) {
        req.log.error(err, "Unhandled error inside createPricing controller");
        res.status(500).json({message: "Error creating pricing", error: err.message});
    }

    

}


export async function getPricing(req, res) {
  req.log.debug("--> getPricing controller hit");
  try {
    const { institute, batch } = req.query;

    req.log.info({ institute, batch }, "Fetching pricing information");

    if (!institute || !batch) {
      req.log.warn({ user: req.user }, "Get pricing failed: Missing required fields");
      return res.status(400).json({ message: "Institute and batch required" });
    }

    const pricing = await Pricing.findOne({
      institute: institute.trim(),
      batch: batch.trim(),
    });

    if (!pricing) {
      req.log.warn({ user: req.user, institute, batch }, "Get pricing failed: Pricing not found");
      return res.status(404).json({ message: "Pricing not found" });
    }

    res.json(pricing);
    req.log.info({ institute, batch, pricing }, "Pricing retrieved successfully");

  } catch (err) {
    req.log.error(err, "Unhandled error inside getPricing controller");
    res.status(500).json({ message: "Error fetching pricing", error: err.message });
  }
}

