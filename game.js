// Get width and height of webview
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

// Split width and height into columns and rows of 32 pixels
const NUMBER_OF_COLS = Math.round(WIDTH / 64);
const NUMBER_OF_ROWS = Math.round(HEIGHT / 64);

// Move and jump speed
const MOVE_SPEED = 200
const JUMP_SPEED = 800

// Initialise Kaboom. with width and height and a plain white background
kaboom({
    width: WIDTH,
    height: HEIGHT,
    background: [127, 169, 255]
});

loadRoot("https://i.ibb.co/"); // ImgBB server as root directory for graphics

// Kaboom appears to have some issues with getting graphics from local storage
// Load graphics for floor, obstacle, and player as sprites
loadSprite("floor", "4jMbFVt/sand.png");
loadSprite("obstacle", "CsDYk5S/cactus.png");
loadSpriteAtlas("9pskdx9/creeper.png", {
    player: {
        x: 0,
        y: 0,
        width: 80,
        height: 265,
        sliceX: 1,
        sliceY: 2,
        anims: {
            move: { from: 0, to: 1, speed: 4, loop: true }
        }
    }
});

// Main scene; this will be the game itself
scene("main", () => {
    const player = add([
        sprite("player"),
        area(),
        pos(0, 0),
        body(),
        solid()
    ]); // Setup player sprite

    player.play("move");

    const score = add([
        text("Score: 0", {
            size: 25
        }),
        pos(0, 0),
        color(255, 255, 255),
        { value: 0 }
    ]) // Setup score text

    // Generate map based on width and height of page
    var map = [];
    
    for (let y = 0; y < NUMBER_OF_ROWS; y++) { // Loop y from 0 to NUMBER_OF_ROWS
        let row = ""; // Start row as an empty string
    
        for (let x = 0; x < NUMBER_OF_COLS; x++) { // Loop x from 0 to NUMBER_OF_COLS
            if (y == NUMBER_OF_ROWS-1) { // The final row will be the floor
                row += "F"; // Add 'F' for Kaboom to parse later on
            } else { // Otherwise
                row += " "; // Add empty space; this will be ignored
            }
        }
    
        map.push(row); // Push row to map
    }
    
    addLevel(map, {
        width: 64,
        height: 64,
        "F": () => [
            sprite("floor"),
            area(),
            solid()
        ] // Spawn the floor sprite for F on the map
    });
    
    let lastObstacle = 0; // Define lastObstacle; this will be used to avoid multiple obstacles appearing next to one another
    
    loop(0.2, () => { // Every 200 milliseconds
        let obstacleChance = Math.floor(Math.random() * 2); // Randomly pick number between 0 and 1 and round it
        if (lastObstacle > 5 && obstacleChance == 1) { // Make sure there is space between obstacles and obstacleChance is 1
            add([
                sprite("obstacle"),
                area(),
                pos(64*(NUMBER_OF_COLS-1), 64*(NUMBER_OF_ROWS-2)),
                body(),
                solid(),
                "obstacle"
            ]); // Setup obstacle
            lastObstacle = 0; // Reset lastObstacle to 0
        } else { 
            lastObstacle++; // Increment lastObstacle
        }
    });
    
    onUpdate("obstacle", (obstacle) => { // Update each obstacles every frame
        obstacle.move(-MOVE_SPEED, 0); // Move obstacle to the left at constant speed
        if (obstacle.pos.x < -64) { // Player has avoided the obstacle
            score.value++; // Increment score
            score.text = "Score: " + score.value; // Update score text
            destroy(obstacle); // Stop counting any further to score
        }
    });

    onKeyPress("space", () => { // Space key pressed
        player.jump(JUMP_SPEED); // Jump at constant speed
    });

    onTouchStart(() => { // Screen touched on a touchscreen device
        player.jump(JUMP_SPEED);
    });

    player.collides("obstacle", () => { // When player collides with any obstacle
        shake(10); // Shake camera mildly
        // Wait half a second before switching to Game Over scene
        setTimeout(() => {
            go("game-over", score.value);
        }, 500);
    });
});

// Game Over scene; this will appear when the player collides with an obstacle
scene("game-over", (score) => {
    add([
        text("Game Over\nYour score was "+score+"\nPress any key to play again", {
            size: 35,
            width: WIDTH
        }),
        pos(center()),
        origin("center"),
        color(255, 255, 255)
    ]); // Setup three lines of text informing game is over, the score, and to press any key to restart

    onKeyPress(() => { // Any key pressed
        go("main"); // Go to Main scene
    });

    onTouchStart(() => {
        go("main");
    });
});

go("main");
