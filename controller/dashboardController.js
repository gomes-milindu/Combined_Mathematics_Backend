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

    const totalIncome = totalIncomeData[0]?.total || 0;
    




    

    res.json({
      totalStudents,
      totalPayments,
      totalIncome,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
}
