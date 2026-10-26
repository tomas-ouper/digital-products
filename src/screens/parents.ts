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
import { tr } from '../core/i18n';
import { ageLabel } from './profiles';

export function parentsScreen(root: HTMLElement) {
  root.className = 'screen center';
  const a = 4 + Math.floor(Math.random() * 6);
  const b = 3 + Math.floor(Math.random() * 7);
  let val = '';
  const show = h('input', { class: 'big', readonly: 'true', value: '', 'aria-label': tr('Respuesta', 'Answer'), style: { maxWidth: '220px' } }) as HTMLInputElement;
  const err = h('div', { class: 'err' });
  const press = (k: string) => {
    if (k === '⌫') val = val.slice(0, -1);
    else if (k === 'OK') {
      if (Number(val) === a + b) {
        sfx.good();
        return parentPanel(root);
      }
      sfx.bad();
      err.textContent = tr('No es correcto. Intenta otra vez.', "That's not right. Try again.");
      val = '';
    } else if (val.length < 3) val += k;
    show.value = val;
  };
  const back = () => go(activeProfile() ? 'hub' : 'profiles');
  root.append(
    h('div', { class: 'topbar' }, iconButton(ICONS.back, tr('Volver', 'Back'), back)),
    h(
      'div',
      { class: 'card col', style: { maxWidth: '440px', width: '100%' } },
      h('h2', {}, tr('Solo para adultos', 'Grown-ups only')),
      h('p', { class: 'sub' }, tr('Resuelve la suma para entrar:', 'Solve the sum to enter:')),
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
    const updL = () => (limitLabel.textContent = settings.dailyLimitMin ? tr(`${settings.dailyLimitMin} minutos por día`, `${settings.dailyLimitMin} minutes per day`) : tr('Sin límite', 'No limit'));
    range.addEventListener('input', () => {
      settings.dailyLimitMin = Number(range.value);
      saveSettings();
      updL();
    });
    updL();
    const toggle = (label: string, key: 'sound' | 'voice') => {
      const btn = h('button', { class: 'btn small ' + (settings[key] ? 'green' : 'ghost') }, `${label}: ${settings[key] ? tr('sí', 'on') : tr('no', 'off')}`);
      btn.addEventListener('click', () => {
        settings[key] = !settings[key];
        saveSettings();
        render();
      });
      return btn;
    };
    body.append(
      h('h1', {}, tr('Panel de padres', 'Parent panel')),
      h(
        'div',
        { class: 'card parent-section' },
        h('h2', {}, tr('Tiempo de juego diario', 'Daily play time')),
        limitLabel,
        range,
        h('p', { class: 'small-note' }, tr('Cuando se termina el tiempo, aparece una "Misión del día" para hacer sin pantalla. El límite se cuenta por perfil.', 'When time is up, a screen-free "Mission of the day" appears. The limit is counted per profile.')),
        h('div', { class: 'row' }, toggle(tr('Voz', 'Voice'), 'voice'), toggle(tr('Sonidos', 'Sounds'), 'sound'))
      )
    );
    body.append(
      h('section', { class: 'card parent-section', 'aria-labelledby': 'support-title' },
        h('h2', { id: 'support-title' }, tr('Soporte y sugerencias', 'Support and suggestions')),
        h('p', { class: 'sub' }, tr('¿Tienes una duda, un problema con el juego o una idea para mejorarlo? Escríbele a Tomás por WhatsApp.', 'Have a question, a problem with the game or an idea to make it better? Message Tomás on WhatsApp.')),
        h('a', {
          class: 'btn green support-link',
          href: 'https://wa.me/5493424221634?text=' + encodeURIComponent(tr('Hola Tomás, te escribo por Montessori Play. Mi consulta o sugerencia es: ', "Hi Tomás, I'm writing about Montessori Play. My question or suggestion is: ")),
          target: '_blank', rel: 'noopener noreferrer',
        }, tr('Hablar con Tomás por WhatsApp', 'Chat with Tomás on WhatsApp')),
        h('p', { class: 'small-note' }, tr('+54 9 342 422 1634 · Atención para madres, padres y adultos responsables.', '+54 9 342 422 1634 · Support for parents and caregivers.'))
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
      return h('div', { class: 'stat' }, h('div', { class: 'v' }, `${done}/${g.levels.length}`), h('div', { class: 'l' }, g.name + tr(' (niveles)', ' (levels)')));
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
        ageLabel(a)
      );
    body.append(
      h(
        'div',
        { class: 'card parent-section' },
        h('h2', {}, tr(`Progreso de ${p.name}`, `${p.name}'s progress`)),
        h(
          'div',
          { class: 'stat-grid' },
          h('div', { class: 'stat' }, h('div', { class: 'v' }, String(Math.round(playedTodaySec(p.id) / 60))), h('div', { class: 'l' }, tr('minutos hoy', 'minutes today'))),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, String(minutesLastDays(p, 7))), h('div', { class: 'l' }, tr('minutos en 7 días', 'minutes in 7 days'))),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, '🔥 ' + streak(p.id)), h('div', { class: 'l' }, tr('días seguidos', 'days in a row'))),
          h('div', { class: 'stat' }, h('div', { class: 'v' }, '⭐ ' + totalStars(p.id)), h('div', { class: 'l' }, tr('estrellas', 'stars'))),
          ...perGame
        ),
        h('h2', {}, tr(`Letras dominadas (${letters.length})`, `Letters mastered (${letters.length})`)),
        letters.length
          ? h('div', { class: 'letters-done' }, ...letters.map((k) => h('span', { class: isCursive(k) ? 'cur' : '' }, glyph(k))))
          : h('p', { class: 'small-note' }, tr('Todavía ninguna. Se marcan al trazar bien una letra en Snake Lecto o Trazo Ninja.', 'None yet. A letter is marked when it is traced well in Letter Snake or Trace Ninja.')),
        h('h2', {}, tr('Dificultad', 'Difficulty')),
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
            tr('+10 min solo hoy', '+10 min today only')
          ),
          h(
            'button',
            {
              class: 'btn small coral',
              onTap: () => {
                if (confirm(tr(`¿Borrar el perfil de ${p.name} y todo su progreso?`, `Delete ${p.name}'s profile and all their progress?`))) {
                  deleteProfile(p.id);
                  go('parents');
                }
              },
            },
            tr('Borrar perfil', 'Delete profile')
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
      iconButton(ICONS.home, tr('Salir', 'Exit'), () => go(activeProfile() ? 'hub' : 'profiles')),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn ghost small', onTap: () => go('profiles') }, tr('Cambiar de jugador', 'Switch player'))
    ),
    body
  );
}
