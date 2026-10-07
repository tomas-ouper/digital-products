import type { GameContext, GameInstance } from '../types';

export function start(ctx: GameContext): GameInstance {
  ctx.host.innerHTML = '<div style="color:#fff;padding:120px 20px;text-align:center;font-size:28px">Muy pronto</div>';
  return { destroy() {} };
}
