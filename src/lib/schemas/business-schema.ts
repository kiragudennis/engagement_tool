// lib/schemas/business-schema.ts
import { z } from "zod";

export const businessSignupSchema = z.object({
  businessName: z
    .string()
    .min(1, "Business name is required")
    .max(100, "Business name must be under 100 characters")
    .transform((val) => val.trim()),

  fullName: z
    .string()
    .min(1, "Your name is required")
    .max(100, "Name must be under 100 characters")
    .transform((val) => val.trim()),

  email: z.email("Please enter a valid email"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be under 128 characters"),
});

export type BusinessSignupInput = z.infer<typeof businessSignupSchema>;

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
