/* Device Access Guard: local alerts plus safe phone/OTP format checks. */
(() => {
  const state = { muted: false, audioContext: null };
  const $ = (id) => document.getElementById(id);
  const overlay = $('accessOverlay');
  function getAudioContext() { if (!state.audioContext) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; state.audioContext = new C(); } if (state.audioContext.state === 'suspended') state.audioContext.resume(); return state.audioContext; }
  function playAlert(kind = 'warning') { if (state.muted) return; const c = getAudioContext(); if (!c) return; const start = c.currentTime, base = kind === 'test' ? 660 : 520; for (let i = 0; i < 4; i += 1) { const t = start + i, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(base + (i % 2) * 160, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(kind === 'test' ? 0.08 : 0.12, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.58); } }
  function notify(message) { if ('Notification' in window && Notification.permission === 'granted') { const n = new Notification('Device Access Guard warning', { body: message, tag: 'device-access-warning', requireInteraction: true }); n.onclick = () => { window.focus(); n.close(); }; } }
  function reportAccessAttempt(event = {}) { const message = event.detail || 'Someone may be trying to access your device or account. Review the warning if you do not recognize it.'; $('status').className = 'status status-alert'; $('statusText').textContent = 'Action needed: please review an access attempt'; $('warningMessage').textContent = message; $('warningSource').textContent = `Reported by: ${event.source || 'A connected service'}`; $('warning').hidden = false; $('defenseGuide').hidden = true; $('overlayMessage').textContent = message; overlay.hidden = false; playAlert(); notify(message); }
  function clearWarning(message) { $('warning').hidden = true; $('defenseGuide').hidden = true; overlay.hidden = true; $('status').className = 'status status-safe'; $('statusText').textContent = message; }
  function updateProgress() { const boxes = document.querySelectorAll('.defense-step input'), checked = document.querySelectorAll('.defense-step input:checked').length; $('progressText').textContent = `${checked} / ${boxes.length}`; $('progressFill').style.width = `${boxes.length ? checked / boxes.length * 100 : 0}%`; }
  document.querySelectorAll('.defense-step input').forEach((box) => box.addEventListener('change', updateProgress));
  $('testButton').addEventListener('click', () => playAlert('test'));
  $('simulateButton').addEventListener('click', () => reportAccessAttempt({ source: 'Demo security monitor', detail: 'A sign-in was detected from a new device. If this was not you, follow the defense steps to secure your account.' }));
  $('defendButton').addEventListener('click', () => { $('warning').hidden = true; $('defenseGuide').hidden = false; });
  $('closeDefenseButton').addEventListener('click', () => { $('defenseGuide').hidden = true; $('warning').hidden = false; });
  $('dismissButton').addEventListener('click', () => clearWarning('Marked as familiar — monitoring is ready'));
  $('completeButton').addEventListener('click', () => clearWarning('Your account is secured. Monitoring is ready.'));
  $('overlayReviewButton').addEventListener('click', () => { overlay.hidden = true; $('warning').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('overlayCloseButton').addEventListener('click', () => { overlay.hidden = true; });
  $('muteButton').addEventListener('click', (e) => { state.muted = !state.muted; e.currentTarget.textContent = state.muted ? 'Unmute sound' : 'Mute sound'; e.currentTarget.setAttribute('aria-pressed', String(state.muted)); if (!state.muted) playAlert('test'); });
  $('notifyButton').addEventListener('click', async () => { if (!('Notification' in window)) { $('notifyButton').textContent = 'Not supported by this browser'; return; } const permission = await Notification.requestPermission(); $('notifyButton').textContent = permission === 'granted' ? 'Desktop notifications enabled' : 'Notifications blocked'; });
  $('verificationForm').addEventListener('submit', (e) => { e.preventDefault(); const phone = $('phoneNumber').value.trim(), otp = $('otpCode').value.trim(); const phoneOk = /^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s()-]/g, '')), otpOk = /^\d{6}$/.test(otp); $('phoneError').textContent = phoneOk ? '' : 'Use a valid international number, such as +15551234567.'; $('otpError').textContent = otpOk ? '' : 'Enter exactly six digits.'; $('verificationResult').textContent = phoneOk && otpOk ? 'Format looks correct. This demo did not send or verify the code. Use only your trusted provider to complete verification.' : ''; });
  window.deviceGuard = { reportAccessAttempt };
})();
