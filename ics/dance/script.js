// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

const URL = 'https://teachablemachine.withgoogle.com/models/oCLgncn75/';
let model, webcam, ctx, labelContainer, maxPredictions;

let exploding_now = false;

const THRESHOLD_POSE_CONFIDENCE = 0.5;

const explosion_sound = new Audio("explsn.mp3");

function triggerExplosion() {
    explosion_sound.play();
    exploding_now = true;

    setTimeout(() => {
        exploding_now = false;
    }, 500);
}

/*
Architecture:
buttons -> start_all -> loop -> [predict -> drawPose, loop]
*/

async function start_all() {
    const modelURL = URL + 'model.json';
    const metadataURL = URL + 'metadata.json';

    // load the model and metadata
    // Refer to tmPose.loadFromFiles() in the API to support files from a file picker
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // set up webcam
    webcam = new tmPose.Webcam(400, 400, true); // width, height, flip
    await webcam.setup(); // request access to the webcam
    webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById('canvas');
    canvas.width = 200; canvas.height = 200;
    ctx = canvas.getContext('2d');
    labelContainer = document.getElementById('label-container');
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement('div'));
    }
}

async function start_video() {
    const video = document.getElementById('instructionVideo');
    const videoSrc = video.getAttribute('data-video-src') || 'vid.mp4';
    video.src = videoSrc;
    const videoContainer = video.parentElement;

    video.addEventListener('timeupdate', () => {
        video_time = video.currentTime;
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

    video.play();
}

function checkPose(prediction, video) {
    const time = video.currentTime;
    const prob = prediction.probability;

    // this is the regex to remove all but numbers 0-9
    const poseNumber = prediction.className.replace(/[^0-9]/g, '');

    if (prob > THRESHOLD_POSE_CONFIDENCE) {
        
        switch(poseNumber) {
            case '1':
                if (0.0 <= time && time <= 1.0)
                    triggerExplosion();
                break;

            case '2':
                if ( 1.0 <= time && time <=  3.0 ||
                    14.0 <= time && time <= 16.0 ||
                    19.0 <= time && time <= 21.0)
                    triggerExplosion();
                break;

            case '3':
                if (2.0 <= time && time <= 5.0)
                    triggerExplosion();
                break;

            case '4':
                if ( 5.0 <= time && time <=  7.0 ||
                    13.0 <= time && time <= 14.0)
                    triggerExplosion();
                break;

            case '5':
                if (7.0 <= time && time <= 10.0)
                    triggerExplosion();
                break;

            case '6':
                if (10.0 <= time && time <= 13.0)
                    triggerExplosion();
                break;

            case '7':
                if (16.0 <= time && time <= 20.0)
                    triggerExplosion();
                break;

            case '8':
                if (21.0 <= time && time <= 29.0)
                    triggerExplosion();
                break;

            case '9':
                if (29.0 <= time && time <= 31.0)
                    triggerExplosion();
                break;
        }
    }
}

function stop_video() {
    const video = document.getElementById('instructionVideo');
    video.pause();
    video.currentTime = 0;
    const canvas = video.parentElement.querySelector('canvas');

    if (canvas)
        canvas.remove();
}

function stop_webcam() {
    if (webcam) {
        webcam.stop();
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

async function loop(_timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    try {
    // Prediction #1: run input through posenet
    // estimatePose can take in an image, video or canvas html element
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    let highest_tag = "NONE";
    let highest_confidence = 0.0;
    let highest_prediction = null;

    for (let i = 0; i < maxPredictions; i++) {
        let confidence = prediction[i].probability;
        let tag = prediction[i].className;

        let text_to_write = tag + ': ' + confidence.toFixed(2);

        if (confidence > highest_confidence) {
            highest_confidence = confidence;
            highest_tag = tag;
            highest_prediction = prediction[i];
            document.getElementById("most-confident-prediction").innerHTML = text_to_write;
        }
        
        labelContainer.childNodes[i].innerHTML = text_to_write;
    }

    checkPose(highest_prediction, document.getElementById('instructionVideo'));

    // finally draw the poses
    drawPose(pose);
    }
    catch (e) {
        alert(e);
    }
}


function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            if (exploding_now) {
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