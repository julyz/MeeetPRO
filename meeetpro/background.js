// MeeetPRO background service worker (MV3)

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'MEEETPRO_TOGGLE' });
  } catch (err) {
    // Tab may not have content script (wrong site), ignore
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-meetpro') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'MEEETPRO_TOGGLE' });
  } catch (err) {
    // Ignore if not on Meet or content script not injected yet
  }
});