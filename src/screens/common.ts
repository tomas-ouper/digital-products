import { h, ICONS } from '../core/ui';
import { settings, saveSettings } from '../core/state';
import { stopVoice } from '../core/voice';

/** Botón de sonido on/off (apaga efectos y voz). */
export function soundToggle(): HTMLButtonElement {
  const b = h('button', { class: 'icon-btn', 'aria-label': 'Sonido' }) as HTMLButtonElement;
  const draw = () => (b.innerHTML = settings.sound || settings.voice ? ICONS.soundOn : ICONS.soundOff);
  b.addEventListener('click', () => {
    const on = !(settings.sound || settings.voice);
    settings.sound = on;
    settings.voice = on;
    if (!on) stopVoice();
    saveSettings();
    draw();
  });
  draw();
  return b;
}

export function iconButton(icon: string, label: string, onTap: () => void) {
  return h('button', { class: 'icon-btn', 'aria-label': label, html: icon, onTap });
}
