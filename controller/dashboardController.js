import Payment from "../model/paymentModel.js";
import Student from "../model/studentModel.js";
import Pricing from "../model/pricingModel.js";

/**
 * Build an array of the last `count` months in YYYY-MM format,
 * ending with the current month, sorted chronologically.
 */
function getLastNMonths(count) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${yyyy}-${mm}`);
  }
  return months;
}

export async function getDashboardStats(req, res) {
  req.log.debug("--> getDashboardStats controller hit");

  try {
    // Current month in YYYY-MM (matches payment.month format)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    // Human-readable name kept for backward compatibility in response
    const currentMonthName = now.toLocaleString("en-US", { month: "long" });

    const totalStudents = await Student.countDocuments();
    const totalPayments = await Payment.countDocuments({ status: "PAID" });

    // ── Total Income for current month (fixed: uses YYYY-MM) ──
    const totalIncomeData = await Payment.aggregate([
      { $match: { month: currentMonth, status: "PAID" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    const totalIncome = totalIncomeData[0]?.total || 0;
    const netProfit = (totalIncome * 75) / 100;

    // ── 6-Month Profit Summary ──
    const last6 = getLastNMonths(6);

    const sixMonthAgg = await Payment.aggregate([
      { $match: { status: "PAID", month: { $in: last6 } } },
      {
        $group: {
          _id: "$month",
          grossProfit: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);

    // Map aggregation results, filling in zeros for months with no payments
    const aggMap = {};
    sixMonthAgg.forEach((item) => {
      aggMap[item._id] = item.grossProfit;
    });

    const sixMonthSummary = last6.map((m) => {
      const gross = aggMap[m] || 0;
      return {
        month: m,
        grossProfit: gross,
        netProfit: Math.round((gross * 75) / 100),
      };
    });

    // ── Institute Performance (unchanged logic, fixed month format) ──
    const savedPricings = await Pricing.find().lean();

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

    const monthlyRevenueAgg = await Payment.aggregate([
      {
        $match: {
          status: "PAID",
          month: currentMonth,
        },
      },
      {
        $group: {
          _id: {
            institute: "$institute",
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
      sixMonthSummary,
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
