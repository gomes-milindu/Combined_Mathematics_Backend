import Payment from "../model/paymentModel.js";
import Student from "../model/studentModel.js";

export async function getDashboardStats(req, res) {
  req.log.debug("--> getDashboardStats controller hit");
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const thisMonthName = monthNames[new Date().getMonth()];

  try {
    const totalStudents = await Student.countDocuments();
    const totalPayments = await Payment.countDocuments({ amount: "3800" });
    

    const totalIncomeData = await Payment.aggregate([
      { $match: { month: thisMonthName } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$amount" } },
        },
      },
    ]);
/*
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

*/

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
          // CHANGE 1: Convert the string amount to a number before summing
          totalAmount: { $sum: { $toDouble: "$amount" } }, 
        },
      },
      {
        $project: {
          _id: 0,
          batch: "$_id.batch",
          institute: "$_id.institute",
          totalStudents: 1,
          // CHANGE 2: Add totalAmount here so it doesn't get hidden
          totalAmount: 1, 
        },
      },
    ]);

 // Get current month name
const currentMonthName = new Date().toLocaleString("default", { month: "long" }); // "February"

const totalByInstituteAndMonth = await Payment.aggregate([
  {
    $match: { 
      status: "PAID",
      month: currentMonthName  // filter only this month
    },
  },
  {
    $lookup: {
      from: "students",
      localField: "studentId",
      foreignField: "studentId",
      as: "studentInfo",
    },
  },
  { $unwind: "$studentInfo" },
  { $unwind: "$studentInfo.institute" },
  {
    $group: {
      _id: {
        institute: "$studentInfo.institute",
        batch: "$batch",
        month: "$month",
      },
      totalAmount: { $sum: { $toDouble: "$amount" } },
      paymentCount: { $sum: 1 },
      uniqueStudents: { $addToSet: "$studentId" },
    },
  },
  {
    $sort: { "_id.institute": 1 },
  },
  {
    $project: {
      _id: 0,
      institute: "$_id.institute",
      batch: "$_id.batch",
      month: "$_id.month",
      totalAmount: 1,
      paymentCount: 1,
      studentCount: { $size: "$uniqueStudents" },
    },
  },
]);

// console.log("This Month Total by Institute:", totalByInstituteAndMonth);

    const totalIncome = totalIncomeData[0]?.total || 0;
    const netProfit = (totalIncome * 75) / 100;

    res.json({
      totalStudents,
      totalPayments,
      totalIncome,
      netProfit,
      activeCounts,
      totalByInstituteAndMonth,
    });
  } catch (err) {
    req.log.error(err, "Unhandled error inside getDashboardStats controller");
    res.status(500).json({ message: "Error fetching stats" });
  }
}
