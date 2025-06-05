let URL = "https://teachablemachine.withgoogle.com/models/oCLgncn75/";

let model, webcam, ctx, labelContainer, maxPredictions;

// Dynamic pose tracking
let poseStates = {};
let explosionActive = false;
let explosionSound = new Audio('explsn.mp3');

async function init() {
    const video = document.getElementById('instructionVideo');
    video.volume = 0.4;

        model = await tmPose.load(URL + "model.json", URL + "metadata.json");
        maxPredictions = model.getTotalClasses();

    webcam = new tmPose.Webcam(600, 600, true);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    const canvas = document.getElementById("canvas");
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }

}

async function loop(timestamp) {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}
const newSound = new Audio('explsn.mp3');
function playExplosionSound() {
    newSound.volume = 1.0;
    newSound.play();
}

async function predict() {
    try {
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        const prediction = await model.predict(posenetOutput);
        const video = document.getElementById('instructionVideo');

        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction =
                prediction[i].className + ": " + prediction[i].probability.toFixed(2);
            labelContainer.childNodes[i].innerHTML = classPrediction;

            // Check pose dynamically
            checkPose(prediction[i], video);
        }

        drawPose(pose, explosionActive);
    } catch (error) {
        console.error("Error in predict:", error);
    }
}

function checkPose(prediction, video) {
    const time = video.currentTime;
    const prob = prediction.probability;

    // Only respond to pose1 through pose5 labels
    const poseNumber = prediction.className.toLowerCase().replace(/[^0-9]/g, '');
    const isPoseLabel = prediction.className.toLowerCase().includes('pose') && poseNumber >= 1 && poseNumber <= 9;

    if (!isPoseLabel) return;

    if (!poseStates[`pose${poseNumber}`]) {
        poseStates[`pose${poseNumber}`] = {
            triggered: false,
            firstWindowTriggered: false,
            secondWindowTriggered: false
        };
    }

    if (prob > 0.8 && !explosionActive) {
        const poseState = poseStates[`pose${poseNumber}`];

        switch(poseNumber) {
            case '1':
                if (time >= 0.0 && time <= 1.0 && !poseState.triggered) {
                    triggerExplosion(poseState);
                }
                break;

            case '2':
                break;
        }
    }
}

function triggerExplosion(poseState) {
    explosionActive = true;
    poseState.triggered = true;
    playExplosionSound();
    setTimeout(() => { explosionActive = false; }, 300);
}

function drawPose(pose, explode) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            if (explode) {
                pose.keypoints.forEach(keypoint => {
                    if (keypoint.score > minPartConfidence) {
                        const scale = 3;
                        ctx.beginPath();
                        ctx.arc(keypoint.position.x, keypoint.position.y, 10 * scale, 0, 2 * Math.PI);
                        ctx.fillStyle = '#FF0000';
                        ctx.fill();
                    }
                });
            } else {
                tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
                tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
            }
        }
    }
}

async function playInstructionVideo() {
    const video = document.getElementById('instructionVideo');
    const videoSrc = video.getAttribute('data-video-src') || 'vid.mp4';
    video.src = videoSrc;
    const videoContainer = video.parentElement;

    video.addEventListener('timeupdate', () => {
        const minutes = Math.floor(video.currentTime / 60);
        const seconds = Math.floor(video.currentTime % 60);
        document.getElementById('videoTime').textContent = 
            `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    });

    const videoCanvas = document.createElement('canvas');
    videoCanvas.id = 'poseCanvas';
    videoCanvas.style.position = 'absolute';
    videoCanvas.style.left = '0';
    videoCanvas.style.top = '0';
    videoCanvas.width = 600;
    videoCanvas.height = 450;

    videoContainer.style.position = 'relative';
    videoContainer.appendChild(videoCanvas);
    const videoCtx = videoCanvas.getContext('2d');

    video.play();

    async function processFrame() {
        if (!video.paused && !video.ended) {
            try {
                const { pose, posenetOutput } = await model.estimatePose(video);
                videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);

                if (pose) {
                    tmPose.drawKeypoints(pose.keypoints, 0.6, videoCtx);
                    tmPose.drawSkeleton(pose.keypoints, 0.6, videoCtx);
                }
            } catch (error) {
                console.error('Pose detection error:', error);
            }
            requestAnimationFrame(processFrame);
        }
    }

    if (model) {
        processFrame();
    } else {
        console.log("https://teachablemachine.withgoogle.com/models/oCLgncn75/");
    }
}

function stopInstructionVideo() {
    const video = document.getElementById('instructionVideo');
    video.pause();
    video.currentTime = 0;
    const canvas = video.parentElement.querySelector('canvas');
    if (canvas) {
        canvas.remove();
    }
    pose1Triggered = false;
    pose2Triggered = false;
    pose3FirstWindowTriggered = false;
    pose3SecondWindowTriggered = false;
    pose4Triggered = false;
    pose5Triggered = false;
}

function stopWebcam() {
    if (webcam) {
        webcam.stop();
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
