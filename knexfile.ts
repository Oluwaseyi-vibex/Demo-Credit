import dotenv from "dotenv";

dotenv.config();

export default {
  development: {
    client: "mysql2",

    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },

    pool: {
      min: 2,
      max: 10,
    },

    migrations: {
      tableName: "knex_migrations",
    },
  },
};
