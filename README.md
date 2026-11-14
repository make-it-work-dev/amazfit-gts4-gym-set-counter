# Gym Sets for Amazfit GTS 4

A minimal Zepp OS 2.0 gym set counter for the Amazfit GTS 4.

## Behavior

- Four-set target
- Tap **SET DONE** after each set
- 90-second rest starts after sets 1–3
- Adjust an active rest by ±15 seconds
- Vibration when a set is logged and a stronger reminder when rest ends
- Reset button starts the exercise over

## Development

```bash
npm install
npm test
npm run build
```

The build output is written to `dist/` as a `.zab` package.

## Install and store submission

For private testing, use the Zepp developer workflow/QR preview with the Zepp app. For store submission, first register the app in the Zepp developer console and replace `app.appId` in `app.json` with the assigned ID before rebuilding and uploading the ZAB.
