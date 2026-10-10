// Setup for `*.browser.test.ts` (Vitest browser mode, Chromium and WebKit). Nothing is stubbed:
// these tests exist to measure real layout, focus and input. The docs stylesheet gives every
// component its Tailwind classes, so `hidden`, `fixed` and transforms behave as in the app.
import './src/app.css';
