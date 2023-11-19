console.log('YouTube PowerTools loaded! (^_^)v');

let loopAnimationFrameId; // Variable to store requestAnimationFrame ID

// Function to control video playback
function controlVideoPlayback(videoId, command, startTime, endTime) {
  const videoElement = document.querySelector('video');
  if (!videoElement) return;

  // Cancel any existing loop to prevent overlapping loops
  if (loopAnimationFrameId) {
    cancelAnimationFrame(loopAnimationFrameId);
    loopAnimationFrameId = null;
  }

  switch (command) {
    case 'startLoop':
      videoElement.currentTime = startTime;
      videoElement.play();
      const loop = () => {
        if (videoElement.currentTime >= endTime) {
          videoElement.currentTime = startTime;
        }
        loopAnimationFrameId = requestAnimationFrame(loop);
      };
      loop();
      break;
    case 'stopLoop':
      videoElement.pause();
      break;
  }
}

// Listens for message from React, extracts vid ID from URL, sends it back
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'GetYoutubeVideoId') {
    const videoId = window.location.search.split('v=')[1]?.split('&')[0];
    sendResponse({ videoId: videoId });
  } else if (request.message === 'ControlVideoPlayback') {
    controlVideoPlayback(
      request.videoId,
      request.command,
      request.startTime,
      request.endTime
    );
  }
});
