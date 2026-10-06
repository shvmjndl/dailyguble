# Brand: Harbor Light

The logo is the word **guble** with a lighthouse standing in for the "l", its
warm beam sweeping back across the word. The paper keeps the light on.

| File | Use it for |
|---|---|
| `guble-wordmark.svg` | The logo on light backgrounds |
| `guble-wordmark-dark.svg` | The logo on dark backgrounds |
| `guble-icon.svg` | The round lighthouse badge: favicons, avatars, anywhere the mark stands alone |
| `guble-icon-square.svg` | App icons (phones round the corners themselves) |
| `guble-share.svg` | Link previews (1200 × 630) |

Every letter is a vector outline, so the files print and scale cleanly with no fonts installed.

**Where it appears**

- **Front page:** the round badge is the masthead's left ear, with a live weather ear opposite.
- **Inside pages:** a small badge beside the paper's name in the running head.
- **Desk toolbar:** the wordmark, on wider screens.
- **Story reader:** the badge at the end of the paper.
- **Elsewhere:** the sign-in pass and newsroom header, the browser tab and home-screen icon, and link previews.

The paper carries its own copy of the badge and wordmark in `src/brand.js`. After changing the files here, run `node scripts/build-brand.js` to update it.

**Colours**

| Name | Hex | Used for |
|---|---|---|
| Ink | `#17150f` | Letters, the tower |
| Newsprint | `#e7e1d1` | Backgrounds |
| Press red | `#95291c` | The band on the tower |
| Lamp | `#f6d77a` | The lit window |
| Beam | `#f2b53c` at 42–45% | The light |

**Don't** stretch the wordmark, recolour the tower band, or put the ink
wordmark on a dark background (use the `-dark` file).

`concepts/` keeps the three directions that were explored (The Fold, Harbor
Light, Press Seal); open `concepts/index.html` to compare them.
