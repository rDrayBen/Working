const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://dbms_admin:ASAPRocky123@6.tcp.eu.ngrok.io:11684/AH_DBV1';

const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Метод для створення нового запису у таблиці payment_transactions
async function createTransaction(user_id, transaction_date, amount, currency, payment_method, status, fee) {
  const query = `
    INSERT INTO payment_transactions (user_id, transaction_date, amount, currency, payment_method, status, fee)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  try {
    const res = await pool.query(query, [user_id, transaction_date, amount, currency, payment_method, status, fee]);
    console.log('Transaction Created:', res.rows[0]);
    return res.rows[0];
  } catch (err) {
    console.error('Error creating transaction:', err);
    throw err;
  }
}

// Метод для оновлення запису в таблиці payment_transactions
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
