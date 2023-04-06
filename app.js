// Import required modules
const http = require('http');
const express = require('express');
const cookieParser = require('cookie-parser');

// Account functionality
const account = require('./lib/account');

const app = express(); // Create Express application
app.use(express.static(__dirname + "/public")); // Serve static files in /public directory
app.use(cookieParser()); // Enable cookie parsing

// On connection to root
app.get('/', (req, res) => {
    const session = req.cookies.session; // Get session from cookie

    var username;

    if (session) { // Session is defined
        // Get user information from account
        account.getInfo(session, (err, data) => {
            if (data) { // Info found
                username = data.username; // Set username to that retrieved
            } else {
                username = "Guest"; // Set username to Guest
            }
        });
    } else { // No session
        username = "Guest";
    }

    function waitForInfo() { // Recursion function to avoid username being undefined
        if (username) { // Username has a value
            res.send(`
            <!DOCTYPE html>
            <html>
                <head lang="en">
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Obstacle Jump</title>
                    <link rel="stylesheet" href="styles.css">
                </head>
                <body>
                    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.3/jquery.min.js"></script>
                    <script src="https://unpkg.com/kaboom@2000.2.10/dist/kaboom.js"></script>
                    <script>
                        const username = "${username}";
                    </script>
                    <script src="js/game.js"></script>

                </body>
            </html>
            `); // Send HTML to client including constant value of username
            res.end('');
        } else { // Username undefined
            setTimeout(waitForInfo, 10); // Repeat in 10 milliseconds
        }
    }

    waitForInfo();
});

// POST request register; run upon submission of registration form
app.post('/register', express.urlencoded({ extended: true }), (req, res) => {
    account.register(req.body, (err) => { // Pass body of request (containing username and password) to register function
        if (err) { // Unsuccessful
            res.status(err); // Send error code
        }
        res.end(''); // End response
    })
});

// POST request login; run upon submission of login form
app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
    account.login(req.body, (err, session) => {
        if (session) { // Successful
            res.cookie('session', session); // Store session as cookie on client
        } else { // Unsuccessful
            res.status(err);
        }
        res.end('');
    });
});

// POST request logout
app.post('/logout', express.urlencoded({ extended: true }), (req, res) => {
    const session = req.cookies.session;
    account.logout(session);

    res.clearCookie('session'); // Clear cookie of session
    res.end('');
});

const server = http.createServer(app); // Create server running app
server.listen(8080, () => {
    console.log("Server is running!");
}); // Run on port 8080
