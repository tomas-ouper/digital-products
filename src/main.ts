import './style.css';
import { register, go, startClock } from './core/nav';
import { settings, activeProfile } from './core/state';
import { unlockAudio } from './core/sound';
import { accessScreen } from './screens/access';
import { deviceScreen } from './screens/device';
import { profilesScreen, newProfileScreen } from './screens/profiles';
import { hubScreen } from './screens/hub';
import { levelsScreen } from './screens/levels';
import { playScreen } from './screens/play';
import { missionScreen } from './screens/mission';
import { parentsScreen } from './screens/parents';

register('access', accessScreen);
register('device', deviceScreen);
register('profiles', profilesScreen);
register('newProfile', newProfileScreen);
register('hub', hubScreen);
register('levels', levelsScreen);
register('play', playScreen);
register('mission', missionScreen);
register('parents', parentsScreen);

// Desbloquear audio con el primer toque (iOS/Android).
window.addEventListener('pointerdown', unlockAudio, { once: true });
// Evitar zoom con doble toque / gesto en iOS.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());

startClock();
// Atajo de prueba (consola / tests automáticos)
(window as any).mpGo = go;

if (!settings.unlocked) go('access');
else if (!settings.device) go('device');
else if (activeProfile()) go('hub');
else go('profiles');

// PWA: service worker (solo en https/localhost y fuera de iframes sandbox).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
