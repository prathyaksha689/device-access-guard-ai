/* Device Access Guard: AI-powered OTP and device security checks */
(() => {
  const state = { muted: false, audioContext: null, otpStore: {}, currentPhone: null };
  const $ = (id) => document.getElementById(id);
  const overlay = $('accessOverlay');

  function getAudioContext() {
    if (!state.audioContext) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      state.audioContext = new C();
    }
    if (state.audioContext.state === 'suspended') state.audioContext.resume();
    return state.audioContext;
  }

  function playAlert(kind = 'warning') {
    if (state.muted) return;
    const c = getAudioContext();
    if (!c) return;
    const start = c.currentTime, base = kind === 'test' ? 660 : 520;
    for (let i = 0; i < 4; i += 1) {
      const t = start + i, o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(base + (i % 2) * 160, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(kind === 'test' ? 0.08 : 0.12, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.58);
    }
  }

  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function sendOTP(phoneNumber) {
    const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
    const isValid = /^\+[1-9]\d{7,14}$/.test(cleanPhone);
    if (!isValid) {
      $('phoneError').textContent = 'Use valid international format: +1 555 1234567';
      return false;
    }
    $('phoneError').textContent = '';
    const otp = generateOTP();
    state.otpStore[cleanPhone] = { code: otp, time: Date.now(), attempts: 0, maxAttempts: 3 };
    state.currentPhone = cleanPhone;
    const masked = cleanPhone.slice(0, -4) + '****';
    $('otpSentMessage').textContent = `Verification code sent to ${masked}. It expires in 5 minutes.`;
    $('phoneStep').hidden = true;
    $('otpStep').hidden = false;
    console.log(`[DEMO] OTP sent to ${cleanPhone}: ${otp}`);
    return true;
  }

  function verifyOTP(otp) {
    if (!state.currentPhone) return false;
    const stored = state.otpStore[state.currentPhone];
    if (!stored) return false;
    const ageMs = Date.now() - stored.time;
    if (ageMs > 5 * 60 * 1000) {
      $('otpError').textContent = 'Code expired. Request a new one.';
      return false;
    }
    if (stored.attempts >= stored.maxAttempts) {
      $('otpError').textContent = 'Too many attempts. Try again later.';
      return false;
    }
    stored.attempts++;
    if (otp !== stored.code) {
      $('otpError').textContent = `Wrong code (${stored.maxAttempts - stored.attempts} attempts left).`;
      return false;
    }
    $('otpError').textContent = '';
    delete state.otpStore[state.currentPhone];
    return true;
  }

  function getDeviceSecurityInfo() {
    const checks = [];
    checks.push({ name: 'Browser Type', value: getBrowserInfo(), severity: 'info' });
    checks.push({ name: 'OS Platform', value: getOSInfo(), severity: 'info' });
    checks.push({ name: 'HTTPS', value: window.location.protocol === 'https:' ? '✓ Encrypted' : '⚠ Not encrypted', severity: window.location.protocol === 'https:' ? 'good' : 'warning' });
    checks.push({ name: 'JavaScript', value: 'Enabled', severity: 'good' });
    checks.push({ name: 'Cookies', value: navigator.cookieEnabled ? '✓ Enabled' : '⚠ Disabled', severity: 'good' });
    if (navigator.deviceMemory) checks.push({ name: 'Device Memory', value: `${navigator.deviceMemory} GB`, severity: 'info' });
    if (navigator.hardwareConcurrency) checks.push({ name: 'CPU Cores', value: navigator.hardwareConcurrency, severity: 'info' });
    if ('geolocation' in navigator) checks.push({ name: 'Geolocation', value: 'Available', severity: 'info' });
    checks.push({ name: 'WebGL', value: testWebGL() ? '✓ Supported' : '⚠ Not supported', severity: 'info' });
    checks.push({ name: 'Service Workers', value: 'serviceWorker' in navigator ? '✓ Supported' : '⚠ Not supported', severity: 'info' });
    return checks;
  }

  function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    return 'Other';
  }

  function getOSInfo() {
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'macOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';
    return 'Unknown';
  }

  function testWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function displaySecurityChecks() {
    const checks = getDeviceSecurityInfo();
    const html = checks.map(check => `
      <div class="check-item severity-${check.severity}">
        <span class="check-name">${check.name}</span>
        <span class="check-value">${check.value}</span>
      </div>
    `).join('');
    $('checksList').innerHTML = html;
  }

  function reportAccessAttempt(event = {}) {
    const message = event.detail || 'Unknown access attempt detected. Verify your identity to continue.';
    $('status').className = 'status status-alert';
    $('statusText').textContent = '⚠️ Access alert - verify your identity';
    $('warningMessage').textContent = message;
    $('warningSource').textContent = `Reported by: ${event.source || 'Security system'}`;
    $('warning').hidden = false;
    $('otpSection').hidden = true;
    $('defenseGuide').hidden = true;
    $('securityChecks').hidden = true;
    $('overlayMessage').textContent = message;
    overlay.hidden = false;
    playAlert();
  }

  function clearWarning(message) {
    $('warning').hidden = true;
    $('otpSection').hidden = true;
    $('defenseGuide').hidden = true;
    $('securityChecks').hidden = true;
    overlay.hidden = true;
    $('status').className = 'status status-safe';
    $('statusText').textContent = message;
  }

  function updateProgress() {
    const boxes = document.querySelectorAll('.defense-step input');
    const checked = document.querySelectorAll('.defense-step input:checked').length;
    $('progressText').textContent = `${checked} / ${boxes.length}`;
    $('progressFill').style.width = `${boxes.length ? checked / boxes.length * 100 : 0}%`;
  }

  // Event listeners
  document.querySelectorAll('.defense-step input').forEach((box) => box.addEventListener('change', updateProgress));

  $('testButton').addEventListener('click', () => playAlert('test'));
  $('simulateButton').addEventListener('click', () => reportAccessAttempt({ source: 'Demo security monitor', detail: 'A new login was detected from an unfamiliar device. Verify your identity.' }));
  $('defendButton').addEventListener('click', () => {
    $('warning').hidden = true;
    $('otpSection').hidden = false;
    $('phoneStep').hidden = false;
    $('otpStep').hidden = true;
  });
  $('closeDefenseButton').addEventListener('click', () => {
    $('defenseGuide').hidden = true;
    $('warning').hidden = false;
  });
  $('dismissButton').addEventListener('click', () => clearWarning('✓ Marked as familiar - monitoring ready'));
  $('completeButton').addEventListener('click', () => clearWarning('✓ Device secured - monitoring active'));
  $('overlayReviewButton').addEventListener('click', () => {
    overlay.hidden = true;
    $('warning').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('overlayCloseButton').addEventListener('click', () => { overlay.hidden = true; });
  $('muteButton').addEventListener('click', (e) => {
    state.muted = !state.muted;
    e.currentTarget.textContent = state.muted ? 'Unmute sound' : 'Mute sound';
    e.currentTarget.setAttribute('aria-pressed', String(state.muted));
    if (!state.muted) playAlert('test');
  });
  $('notifyButton').addEventListener('click', async () => {
    if (!('Notification' in window)) {
      $('notifyButton').textContent = 'Not supported';
      return;
    }
    const p = await Notification.requestPermission();
    $('notifyButton').textContent = p === 'granted' ? '✓ Notifications enabled' : '✗ Blocked';
  });
  $('sendOtpButton').addEventListener('click', () => {
    sendOTP($('phoneNumber').value.trim());
  });
  $('changePhoneButton').addEventListener('click', () => {
    $('phoneNumber').value = '';
    $('phoneStep').hidden = false;
    $('otpStep').hidden = true;
    $('otpCode').value = '';
  });
  $('otpForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const otp = $('otpCode').value.trim();
    if (!/^\d{6}$/.test(otp)) {
      $('otpError').textContent = 'Enter exactly 6 digits.';
      return;
    }
    if (verifyOTP(otp)) {
      $('otpResult').textContent = '✓ Identity verified! Showing device security checks.';
      $('otpSection').hidden = true;
      $('securityChecks').hidden = false;
      $('defenseGuide').hidden = false;
      displaySecurityChecks();
    }
  });
  $('refreshChecksButton').addEventListener('click', () => {
    displaySecurityChecks();
  });

  window.checkDeviceActivity = () => alert('View login history and connected devices in your account security settings.');
  window.changePassword = () => alert('Change your password to a strong, unique combination.');
  window.enable2FA = () => alert('Set up two-factor authentication via SMS, authenticator app, or security key.');
  window.disconnectSessions = () => alert('Log out all unrecognized devices from your account.');

  window.deviceGuard = { reportAccessAttempt };
})();
