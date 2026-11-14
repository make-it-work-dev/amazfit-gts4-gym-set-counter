# Gym Sets for Amazfit GTS 4

A minimal Zepp OS 2.0 gym set counter for the Amazfit GTS 4.

## Behavior

- Four-set target
- Tap **SET DONE** after each set
- 60-second default rest after sets 1–3
- Change the default rest in 15-second steps from **SETTINGS**
- Rest uses an absolute deadline, so leaving and reopening the app does not pause it
- If the app is closed during rest, Zepp OS schedules the app to reopen at the deadline
- The display stays awake while the app page is open
- Vibration when a set is logged and a stronger reminder when rest ends
- Reset button starts the exercise over

## GTS 4 sensor limitation

The GTS 4 target uses Zepp OS API level 2.0. The official accelerometer API begins at API level 3.0, so accelerometer rep counting and movement graphs are not included in this build.

## Development

```bash
npm install
npm test
npm run build
```

The build output is written to `dist/` as a `.zab` package.

## Install and store submission

For private testing, use the Zepp developer workflow/QR preview with the Zepp app. For store submission, first register the app in the Zepp developer console and replace `app.appId` in `app.json` with the assigned ID before rebuilding and uploading the ZAB.
