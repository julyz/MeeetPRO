// MeeetPRO background service worker (MV3)

async function toggleInTab(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'MEEETPRO_TOGGLE' });
    return;
  } catch (err) {
    // Likely no content script yet; try to inject programmatically and retry
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content.js']
    });
    await chrome.tabs.sendMessage(tabId, { type: 'MEEETPRO_TOGGLE' });
  } catch (err2) {
    // Give up silently; probably not a Meet tab
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  await toggleInTab(tab.id);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-meetpro') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  await toggleInTab(tab.id);
});