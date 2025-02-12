const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://dbms_admin:asap123@4.tcp.eu.ngrok.io:10695/AH_DBV1';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function createTransaction(username, transaction_id, transaction_date, update_date, amount, currency, payment_method, status, fee) {
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
      INSERT INTO "payment_transactions" (user_id, payment_system_id, transaction_date, update_date, amount, currency, payment_method, status, fee)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const transactionRes = await client.query(transactionQuery, [
      user_id, transaction_id, transaction_date, update_date, amount, currency, payment_method, status, fee
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


async function updateTransaction(username, transaction_id, update_date, status) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Отримуємо user_id за username
    const userQuery = `SELECT "id" FROM "user" WHERE "username" = $1;`;
    const userRes = await client.query(userQuery, [username]);

    if (userRes.rows.length === 0) {
      throw new Error(`User with username "${username}" not found`);
    }

    const user_id = userRes.rows[0].id;

    const transactionQuery = `SELECT * FROM "payment_transactions" WHERE "payment_system_id" = $1 AND "user_id" = $2;`;
    const transactionRes = await client.query(transactionQuery, [transaction_id, user_id]);

    if (transactionRes.rows.length === 0) {
      throw new Error(`Transaction with ID "${transaction_id}" not found or does not belong to user "${username}"`);
    }

    const updateQuery = `
      UPDATE "payment_transactions"
      SET "status" = $3, "update_date" = $4
      WHERE "user_id" = $1 AND "payment_system_id" = $2
      RETURNING *;
    `;

    const updateRes = await client.query(updateQuery, [user_id, transaction_id, update_date, status]);

    await client.query('COMMIT');

    console.log('Transaction Updated:', updateRes.rows[0]);
    return updateRes.rows[0];

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating transaction:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createTransaction, updateTransaction };
