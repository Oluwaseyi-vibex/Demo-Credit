import { z } from "zod";

export const fundWalletBodySchema = z.object({
    body: z.object({
        amount: z.number("Invalid amount").positive("Amount must be positive"),
    }),
});

export const sendMoneyBodySchema = z.object({
    body: z.object({
        amount: z.number("Invalid amount").positive("Amount must be positive"),
        receiverEmail: z.email("Invalid email"),
        description: z.string().optional()
    }),
});