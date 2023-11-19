// Open new window for extension
chrome.action.onClicked.addListener((tab) => {
  const tabId = tab.id; // Get current tab ID

  chrome.windows.create({
    url: chrome.runtime.getURL(`index.html?tabId=${tabId}`), // Pass tab ID as query param
    type: 'popup',
    width: 440,
    height: 600,
  });
});
