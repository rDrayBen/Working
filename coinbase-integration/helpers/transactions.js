const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://dbms_admin:asap123@4.tcp.eu.ngrok.io:10695/AH_DBV1';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function createTransaction(username, transaction_date, amount, currency, payment_method, status, fee) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const userQuery = `SELECT "id" FROM "user" WHERE "username" = $1;`;
    const userRes = await client.query(userQuery, [username]);

    if (userRes.rows.length === 0) {
      throw new Error(`User with username "${username}" not found`);
    }

    const user_id = userRes.rows[0].id;

    const transactionQuery = `
      INSERT INTO "payment_transactions" (user_id, transaction_date, amount, currency, payment_method, status, fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const transactionRes = await client.query(transactionQuery, [
      user_id, transaction_date, amount, currency, payment_method, status, fee
    ]);

    await client.query('COMMIT');

    console.log('Transaction Created:', transactionRes.rows[0]);
    return transactionRes.rows[0];

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating transaction:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function updateTransaction(transaction_id, status) {
  const query = `
    UPDATE payment_transactions
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *;
  `;
  try {
    const res = await pool.query(query, [status, transaction_id]);
    console.log('Transaction Updated:', res.rows[0]);
    return res.rows[0];
  } catch (err) {
    console.error('Error updating transaction:', err);
    throw err;
  }
}

module.exports = { createTransaction, updateTransaction };
