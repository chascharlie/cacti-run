const open = require("./open")

// Retrieve the record score for specified player
function getPlayerRecord(username, callback) {
    open((db) => {
        db.get(`SELECT record FROM users WHERE username='${username}'`, (err, row) => {
            if (!row) {
                callback({
                    code: 404,
                    msg: "Resource not found"
                })
                return
            }

            callback(false, row.record)
        })
    })
}

// Retrieve the 25 highest records
function getHighestRecords(callback) {
    open((db) => {
        // Get the usernames and corresponding records of all rows sorted in descending order (highest first)
        db.all(`SELECT username, record FROM users SORT BY record DESC`, (err, rows) => {
            if (err) {
                callback({
                    code: 500,
                    msg: "Internal server error"
                })
                return
            }

            // Store top 25 in array
            var topRecords = []
            for (let i = 0; i < 25; i++) {
                try {
                    topRecords.push({
                        username: rows[i].username,
                        record: rows[i].record
                    })
                } catch {
                    break
                }
            }
            callback(false, topRecords) 
        })
    })
}

// Update record of specified player
function updateRecord(username, score, callback) {
    open((db) => {
        db.run(`UPDATE users SET record=${score} WHERE username='${username}'`, (err) => {
            if (err) {
                callback({
                    code: 500,
                    msg: "Internal server error"
                })
            }
        })
    })
}

module.exports = { getPlayerRecord, getHighestRecords, updateRecord }
