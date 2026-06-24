import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("transfers", (table) => {
        table.uuid("id").primary();

        table
            .uuid("sender_wallet_id")
            .notNullable()
            .references("id")
            .inTable("wallets");

        table
            .uuid("receiver_wallet_id")
            .notNullable()
            .references("id")
            .inTable("wallets");

        table.decimal("amount", 15, 2).notNullable();

        table.string("reference").unique().notNullable();

        table.timestamps(true, true);

        table.index(["sender_wallet_id"]);
        table.index(["receiver_wallet_id"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("transfers");
}