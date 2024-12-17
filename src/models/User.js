const db = require('../config/db.config');
const mysql = require('mysql');

class User {
  static create(username, password) {
    return new Promise((resolve, reject) => {
      db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (error, result) => {
        if (error) return reject(error);
        resolve(result.insertId);
      });
    });
  }

  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
        if (error) return reject(error);
        resolve(results[0]);
      });
    });
  }
}

module.exports = User;
