const db = require('../config/db.config');

class Transaction {
  static log(userId, txHash, amount) {
    return new Promise((resolve, reject) => {
      db.query('INSERT INTO transactions (user_id, tx_hash, amount) VALUES (?, ?, ?)', [userId, txHash, amount], (error, result) => {
        if (error) return reject(error);
        resolve(result.insertId);
      });
});
