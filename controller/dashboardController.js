import Payment from "../model/paymentModel.js";
import Student from "../model/studentModel.js";

export async function getDashboardStats(req, res) {
  const thisMonth = new Date().getMonth() + 1;

  try {
    const totalStudents = await Student.countDocuments();
    const totalPayments = await Payment.countDocuments({ amount: "3500" });

    const totalIncomeData = await Payment.aggregate([
      { $match: { month: String(thisMonth) } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const activeCounts = await Student.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            batch: "$batch",
            institute: "$institute",
            amount: "$amount",
          },
          totalStudents: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          batch: "$_id.batch",
          institute: "$_id.institute",
          totalStudents: 1,
          
        },
      },
    ]);

    const totalIncome = totalIncomeData[0]?.total || 0;
    const netProfit = (totalIncome * 75) / 100;

    res.json({
      totalStudents,
      totalPayments,
      totalIncome,
      netProfit,
        activeCounts,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
}
