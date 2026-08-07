import Payment from "../model/paymentModel.js";
import Student from "../model/studentModel.js";
import Pricing from "../model/pricingModel.js";

export async function getDashboardStats(req, res) {
  req.log.debug("--> getDashboardStats controller hit");

  try {
    const currentMonthName = new Date().toLocaleString("en-US", {
      month: "long",
    });

    const totalStudents = await Student.countDocuments();
    const totalPayments = await Payment.countDocuments({ status: "PAID" });

    // Total Income for system current date month
    const totalIncomeData = await Payment.aggregate([
      { $match: { month: currentMonthName, status: "PAID" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    const totalIncome = totalIncomeData[0]?.total || 0;
    const netProfit = (totalIncome * 75) / 100;

    // Get all saved pricing plans (Institute & Batch pairs)
    const savedPricings = await Pricing.find().lean();

    // Active student counts grouped by Institute & Batch
    const activeStudentAgg = await Student.aggregate([
      { $match: { isActive: true } },
      { $unwind: "$institute" },
      {
        $group: {
          _id: {
            institute: "$institute",
            batch: "$batch",
          },
          totalStudents: { $sum: 1 },
        },
      },
    ]);

    const studentCountMap = {};
    activeStudentAgg.forEach((item) => {
      const key = `${item._id.institute}_${item._id.batch}`;
      studentCountMap[key] = item.totalStudents;
    });

    // Monthly revenue per Institute & Batch for system current date month
    const monthlyRevenueAgg = await Payment.aggregate([
      {
        $match: {
          status: "PAID",
          month: currentMonthName,
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "studentId",
          as: "student",
        },
      },
      { $unwind: "$student" },
      { $unwind: "$student.institute" },
      {
        $group: {
          _id: {
            institute: "$student.institute",
            batch: "$batch",
          },
          totalRevenue: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    const revenueMap = {};
    monthlyRevenueAgg.forEach((item) => {
      const key = `${item._id.institute}_${item._id.batch}`;
      revenueMap[key] = item.totalRevenue;
    });

    // Combine saved institutes & batches from Pricing and Active Students
    const performanceMap = new Map();

    savedPricings.forEach((p) => {
      const key = `${p.institute}_${p.batch}`;
      performanceMap.set(key, {
        institute: p.institute,
        batch: p.batch,
        totalStudents: studentCountMap[key] || 0,
        revenue: revenueMap[key] || 0,
        month: currentMonthName,
      });
    });

    // Also include any active student institute/batch pairs if not already in Pricing
    activeStudentAgg.forEach((item) => {
      const key = `${item._id.institute}_${item._id.batch}`;
      if (!performanceMap.has(key)) {
        performanceMap.set(key, {
          institute: item._id.institute,
          batch: item._id.batch,
          totalStudents: item.totalStudents,
          revenue: revenueMap[key] || 0,
          month: currentMonthName,
        });
      }
    });

    const institutePerformance = Array.from(performanceMap.values());

    res.json({
      totalStudents,
      totalPayments,
      totalIncome,
      netProfit,
      currentMonth: currentMonthName,
      institutePerformance,
      // Backward compatibility fields
      activeCounts: institutePerformance.map((item) => ({
        ...item,
        totalAmount: item.revenue,
      })),
      totalByInstituteAndMonth: institutePerformance.map((item) => ({
        ...item,
        totalAmount: item.revenue,
      })),
    });
  } catch (err) {
    req.log.error(err, "Unhandled error inside getDashboardStats controller");
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
}

