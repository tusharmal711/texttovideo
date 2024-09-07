function generateVideo() {
    const userText = document.getElementById('userText').value;
    const duration = parseInt(document.getElementById('duration').value, 10);
    const textColor = document.getElementById('textColor').value;
    const bgColor = document.getElementById('bgColor').value;
    const textAnimation = document.getElementById('textAnimation').value;
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
    const fps = 50;
    const frameCount = duration * fps;
    const bgImage = bgImageInput.files[0];

    // Create an offscreen canvas for rendering frames
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offscreenCtx = offscreenCanvas.getContext('2d');

    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    const recordedChunks = [];
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const downloadLink = document.getElementById('downloadLink');
        const refreshLink = document.getElementById('refreshLink');
        downloadLink.href = url;
        downloadLink.download = 'animated-text-video.webm'; // WEBM format
        downloadLink.style.display = 'block';
        refreshLink.style.display = 'block';
        downloadLink.textContent = 'Download Video';
        loadingOverlay.style.display = 'none'; // Hide loading overlay
        if (audioFile) {
            const audioUrl = URL.createObjectURL(audioFile);
            const audio = new Audio(audioUrl);
            audio.play();
        }
    };

    mediaRecorder.start();

    let frame = 0;
    const bgImageObj = new Image();

    // If an image is uploaded, use it; otherwise, use the background color
    if (bgImage) {
        const reader = new FileReader();
        reader.onload = function(event) {
            bgImageObj.src = event.target.result;
            renderFrame();
        };
        reader.readAsDataURL(bgImage);
    } else {
        renderFrame(); // No image, proceed with background color
    }

    function applyAnimation(ctx, animation, frame, totalFrames) {
        const progress = frame / totalFrames;
        const x = width / 2;
        const y = height / 2;

        switch (animation) {
            case 'fadeIn':
                offscreenCtx.globalAlpha = Math.min(progress, 1);
                break;
            case 'fadeOut':
                offscreenCtx.globalAlpha = Math.max(1 - progress, 0);
                break;
            case 'bounce':
                offscreenCtx.translate(x, y);
                offscreenCtx.translate(0, Math.abs(Math.sin(progress * Math.PI * 2)) * 50);
                offscreenCtx.translate(-x, -y);
                break;
            case 'slideLeft':
                offscreenCtx.translate(-width * (1 - progress), 0);
                break;
            case 'slideRight':
                offscreenCtx.translate(width * progress, 0);
                break;
            case 'zoomIn':
                offscreenCtx.translate(x, y);
                offscreenCtx.scale(progress, progress);
                offscreenCtx.translate(-x, -y);
                break;
            case 'zoomOut':
                offscreenCtx.translate(x, y);
                offscreenCtx.scale(1 - progress, 1 - progress);
                offscreenCtx.translate(-x, -y);
                break;
            case 'spin':
                offscreenCtx.translate(x, y);
                offscreenCtx.rotate(progress * Math.PI * 2);
                offscreenCtx.translate(-x, -y);
                break;
            case 'flip':
                offscreenCtx.translate(x, y);
                offscreenCtx.scale(1, progress < 0.5 ? 1 : -1);
                offscreenCtx.translate(-x, -y);
                break;
            case 'bounceIn':
                offscreenCtx.translate(x, y);
                offscreenCtx.scale(1 + 0.5 * Math.sin(progress * Math.PI * 2), 1 + 0.5 * Math.sin(progress * Math.PI * 2));
                offscreenCtx.translate(-x, -y);
                break;
            case 'bounceOut':
                offscreenCtx.translate(x, y);
                offscreenCtx.scale(1 - 0.5 * Math.sin(progress * Math.PI * 2), 1 - 0.5 * Math.sin(progress * Math.PI * 2));
                offscreenCtx.translate(-x, -y);
                break;
            case 'rotateIn':
                offscreenCtx.translate(x, y);
                offscreenCtx.rotate(progress * Math.PI * 2);
                offscreenCtx.translate(-x, -y);
                break;
            case 'rotateOut':
                offscreenCtx.translate(x, y);
                offscreenCtx.rotate((1 - progress) * Math.PI * 2);
                offscreenCtx.translate(-x, -y);
                break;
            case 'slideUp':
                offscreenCtx.translate(0, height * (1 - progress));
                break;
            case 'slideDown':
                offscreenCtx.translate(0, -height * progress);
                break;
            case 'flipY':
                offscreenCtx.translate(x, y);
                offscreenCtx.scale(1, -1);
                offscreenCtx.translate(-x, -y);
                break;
            case 'flipX':
                offscreenCtx.translate(x, y);
                offscreenCtx.scale(-1, 1);
                offscreenCtx.translate(-x, -y);
                break;
            case 'none':
            default:
                ctx.globalAlpha = 1;
                ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformations
        }
    }

    function renderFrame() {
        if (frame >= frameCount) {
            mediaRecorder.stop();
            return;
        }

        // Clear canvas
        offscreenCtx.clearRect(0, 0, width, height);

        // Draw background: either color or image
        if (bgImageObj.src) {
            offscreenCtx.drawImage(bgImageObj, 0, 0, width, height);
        } else {
            offscreenCtx.fillStyle = bgColor;
            offscreenCtx.fillRect(0, 0, width, height);
        }

        // Draw the text
        offscreenCtx.font = '40px Arial';
        offscreenCtx.fillStyle = textColor;
        offscreenCtx.textAlign = 'center';
        offscreenCtx.textBaseline = 'middle';

        // Apply text animation
        applyAnimation(offscreenCtx, textAnimation, frame, frameCount);

        offscreenCtx.fillText(userText, width / 2, height / 2);

        // Draw the frame on the main canvas
        ctx.drawImage(offscreenCanvas, 0, 0);

        frame++;
        setTimeout(renderFrame, 1000 / fps);
    }
}
