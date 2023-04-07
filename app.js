// Require modules
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const account = require('./lib/account')

const app = express() // Create Express app
app.use(bodyParser.urlencoded({ extended: true })) // Use middleware to parse request body
app.use(express.static(__dirname + "/public")) // Serve static files from public directory
app.use(cookieParser()) // Use cookie-parser middleware to handle cookies


// Define route for root
app.get('/', (req, res) => {
    let session = req.cookies.session // Get session from cookies
    var username

    // If session is a value, try to find the corresponding username in database
    if (session) {
        account.getDetails(session, (err, details) => {
            if (err) {
                username = "Guest"
            } else {
                username = details.username
            }
        })
    } else { // If session is undefined, user is a guest
        username = "Guest"
    }

    // Wait for username to be available and send response
    (function waitForUsername() {
        if (username) {
            res.send(`
            <!DOCTYPE html>
            <html>
                <head lang="en">
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Obstacle Jump</title>
                </head>
                <body>
                    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.3/jquery.min.js"></script>
                    <script src="https://unpkg.com/kaboom@2000.2.10/dist/kaboom.js"></script>
                    <script src="js/game.js"></script>
                    <script>
                        const username = "${username}"
                    </script>
                </body>
            </html>
            `)
        } else {
            setTimeout(waitForUsername, 10) // Wait for 10 milliseconds and check again
        }
    })()
})

// POST route for /login
app.post('/login', (req, res) => {
    // Call the login function, passing in the request body
    account.login(req.body, (err, session) => {
        // If an error occurred during login, set the response status to the error code and send the error message
        if (err) {
            res.status(err.code).send(err.msg)
            return
        }

        // If login was successful, set a cookie with the session ID and a max age of 1 year (in seconds)
        res.cookie('session', session, {
            maxAge: 60 * 60 * 24 * 7 * 52,
            httpOnly: true
        })

        // End the response with the session ID as the body
        res.redirect('/')
    })
})

// POST route for /register
app.post('/register', (req, res) => {
    // Call the register function, passing in the request body
    account.register(req.body, (err) => {
        // If an error occurred during registration, set the response status to the error code and send the error message
        if (err) {
            res.status(err.code).send(err.msg)
            return
        }

        res.redirect('back') // If registration was successful, refresh the page
    })
})

// POST route for /logout
app.post('/logout', (req, res) => {
    let session = req.cookies.session

    // Call the logout function, passing in the session
    account.logout(session, () => {
        res.clearCookie("session") // Delete cookie
        res.end('')
    })
})

// This starts the server listening on port 8080 and logs a message to the console when the server is running
app.listen(8080, () => {
    console.log("Server running!")
})
