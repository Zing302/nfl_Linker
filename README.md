# NFL Linker

LG webOS TV app that shows the NFL schedule week by week, categorizes each game
(TNF / SNF / MNF / Thanksgiving / Christmas / International / Playoff vs. a
normal Sunday game), and launches the streaming app that carries it.

## How it works

- **Schedule:** ESPN's public scoreboard API (no key needed). `src/core/scheduleClient.ts`
  parses each event's `geoBroadcasts` into TV networks, streaming networks, and
  national/regional market. Data is fetched live on load, re-pulled hourly and
  on app resume, so flexed games and playoff matchups stay current; unset
  playoff slots show as TBD.
- **Categorizer** (`src/core/categorizer.ts`): pure function on the kickoff
  converted to US/Eastern (UTC dates roll over for night games).
- **Resolver** (`src/core/serviceResolver.ts`): prefers ESPN's named streaming
  service (Peacock, Prime Video, Netflix, YouTube…), falls back to a TV-network
  map (NBC→Peacock, CBS→Paramount+, FOX→Fox One, ESPN/ABC→ESPN, NFL
  Network→NFL+). Paramount+ and Fox One stream the local affiliate, so they
  only resolve for regional games in your market — determined by the ZIP code
  entered in the header (persisted in localStorage) against each team's
  approximate DMA in `src/core/marketData.ts`. Out-of-market regional games
  resolve to NFL Sunday Ticket instead. No ZIP entered = assume in-market.
- **Launchers** (`src/platform/`): on a TV, a Luna
  `com.webos.applicationManager/launch` call opens the service's app; in a
  desktop browser the service's website opens in a new tab, so the whole app is
  testable without a TV.

## Develop

```sh
npm install
npm test        # vitest unit tests (fixtures; no network needed)
npm run dev     # desktop browser at the printed URL
npm run build   # type-check + production bundle in dist/
```

## Package for webOS

1. `npm run build`
2. Download LG's [webOSTV.js](https://webostv.developer.lge.com/develop/tools/webostvjs-introduction)
   and place it at `dist/webOSTVjs-1.2.10/webOSTV.js` (the script tag in
   `index.html` expects that path next to the built page).
3. `ares-package .` then `ares-install --device <tv> com.nfllinker.app_0.1.0_all.ipk`

### TV remote

Arrow up/down moves focus between games, left/right changes week, Enter (OK)
launches the focused game's service.

### Verify webOS app IDs

The app IDs in `src/services/registry.ts` are best-effort constants. List what
your TV actually has with:

```sh
ares-launch --device <tv> --list
```

and adjust the `webosAppId` values there — it's the single place they live.
