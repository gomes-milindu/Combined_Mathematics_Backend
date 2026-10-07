import api from "../../config/axios";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

// Helper: get current month as YYYY-MM
const getCurrentYYYYMM = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

// Helper: build month options for the last 12 months in YYYY-MM format
const buildMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const label = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    options.push({ value: `${y}-${m}`, label });
  }
  return options;
};

export default function PaymentDrawer({ isOpen, onClose, student }) {
  const [formData, setFormData] = useState({
    studentId: "",
    institute: "",
    batch: "",
    month: "",
    amount: "",
    cardType: "Full Payment",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [batchesList, setBatchesList] = useState([]);
  const [pricingList, setPricingList] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Build enrollment list from student data (new format or legacy fallback)
  const enrollments = student
    ? Array.isArray(student.enrollments) && student.enrollments.length > 0
      ? student.enrollments
      : (() => {
          const insts = Array.isArray(student.institute)
            ? student.institute
            : student.institute
            ? [student.institute]
            : [];
          const b = student.batch || "";
          if (insts.length === 0 && !b) return [];
          if (insts.length === 0) return [{ institute: "", batch: b }];
          return insts.map((inst) => ({ institute: inst, batch: b }));
        })()
    : [];

  // Set default form values when student changes
  useEffect(() => {
    if (student && enrollments.length > 0) {
      const enr = enrollments[0];
      // Auto-select cardType based on enrollment paymentType
      const autoCard =
        enr.paymentType === "Half Payment" ? "Half Card" : "Full Payment";
      setFormData((prev) => ({
        ...prev,
        studentId: student.studentId || "",
        institute: enr.institute || "",
        batch: enr.batch || "",
        month: prev.month || getCurrentYYYYMM(),
        amount: "",
        cardType: autoCard,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  // Fetch pricing records when drawer opens or student changes
  useEffect(() => {
    if (!isOpen || !student) return;

    const fetchData = async () => {
      setLoading(true);
      setStudentInfo(student);

      try {
        const pRes = await api.get("/pricing/");
        const pData = pRes.data?.pricing || pRes.data || [];
        setPricingList(Array.isArray(pData) ? pData : []);

        // Filter batches for student's institute if available
        let availableBatches = [];
        const studentInstitute = Array.isArray(student?.institute)
          ? student.institute[0]
          : student?.institute;

        if (studentInstitute) {
          availableBatches = [
            ...new Set(
              pData
                .filter((item) => item.institute === studentInstitute)
                .map((item) => item.batch)
                .filter(Boolean)
            ),
          ];
        }

        // If no institute specific batches, get all batches from pricing
        if (availableBatches.length === 0) {
          availableBatches = [
            ...new Set(pData.map((item) => item.batch).filter(Boolean)),
          ];
        }

        // Fallback to student's own batch if present
        if (student?.batch && !availableBatches.includes(student.batch)) {
          availableBatches.push(student.batch);
        }

        setBatchesList(availableBatches);

        // Pre-select batch
        const initialBatch = student?.batch || availableBatches[0] || "";

        // Find pricing record for initialBatch
        const matchPricing =
          pData.find(
            (p) =>
              (!studentInstitute || p.institute === studentInstitute) &&
              p.batch === initialBatch
          ) || pData.find((p) => p.batch === initialBatch);

        const initialAmount = matchPricing
          ? matchPricing.fullPayment
          : "3800";

        setFormData((prev) => ({
          ...prev,
          studentId: student?.studentId || prev.studentId || "",
          institute: studentInstitute || prev.institute || "",
          batch: initialBatch,
          amount: String(initialAmount),
        }));
      } catch (err) {
        console.error("Failed to load pricing data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, student]);

  // Update amount automatically when batch or cardType changes
  const updateAmountForSelection = useCallback(
    (batchName, cardTypeVal) => {
      const studentInstitute = Array.isArray(studentInfo?.institute)
        ? studentInfo.institute[0]
        : studentInfo?.institute;

      const matchPricing =
        pricingList.find(
          (p) =>
            (!studentInstitute || p.institute === studentInstitute) &&
            p.batch === batchName
        ) || pricingList.find((p) => p.batch === batchName);

      if (matchPricing) {
        if (cardTypeVal === "Free Card" || cardTypeVal === "Free Payment") {
          return String(matchPricing.freePayment ?? 0);
        } else if (
          cardTypeVal === "Half Card" ||
          cardTypeVal === "Half Payment"
        ) {
          return String(matchPricing.halfPayment ?? 1900);
        } else {
          return String(matchPricing.fullPayment ?? 3800);
        }
      }
      return null;
    },
    [pricingList, studentInfo]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "batch" || name === "cardType") {
        const newAmount = updateAmountForSelection(
          name === "batch" ? value : prev.batch,
          name === "cardType" ? value : prev.cardType
        );
        if (newAmount !== null) {
          updated.amount = newAmount;
        }
      }

      // When batch changes, update institute from enrollments
      if (name === "batch") {
        const matchEnr = enrollments.find((e) => e.batch === value);
        if (matchEnr) {
          updated.institute = matchEnr.institute || prev.institute;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = {
      studentId: formData.studentId,
      institute: formData.institute,
      batch: formData.batch,
      month: formData.month,
      amount: Number(formData.amount),
      status: "PAID",
      cardType: formData.cardType,
    };

    if (
      !payload.studentId ||
      !payload.institute ||
      !payload.batch ||
      !payload.month ||
      payload.amount === undefined ||
      !payload.cardType
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/payment/create", payload);
      toast.success("Payment processed successfully");

      setFormData({
        studentId: student?.studentId || "",
        institute: formData.institute,
        batch: batchesList[0] || "",
        month: "",
        amount: "",
        cardType: "Full Payment",
      });

      onClose();
      window.location.reload();
    } catch (err) {
      console.error("Payment error:", err);
      const status = err.response?.status;
      const message = err.response?.data?.message || "Payment failed";

      if (status === 409) {
        toast.error("Duplicate: " + message);
      } else if (status === 404) {
        toast.error("Student not found: " + message);
      } else if (status === 400) {
        toast.error("Validation error: " + message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build month options for the dropdown
  const monthOptions = buildMonthOptions();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto z-10 border-l border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Process Payment
            </h2>
            {studentInfo && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Student: {studentInfo.firstName} {studentInfo.lastName} (
                {Array.isArray(studentInfo.institute)
                  ? studentInfo.institute.join(", ")
                  : studentInfo.institute}
                )
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Student ID
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId || ""}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              />
            </div>

            {/* Batch Dropdown (Dynamic from inserted data) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Batch
              </label>
              <select
                name="batch"
                value={formData.batch || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
              >
                <option value="">Select Batch</option>
                {batchesList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Dropdown — uses YYYY-MM format to match database */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Month
              </label>
              <select
                name="month"
                value={formData.month || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
              >
                <option value="">Select Month</option>
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Card Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Card Type
              </label>
              <select
                name="cardType"
                value={formData.cardType || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
              >
                <option value="Full Payment">Full Payment</option>
                <option value="Half Card">Half Card</option>
                <option value="Free Card">Free Card</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount (LKR)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 3800"
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-slate-200 dark:border-slate-700 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
