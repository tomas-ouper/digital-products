import { h, ICONS } from '../core/ui';
import { avatarSvg } from '../core/avatars';
import {
  activeProfile, addBonusMinutes, deleteProfile, getData, getProfiles, playedTodaySec, saveSettings, settings, streak,
  today, totalStars, updateProfile, type AgeGroup, type Profile,
} from '../core/state';
import { go, flushClock } from '../core/nav';
import { say } from '../core/voice';
import { sfx } from '../core/sound';
import { glyph, isCursive } from '../core/letters';
import { iconButton } from './common';
import { GAMES } from '../games/registry';

export function parentsScreen(root: HTMLElement) {
  root.className = 'screen center';
  const a = 4 + Math.floor(Math.random() * 6);
  const b = 3 + Math.floor(Math.random() * 7);
  let val = '';
  const show = h('input', { class: 'big', readonly: 'true', value: '', 'aria-label': 'Respuesta', style: { maxWidth: '220px' } }) as HTMLInputElement;
  const err = h('div', { class: 'err' });
  const press = (k: string) => {
    if (k === '⌫') val = val.slice(0, -1);
    else if (k === 'OK') {
      if (Number(val) === a + b) {
        sfx.good();
        return parentPanel(root);
      }
      sfx.bad();
      err.textContent = 'No es correcto. Intenta otra vez.';
      val = '';
    } else if (val.length < 3) val += k;
    show.value = val;
  };
  const back = () => go(activeProfile() ? 'hub' : 'profiles');
  root.append(
    h('div', { class: 'topbar' }, iconButton(ICONS.back, 'Volver', back)),
    h(
      'div',
      { class: 'card col', style: { maxWidth: '440px', width: '100%' } },
      h('h2', {}, 'Solo para adultos'),
      h('p', { class: 'sub' }, 'Resuelve la suma para entrar:'),
      h('div', { style: { fontSize: '44px', fontWeight: '700' } }, `${a} + ${b} = ?`),
      show,
      err,
      h('div', { class: 'keypad' }, ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => h('button', { onTap: () => press(k) }, k)))
    )
  );
  setTimeout(() => root.isConnected && say('padres'), 200);
}

function minutesLastDays(p: Profile, days: number) {
  const log = getData(p.id).playLog;
  let s = 0;
  const d = new Date();
  for (let i = 0; i < days; i++) {
    s += log[today(d)] || 0;
    d.setDate(d.getDate() - 1);
  }
  return Math.round(s / 60);
}

function parentPanel(root: HTMLElement) {
  flushClock();
  root.innerHTML = '';
  root.className = 'screen';
  const profiles = getProfiles();
  let sel: Profile | null = activeProfile() || profiles[0] || null;

  const body = h('div', { class: 'col maxw', style: { paddingBottom: '30px' } });
  const render = () => {
    body.innerHTML = '';
    // ---- Ajustes generales ----
    const limitLabel = h('div', { style: { fontSize: '24px', fontWeight: '600' } });
    const range = h('input', { type: 'range', min: '0', max: '60', step: '5', value: String(settings.dailyLimitMin) }) as HTMLInputElement;
    const updL = () => (limitLabel.textContent = settings.dailyLimitMin ? `${settings.dailyLimitMin} minutos por día` : 'Sin límite');
    range.addEventListener('input', () => {
      settings.dailyLimitMin = Number(range.value);
      saveSettings();
      updL();
    });
    updL();
    const toggle = (label: string, key: 'sound' | 'voice') => {
      const btn = h('button', { class: 'btn small ' + (settings[key] ? 'green' : 'ghost') }, `${label}: ${settings[key] ? 'sí' : 'no'}`);
      btn.addEventListener('click', () => {
        settings[key] = !settings[key];
        saveSettings();
        render();
      });
      return btn;
    };
    body.append(
      h('h1', {}, 'Panel de padres'),
      h(
        'div',
        { class: 'card parent-section' },
        h('h2', {}, 'Tiempo de juego diario'),
        limitLabel,
        range,
        h('p', { class: 'small-note' }, 'Cuando se termina el tiempo, aparece una "Misión del día" para hacer sin pantalla. El límite se cuenta por perfil.'),
        h('div', { class: 'row' }, toggle('Voz', 'voice'), toggle('Sonidos', 'sound'))
      )
    );
    body.append(
      h('section', { class: 'card parent-section', 'aria-labelledby': 'support-title' },
        h('h2', { id: 'support-title' }, 'Soporte y sugerencias'),
        h('p', { class: 'sub' }, '¿Tienes una duda, un problema con el juego o una idea para mejorarlo? Escríbele a Tomás por WhatsApp.'),
        h('a', {
          class: 'btn green support-link',
          href: 'https://wa.me/5493424221634?text=' + encodeURIComponent('Hola Tomás, te escribo por Montessori Play. Mi consulta o sugerencia es: '),
          target: '_blank', rel: 'noopener noreferrer',
        }, 'Hablar con Tomás por WhatsApp'),
        h('p', { class: 'small-note' }, '+54 9 342 422 1634 · Atención para madres, padres y adultos responsables.')
      )
    );
    if (!profiles.length) return;
    // ---- Selector de perfil ----
    body.append(
      h(
        'div',
        { class: 'row' },
        ...profiles.map((p) =>
          h(
            'button',
            {
              class: 'btn small ' + (sel?.id === p.id ? '' : 'ghost'),
              onTap: () => {
                sel = p;
                render();
              },
            },
            h('span', { html: avatarSvg(p.avatar, 40) }),
            p.name
          )
        )
      )
    );
    if (!sel) return;
    const p = sel;
    const d = getData(p.id);
    const letters = Object.keys(d.letters).filter((k) => d.letters[k] > 0).sort((x, y) => (isCursive(x) ? 1 : 0) - (isCursive(y) ? 1 : 0) || x.localeCompare(y));
    const perGame = GAMES.map((g) => {
      const st = d.stars[g.id] || [];
      const done = st.filter((x) => x > 0).length;
      return h('div', { class: 'stat' }, h('div', { class: 'v' }, `${done}/${g.levels.length}`), h('div', { class: 'l' }, g.name + ' (niveles)'));
    });
    const ageBtn = (a: AgeGroup) =>
      h(
        'button',
        {
          class: 'btn small ' + (p.age === a ? 'purple' : 'ghost'),
          onTap: () => {
            p.age = a;
            updateProfile(p);
            render();
          },
        },
        a + ' años'
      );
    body.append(
      h(
        'div',
        { class: 'card parent-section' },
        h('h2', {}, `Progreso de ${p.name}`),
        h(
          'div',
          { class: 'stat-grid' },
          h('div', { class: 'stat' }, h('div', { class: 'v' }, String(Math.round(playedTodaySec(p.id) / 60))), h('div', { class: 'l' }, 'minutos hoy')),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, String(minutesLastDays(p, 7))), h('div', { class: 'l' }, 'minutos en 7 días')),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, '🔥 ' + streak(p.id)), h('div', { class: 'l' }, 'días seguidos')),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, '⭐ ' + totalStars(p.id)), h('div', { class: 'l' }, 'estrellas')),
          ...perGame
        ),
        h('h2', {}, `Letras dominadas (${letters.length})`),
        letters.length
          ? h('div', { class: 'letters-done' }, ...letters.map((k) => h('span', { class: isCursive(k) ? 'cur' : '' }, glyph(k))))
          : h('p', { class: 'small-note' }, 'Todavía ninguna. Se marcan al trazar bien una letra en Snake Lecto o Trazo Ninja.'),
        h('h2', {}, 'Dificultad'),
        h('div', { class: 'row' }, ageBtn('3-5'), ageBtn('6-8')),
        h(
          'div',
          { class: 'row' },
          h(
            'button',
            {
              class: 'btn small yellow',
              onTap: () => {
                addBonusMinutes(p.id, 10);
                sfx.good();
                render();
              },
            },
            '+10 min solo hoy'
          ),
          h(
            'button',
            {
              class: 'btn small coral',
              onTap: () => {
                if (confirm(`¿Borrar el perfil de ${p.name} y todo su progreso?`)) {
                  deleteProfile(p.id);
                  go('parents');
                }
              },
            },
            'Borrar perfil'
          )
        )
      )
    );
  };
  render();
  root.append(
    h(
      'div',
      { class: 'topbar' },
      iconButton(ICONS.home, 'Salir', () => go(activeProfile() ? 'hub' : 'profiles')),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn ghost small', onTap: () => go('profiles') }, 'Cambiar de jugador')
    ),
    body
  );
}
