
const SOUND_URLS = {
  dice: "https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3",
  move: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
  snake: "https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3",
  ladder: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  win: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
  notification: "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3",
};

class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      Object.entries(SOUND_URLS).forEach(([key, url]) => {
        this.sounds[key] = new Audio(url);
        this.sounds[key].preload = "auto";
      });
    }
  }

  play(name: keyof typeof SOUND_URLS) {
    if (!this.enabled || !this.sounds[name]) return;
    
    // Clone to allow overlapping sounds
    const sound = this.sounds[name].cloneNode() as HTMLAudioElement;
    sound.play().catch(() => {
      // Ignore errors (e.g. user hasn't interacted yet)
    });
  }

  toggle(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundManager = new SoundManager();
