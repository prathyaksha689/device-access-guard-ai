/* Device Access Guard: local, browser-generated sound alerts + defense guide. */
(() => {
  const state = { muted: false, sensitivity: 2, audioContext: null };
  const $ = (id) => document.getElementById(id);

  function getAudioContext() {
    if (!state.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      state.audioContext = new AudioContext();
    }
    if (state.audioContext.state === 'suspended') state.audioContext.resume();
    return state.audioContext;
  }

  // Dual-tone alert: easier to notice than a single beep, still brief and non-alarming.
  function playAlert(kind = 'warning') {
    if (state.muted) return;
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime;
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    const volume = kind === 'test' ? 0.08 : 0.12;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(kind === 'test' ? 660 : 520, now);
    oscillator.frequency.setValueAtTime(kind === 'test' ? 880 : 700, now + 0.14);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.34);
  }

  function reportAccessAttempt(event = {}) {
    const source = event.source || 'A connected service';
    $('status').className = 'status status-alert';
    $('statusText').textContent = 'Action needed: please review an access attempt';
    $('warningTitle').textContent = 'Please check this access';
    $('warningMessage').textContent = event.detail || 'Someone may be trying to access your device or account. If you do not recognize it, follow the defense steps below.';
    $('warningSource').textContent = `Reported by: ${source}`;
    $('warning').hidden = false;
    $('defenseGuide').hidden = true;
    resetDefenseSteps();
    playAlert('warning');
  }

  function clearWarning(message) {
    $('warning').hidden = true;
    $('defenseGuide').hidden = true;
    $('status').className = 'status status-safe';
    $('statusText').textContent = message;
  }

  function resetDefenseSteps() {
    document.querySelectorAll('.step-checkbox').forEach(cb => cb.checked = false);
    updateProgressBar();
  }

  function updateProgressBar() {
    const total = document.querySelectorAll('.step-checkbox').length;
    const checked = document.querySelectorAll('.step-checkbox:checked').length;
    $('progressText').textContent = `${checked} / ${total}`;
    const percent = (checked / total) * 100;
    $('progressFill').style.width = percent + '%';
  }

  // Attach progress tracking to checkboxes
  document.querySelectorAll('.step-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateProgressBar);
  });

  window.completeDefense = function() {
    clearWarning('✓ Your account is now secured. Monitoring is ready.');
    $('status').className = 'status status-secure';
  };

  window.openLink = function(action) {
    const links = {
      'account-activity': 'https://myaccount.google.com/security?hl=en#signin',
      'password-change': 'https://myaccount.google.com/security?hl=en#password',
      'enable-2fa': 'https://myaccount.google.com/security?hl=en#security-key',
      'active-sessions': 'https://myaccount.google.com/security?hl=en#sessions',
      'privacy-settings': 'https://myaccount.google.com/privacy?hl=en',
      'contact-support': 'https://support.google.com/accounts/answer/3463844'
    };
    const url = links[action] || '#';
    if (url !== '#') {
      window.open(url, '_blank');
    }
  };

  $('defendButton').addEventListener('click', () => {
    $('warning').hidden = true;
    $('defenseGuide').hidden = false;
  });

  $('closeDefenseButton').addEventListener('click', () => {
    $('defenseGuide').hidden = true;
    $('warning').hidden = false;
  });

  $('testButton').addEventListener('click', () => playAlert('test'));
  $('simulateButton').addEventListener('click', () => reportAccessAttempt({
    source: 'Demo security monitor',
    detail: 'A sign-in was detected from a new device. If this was not you, follow the defense steps to secure your account.'
  }));
  $('muteButton').addEventListener('click', (event) => {
    state.muted = !state.muted;
    event.currentTarget.textContent = state.muted ? 'Unmute sound' : 'Mute sound';
    event.currentTarget.setAttribute('aria-pressed', String(state.muted));
    if (!state.muted) playAlert('test');
  });
  $('sensitivity').addEventListener('input', (event) => {
    state.sensitivity = Number(event.target.value);
    $('sensitivityValue').textContent = ['Low', 'Medium', 'High'][state.sensitivity - 1];
  });

  window.deviceGuard = { reportAccessAttempt };
})();
