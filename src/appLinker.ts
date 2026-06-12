import type { Game, ResolveOptions, StreamingService } from './core/types';
import { resolve } from './core/serviceResolver';
import type { Launcher } from './platform/launcher';
import { WebOSLauncher, isWebOS } from './platform/webosLauncher';
import { WebLauncher } from './platform/webLauncher';

function pickLauncher(): Launcher {
  return isWebOS() ? new WebOSLauncher() : new WebLauncher();
}

/**
 * Public entry point: figure out which streaming service carries the game
 * and launch it on whatever platform we're running on.
 */
export async function resolveAndLaunch(
  game: Game,
  opts: ResolveOptions,
): Promise<StreamingService> {
  const service = resolve(game, opts);
  await pickLauncher().launch({ service, game });
  return service;
}
