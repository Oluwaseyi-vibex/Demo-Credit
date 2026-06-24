// ./src/modules/wallet/wallet.validation.ts
import { z } from "zod";

export const fundWalletBodySchema = z.object({
    body: z.object({
        amount: z.number("Invalid amount").positive("Amount must be positive"),
    }),
});