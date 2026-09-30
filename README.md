# Device Access Guard AI

A complete adaptive AI system that detects unauthorized device access, sends real OTPs, performs device security checks, and guides users through proven defense steps.

## Features

✅ **OTP Generation & Verification**
- AI generates and sends 6-digit codes to verified phone numbers
- International phone validation (E.164 format)
- 5-minute expiry, 3-attempt limit, rate limiting
- Demo backend simulates OTP delivery

✅ **Device Security Checks**
- Browser and OS detection
- HTTPS/encryption status
- WebGL, Service Worker, Geolocation support
- Device memory and CPU information
- Real-time security dashboard

✅ **Sound & Visual Alerts**
- 4-second localized sound alert
- High-priority overlay (stays on top of page content)
- Desktop notifications (with OS permission)

✅ **Adaptive Defense Steps**
- Review activity, change password, enable 2FA, disconnect sessions
- Progress tracking with visual feedback

✅ **Privacy-First**
- No passwords, keystrokes, or private data collected
- OTP stored only in-memory during demo
- All checks run locally (browser APIs only)

## Run Locally

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000`

## OTP Demo

1. Click **Simulate access attempt**
2. Click **Verify & Defend**
3. Enter any valid international phone (e.g., +15551234567)
4. Click **Send verification code**
5. Check console or documentation for the 6-digit OTP
6. Enter it and click **Verify code**
7. View device security checks

**Demo OTP:** Check browser console output (logged with `[DEMO]` prefix)

## Production Deployment

For real deployments:
- Replace demo OTP generation with trusted SMS/email provider (Twilio, AWS SNS, SendGrid)
- Implement server-side OTP storage with hashing
- Enforce strict rate limiting and abuse detection
- Add device fingerprinting for anomaly detection
- Integrate with your identity provider or IAM system
- Log all security events for compliance

## Security Notes

- Users should never share OTPs with anyone
- OTPs are single-use and time-limited
- This browser page cannot appear above other applications (use native apps for that)
- Always verify access through trusted services only
