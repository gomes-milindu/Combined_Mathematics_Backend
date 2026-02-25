import { z } from "zod";

export const studentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number is too short"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  institute: z.string().min(1, "Institute is required"),
  batch: z.string().min(1, "Batch is required"),
  dateOfBirth: z.coerce.date({
    required_error: "Date of birth is required",
  }),
}).strict();