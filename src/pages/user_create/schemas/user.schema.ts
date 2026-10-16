import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),

  username: z
    .string()
    .trim()
    .min(5, "Username must be at least 7 characters")
    .max(20, "Username cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Username can contain only letters and numbers")
    .regex(/[a-zA-Z]/, "Username must contain at least one letter"),

  mobileNumber: z
    .string()
    .trim()
    .min(7, "Mobile number is required")
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(20, "Password cannot exceed 20 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[0-9]/, "Include at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Include at least one special character (e.g. @, #, $, !)",
    ),
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
