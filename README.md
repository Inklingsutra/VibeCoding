# Audio Visual Engine

Audio Visual Engine is a small browser-based playground for audio-reactive motion graphics. It uses the Web Audio API to analyze a playing media element and feeds those frequency bands into a canvas particle renderer.

## Current Features

- Sample-track playback through the built-in audio player
- Local audio upload for testing the visualization against your own files
- Real-time frequency band analysis for bass, low-mid, mid, and high ranges
- Canvas-based particle field with shockwave reactions on kick peaks
- Live controls for sensitivity, flow, and particle density response
- Responsive overlay UI for desktop and mobile screens

## Tech Stack

- React 19
- TypeScript
- Vite
- Web Audio API
- Canvas 2D

## Local Development

```bash
npm install
npm run dev
```

Open the local Vite URL, press play in the control panel, and the visualization will start sampling from `public/sample.wav`. You can also upload a local audio file from the playback section and analyze that instead.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Project Structure

```text
src/
  engine/        Audio analysis lifecycle
  ui/            Playback and control surface
  visual/        Canvas renderer and particles
  types/         Shared visualization contracts
```

## Notes

- Audio initialization is lazy and starts on user playback to align with browser autoplay policies.
- The default experience starts from a bundled sample, but the UI also supports local audio upload for quick experimentation.

## Recommended Next Steps

- Add microphone input as an alternate live source
- Split renderer behaviors into selectable visual modes
- Add focused tests around audio band calculation and playback lifecycle
