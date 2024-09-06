function generateVideo() {
  const userText = document.getElementById('userText').value;
  const duration = parseInt(document.getElementById('duration').value, 10);
  const canvas = document.getElementById('videoCanvas');
  const ctx = canvas.getContext('2d');
  const loadingOverlay = document.getElementById('loadingOverlay');

  if (!userText || isNaN(duration) || duration <= 0) {
      alert('Please enter valid text and duration.');
      return;
  }

  loadingOverlay.style.display = 'flex'; // Show loading overlay

  const width = canvas.width;
  const height = canvas.height;
  const fps = 50;
  const frameCount = duration * fps;

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
      downloadLink.href = url;
      downloadLink.download = 'animated-text-video.webm';
      downloadLink.style.display = 'block';
      downloadLink.textContent = 'Download Video';
      loadingOverlay.style.display = 'none'; // Hide loading overlay
  };

  mediaRecorder.start();

  let frame = 0;
  function renderFrame() {
      if (frame >= frameCount) {
          mediaRecorder.stop();
          return;
      }

      // Clear canvas
      offscreenCtx.clearRect(0, 0, width, height);

      // Draw the text
      offscreenCtx.font = '40px Arial';
      offscreenCtx.fillStyle = 'white';
      offscreenCtx.textAlign = 'center';
      offscreenCtx.textBaseline = 'middle';
      offscreenCtx.fillText(userText, width / 2, height / 2);

      // Draw the frame on the main canvas
      ctx.drawImage(offscreenCanvas, 0, 0);

      frame++;
      setTimeout(renderFrame, 1000 / fps);
  }

  renderFrame();
}
