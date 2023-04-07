const sqlite3 = require('sqlite3').verbose() // Require SQLite3 module for database management
const bcrypt = require('bcrypt') // Require bcrypt module for password hashing

// Open database and create tables if they don't exist
function open(callback) {
  const db = new sqlite3.Database('db/users.db') // Open or create 'users.db' database using SQLite3
  db.run(`CREATE TABLE IF NOT EXISTS users (
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL UNIQUE
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

// Attempt to log in a user with the provided details
async function login(details, callback) {
    const { username, password } = details

    // Open the database
    open((db) => {
        // Check if user exists
        db.get(`SELECT * FROM users WHERE username = '${username}'`, (err, row) => {
            if (err) { // If a SQL-related error occurs, return code 500
                callback({
                    code: 500,
                    msg: "Internal server error"
                })
                return
            }
            if (!row) { // If username doesn't exist, return code 401
                callback({
                    code: 401,
                    msg: "Invalid username or password"
                })
                return
            }

            // Compare passwords
            bcrypt.compare(password, row.password, (err, result) => {
                if (err) {
                    callback({
                        code: 500,
                        msg: "Internal server error"
                    })
                    return
                }
                if (!result) { // If passwords don't match, return code 401
                    callback({
                        code: 401,
                        msg: "Invalid username or password"
                    })
                    return
                }

                // Create a new session
                createSession((session) => {
                    db.run(`INSERT INTO sessions (username, session)
                    VALUES ('${username}', '${session}')`, (err) => {
                        if (err) {
                            callback({
                                code: 500,
                                msg: "Internal server error"
                            })
                            return
                        }
                        // Login successful
                        callback(false, session)
                    })
                })
            })
        })
    })
}

// Registers a new user with a given username and password.
function register(details, callback) {
    const {username, password} = details

    // Open the users database
    open((db) => {
        // Check if username already exists
        db.get(`SELECT username FROM users WHERE username='${username}'`, (err, row) => {
            if (err) {
                callback({
                    code: 500,
                    msg: "Internal server error"
                })
                return
            }
            if (row) {
                callback({
                    code: 409,
                    msg: "Username already in use"
                })
                return
            }
        
            // Generate salt for password hashing
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    callback({
                        code: 500,
                        msg: "Internal server error"
                    })
                    return 
                }

                // Hash the user's password with the salt
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) {
                        callback({
                            code: 500,
                            msg: "Internal server error"
                        })
                        return
                    }

                    // Add the user to the database with hashed password
                    db.run(`INSERT INTO users (username, password)
                    VALUES ('${username}', '${hash}')`, (err) => {
                        if (err) {
                            callback({
                                code: 500,
                                msg: "Internal server error"
                            })
                            return
                        }

                        callback(false)
                    })
                })
            })
        })
    })
}

// Delete session from database
function logout(session, callback) {
    open((db) => {
        db.run(`DELETE FROM sessions WHERE session = '${session}'`, (err) => {
            callback(!err)
        })
    })
}

// Retrieves the details of the user associated with the provided session token
function getDetails(session, callback) {
    open((db) => {
        // Retrieve username from sessions table where session equals provided session token
        db.get(`SELECT username FROM sessions WHERE session = '${session}'`, (err, row) => {
            if (err) {
                callback({
                    code: 500,
                    msg: "Internal server error"
                })
                return
            }
            if (!row) { // If row is empty, return 404 error
                callback({
                    code: 404,
                    msg: "Resource not found"
                })
                return
            }

            // Otherwise, return the user details
            callback(false, {
                username: row.username
            })
        })
    })
}


// Generate a random session token
function generateSession() { 
    // Define array of characters to choose from for each category
    const characters = ["ABCDEFGIJKLMNOPQRSTUVWXYZ".split(''), "abcdefgijklmnopqrstuvwxyz".split(''), "1234567890".split('')]

    let result = ""

    // Generate a random session token with 30 characters
    for (let i = 0; i < 30; i++) {
        let category = characters[Math.floor(Math.random() * 3)] // Randomly select a category from the array of characters
        result += category[Math.floor(Math.random() * category.length)] // Randomly select a character from the chosen category and add it to the session token
    }

    return result
}

// Check if a session exists in the database
function checkSession(session) {
    // Return a Promise that resolves to true if the session exists, false otherwise
    return new Promise((resolve, reject) => {
        // Open the database and query for session
        open((db) => {
            db.get(`SELECT * FROM sessions WHERE session = '${session}'`, (err, row) => {
                if (err) { // If a SQL-related error occurs, reject the Promise with the error
                    reject(err)
                } else { // If there's no error, resolve the Promise with true if the session is in use, false otherwise
                    resolve(row !== undefined)
                }
            })
        })
    })
}

// Create a unique session token by repeatedly generating one until a unique one is found
async function createSession(callback) {
    let session
    let taken = true

    // Keep generating sessions until an unused one is found
    while (taken) {
        session = generateSession()
        taken = await checkSession(session) // Check if session is already in database
    }

    callback(session)
}

module.exports = { login, register, logout, getDetails }
