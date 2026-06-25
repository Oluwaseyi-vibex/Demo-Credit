export async function getIdempotentResponse(
  trx: any,
  key: string,
  userId: string,
  endpoint: string,
) {
  const existing = await trx("idempotency_keys")
    .where({
      key,
      user_id: userId,
      endpoint,
      status: "COMPLETED",
    })
    .first();

  if (!existing) {
    return null;
  }

  return typeof existing.response === "string"
    ? JSON.parse(existing.response)
    : existing.response;
}

export async function createIdempotentRecord(
  trx: any,
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
      status: "COMPLETED",
      response: JSON.stringify(response),
    });
    return response;
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
      const existing = await trx("idempotency_keys").where({ key }).first();
      if (!existing) {
        return null;
      }

      return typeof existing.response === "string"
        ? JSON.parse(existing.response)
        : existing.response;
    }
    throw error;
  }
}
