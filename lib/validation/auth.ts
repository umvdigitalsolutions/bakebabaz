import { z } from "zod";
import { emailSchema } from "./common";

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});
