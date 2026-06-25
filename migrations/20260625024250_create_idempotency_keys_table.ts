import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("idempotency_keys", (table) => {
    table.uuid("id").primary();

    table.string("key").notNullable().unique();

    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.string("endpoint").notNullable();

    table.jsonb("response");

    table.timestamps(true, true);

    table.index(["key"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("idempotency_keys");
}
