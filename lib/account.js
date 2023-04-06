// Import required modules
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Function init; open/create database and create necessary tables
function init(callback) {
    const db = new sqlite3.Database('./db/data.db');

    db.run(`CREATE TABLE IF NOT EXISTS accounts (
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    );`, () => {
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            username TEXT NOT NULL,
            session TEXT NOT NULL UNIQUE
        );`, () => {
            callback(db);
        });
    });
}

// Function register; check if username available and if so, write to database
function register(data, callback) {
    const firstname = data.firstname;
    const lastname = data.lastname;
    const username = data.username;
    const password = crypto.createHmac('sha256', data.password).digest('hex');

    init((db) => {
        // Check if username already exists
        db.get(`SELECT username FROM accounts WHERE username='${username}';`, (err, row) => {
            if (err) {
                console.log(err);
                callback(500);
            } else if (row) { // Username already exists
                callback(409); // Conflict of resources
            } else { // Username available
                // Insert entry of new account into accounts table
                db.run(`INSERT INTO accounts (username, password)
                VALUES ('${username}', '${password}');`, (err) => {
                    if (err) {
                        console.log(err);
                        callback(500);
                    } else { // Successful
                        callback(false); // No error
                    }
                });
            }
        });
    });
}

// Function login; check credentials and if they are correct, generate a unique session for user
function login(data, callback) {
    const username = data.username;
    const password = crypto.createHmac('sha256', data.password).digest('hex'); // Hash password as SHA256

    init((db) => { // Initialise database
        // Check if username and password are valid
        db.get(`SELECT username FROM accounts WHERE username='${username}' AND password='${password}';`, (err, row) => {
            if (err) { // SQL error
                callback(500); // Code for internal server error
            } else if (row) { // Username and password valid
                // Generate unique 30 character long session identifier
                const chars = ["abcdefghijklmnopqrstuvwxyz".split(''), "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(''), "1234567890".split('')];

                let session = "";
                
                while (session.length < 30) {
                    let type = Math.floor(Math.random() * 3); // Type of character
                    let char = Math.floor(Math.random() * chars[type].length); // Character from list of type
                    session += chars[type][char]; // Add character to session
                }

                // Insert session into sessions table
                db.run(`INSERT INTO sessions (username, session)
                VALUES ('${username}', '${session}');`, (err) => {
                    if (err) {
                        callback(500);
                    } else { // Successful
                        callback(false, session);
                    }
                });

            } else { // Username and/or password invalid
                callback(401); // Unauthorised
            }
        });
    });
}

// Function logout; remove session from database
function logout(session) {
    init((db) => {
        db.run(`DELETE FROM sessions WHERE session='${session}';`);
    });
}

// Function getInfo; obtain details correspondent to session
function getInfo(session, callback) {
    init((db) => {
        // Get username corresponding to session because they're in the same table
        db.get(`SELECT username FROM sessions WHERE session='${session}';`, (err, row) => {
            if (err) { // SQL error
                callback(500);
            } else if (row) { // Username found
                callback(false, {
                    username: row.username
                });
            } else { // Username not found
                callback(404);
            }
        });
    });
}

module.exports = { login, logout, register, getInfo }
