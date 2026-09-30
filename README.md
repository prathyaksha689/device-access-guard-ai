# Device Access Guard AI

This browser demo detects reported access events, shows a warning overlay above every element in the current browser tab, and plays a four-second alert made locally with the Web Audio API.

## Important platform limitation

A normal web page **cannot forcibly appear above other applications** or bypass the operating system. The in-page overlay is always above this page's content. For alerts while another app or browser tab is active, click **Enable desktop notifications** and allow notifications in the browser and operating system. Whether those notifications appear on top of other apps is controlled by the OS notification settings.

For a true always-on-top alert, package this UI as a trusted native desktop/mobile application and request the platform's notification or overlay permission explicitly. Never use an overlay to imitate system dialogs or collect passwords.

## Sound

The warning sound contains four gentle pulses scheduled one second apart, lasting about four seconds total. Browsers require a user interaction before audio can play, so use **Play 4-second test alert** once. The user can mute it at any time.

## Run

```bash
python3 -m http.server 8000
```

Visit <http://localhost:8000>.

## Integration

```js
window.deviceGuard.reportAccessAttempt({
  source: 'New browser session',
  detail: 'A sign-in was detected from a device you do not recognize.'
});
```

The demo does not read passwords, keystrokes, messages, or private files. Connect it only to trusted security signals.
