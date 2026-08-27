# dots

A single-purpose, offline-first habit tracker PWA. No accounts, no backend, no
build step — all state lives in `localStorage` on the device.

- Tap a habit row to mark it done for today (tap again to undo)
- **EDIT** to add habits (name + one of six colors) or delete them
- Calendar shows a dot per habit per day; the legend below shows
  `days done / days in month` for the viewed month
- Light/dark follows the system theme
- Type: [iA Writer Mono S](https://github.com/iaolo/iA-Fonts) (SIL OFL,
  license bundled in `fonts/`); icons are Phosphor stroke glyphs, inlined

## Run locally

```bash
python3 -m http.server 8642
```

then open http://localhost:8642.

## Install on iPhone

PWAs need HTTPS (or localhost), so host the folder anywhere static —
GitHub Pages, Cloudflare Pages, Netlify — then on the phone:

1. Open the URL in Safari
2. Share → **Add to Home Screen**

Opened from the home screen it runs standalone, works fully offline, and its
`localStorage` is exempt from Safari's 7-day storage eviction (that cap only
applies to sites used in browser tabs).

## Notes

- Data schema: `localStorage["dots.v1"] = { habits: [{id, name, color}], log: { "YYYY-MM-DD": [habitId] } }`
- After changing any file, bump `CACHE` in `sw.js` so installed clients pick
  up the new version.
- App icons are generated: `python3 tools/make_icons.py`
