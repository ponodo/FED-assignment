const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT),

  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

async function getPool() {
    if (!pool) {
        pool = await sql.connect(dbConfig);
    }

    return pool;
}

module.exports = {
  sql,
  dbConfig,
  getPool
};
