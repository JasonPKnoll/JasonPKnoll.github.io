# jpknoll.com

Personal portfolio for Jason Knoll, built with [SvelteKit](https://svelte.dev/docs/kit) and fully prerendered to static HTML for GitHub Pages.

## Develop

Requires Node 24 (see `.nvmrc`; SvelteKit 3 needs ≥ 22.17).

```sh
nvm use 24
npm install
npm run dev       # http://localhost:5173
npm run check     # type-check
npm run build     # static site → build/
npm run preview   # serve the production build
```

## Where things live

| What | Where |
| --- | --- |
| Bio, socials, skills | `src/lib/site.ts` |
| Projects (cards + detail pages) | `src/lib/projects.ts` |
| Old Jekyll URL redirects | `src/lib/legacy.ts` |
| Card / portrait images (optimized at build) | `src/lib/assets/` |
| Project demo clips & screenshots | `static/images/` |
| Original GIF sources (not deployed) | `media-src/` |

### Adding a demo clip

Convert screen recordings to MP4 + poster rather than shipping GIFs:

```sh
ffmpeg -i clip.gif -movflags +faststart -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf 24 -preset slow -an clip.mp4
ffmpeg -i clip.mp4 -frames:v 1 -q:v 4 clip.jpg
```

Then reference it in `projects.ts` with `video('images/…/clip.mp4', alt, width, height)`.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `build/` to GitHub Pages. The custom domain is kept via `static/CNAME`.
