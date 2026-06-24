import z from "zod";

export const registerSchema = z.object({
    body: z.object({
        first_name: z.string().min(2, "First name must be at least 2 characters long"),
        last_name: z.string().min(2, "Last name must be at least 2 characters long"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    })
})

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    })
})

export type RegisterBodySchema = z.infer<typeof registerSchema>["body"];
export type LoginBodySchema = z.infer<typeof loginSchema>["body"];