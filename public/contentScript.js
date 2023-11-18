console.log('YouTube PowerTools loaded! (^_^)v');

// Listens for message from React, extracts vid ID from URL, sends it back
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'GetYoutubeVideoId') {
    const videoId = window.location.search.split('v=')[1]?.split('&')[0];
    sendResponse({ videoId: videoId });
  }
});
