import { h } from '../core/ui';
import { avatarSvg, AVATARS } from '../core/avatars';
import { addProfile, canAddProfile, getProfiles, settings, saveSettings, type AgeGroup } from '../core/state';
import { go } from '../core/nav';
import { say } from '../core/voice';
import { sfx } from '../core/sound';

export function profilesScreen(root: HTMLElement) {
  root.className = 'screen center';
  const list = getProfiles();
  if (list.length === 0) return go('newProfile');
  root.append(
    h('h1', {}, '¿Quién va a jugar?'),
    h(
      'div',
      { class: 'profiles' },
      ...list.map((p) =>
        h(
          'button',
          {
            class: 'profile-tile',
            onTap: () => {
              settings.activeProfile = p.id;
              saveSettings();
              go('hub');
            },
          },
          h('span', { html: avatarSvg(p.avatar, 110) }),
          h('span', { class: 'name' }, p.name),
          h('span', { class: 'meta' }, p.age + ' años')
        )
      ),
      canAddProfile() ? h('button', { class: 'profile-tile add', onTap: () => go('newProfile') }, h('span', { style: { fontSize: '56px' } }, '+'), h('span', { class: 'meta' }, 'Nuevo perfil')) : null
    ),
    h('button', { class: 'btn ghost small', onTap: () => go('device') }, '¿Desde dónde juegas?')
  );
  setTimeout(() => root.isConnected && say('quien_juega'), 300);
}

export function newProfileScreen(root: HTMLElement) {
  root.className = 'screen';
  let avatar = 0;
  let age: AgeGroup | null = null;
  const name = h('input', { class: 'big', type: 'text', maxlength: '12', placeholder: 'Nombre', autocomplete: 'off', 'aria-label': 'Nombre' });
  const err = h('div', { class: 'err' });
  const avWrap = h('div', { class: 'avatar-pick' });
  const drawAv = () => {
    avWrap.innerHTML = '';
    AVATARS.forEach((_, i) =>
      avWrap.append(
        h(
          'button',
          {
            class: i === avatar ? 'sel' : '',
            'aria-label': AVATARS[i].name,
            onTap: () => {
              avatar = i;
              drawAv();
            },
          },
          h('span', { html: avatarSvg(i, 84) })
        )
      )
    );
  };
  drawAv();
  const ageWrap = h('div', { class: 'choice' });
  const drawAge = () => {
    ageWrap.innerHTML = '';
    (['3-5', '6-8'] as AgeGroup[]).forEach((a) =>
      ageWrap.append(
        h(
          'button',
          {
            class: 'opt' + (age === a ? ' sel' : ''),
            onTap: () => {
              age = a;
              drawAge();
            },
          },
          a + ' años',
          h('small', {}, a === '3-5' ? 'Todo se dice en voz alta' : 'Más desafíos')
        )
      )
    );
  };
  drawAge();
  const create = () => {
    const n = name.value.trim();
    if (!n) {
      err.textContent = 'Escribe un nombre.';
      sfx.bad();
      return;
    }
    if (!age) {
      err.textContent = 'Elige la edad.';
      sfx.bad();
      return;
    }
    const p = addProfile({ name: n.charAt(0).toUpperCase() + n.slice(1), avatar, age });
    settings.activeProfile = p.id;
    saveSettings();
    sfx.good();
    go('hub');
  };
  const hasProfiles = getProfiles().length > 0;
  root.append(
    h(
      'div',
      { class: 'col maxw', style: { paddingBottom: '24px' } },
      h('h1', {}, 'Nuevo perfil'),
      h('div', { class: 'card col w100' }, h('h2', {}, 'Elige tu animalito'), avWrap),
      h('div', { class: 'card col w100' }, h('h2', {}, '¿Cómo te llamas?'), name),
      h('div', { class: 'card col w100' }, h('h2', {}, '¿Cuántos años tienes?'), ageWrap),
      err,
      h('div', { class: 'row' }, hasProfiles ? h('button', { class: 'btn ghost', onTap: () => go('profiles') }, 'Volver') : null, h('button', { class: 'btn green', onTap: create }, '¡Listo!'))
    )
  );
  setTimeout(() => root.isConnected && say('nuevo_perfil'), 300);
}
