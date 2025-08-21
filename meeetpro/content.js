(() => {
  const STATE = {
    enabled: false,
    enforceIntervalId: null,
    mutationObserver: null,
    currentStageEl: null,
    currentVideoEl: null,
    currentPeopleEl: null,
  };

  const STYLE_ID = 'meeetpro-style';
  const ROOT_ON_CLASS = 'meeetpro-on';
  const KEEP_CLASS = 'meeetpro-keep';
  const STAGE_CLASS = 'meeetpro-stage';
  const PEOPLE_CLASS = 'meeetpro-people';

  function injectStyleOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html.${ROOT_ON_CLASS} body :not(.${KEEP_CLASS}):not(.${KEEP_CLASS} *) { display: none !important; }
      html.${ROOT_ON_CLASS} video, html.${ROOT_ON_CLASS} canvas, html.${ROOT_ON_CLASS} img { border-radius: 0 !important; }
      html.${ROOT_ON_CLASS} .${STAGE_CLASS} { position: fixed !important; top: 0 !important; left: 0 !important; bottom: 0 !important; right: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; background: #000 !important; z-index: 1 !important; }
      html.${ROOT_ON_CLASS} .${PEOPLE_CLASS} { position: fixed !important; top: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 2 !important; }
    `;
    document.documentElement.appendChild(style);
  }

  function removeStyleIfAny() {
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  function isElementVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    return true;
  }

  function findLargestVideo() {
    const videos = Array.from(document.querySelectorAll('video'));
    let best = null;
    let bestArea = 0;
    for (const v of videos) {
      if (!isElementVisible(v)) continue;
      const r = v.getBoundingClientRect();
      const area = r.width * r.height;
      if (area > bestArea) {
        best = v;
        bestArea = area;
      }
    }
    return best;
  }

  function markKeepForChain(el) {
    let node = el;
    while (node && node !== document.body) {
      node.classList.add(KEEP_CLASS);
      node = node.parentElement;
    }
  }

  function clearKeepMarks() {
    for (const el of Array.from(document.querySelectorAll('.' + KEEP_CLASS))) {
      el.classList.remove(KEEP_CLASS);
      el.classList.remove(STAGE_CLASS);
      el.classList.remove(PEOPLE_CLASS);
      if (el === STATE.currentVideoEl) {
        el.style.width = '';
        el.style.height = '';
        el.style.maxWidth = '';
        el.style.maxHeight = '';
        el.style.objectFit = '';
      }
      if (el === STATE.currentPeopleEl || el === STATE.currentStageEl) {
        el.style.right = '';
        el.style.width = '';
        el.style.zIndex = '';
      }
    }
  }

  function sizeVideo1280x720(videoEl) {
    if (!videoEl) return;
    videoEl.style.width = '1280px';
    videoEl.style.height = '720px';
    videoEl.style.maxWidth = 'none';
    videoEl.style.maxHeight = 'none';
    videoEl.style.objectFit = 'contain';
  }

  function findPeoplePanel() {
    const candidates = [
      '[data-panel-id="people"]',
      '[aria-label="People"]',
      '[aria-label*="People"]',
      'div[role="region"][aria-label*="People"]',
      'div[role="tabpanel"][aria-label*="People"]'
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && isElementVisible(el)) return el;
    }
    return null;
  }

  function ensurePeoplePanelOpen() {
    let panel = findPeoplePanel();
    if (panel) return panel;

    const btnSelectors = [
      'button[aria-label*="People"]',
      'button[aria-label*="Show everyone"]',
      '[data-tooltip*="People"]',
      '[data-tooltip*="Everyone"]'
    ];
    for (const sel of btnSelectors) {
      const btn = document.querySelector(sel);
      if (btn) {
        btn.click();
        break;
      }
    }
    return findPeoplePanel();
  }

  function layoutStageAroundPeople(stageEl, peopleEl) {
    if (!stageEl) return;
    stageEl.classList.add(STAGE_CLASS);
    if (!peopleEl || !isElementVisible(peopleEl)) return;

    const rect = peopleEl.getBoundingClientRect();
    const panelWidth = Math.max(0, Math.floor(rect.width));
    stageEl.style.right = panelWidth ? `${panelWidth}px` : '0';
    peopleEl.classList.add(PEOPLE_CLASS);
    peopleEl.style.zIndex = '2';
  }

  function enforceOnce() {
    clearKeepMarks();

    const largestVideo = findLargestVideo();
    STATE.currentVideoEl = largestVideo;
    if (largestVideo) {
      markKeepForChain(largestVideo);
      sizeVideo1280x720(largestVideo);

      let stageEl = largestVideo;
      let prev = null;
      while (stageEl && stageEl.parentElement && stageEl.parentElement !== document.body) {
        prev = stageEl;
        stageEl = stageEl.parentElement;
      }
      STATE.currentStageEl = stageEl || largestVideo;
      STATE.currentStageEl.classList.add(KEEP_CLASS);
      STATE.currentStageEl.classList.add(STAGE_CLASS);
    }

    const peopleEl = ensurePeoplePanelOpen();
    if (peopleEl) {
      STATE.currentPeopleEl = peopleEl;
      markKeepForChain(peopleEl);
      peopleEl.classList.add(PEOPLE_CLASS);
    }

    layoutStageAroundPeople(STATE.currentStageEl, STATE.currentPeopleEl);
  }

  function startEnforcement() {
    if (STATE.enforceIntervalId) return;
    STATE.enforceIntervalId = setInterval(enforceOnce, 800);

    if (!STATE.mutationObserver) {
      STATE.mutationObserver = new MutationObserver(() => {
        if (STATE.enabled) {
          queueMicrotask(enforceOnce);
        }
      });
      STATE.mutationObserver.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }
  }

  function stopEnforcement() {
    if (STATE.enforceIntervalId) {
      clearInterval(STATE.enforceIntervalId);
      STATE.enforceIntervalId = null;
    }
    if (STATE.mutationObserver) {
      STATE.mutationObserver.disconnect();
      STATE.mutationObserver = null;
    }
  }

  function enable() {
    if (STATE.enabled) return;
    STATE.enabled = true;
    injectStyleOnce();
    // IMPORTANT: mark keep targets before hiding the rest
    enforceOnce();
    document.documentElement.classList.add(ROOT_ON_CLASS);
    startEnforcement();
    try { console.debug('[MeeetPRO] Enabled'); } catch (_) {}
  }

  function disable() {
    if (!STATE.enabled) return;
    STATE.enabled = false;
    stopEnforcement();
    document.documentElement.classList.remove(ROOT_ON_CLASS);
    clearKeepMarks();
    removeStyleIfAny();
    try { console.debug('[MeeetPRO] Disabled'); } catch (_) {}
  }

  function toggle() {
    if (STATE.enabled) disable(); else enable();
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.type !== 'MEEETPRO_TOGGLE') return;
    try {
      toggle();
      sendResponse && sendResponse({ ok: true, enabled: STATE.enabled });
    } catch (e) {
      sendResponse && sendResponse({ ok: false, error: String(e) });
    }
    return false;
  });

  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
      toggle();
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
})();