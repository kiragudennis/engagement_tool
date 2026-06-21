import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export const customerSignupSchema = z.object({
  fullName: z
    .string()
    .min(1, "Name is required")
    .max(100)
    .transform((v) => v.trim()),
  email: z
    .string()
    .email("Valid email required")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128),
});

export const redeemCodeSchema = customerSignupSchema.extend({
  code: z
    .string()
    .min(1, "Code is required")
    .transform((v) => v.toUpperCase().trim()),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
export type RedeemCodeInput = z.infer<typeof redeemCodeSchema>;
