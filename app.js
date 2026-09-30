/* Device Access Guard: local alerts. The overlay is topmost within this browser tab. */
(() => {
  const state = { muted: false, audioContext: null, soundTimer: null };
  const $ = (id) => document.getElementById(id);
  const overlay = $('accessOverlay');

  function getAudioContext() {
    if (!state.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      state.audioContext = new AudioContext();
    }
    if (state.audioContext.state === 'suspended') state.audioContext.resume();
    return state.audioContext;
  }

  // Four short pulses spread across 4 seconds: noticeable, but not a continuous harsh tone.
  function playAlert(kind = 'warning') {
    if (state.muted) return;
    const context = getAudioContext();
    if (!context) return;
    const start = context.currentTime;
    const frequency = kind === 'test' ? 660 : 520;
    for (let i = 0; i < 4; i += 1) {
      const time = start + i;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency + (i % 2) * 160, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(kind === 'test' ? 0.08 : 0.12, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.58);
    }
  }

  function showDesktopNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Device Access Guard warning', { body: message, tag: 'device-access-warning', requireInteraction: true });
      notification.onclick = () => { window.focus(); notification.close(); };
    }
  }

  function showOverlay(message) {
    $('overlayMessage').textContent = message;
    overlay.hidden = false;
  }

  function reportAccessAttempt(event = {}) {
    const message = event.detail || 'Someone may be trying to access your device or account. If you do not recognize it, review the warning.';
    $('status').className = 'status status-alert';
    $('statusText').textContent = 'Action needed: please review an access attempt';
    $('warningMessage').textContent = message;
    $('warningSource').textContent = `Reported by: ${event.source || 'A connected service'}`;
    $('warning').hidden = false;
    $('defenseGuide').hidden = true;
    showOverlay(message);
    playAlert('warning');
    showDesktopNotification(message);
  }

  function clearWarning(message) {
    $('warning').hidden = true;
    $('defenseGuide').hidden = true;
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
  document.querySelectorAll('.defense-step input').forEach((box) => box.addEventListener('change', updateProgress));

  $('testButton').addEventListener('click', () => playAlert('test'));
  $('simulateButton').addEventListener('click', () => reportAccessAttempt({ source: 'Demo security monitor', detail: 'A sign-in was detected from a new device. If this was not you, follow the defense steps to secure your account.' }));
  $('defendButton').addEventListener('click', () => { $('warning').hidden = true; $('defenseGuide').hidden = false; });
  $('closeDefenseButton').addEventListener('click', () => { $('defenseGuide').hidden = true; $('warning').hidden = false; });
  $('dismissButton').addEventListener('click', () => clearWarning('Marked as familiar — monitoring is ready'));
  $('completeButton').addEventListener('click', () => clearWarning('Your account is secured. Monitoring is ready.'));
  $('overlayReviewButton').addEventListener('click', () => { overlay.hidden = true; $('warning').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('overlayCloseButton').addEventListener('click', () => { overlay.hidden = true; });
  $('muteButton').addEventListener('click', (event) => { state.muted = !state.muted; event.currentTarget.textContent = state.muted ? 'Unmute sound' : 'Mute sound'; event.currentTarget.setAttribute('aria-pressed', String(state.muted)); if (!state.muted) playAlert('test'); });
  $('notifyButton').addEventListener('click', async () => { if (!('Notification' in window)) return; const permission = await Notification.requestPermission(); $('notifyButton').textContent = permission === 'granted' ? 'Desktop notifications enabled' : 'Notifications blocked'; });

  window.deviceGuard = { reportAccessAttempt };
})();
