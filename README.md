# Device Access Guard AI

A small, adaptable browser demo that presents clear warnings and uses a non-invasive sound alert when a possible unauthorized access attempt is detected.

## Features

- Clear, friendly warning messages instead of technical jargon.
- Web Audio API alert tones generated locally; no audio file or upload is required.
- Test-alert button so users can confirm their sound level.
- Mute/unmute control and adjustable alert sensitivity.
- Demo event simulator showing how an integration can report access attempts.
- **Guided defense actions** to help users respond immediately.
- Respects browser autoplay rules: the user must interact with the page before sound can play.

> **Important:** This demo does not inspect devices or detect intrusions by itself. Connect it to trusted platform signals such as a login event, failed unlock, new device session, or OS security notification. Do not collect passwords, keystrokes, or private content.

## Run it

Open `index.html` in a modern browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Integration example

```js
window.deviceGuard.reportAccessAttempt({
  source: 'New browser session',
  detail: 'A sign-in was detected from a device you do not recognize.'
});
```

The alert system is intentionally conservative: it informs the user and lets them decide what to do. It does not claim that an attempt is definitely malicious.

## Defense Actions

When an access attempt is detected, the system guides the user through immediate security steps:

1. **Review Recent Activity** – Check login history and connected devices.
2. **Change Password** – Secure your account with a strong, unique password.
3. **Enable 2FA** – Add an extra layer of protection.
4. **Disconnect Sessions** – Log out unauthorized devices.
5. **Check Privacy Settings** – Review who has access to your data.
6. **Contact Support** – Reach out if you need help.
