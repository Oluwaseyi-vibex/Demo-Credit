import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wallets", (table) => {
        table.uuid('id').defaultTo(knex.raw('gen_random_uuid()')).primary();
        table
            .uuid("user_id")
            .notNullable()
            .unique()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");

        table.decimal("balance", 15, 2).notNullable().defaultTo(0);

        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("wallets");
}