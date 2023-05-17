// Get width and height of window
const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight

// Calculate number of columns and rows
const NUMBER_OF_COLS = Math.round(WIDTH / 64)
const NUMBER_OF_ROWS = Math.round(HEIGHT / 64)

 // Initialise Kaboom
kaboom({
    width: WIDTH, // Set the width of the game window
    height: HEIGHT, // Set the height of the game window
    background: [180, 210, 246] // Set the background color of the game to light blue
})

loadRoot("https://i.ibb.co/")  // Set the root URL for all asset loading
loadSprite("floor", "DKK28Xh/sand.png")  // Load the floor sprite
loadSprite("obstacle", "f9HPp8H/cactus.png")
loadSprite("sun", "r3J0fH4/sun.png")
loadSpriteAtlas("WG888nd/player.png", {
    player: {
        x: 0,
        y: 0,
        width: 226,
        height: 80,
        sliceX: 4,
        sliceY: 1,
        anims: {
            moving: {from: 0, to: 3, loop: true, speed: 7}
        }
    }
})
loadSpriteAtlas("HB1sD0r/button.png", {
    button: {
        x: 0,
        y: 0,
        width: 130,
        height: 80,
        sliceX: 1,
        sliceY: 2,
        anims: {
            default: 0, // Set the default animation frame to display
            selected: 1 // Set the "selected" animation frame to display
        }
    }
})
loadFont("VT323", "ZdsBMqw/VT323.png", 10, 20) // Load the "VT323" font

const map = []
    
for (let y = 0; y <= NUMBER_OF_ROWS; y++) { // Run NUMBER_OF_ROWS times
    let row = "" // Row is empty string

    for (let x = 0; x <= NUMBER_OF_COLS; x++) { // RUN NUMBER_OF_COLS times
        if (y >= NUMBER_OF_ROWS-1) { // If it's the last row, add floor tile
            row += "F"
        } else { // Otherwise, add an empty space
            row += " "
        }
    }

    map.push(row) // Add row to map
}

const config = {
    width: 64, // Width of tile is 64
    height: 64, // Height of tile is 64
    "F": () => [ // For every use of "F" in map
        sprite("floor"), // Use floor sprite
        area(),
        solid()
    ]
}

// Title scene
scene("title", () => {
    // Add level with map and config
    addLevel(map, config)

    add([
        sprite("sun"),
        area(),
        pos(WIDTH-80, 80),
        origin("center")
    ])
    
    // Display game title
    add([
        text("Cacti Run", {
            size: 60,
            font: "VT323"
        }),
        area(),
        origin("center"),
        pos(center().x, 40),
        color(103, 139, 128)
    ])

    // Create play button
    const playButton = add([
        sprite("button"),
        area(),
        origin("center"),
        pos(center().x, center().y-22),
        "button"
    ])

    // Display the text "Play" on top of the play button
    add([
        text("Play", {
            size: 25,
            font: "VT323"
        }),
        area(),
        origin("center"),
        pos(center().x, center().y-22),
        color(255, 255, 255)
    ])

    const loginButton = add([
        sprite("button"),
        area(),
        origin("center"),
        pos(center().x, center().y+22),
        "button",
        { signed_in: (username !== "Guest") } // Set signed_in attribute to false if username is Guest, true otherwise
    ])

    // Check if user is signed in and create the relevant text
    if (loginButton.signed_in) { // Is signed in
        // Display the text "Sign Out" on top of login button
        add([
            text("Sign Out", {
                size: 25,
                font: "VT323"
            }),
            area(),
            origin("center"),
            pos(center().x, center().y+22),
            color(255, 255, 255)
        ])

        // Display the player's username
        add([
            text(`Signed in as: ${username}`, {
                size: 20,
                font: "VT323"
            }),
            area(),
            origin("center"),
            pos(center().x, center().y+65),
            color(255, 255, 255)
        ])

    } else { // Not signed in
        // Display the text "Sign In" on top of login button
        add([
            text("Sign In", {
                size: 25,
                font: "VT323"
            }),
            area(),
            origin("center"),
            pos(center().x, center().y+22),
            color(255, 255, 255)
        ])
    }

    // Change the button to selected when hovered
    onHover("button", (button) => {
        button.play("selected")
    }, (button) => {
        button.play("default")
    })

    // When login button is clicked, send logout request if signed in, or go to login page if signed out
    function loginBtnClicked() {
        if (loginButton.signed_in) {
            $.post("/logout", () => {
                location.reload()
            })
        } else {
            location.href = "login.html"
        }
    }

    // When play button is clicked, go to main scene
    function playBtnClicked() {
        go("main")
    }

    // Touchscreen support
    onTouchStart(() => {
        // Kaboom.js counts tapping a button as hovering
        playButton.onHover(() => { // On touch of play button
            playBtnClicked()
        })
        loginButton.onHover(() => {
            loginBtnClicked()
        })
    })

    // Add click event listeners to the buttons
    playButton.onClick(() => { // On click of play button
        playBtnClicked()
    })
    loginButton.onClick(() => {
        loginBtnClicked()
    })
})

// Main scene; this is the game itself
scene("main", () => {
    addLevel(map, config)

    add([
        sprite("sun"),
        area(),
        pos(WIDTH-80, 80),
        origin("center")
    ])

    // Create the player sprite
    const player = add([
        sprite("player"),
        area(),
        pos(20, HEIGHT-192),
        body(),
        solid()
    ])

    player.play("moving")

    // Display score text
    let score = add([
        text("Score: 0", {
            size: 25,
            font: "VT323"
        }),
        pos(0, 0),
        color(255, 255, 255),
        { value: 0 }
    ])

    var obstacleFrequency = 1.5 // Frequency in seconds at which a new obstacle is generated
    var moveSpeed = 300 // Speed at which obstacles move toward the player
    var jumpSpeed = 700 // Speed at which the player jumps

    // Function to spawn obstacles at a specific frequency
    function spawnObstacles() {
        // Add obstacle
        add([
            sprite("obstacle"),
            area(),
            pos(64*(NUMBER_OF_COLS-1), 64*(NUMBER_OF_ROWS-2)),
            body(),
            solid(),
            "obstacle"
        ])
        wait(obstacleFrequency, spawnObstacles)  // Wait for the duration of the obstacle frequency before spawning the next obstacle
    }
    
    spawnObstacles() // Start spawning obstacles immediately

    action("obstacle", (obstacle) => {
        obstacle.move(-moveSpeed, 0)  // Move the obstacle to the left
        if (obstacle.pos.x < -64) {  // If the obstacle goes off screen
            score.value++  // Increment score
            score.text = "Score: " + score.value  // Update the score text
            destroy(obstacle) // Destroy the obstacle

            if (score.value % 15 == 0 && score.value < 150) { // If the score is a multiple of 15 and less than 150
                moveSpeed *= 1.05 // Increase move speed
                obstacleFrequency *= 0.95 // Decrease obstacle frequency
                jumpSpeed *= 0.95 // Decrease jump speed
            }
        }
    })

    // Function to make the player jump if it is on the ground
    function playerJump() {
        if (player.isGrounded()) {
            player.jump(jumpSpeed)
        }
    }

    // When space is pressed, player jump
    onKeyPress("space", () => {
        playerJump()
    })

    // When screen is touched, player jump
    onTouchStart(() => {
        playerJump()
    })

    player.collides("obstacle", () => { // When the player collides with an obstacle
        shake(10) // Mildly shake screen

        setTimeout(() => {
            go("game-over", score.value)
        }, 500) // Wait for 500 milliseconds before going to game over screen
    })
})

// Game Over scene taking in score as parameter
scene("game-over", (score) => {
    if (username !== "Guest") { // If player signed in
        // Send POST request to /score, including username and score
        $.post({
            url: "/score",
            data: {
                username: username,
                score: score
            }
        })
    }

    addLevel(map, config)

    add([
        sprite("sun"),
        area(),
        pos(WIDTH-80, 80),
        origin("center")
    ])

    // Display the "Game Over" text with the player's score
    add([
        text("Game Over\nYour score was "+score, {
            size: 35,
            width: WIDTH,
            font: "VT323"
        }),
        pos(center().x, center().y-70),
        origin("center"),
        color(255, 255, 255)
    ])

    // Create respawn button
    const respawnButton = add([
        sprite("button"),
        area(),
        origin("center"),
        pos(center()),
        "button"
    ])

    // Display the text "Respawn" on top of respawn button
    add([
        text("Respawn", {
            size: 25,
            font: "VT323"
        }),
        area(),
        origin("center"),
        pos(center()),
        color(255, 255, 255)
    ])

    // Play selected animation on hover of button
    onHover("button", (button) => {
        button.play("selected")
    }, (button) => {
        button.play("default")
    })

    function respawn() {
        go("main")
    }

    onTouchStart(() => {
        respawnButton.onHover(() => { // When respawn button tapped on touchscreens
            respawn()
        })
    })

    respawnButton.onClick(() => {
        go("main")
    })
})

// Start the game by going to the "title" scene
go("title")
