# AI Tier Maker

Production-ready drag-and-drop tier lists for AI models, coding agents, and creative tools.

## Features

- Presets for models, coding tools, image, video/audio, and local AI
- Drag, keyboard, or tap-to-place ranking
- Custom items, editable tier labels and colors
- Shareable URL + Open Graph preview
- PNG download and clipboard copy
- Optional [Logo.dev](https://logo.dev) key for brand logos

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm run build
```

Set `NEXT_PUBLIC_SITE_URL` in production so Open Graph URLs resolve correctly.

## Keyboard

- `/` focus filter
- `Esc` deselect / close dialogs
- Arrow keys move a focused tile (dnd-kit keyboard sensor)
