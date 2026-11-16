# Gym Sets for Amazfit GTS 4

A minimal Zepp OS 3.0 gym set counter for the Amazfit GTS 4.

## Behavior

- Adjustable 1–20 set target
- Tap **SET DONE** after each set
- 60-second default rest after each non-final set
- Change the default rest in 15-second steps from **SETTINGS**
- Rest uses an absolute deadline, so leaving and reopening the app does not pause it
- If the app is closed during rest, Zepp OS schedules the app to reopen at the deadline
- The display stays awake while the app page is open, including when the wrist is lowered
- Rest completion repeats Zepp's high-intensity strong-reminder pattern for two seconds, then explicitly stops the motor
- After the final set, choose **CHEST**, **BICEPS**, **TRICEPS**, **SHOULDERS**, **LEGS**, **BACK**, or **OTHER**
- Completed workouts are stored locally and shown by date and body part in **HISTORY**
- **HISTORY → EDIT** can remove entries or add a past workout using a selectable date and body part
- The **MUSIC** button opens the GTS 4's built-in phone-media controls, preserving the workout/rest deadline while you switch apps
- Reset button starts the exercise over without deleting history

## Accelerometer status

Current Zepp documentation lists the GTS 4 at API level 3.6, so an accelerometer-based experimental rep counter or graph is possible in a future API 3.x build. It is not included in this stability-focused release.

## Development

```bash
npm install
npm test
npm run build
```

The build output is written to `dist/` as a `.zab` package.

## Payment and license

Gym Sets uses KiezelPay product `961336733` for a **$2.99 one-time lifetime license**. There is no trial or subscription. The app fails closed until KiezelPay reports a valid license; workout history remains local to the watch and is not sent to the payment service.

The KiezelPay companion Side Service requires the Zepp mobile app and a phone connection during initial purchase, periodic license verification, or license restoration.

## Install and store submission

For private testing, use the Zepp developer workflow/QR preview with the Zepp app. For store submission, register the app in the Zepp developer console and ensure `app.appId` in `app.json` matches the assigned ID before rebuilding and uploading the ZAB.

Store materials are maintained under `store/`, including the privacy statement, listing copy, icon, and 360×360 screenshots. The published privacy-policy page is generated from `docs/privacy.html`.
