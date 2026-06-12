import type { LaunchTarget } from '../core/types';

export interface Launcher {
  launch(target: LaunchTarget): Promise<void>;
}
