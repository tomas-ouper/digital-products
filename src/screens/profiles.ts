import { h } from '../core/ui';
import { avatarSvg, AVATARS } from '../core/avatars';
import { addProfile, canAddProfile, getProfiles, settings, saveSettings, type AgeGroup } from '../core/state';
import { go } from '../core/nav';
import { say } from '../core/voice';
import { sfx } from '../core/sound';
import { tr } from '../core/i18n';

/** "3-5 años" / "Ages 3-5" */
export const ageLabel = (a: AgeGroup) => tr(a + ' años', 'Ages ' + a, a + ' ans');

export function profilesScreen(root: HTMLElement) {
  root.className = 'screen center';
  const list = getProfiles();
  if (list.length === 0) return go('newProfile');
  root.append(
    h('h1', {}, tr('¿Quién va a jugar?', "Who's playing?", 'Qui va jouer ?')),
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
          h('span', { class: 'meta' }, ageLabel(p.age))
        )
      ),
      canAddProfile() ? h('button', { class: 'profile-tile add', onTap: () => go('newProfile') }, h('span', { style: { fontSize: '56px' } }, '+'), h('span', { class: 'meta' }, tr('Nuevo perfil', 'New profile', 'Nouveau profil'))) : null
    ),
    h('button', { class: 'btn ghost small', onTap: () => go('device') }, tr('¿Desde dónde juegas?', 'Where are you playing from?', 'Sur quel appareil joues-tu ?'))
  );
  setTimeout(() => root.isConnected && say('quien_juega'), 300);
}

export function newProfileScreen(root: HTMLElement) {
  root.className = 'screen';
  let avatar = 0;
  let age: AgeGroup | null = null;
  const name = h('input', { class: 'big', type: 'text', maxlength: '12', placeholder: tr('Nombre', 'Name', 'Prénom'), autocomplete: 'off', 'aria-label': tr('Nombre', 'Name', 'Prénom') });
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
          ageLabel(a),
          h('small', {}, a === '3-5' ? tr('Todo se dice en voz alta', 'Everything is read aloud', 'Tout est lu à voix haute') : tr('Más desafíos', 'More challenges', 'Plus de défis'))
        )
      )
    );
  };
  drawAge();
  const create = () => {
    const n = name.value.trim();
    if (!n) {
      err.textContent = tr('Escribe un nombre.', 'Type a name.', 'Écris un prénom.');
      sfx.bad();
      return;
    }
    if (!age) {
      err.textContent = tr('Elige la edad.', 'Pick an age.', 'Choisis un âge.');
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
      h('h1', {}, tr('Nuevo perfil', 'New profile', 'Nouveau profil')),
      h('div', { class: 'card col w100' }, h('h2', {}, tr('Elige tu animalito', 'Pick your animal friend', 'Choisis ton ami animal')), avWrap),
      h('div', { class: 'card col w100' }, h('h2', {}, tr('¿Cómo te llamas?', "What's your name?", 'Comment tu t’appelles ?')), name),
      h('div', { class: 'card col w100' }, h('h2', {}, tr('¿Cuántos años tienes?', 'How old are you?', 'Quel âge as-tu ?')), ageWrap),
      err,
      h('div', { class: 'row' }, hasProfiles ? h('button', { class: 'btn ghost', onTap: () => go('profiles') }, tr('Volver', 'Back', 'Retour')) : null, h('button', { class: 'btn green', onTap: create }, tr('¡Listo!', 'Done!', 'C’est prêt !')))
    )
  );
  setTimeout(() => root.isConnected && say('nuevo_perfil'), 300);
}
