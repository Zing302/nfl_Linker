import type { Launcher } from './launcher';
import type { LaunchTarget } from '../core/types';

/** Desktop-browser fallback: open the service's website in a new tab. */
export class WebLauncher implements Launcher {
  async launch(target: LaunchTarget): Promise<void> {
    window.open(target.service.webUrl, '_blank', 'noopener');
  }
}
