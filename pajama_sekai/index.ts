import p5 from "p5";
import 'p5/lib/addons/p5.sound';

const using_input = {
    keyboard: true,
    touch: false,
};

let topw;

let bg, level, song;
let started = false;

let g = {};

const letters = {
    a:65, b:66, c:67, d:68, e:69, f:70, g:71, h:72, i:73, j:74, k:75, l:76, 
    m:77, n:78, o:79, q:80, r:81, s:82, t:83, u:84, w:85, x:86, y:87, z:88,
};

const sketch = (p: p5) => {

    function getTouches(p: p5) {
        if (using_input.keyboard) {
            // Doing this here turns out to be a lot more reliable than keyPressed. It's still weird and browser-dependent, though.
            let squares_activated_new = [
                p.keyIsDown(letters.d),
                p.keyIsDown(letters.d),
                p.keyIsDown(letters.f),
                p.keyIsDown(letters.f),
                p.keyIsDown(letters.g),
                p.keyIsDown(letters.g),
                p.keyIsDown(letters.h),
                p.keyIsDown(letters.h),
                p.keyIsDown(letters.j),
                p.keyIsDown(letters.j),
                p.keyIsDown(letters.k),
                p.keyIsDown(letters.k),
            ];
    
            squares_activated = squares_activated_new;
        }
    
        if (using_input.touch) {
            throw new Error("not implemented: using_input.touch: true");
        }
    }
    
    function simpleDrawStage(p: p5) {
        p.push();
    
        p.image(bg, 0, 0, p.width, p.height);
    
        p.noStroke();
        p.fill(150, 125, 125, 200);
        p.rect(0, 0, p.width, p.height);
    
        p.noStroke();
        p.fill(0, 0, 0, 50);
        p.quad(
            0, p.height,             // bottom left
            p.width, p.height,       // bottom right
            (p.width + topw) / 2, 0, // top right
            (p.width - topw) / 2, 0, // top left
        );
    
        p.stroke(255, 255, 255);
        p.noFill();
        for (let i = 0; i <= 1; i += 1 / 6) {
    
            if (i == 0 || i > 5 / 6)
                p.strokeWeight(2);
            else
                p.strokeWeight(0.75);
    
            p.line(
                p.lerp(0, p.width, i), p.height,
                p.lerp((p.width - topw) / 2, (p.width + topw) / 2, i), 0
            );
        }
    
        p.pop();
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
        let stage_topl = (p.width - topw) / 2; // top left
        let stage_topr = (p.width + topw) / 2; // top right
    
        x /= 6;
        w /= 6;
        
        // This was originally written as 12 lerp expressions which were then expanded.
        // Simplifying this would probably not improve performance.
        p.quad(
            stage_topl * y + (p.width + (stage_topr - p.width) * y - stage_topl * y) * x,
            p.height * (1 - y),
    
            stage_topl * (y + h) + (p.width + (stage_topr - p.width) * (y + h) - stage_topl * (y + h)) * x,
            p.height * (1 - (y + h)),
    
            stage_topl * (y + h) + (p.width + (stage_topr - p.width) * (y + h) - stage_topl * (y + h)) * (x + w),
            p.height * (1 - (y + h)),
    
            stage_topl * y + (p.width + (stage_topr - p.width) * y - stage_topl * y) * (x + w),
            p.height * (1 - y)
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

    p.setup = async () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.P2D);
        p.angleMode(p.DEGREES);
        p.colorMode(p.RGB, 255, 255, 255, 255);
    
        if (using_input.keyboard == using_input.touch) {
            throw new Error("The input types must be mutually exclusive. Only one can be used. Check using_input.");
        }
    
        level = await p.loadJSON("out(6).json");
    
        song = await p.loadSound(level.meta.song);
        bg = await p.loadImage(level.meta.bg);
    
        topw = p.width / 10;
    }

    p.draw = () => {
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

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        topw = p.width / 10;
    }
}

new p5(sketch);