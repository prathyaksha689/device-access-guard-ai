# Device Access Guard AI

The app now includes safe phone-number and one-time-password checks.

- Phone numbers are normalized and checked for international format (E.164-style).
- OTP input is limited to exactly six digits and supports password-manager/autofill APIs.
- The demo validates format **locally only**. It never stores, sends, logs, or guesses OTPs.
- A real deployment must verify OTPs server-side through a trusted provider, with short expiry, one-time use, rate limiting, abuse monitoring, and replay protection.
- Never ask users to reveal an OTP to support staff, another person, or this app. If a code was not requested by the user, they should not enter it.

Run locally:

```bash
python3 -m http.server 8000
```

A browser page can place an overlay above its own content and request desktop notifications, but it cannot forcibly appear above other applications. OS or native-app notification permissions are required for that behavior.
