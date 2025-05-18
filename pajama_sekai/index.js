"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var p5_1 = require("p5");
// import 'p5/lib/addons/p5.sound';
var using_input = {
    keyboard: true,
    touch: false,
};
var letters = {
    a: 65, b: 66, c: 67, d: 68, e: 69, f: 70, g: 71, h: 72, i: 73, j: 74, k: 75, l: 76,
    m: 77, n: 78, o: 79, q: 80, r: 81, s: 82, t: 83, u: 84, w: 85, x: 86, y: 87, z: 88,
};
var sketch = function (p) {
    function loadImageAsync(path) {
        return new Promise(function (resolve, reject) {
            p.loadImage(path, function (img) { return resolve(img); }, function (err) { return reject(err); });
        });
    }
    function loadSoundAsync(path) {
        return new Promise(function (resolve, reject) {
            p.loadSound(path, function (snd) { return resolve(snd); }, function (err) { return reject(err); });
        });
    }
    function loadLevelJSONAsync(path) {
        return new Promise(function (resolve, reject) {
            p.loadJSON(path, function (json) { return resolve(json); }, function (err) { return reject(err); });
        });
    }
    function drawRectangleOnGrid(x, y, w, h) {
        /*
        Current state is intended to pass through this function.
        x - 0.0-6.0
        y - 0.0-1.0
        w - 0.0-6.0
        h - 0.0-1.0
        */
        var stage_topl = (p.width - topw) / 2; // top left
        var stage_topr = (p.width + topw) / 2; // top right
        x /= 6;
        w /= 6;
        // This was originally written as 12 lerp expressions which were then expanded.
        // Simplifying this would probably not improve performance.
        p.quad(stage_topl * y + (p.width + (stage_topr - p.width) * y - stage_topl * y) * x, p.height * (1 - y), stage_topl * (y + h) + (p.width + (stage_topr - p.width) * (y + h) - stage_topl * (y + h)) * x, p.height * (1 - (y + h)), stage_topl * (y + h) + (p.width + (stage_topr - p.width) * (y + h) - stage_topl * (y + h)) * (x + w), p.height * (1 - (y + h)), stage_topl * y + (p.width + (stage_topr - p.width) * y - stage_topl * y) * (x + w), p.height * (1 - y));
    }
    function drawRectangleOnGridProjected(x, y, w, h) {
        var a = 10;
        if (y <= 0) {
            h += y;
            y = 0;
        }
        if (y < -h)
            return;
        var pr = function (z) { return a * z / (z + a); };
        y = pr(y) / pr(1);
        h = pr(y + h) / pr(1) - pr(y) / pr(1);
        drawRectangleOnGrid(x, y, w, h);
    }
    var Level = /** @class */ (function () {
        function Level(json) {
            this.bpm = json.meta.bpm;
            this.song_path = json.meta.song;
            this.bg_path = json.meta.bg;
            this.tiles = json.tiles;
            this.squares_activated = new Array(12).fill(false);
            this.t_start = 0;
            this.active_notes = {};
            this.started = false;
            this.loaded = false;
            this.framerate_apparent = p.frameRate();
        }
        Level.prototype.loadAssets = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _a = this;
                            return [4 /*yield*/, loadSoundAsync(this.song_path)];
                        case 1:
                            _a.song_data = _c.sent();
                            _b = this;
                            return [4 /*yield*/, loadImageAsync(this.bg_path)];
                        case 2:
                            _b.bg_data = _c.sent();
                            this.loaded = true;
                            return [2 /*return*/];
                    }
                });
            });
        };
        Level.prototype.millisToBeat = function (m) {
            return m / 1000 / 60 * this.bpm;
        };
        Level.prototype.getBeat = function () {
            return this.millisToBeat(p.millis()) - this.t_start;
        };
        Level.prototype.getTouches = function () {
            if (using_input.keyboard) {
                // Doing this here turns out to be a lot more reliable than keyPressed. 
                // It's still weird and browser-dependent, though.
                var squares_activated_new = [
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
        };
        Level.prototype.processKeys = function () {
            var now = this.getBeat();
            for (var i = 0; i < 6; i++) {
                var isPressed = this.squares_activated[i * 2];
                var wasPressed = this.active_notes.hasOwnProperty(i);
                if (isPressed && !wasPressed) {
                    // Key just pressed
                    this.active_notes[i] = { start_time: now };
                }
                else if (!isPressed && wasPressed) {
                    // Key just released
                    var startTime = this.active_notes[i].start_time;
                    var duration = now - startTime;
                    this.tiles.push({
                        position: i,
                        time: startTime,
                        duration: duration
                    });
                    console.log(this.tiles.at(-1));
                    delete this.active_notes[i];
                }
            }
        };
        Level.prototype.drawStage = function () {
            p.push();
            p.image(this.bg_data, 0, 0, p.width, p.height);
            p.noStroke();
            p.fill(150, 125, 125, 200);
            p.rect(0, 0, p.width, p.height);
            p.noStroke();
            p.fill(0, 0, 0, 50);
            p.quad(0, p.height, // bottom left
            p.width, p.height, // bottom right
            (p.width + topw) / 2, 0, // top right
            (p.width - topw) / 2, 0);
            p.stroke(255, 255, 255);
            p.noFill();
            for (var i = 0; i <= 1; i += 1 / 6) {
                if (i == 0 || i > 5 / 6)
                    p.strokeWeight(2);
                else
                    p.strokeWeight(0.75);
                p.line(p.lerp(0, p.width, i), p.height, p.lerp((p.width - topw) / 2, (p.width + topw) / 2, i), 0);
            }
            p.pop();
        };
        Level.prototype.drawSelectSquares = function () {
            p.push();
            p.strokeWeight(0.75);
            p.stroke(255, 255, 255);
            for (var i = 0; i < 12; i++) {
                if (this.squares_activated[i])
                    p.fill(255, 0, 255, 100);
                else
                    p.fill(0, 0, 0, 50);
                drawRectangleOnGridProjected(i / 2, 0.1, 1 / 2, 0.05);
            }
            p.pop();
        };
        Level.prototype.drawSelectLines = function () {
            p.push();
            p.stroke("rgb(255,234,238)");
            p.strokeWeight(2.5);
            p.noFill();
            drawRectangleOnGridProjected(0, 0.1, 6.0, 0.05);
            p.pop();
        };
        Level.prototype.drawAllTiles = function () {
            var t = this.getBeat();
            for (var _i = 0, _a = level.tiles; _i < _a.length; _i++) {
                var tile = _a[_i];
                drawRectangleOnGridProjected(tile.position, tile.time - t - 0.3, 1, tile.duration);
            }
        };
        Level.prototype.handleMousePress = function () {
            if (!this.loaded)
                return;
            if (!this.started) {
                this.song_data.play();
                this.started = true;
                this.t_start = this.getBeat();
            }
        };
        Level.prototype.draw = function () {
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
        };
        return Level;
    }());
    var level;
    var topw;
    p.setup = function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, x;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    p.createCanvas(p.windowWidth, p.windowHeight, p.P2D);
                    p.angleMode(p.DEGREES);
                    p.colorMode(p.RGB, 255, 255, 255, 255);
                    if (using_input.keyboard == using_input.touch) {
                        throw new Error("The input types must be mutually exclusive. Only one can be used. Check using_input.");
                    }
                    _a = Level.bind;
                    return [4 /*yield*/, loadLevelJSONAsync("out(6).json")];
                case 1:
                    level = new (_a.apply(Level, [void 0, _b.sent()]))();
                    return [4 /*yield*/, level.loadAssets()];
                case 2:
                    x = _b.sent();
                    p.mousePressed = level.handleMousePress;
                    topw = p.width / 10;
                    return [2 /*return*/];
            }
        });
    }); };
    p.windowResized = function () {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        topw = p.width / 10;
    };
};
new p5_1.default(sketch);
