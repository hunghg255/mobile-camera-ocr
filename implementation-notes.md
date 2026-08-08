# Implementation Notes

## Decisions and deviations

- Package manager changed from npm to pnpm at the user's request.
- TypeScript is pinned to the current 5.9 line because the installed `typescript-eslint` release does not yet declare support for TypeScript 7.
- Tailwind CSS uses the current Vite plugin setup (`@tailwindcss/vite`) rather than the legacy PostCSS configuration.
- shadcn/ui primitives are kept in source under `src/components/ui` so the app owns and can customize the mobile styling.
- Tesseract language models are loaded on demand from its default traineddata host. Bundling all language files would be impractical for a mobile web app.
- The language picker exposes the broad Tesseract catalog but warns above three selected models to protect mobile memory and download time.
- Automated browser, lint, unit/component, and production-build checks are part of final QA. A real iOS/Android camera still requires an HTTPS device test.
- Visual browser QA could not run in this workspace session because no in-app or extension browser instance was available; this is kept as an explicit manual follow-up rather than reported as verified.
- OCR output now enters a temporary review dialog first. The app creates and persists a `ScanItem` only after the user submits non-empty edited text; closing or cancelling the dialog discards that pending result.
