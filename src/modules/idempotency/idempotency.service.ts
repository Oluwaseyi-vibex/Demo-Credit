// src/modules/idempotency/idempotency.service.ts
import db from "../../config/db";

export async function getIdempotentResponse(
  trx: any, // Knex transaction
  key: string,
  userId: string,
  endpoint: string,
) {
  const existing = await trx("idempotency_keys")
    .where({ key, user_id: userId, endpoint })
    .first();
  return existing ? JSON.parse(existing.response) : null;
}

export async function createIdempotentRecord(
  trx: any, // Knex transaction
  key: string,
  userId: string,
  endpoint: string,
  response: any,
) {
  try {
    await trx("idempotency_keys").insert({
      id: crypto.randomUUID(),
      key,
      user_id: userId,
      endpoint,
      response: JSON.stringify(response),
    });
    return response;
  } catch (error: any) {
    // Handle unique constraint violation (PostgreSQL error code 23505)
    if (error.code === "23505") {
      const existing = await trx("idempotency_keys").where({ key }).first();
      return existing ? JSON.parse(existing.response) : null;
    }
    throw error;
  }
}
