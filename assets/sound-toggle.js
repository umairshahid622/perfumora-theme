/**
 * Perfumora Sound Toggle Component
 * Manages audio state (persisted in localStorage: perfumora_sound_muted)
 * Animates waveform equalizer bars and exposes window.PerfumoraAudio
 */
class SoundToggle extends HTMLElement {
  static STORAGE_KEY = 'perfumora_sound_muted';

  connectedCallback() {
    this.button = this.querySelector('button');
    if (!this.button) return;

    this.mistUrl = this.dataset.mistUrl || '';
    this.clickUrl = this.dataset.clickUrl || '';

    // Initialize state from localStorage (defaults to false / unmuted)
    this.isMuted = localStorage.getItem(SoundToggle.STORAGE_KEY) === 'true';
    this.updateState();

    this.button.addEventListener('click', this.onToggle.bind(this));
    window.addEventListener('perfumora:audio-play', this.onAudioPlay.bind(this));

    // Register global bridge
    window.PerfumoraAudio = {
      isMuted: () => this.isMuted,
      playMist: () => this.playMist(),
      playClick: () => this.playClick(),
    };
  }

  disconnectedCallback() {
    this.button?.removeEventListener('click', this.onToggle);
    window.removeEventListener('perfumora:audio-play', this.onAudioPlay);
  }

  onToggle() {
    this.isMuted = !this.isMuted;
    localStorage.setItem(SoundToggle.STORAGE_KEY, String(this.isMuted));
    this.updateState();

    if (!this.isMuted) {
      this.playClick();
    }

    window.dispatchEvent(
      new CustomEvent('perfumora:sound-toggle', {
        detail: { isMuted: this.isMuted },
        bubbles: true,
      })
    );
  }

  updateState() {
    this.dataset.muted = String(this.isMuted);
    this.button.setAttribute('aria-pressed', String(!this.isMuted));
    this.button.setAttribute(
      'aria-label',
      this.isMuted ? 'Unmute interaction sounds' : 'Mute interaction sounds'
    );
  }

  onAudioPlay() {
    if (this.isMuted) return;
    this.classList.add('is-playing');
    setTimeout(() => {
      this.classList.remove('is-playing');
    }, 400);
  }

  playClick() {
    if (this.isMuted || !this.clickUrl) return;
    window.dispatchEvent(new CustomEvent('perfumora:audio-play'));
    try {
      const audio = new Audio(this.clickUrl);
      audio.volume = 0.35;
      audio.play().catch(() => {});
    } catch (_) {}
  }

  playMist() {
    if (this.isMuted || !this.mistUrl) return;
    window.dispatchEvent(new CustomEvent('perfumora:audio-play'));
    try {
      const audio = new Audio(this.mistUrl);
      audio.volume = 0.6;
      audio.play().catch(() => {});
    } catch (_) {}
  }
}

if (!customElements.get('sound-toggle')) {
  customElements.define('sound-toggle', SoundToggle);
}

