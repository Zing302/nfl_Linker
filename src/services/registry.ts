import type { StreamingService } from '../core/types';

/**
 * All streaming services the resolver can hand back, keyed by service.
 *
 * webOS app ids are best-effort constants. Verify on a real TV with
 * `ares-launch --device <tv> --list` and adjust here — this file is the
 * single place they live.
 */
export const SERVICES = {
  peacock: {
    key: 'peacock',
    label: 'Peacock',
    webosAppId: 'com.peacock.tv', // verified on OLED65CX

    webUrl: 'https://www.peacocktv.com/sports/nfl',
    color: '#000000',
  },
  primeVideo: {
    key: 'primeVideo',
    label: 'Prime Video',
    webosAppId: 'amazon',
    webUrl: 'https://www.amazon.com/gp/video/sports',
    color: '#00a8e1',
  },
  netflix: {
    key: 'netflix',
    label: 'Netflix',
    webosAppId: 'netflix',
    webUrl: 'https://www.netflix.com',
    color: '#e50914',
  },
  paramountPlus: {
    key: 'paramountPlus',
    label: 'Paramount+',
    webosAppId: 'com.cbs-all-access.webapp.prod', // verified on OLED65CX

    webUrl: 'https://www.paramountplus.com/live-tv/',
    color: '#0064ff',
  },
  foxOne: {
    key: 'foxOne',
    label: 'Fox One',
    webosAppId: 'com.fox.one',
    webUrl: 'https://www.fox.com/live/',
    color: '#1b2c5b',
  },
  espn: {
    key: 'espn',
    label: 'ESPN',
    webosAppId: 'espn',
    webUrl: 'https://www.espn.com/watch/',
    color: '#cc0000',
  },
  youtube: {
    key: 'youtube',
    label: 'YouTube',
    webosAppId: 'youtube.leanback.v4',
    webUrl: 'https://www.youtube.com/@NFL',
    color: '#ff0000',
  },
  sundayTicket: {
    key: 'sundayTicket',
    label: 'NFL Sunday Ticket',
    // Sunday Ticket lives inside the YouTube app (verified installed); the
    // dedicated YouTube TV app would be youtube.leanback.ytv.v1 if present.
    webosAppId: 'youtube.leanback.v4',
    webUrl: 'https://tv.youtube.com/nfl-sunday-ticket/',
    color: '#013369',
  },
  nflPlus: {
    key: 'nflPlus',
    label: 'NFL+',
    webosAppId: 'com.nfl.app',
    webUrl: 'https://www.nfl.com/plus/',
    color: '#013369',
  },
} as const satisfies Record<string, StreamingService>;

export type ServiceKey = keyof typeof SERVICES;
