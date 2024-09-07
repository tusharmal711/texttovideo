async function generateVideo() {
    const userText = document.getElementById('userText').value;
    const duration = parseInt(document.getElementById('duration').value, 10);
    const textColor = document.getElementById('textColor').value;
    const bgColor = document.getElementById('bgColor').value;
    const bgImageInput = document.getElementById('bgImage');
    const canvas = document.getElementById('videoCanvas');
    const ctx = canvas.getContext('2d');
    const loadingOverlay = document.getElementById('loadingOverlay');

    if (!userText || isNaN(duration) || duration <= 0) {
        alert('Please enter valid text, duration, and colors.');
        return;
    }

    loadingOverlay.style.display = 'flex'; // Show loading overlay

    const width = canvas.width;
    const height = canvas.height;
    const fps = 30;
    const frameCount = duration * fps;
    const bgImage = bgImageInput.files[0];

    // Create an offscreen canvas for rendering frames
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

    const recordedChunks = [];
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const webmArrayBuffer = await blob.arrayBuffer();

        // Initialize FFmpeg.js
        const { createFFmpeg, fetchFile } = FFmpeg;
        const ffmpeg = createFFmpeg({ log: true });

        await ffmpeg.load();

        // Write the WebM file to FFmpeg's virtual file system
        ffmpeg.FS('writeFile', 'input.webm', new Uint8Array(webmArrayBuffer));

        // Transcode the video to MP4 with H.264 and AAC codecs
        await ffmpeg.run(
            '-i', 'input.webm',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '22',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', 'faststart',
            'output.mp4'
        );

        // Read the transcoded MP4 file
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(mp4Blob);

        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = url;
        downloadLink.download = 'animated-text-video.mp4';
        downloadLink.style.display = 'block';
        downloadLink.textContent = 'Download Video';
        loadingOverlay.style.display = 'none'; // Hide loading overlay
    };

    mediaRecorder.start();

    let frame = 0;
    const bgImageObj = new Image();

    if (bgImage) {
        const reader = new FileReader();
        reader.onload = function(event) {
            bgImageObj.src = event.target.result;
            bgImageObj.onload = function() {
                renderFrame();
            };
        };
        reader.readAsDataURL(bgImage);
    } else {
        renderFrame(); // No image, proceed with background color
    }

    function renderFrame() {
        if (frame >= frameCount) {
            mediaRecorder.stop();
            return;
        }

        // Clear canvas
        offscreenCtx.clearRect(0, 0, width, height);

        // Draw background: either image or color
        if (bgImageObj.src) {
            offscreenCtx.drawImage(bgImageObj, 0, 0, width, height);
        } else {
            offscreenCtx.fillStyle = bgColor;
            offscreenCtx.fillRect(0, 0, width, height);
        }

        // Draw the text
        offscreenCtx.font = 'bold 40px Arial';
        offscreenCtx.fillStyle = textColor;
        offscreenCtx.textAlign = 'center';
        offscreenCtx.textBaseline = 'middle';
        offscreenCtx.fillText(userText, width / 2, height / 2);

        // Draw the frame on the main canvas
        ctx.drawImage(offscreenCanvas, 0, 0);

        frame++;
        setTimeout(renderFrame, 1000 / fps);
    }
}
