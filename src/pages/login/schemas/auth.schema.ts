import { z } from "zod";

export const mobileSchema = z.object({
  mobile_number: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit OTP"),
});

export type MobileFormValues = z.infer<typeof mobileSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
