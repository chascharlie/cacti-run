const sqlite3 = require('sqlite3').verbose() // Require SQLite3 module for database management

// Open database and create tables if they don't exist
function open(callback) {
    const db = new sqlite3.Database('db/users.db') // Open or create 'users.db' database using SQLite3
    db.run(`CREATE TABLE IF NOT EXISTS users (
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        record INT NOT NULL
    )`, () => {
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            username TEXT NOT NULL,
            session TEXT NOT NULL UNIQUE
        )`, () => {
            // Pass db to callback after tables created
            callback(db)
        })
    })
}

module.exports = open
