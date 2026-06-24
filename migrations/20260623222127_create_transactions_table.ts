import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("transactions", (table) => {
        table.uuid("id").primary();

        table
            .uuid("wallet_id")
            .notNullable()
            .references("id")
            .inTable("wallets")
            .onDelete("CASCADE");

        table
            .enu("type", ["FUND", "WITHDRAW", "TRANSFER_IN", "TRANSFER_OUT"])
            .notNullable();

        table.decimal("amount", 15, 2).notNullable();

        table
            .enu("status", ["PENDING", "SUCCESS", "FAILED"])
            .notNullable()
            .defaultTo("SUCCESS");

        table.string("reference").unique().notNullable();

        table.text("description");

        table.timestamps(true, true);

        table.index(["wallet_id"]);
        table.index(["reference"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("transactions");
}