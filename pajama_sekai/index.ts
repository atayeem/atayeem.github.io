import p5 from "p5";
import 'p5/lib/addons/p5.sound';

const using_input = {
    keyboard: true,
    touch: false,
};

const letters = {
    a:65, b:66, c:67, d:68, e:69, f:70, g:71, h:72, i:73, j:74, k:75, l:76, 
    m:77, n:78, o:79, q:80, r:81, s:82, t:83, u:84, w:85, x:86, y:87, z:88,
};

const sketch = (p: p5) => {

    function loadImageAsync(path: string): Promise<p5.Image> {
        return new Promise((resolve, reject) => {
            p.loadImage(
                path,
                (img) => resolve(img),
                (err) => reject(err)
            );
        });
    }

    function loadSoundAsync(path: string): Promise<p5.SoundFile> {
        return new Promise((resolve, reject) => {
            p.loadSound(
                path,
                (snd) => resolve(snd),
                (err) => reject(err)
            );
        });
    }

    function loadLevelJSONAsync(path: string): Promise<LevelJSON> {
        return new Promise((resolve, reject) => {
            p.loadJSON(
                path,
                (json) => resolve(json),
                (err) => reject(err)
            );
        });
    }

    function drawRectangleOnGrid(x: number, y: number, w: number, h: number) {
        /*
        Current state is intended to pass through this function.
        x - 0.0-6.0
        y - 0.0-1.0
        w - 0.0-6.0
        h - 0.0-1.0
        */
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
    
    function drawRectangleOnGridProjected(x: number, y: number, w: number, h: number) {
        let a = 10;
    
        if (y <= 0) {
            h += y;
            y = 0;
        }
    
        if (y < -h)
            return;
    
        const pr = (z: number) => a * z / (z + a);
    
        y = pr(y) / pr(1);
        h = pr(y + h) / pr(1) - pr(y) / pr(1);
    
        drawRectangleOnGrid(x, y, w, h);
    }

    interface LevelMetaData {
        bpm: number;
        song: string; // File path or URL (audio)
        bg: string;   // File path or URL (image)
    }
    
    interface LevelTile {
        position: number
        time: number
        duration: number
    }
    
    interface LevelJSON {
        meta: LevelMetaData;
        tiles: LevelTile[];
    }

    class Level {
        bpm: number;

        bg_path: string;
        song_path: string;

        tiles: LevelTile[];

        song_data: p5.SoundFile;
        bg_data: p5.Image;

        squares_activated: boolean[];
        t_start: number;
        active_notes: { [index: number]: { start_time: number } };

        started: boolean;
        loaded: boolean;

        framerate_apparent: number

        constructor(json: LevelJSON) {
            this.bpm = json.meta.bpm;
            this.song_path = json.meta.song;
            this.bg_path = json.meta.bg;

            this.tiles = json.tiles;

            this.squares_activated = new Array(12).fill(false);
            this.t_start = 0
            this.active_notes = {};

            this.started = false;
            this.loaded = false;

            this.framerate_apparent = p.frameRate();
        }
    
        async loadAssets(): Promise<void> {
            this.song_data = await loadSoundAsync(this.song_path);
            this.bg_data = await loadImageAsync(this.bg_path);

            this.loaded = true;
        }

        millisToBeat(m: number) {
            return m / 1000 / 60 * this.bpm;
        }
        
        getBeat() {
            return this.millisToBeat(p.millis()) - this.t_start;
        }

        private getTouches() {
            if (using_input.keyboard) {
                // Doing this here turns out to be a lot more reliable than keyPressed. 
                // It's still weird and browser-dependent, though.
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
        
                this.squares_activated = squares_activated_new;
            }
        
            else if (using_input.touch) {
                throw new Error("not implemented: using_input.touch: true");
            }
    
            else {
                throw new Error("configuration invalid state: using_input");
            }
        }

        private processKeys() {
            const now = this.getBeat();
        
            for (let i = 0; i < 6; i++) {
                const isPressed = this.squares_activated[i * 2];
                const wasPressed = this.active_notes.hasOwnProperty(i);
        
                if (isPressed && !wasPressed) {
                    // Key just pressed
                    this.active_notes[i] = { start_time: now };
                } 
                else if (!isPressed && wasPressed) {
                    // Key just released
                    const startTime = this.active_notes[i].start_time;
                    const duration = now - startTime;
                    this.tiles.push({
                        position: i,
                        time: startTime,
                        duration: duration
                    });
                    console.log(this.tiles.at(-1));
                    delete this.active_notes[i];
                }
            }
        }

        private drawStage() {
            p.push();
        
            p.image(this.bg_data, 0, 0, p.width, p.height);
        
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

        private drawSelectSquares() {
            p.push();
            p.strokeWeight(0.75);
            p.stroke(255, 255, 255);
        
            for (let i = 0; i < 12; i++) {
        
                if (this.squares_activated[i])
                    p.fill(255, 0, 255, 100);
                else
                    p.fill(0, 0, 0, 50);
        
                drawRectangleOnGridProjected(i / 2, 0.1, 1 / 2, 0.05);
            }
            p.pop();
        }

        private drawSelectLines() {
            p.push();
        
            p.stroke("rgb(255,234,238)");
            p.strokeWeight(2.5);
            p.noFill();
        
            drawRectangleOnGridProjected(0, 0.1, 6.0, 0.05);
        
            p.pop();
        }
        
        private drawAllTiles() {
            let t = this.getBeat();
        
            for (const tile of level.tiles) {
                drawRectangleOnGridProjected(tile.position, tile.time - t - 0.3, 1, tile.duration);
            }
        }

        handleMousePress() {
            if (!this.loaded)
                return;

            if (!this.started) {
                this.song_data.play()
                this.started = true;
                this.t_start = this.getBeat();
            }
        }

        draw() {
            this.drawStage();
            this.drawSelectSquares();
            this.drawSelectLines();

            this.getTouches();
            this.processKeys();
    
            this.drawAllTiles();
            
            p.fill("white");
            p.textSize(30);
            p.text(this.framerate_apparent, 30, 30);
            if (p.frameCount % 30 == 0) {
                this.framerate_apparent = Math.round(p.frameRate());
            }
        }
    }
    
    let level: Level;
    let topw: number;
    
    p.setup = async () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.P2D);
        p.angleMode(p.DEGREES);
        p.colorMode(p.RGB, 255, 255, 255, 255);
    
        if (using_input.keyboard == using_input.touch) {
            throw new Error("The input types must be mutually exclusive. Only one can be used. Check using_input.");
        }
    
        level = new Level(await loadLevelJSONAsync("out(6).json"));
        let x = await level.loadAssets();

        p.mousePressed = level.handleMousePress;

        topw = p.width / 10;
    }

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        topw = p.width / 10;
    }
}

new p5(sketch);