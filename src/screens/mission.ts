import { h } from '../core/ui';
import missionsEs from '../data/missions.json';
import missionsEn from '../data/en/missions.json';
import missionsFr from '../data/fr/missions.json';
import { activeProfile, getData, saveData, today } from '../core/state';
import { go } from '../core/nav';
import { sayText, say } from '../core/voice';
import { sfx } from '../core/sound';
import { iconButton, soundToggle } from './common';
import { ICONS } from '../core/ui';
import { pick, tr } from '../core/i18n';

type Mission = { id: string; icono: string; texto: string };
const LIST = pick(missionsEs, missionsEn, missionsFr) as Mission[];

/** Misión del día: estable por día y perfil. */
export function missionOfDay(seed: string): Mission {
  let hsh = 0;
  const s = today() + seed;
  for (let i = 0; i < s.length; i++) hsh = (hsh * 31 + s.charCodeAt(i)) >>> 0;
  return LIST[hsh % LIST.length];
}

export function missionScreen(root: HTMLElement) {
  const p = activeProfile();
  if (!p) return go('profiles');
  root.className = 'screen center';
  const m = missionOfDay(p.id);
  const d = getData(p.id);
  const done = d.missionsDone[today()] === m.id;
  const doneBtn = h(
    'button',
    {
      class: 'btn green',
      onTap: () => {
        d.missionsDone[today()] = m.id;
        saveData(p.id);
        sfx.win();
        say('mision_hecha');
        doneBtn.textContent = tr('¡Misión cumplida! ⭐', 'Mission complete! ⭐', 'Mission accomplie ! ⭐');
        (doneBtn as HTMLButtonElement).disabled = true;
      },
    },
    done ? tr('¡Misión cumplida! ⭐', 'Mission complete! ⭐', 'Mission accomplie ! ⭐') : tr('¡Lo hice!', 'I did it!', 'J’ai réussi !')
  ) as HTMLButtonElement;
  doneBtn.disabled = done;
  root.append(
    h('div', { class: 'topbar' }, h('div', { class: 'spacer' }), soundToggle(), iconButton(ICONS.lock, tr('Padres', 'Parents', 'Parents'), () => go('parents'))),
    h(
      'div',
      { class: 'card col', style: { maxWidth: '760px', width: '100%' } },
      h('h2', {}, tr('¡Se terminó el tiempo de pantalla de hoy!', "Today's screen time is over!", 'Le temps d’écran est fini pour aujourd’hui !')),
      h('p', { class: 'sub' }, tr('Tu misión del día, sin pantalla:', 'Your screen-free mission of the day:', 'Ta mission du jour, loin de l’écran :')),
      h('div', { class: 'mission-emoji' }, m.icono),
      h('div', { class: 'mission-text' }, m.texto),
      h('div', { class: 'row' }, iconButton(ICONS.speak, tr('Escuchar', 'Listen', 'Écouter'), () => sayText(m.texto)), doneBtn),
      h('p', { class: 'small-note' }, tr('Mañana hay más tiempo de juego. Mamá o papá pueden dar minutos extra en el panel de padres (candado).', 'More play time tomorrow. Mom or Dad can add extra minutes in the parent panel (lock).', 'Tu pourras rejouer demain. Papa ou maman peut ajouter des minutes dans l’espace parents (cadenas).')),
      h('button', { class: 'btn ghost small', onTap: () => go('profiles') }, tr('Cambiar de jugador', 'Switch player', 'Changer de joueur'))
    )
  );
  setTimeout(async () => {
    if (!root.isConnected) return;
    await say('tiempo_terminado');
    if (root.isConnected) sayText(m.texto);
  }, 300);
}
