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


export async function getAllPricing(req, res) {
  req.log.debug("--> getAllPricing controller hit");

  try {
    const pricingList = await Pricing.find();

    if (!pricingList || pricingList.length === 0) {
      req.log.warn("No pricing records found");
      return res.status(404).json({
        message: "No pricing records found"
      });
    }

    req.log.info(
      { count: pricingList.length },
      "All pricing records retrieved successfully"
    );

    res.status(200).json({
      message: "Pricing retrieved successfully",
      pricing: pricingList
    });

  } catch (err) {
    req.log.error(err, "Unhandled error inside getAllPricing controller");

    res.status(500).json({
      message: "Error fetching pricing",
      error: err.message
    });
  }
}


export async function updatePricing(req, res) {
  req.log.debug("--> updatePricing controller hit");

  try {
    const {
      id,
      institute,
      batch,
      fullPayment,
      halfPayment,
      freePayment
    } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Pricing ID is required"
      });
    }

    const updatedPricing = await Pricing.findByIdAndUpdate(
      id,
      {
        institute,
        batch,
        fullPayment,
        halfPayment,
        freePayment
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedPricing) {
      req.log.warn({ id }, "Pricing not found");

      return res.status(404).json({
        message: "Pricing not found"
      });
    }

    req.log.info(
      { pricingId: updatedPricing._id },
      "Pricing updated successfully"
    );

    return res.status(200).json({
      message: "Pricing updated successfully",
      pricing: updatedPricing
    });

  } catch (err) {
    req.log.error(err, "Unhandled error inside updatePricing controller");

    return res.status(500).json({
      message: "Error updating pricing",
      error: err.message
    });
  }
}


export async function deletePricing(req, res) {
  req.log.debug("--> deletePricing controller hit");

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Pricing ID is required"
      });
    }

    const deletedPricing = await Pricing.findByIdAndDelete(id);

    if (!deletedPricing) {
      req.log.warn({ id }, "Pricing not found");

      return res.status(404).json({
        message: "Pricing not found"
      });
    }

    req.log.info(
      { pricingId: deletedPricing._id },
      "Pricing deleted successfully"
    );

    res.status(200).json({
      message: "Pricing deleted successfully",
      pricing: deletedPricing
    });

  } catch (err) {
    req.log.error(err, "Unhandled error inside deletePricing controller");

    res.status(500).json({
      message: "Error deleting pricing",
      error: err.message
    });
  }
}


export async function getInstitutes(req, res) {
  try {

    const institutes = await Pricing.distinct("institute");

    res.status(200).json({
      institutes
    });

  } catch (error) {

    res.status(500).json({
      message: "Error fetching institutes",
      error: error.message
    });

  }
}


export async function getBatchesByInstitute(req, res) {
  try {
    const { institute } = req.params;

    
    if (!institute) {
      return res.status(400).json({ message: "Institute identifier is required." });
    }

  
    const batches = await Pricing.distinct("batch", { institute });

   
    if (!batches || batches.length === 0) {
      return res.status(404).json({ 
        message: "No batches found for the specified institute." 
      });
    }

    return res.status(200).json({
      batches
    });

  } catch (error) {
    // 4. Server-side logging for debugging
    console.error(`[Error] getBatchesByInstitute - Institute: ${req.params.institute} - ${error.message}`);
    
    return res.status(500).json({
      message: "An internal server error occurred while fetching batches.",
      error: error.message 
    });
  }
}



