import type { Launcher } from './launcher';
import type { LaunchTarget } from '../core/types';

export class WebOSLauncher implements Launcher {
  launch(target: LaunchTarget): Promise<void> {
    const { service } = target;
    return new Promise((resolvePromise, reject) => {
      window.webOS!.service.request('luna://com.webos.applicationManager', {
        method: 'launch',
        parameters: {
          id: service.webosAppId,
          params: service.contentTarget ? { contentTarget: service.contentTarget } : {},
        },
        onSuccess: () => resolvePromise(),
        onFailure: (error) =>
          reject(
            new Error(
              `Couldn't open ${service.label}. Is it installed? (${error.errorText ?? 'unknown error'})`,
            ),
          ),
      });
    });
  }
}

export function isWebOS(): boolean {
  return typeof window !== 'undefined' && window.webOS !== undefined;
}
