# MeeetPRO (Chrome Extension)

MeeetPRO toggles a distraction-free spotlight view in Google Meet:
- Hides Meet UI chrome while keeping the pinned (spotlight) video visible
- Keeps the People panel accessible so you can pin/unpin participants
- Forces square corners and sizes the main video to 1280x720

## Install (Unpacked)
1. Build not required. Open Chrome and go to `chrome://extensions`.
2. Toggle "Developer mode" (top-right).
3. Click "Load unpacked" and select this folder (`meeetpro`).

## Usage
- Open a Google Meet at `https://meet.google.com/*`.
- Click the MeeetPRO toolbar icon to toggle on/off.
- Or use the shortcut Alt+Shift+M to toggle.

## Notes
- The content script keeps the largest visible `<video>` as the spotlight target and tries to keep the People panel visible. If the panel is closed, MeeetPRO attempts to open it.
- DOM in Meet changes frequently; the extension uses robust fallbacks and a MutationObserver to re-apply layout.
- While enabled, the stage centers the video on a black backdrop. The People panel remains on the right when present.

## Privacy
- No network access. No data leaves your browser.