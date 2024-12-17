// In Transaction.js
const mysql = require('mysql');
const dbConfig = require('../config/db.config');

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) throw err;
  console.log('Transaction model connected to MySQL database');
});

class Transaction {
  static async log(userId, txHash, amount) {
    return new Promise((resolve, reject) => {
      db.query('INSERT INTO transactions (user_id, tx_hash, amount) VALUES (?, ?, ?)', [userId, txHash, amount], (error, result) => {
        if (error) reject(error);
        resolve(result.insertId);
      });
    });
  }
}

module.exports = Transaction;
