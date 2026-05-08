# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Family farm website for the Buck Creek, Kentucky property held in a family trust. Domain: `nanaandpapas.com`.

## Commands

```bash
npm run dev      # Run client (port 5173) + server (port 3001) concurrently
npm run build    # Vite production build → client/dist/
npm start        # Start Express server (production — serves client/dist/)
```

Run client or server alone:
```bash
npm run dev --workspace=client
npm run dev --workspace=server
```

## Architecture

npm workspaces monorepo: `client/` (React + Vite) and `server/` (Express).

**Dev:** Vite proxies `/api/*` → `http://localhost:3001`. No CORS issues in development.

**Prod:** Express serves `client/dist/` as static files with `index.html` fallback for client-side routing.

### Client (`client/src/`)

Single-page app. `App.jsx` composes full-page sections in order — no nested routing needed yet. Add routes in `main.jsx` if pages are required later.

- `components/` — one file per section (Nav, Hero, About, TheLand, Contact, Footer, Divider)
- `hooks/useInView.js` — IntersectionObserver hook; fires once when element enters viewport, then disconnects. Used for scroll-triggered fade-up animations.
- All styling via Tailwind utility classes. No component-level CSS files.

### Server (`server/index.js`)

Single-file Express API. Currently handles one route:
- `POST /api/contact` — sends contact form submissions via Resend

Email is sent with `resend` npm package using the `RESEND_API_KEY` env var.

### Styling

Custom Tailwind color palette (defined in `client/tailwind.config.js`):
- `farm-dark` (#1A1F0F) — primary dark background
- `farm-green` (#2A3B1C) — section backgrounds
- `farm-cream` (#F2EADB) — body text
- `farm-gold` (#C8A44A) — accents, borders, labels
- `farm-earth` (#6B4226) — secondary accent

Custom utilities in `client/src/index.css`:
- `.section-pad` — consistent section padding
- `.label-sm` — uppercase eyebrow/label text
- `.nav-link` — nav links with animated underline on hover

Fonts: Cormorant Garamond (serif headings) + Jost (sans body) loaded from Google Fonts in `index.html`.

### Animations

Scroll reveals: wrap section content in a `div` with `ref={ref}` from `useInView()`, then apply conditional Tailwind classes:
```jsx
const [ref, inView] = useInView()
<div ref={ref} className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
```

Stagger children with `transitionDelay` inline style: `style={{ transitionDelay: inView ? '200ms' : '0ms' }}`.

## Environment Variables

Copy `.env.example` → `.env` at the repo root:

```
RESEND_API_KEY=re_...
CONTACT_EMAIL=your@email.com
```
