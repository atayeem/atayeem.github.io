const using_input = {
    keyboard: true,
    touch: false,
};

let topw;

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    topw = width / 10;
}

let bg, level, song;
let started = false;

async function setup() {
    createCanvas(windowWidth, windowHeight);
    angleMode(DEGREES);
    colorMode(RGB, 255, 255, 255, 255);

    if ([using_input.keyboard, using_input.mouse, using_input.touch].filter(Boolean).length !== 1) {
        throw new Error("The input types must be mutually exclusive. Only one can be used. Check using_input.");
    }

    level = await loadJSON("out(6).json");

    song = await loadSound(level.meta.song);
    bg = await loadImage(level.meta.bg);

    topw = width / 10;
}

function getTouches() {
    if (using_input.keyboard) {
        // Doing this here turns out to be a lot more reliable than keyPressed. It's still weird and browser-dependent, though.
        let squares_activated_new = [
            keyIsDown("d"),
            keyIsDown("d"),
            keyIsDown("f"),
            keyIsDown("f"),
            keyIsDown("g"),
            keyIsDown("g"),
            keyIsDown("h"),
            keyIsDown("h"),
            keyIsDown("j"),
            keyIsDown("j"),
            keyIsDown("k"),
            keyIsDown("k"),
        ];

        squares_activated = squares_activated_new;
    }

    if (using_input.touch) {
        throw new Error("not implemented: using_input.touch: true");
    }
}

function simpleDrawStage() {
    push();

    image(bg, 0, 0, width, height);

    noStroke();
    fill(150, 125, 125, 200);
    rect(0, 0, width, height);

    noStroke();
    fill(0, 0, 0, 50);
    quad(
        0, height,           // bottom left
        width, height,       // bottom right
        (width + topw) / 2, 0, // top right
        (width - topw) / 2, 0, // top left
    );

    stroke(255, 255, 255);
    noFill();
    for (let i = 0; i <= 1; i += 1 / 6) {

        if (i == 0 || i > 5 / 6)
            strokeWeight(2);
        else
            strokeWeight(0.75);

        line(
            lerp(0, width, i), height,
            lerp((width - topw) / 2, (width + topw) / 2, i), 0
        );
    }

    pop();
}

let squares_activated = new Array(12).fill(false);

/*
Current state is intended to pass through this function.
x - 0.0-6.0
y - 0.0-1.0
w - 0.0-6.0
h - 0.0-1.0
*/
function drawRectangleOnGrid(x, y, w, h) {
    let stage_topl = (width - topw) / 2; // top left
    let stage_topr = (width + topw) / 2; // top right

    x /= 6;
    w /= 6;

    quad(
        stage_topl * y + (width + (stage_topr - width) * y - stage_topl * y) * x,
        height * (1 - y),

        stage_topl * (y + h) + (width + (stage_topr - width) * (y + h) - stage_topl * (y + h)) * x,
        height * (1 - (y + h)),

        stage_topl * (y + h) + (width + (stage_topr - width) * (y + h) - stage_topl * (y + h)) * (x + w),
        height * (1 - (y + h)),

        stage_topl * y + (width + (stage_topr - width) * y - stage_topl * y) * (x + w),
        height * (1 - y)
    );
}

function drawRectangleOnGridProjected(x, y, w, h) {
    let a = 10;

    if (y <= 0) {
        h += y;
        y = 0;
    }

    if (y < -h)
        return;

    const p = z => a * z / (z + a);

    y = p(y) / p(1);
    h = p(y + h) / p(1) - p(y) / p(1);

    drawRectangleOnGrid(x, y, w, h);
}

function drawSelectSquares() {
    push();
    strokeWeight(0.75);
    stroke(255, 255, 255);

    for (let i = 0; i < 12; i++) {

        if (squares_activated[i])
            fill(255, 0, 255, 100);
        else
            fill(0, 0, 0, 50);

        drawRectangleOnGridProjected(i / 2, 0.1, 1 / 2, 0.05);
    }
    pop();
}

function drawSelectLines() {
    push();

    stroke("rgb(255,234,238)");
    strokeWeight(2.5);
    noFill();

    drawRectangleOnGridProjected(0, 0.1, 6.0, 0.05);

    pop();
}

function mousePressed() {
    if (!started) {
        song.play()
        started = true;
        t_start = beat();
    }
}

function keyPressed() {
    if (key == ENTER) {
        saveJSON(level, "out.json");
    }
}

let t_start = 0.0;
function drawAllTiles() {
    let t = beat();

    for (const tile of level.tiles) {
        drawRectangleOnGridProjected(tile.position, tile.time - t - 0.3, 1, tile.duration);
    }
}

let activeNotes = {}; // key: index, value: { startTime: number }

function millisToBeat(m) {
    return m / 1000 / 60 * level.meta.bpm;
}

function beat() {
    return millisToBeat(millis()) - t_start;
}

function processKeys(currentKeys) {
    const now = beat();

    for (let i = 0; i < 6; i++) {
        const isPressed = currentKeys[i];
        const wasPressed = activeNotes.hasOwnProperty(i);

        if (isPressed && !wasPressed) {
            // Key just pressed
            activeNotes[i] = { startTime: now };
        } else if (!isPressed && wasPressed) {
            // Key just released
            const startTime = activeNotes[i].startTime;
            const duration = now - startTime;
            level.tiles.push({
                position: i,
                time: startTime,
                duration: duration
            });
            console.log(level.tiles.at(-1));
            delete activeNotes[i];
        }
    }
}

let prev_framerate = 60;
function draw() {
    simpleDrawStage();
    drawSelectSquares();
    drawSelectLines();
    getTouches();

    let to_process = []

    for (let i = 0; i < 12; i += 2)
        to_process.push(squares_activated[i]);
    processKeys(to_process);
    drawAllTiles();

    fill("white");
    textSize(30);
    text(prev_framerate, 30, 30);
    if (frameCount % 30 == 0) {
        prev_framerate = Math.round(frameRate());
    }
}