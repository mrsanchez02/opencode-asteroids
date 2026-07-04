# opencode-asteroids

HTML5 Canvas Asteroids clone — single-file JS game, no build tools, no dependencies.

## Run

Open `index.html` in a browser (double-click) or serve locally:

```bash
npx serve .
```

## Architecture

- `game.js` — all game logic (~420 lines, ES6+, no modules, no bundler)
- `index.html` — shell, loads `game.js` via `<script src="game.js"></script>`
- `favicon.svg` — SVG favicon
- Canvas is 800×600, rendering via 2D context
- `'use strict'` in game.js
- No package.json, no lockfiles, no linter/formatter config, no tests, no CI
- No `.env`, no generated files, no migrations, no dev server beyond a static file server

## Game mechanics (relevant if editing)

- Input: `keydown`/`keyup` listeners on `window`; `keys` object for held state, `justPressed` for single-press detection (reset after read)
- Coordinate system: toroidal wrapping (`wrap` helper: `((v % max) + max) % max`)
- Classes: `Bullet`, `Asteroid`, `Ship`, `Particle` — no exports, all global
- Ship blink during respawn invincibility: `Math.floor(this.invincible * 8) % 2 === 0`
- Asteroid split: size 3 → two size 2, size 2 → two size 1, size 1 is terminal
- `dt` capped at 0.05s to avoid large-frame jumps
- State machine: `'playing' | 'dead' | 'gameover'`
- No localStorage, no high scores persisted across sessions

## Style

- `camelCase` for variables/functions, `PascalCase` for classes
- Hungarian-ish: `vx`/`vy` for velocity, `ttl` for time-to-live, `dead` flag for entity lifecycle
