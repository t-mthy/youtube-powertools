console.log('YouTube PowerTools loaded! (^_^)v');

let loopAnimationFrameId; // Variable to store requestAnimationFrame ID

// Function to control video playback
function controlVideoPlayback(command, startTime, endTime) {
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
      // videoElement.pause(); // Optional: pause video when disabling loop
      break;
  }
}

// Listens for message from React, performs actions based on the message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'GetYoutubeVideoId') {
    const videoId = window.location.search.split('v=')[1]?.split('&')[0];
    sendResponse({ videoId: videoId });
  } else if (request.message === 'ControlVideoPlayback') {
    controlVideoPlayback(request.command, request.startTime, request.endTime);
  } else if (request.message === 'GetCurrentVideoTime') {
    const videoElement = document.querySelector('video');
    if (videoElement) {
      sendResponse({ currentTime: videoElement.currentTime });
    } else {
      sendResponse({ currentTime: null });
    }
  }
});
