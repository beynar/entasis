# Test it

Test what a person (and an agent) can observe: roles, names, values, the callbacks your code
receives, and what is submitted. entasis already tests its own keyboard support, focus handling,
ARIA and validation; your tests prove that your interface wires them to the right data and
actions.

## Set up Vitest

Use the project's setup when it has one. Otherwise add Vitest, Testing Library and jsdom as
dev dependencies (`vitest`, `@testing-library/svelte`, `@testing-library/jest-dom`, `jsdom`) and a
`test` block in `vite.config.ts`:

```ts nocheck
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), svelteTesting()],
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.ts'],
		setupFiles: ['./vitest-setup.ts']
	}
});
```

jsdom lacks a few browser APIs the components use on mount (media queries, observers, Web
Animations, programmatic scrolling). Stub them once in the setup file:

```ts nocheck
// vitest-setup.ts
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

window.matchMedia ??= vi.fn().mockImplementation((query: string) => ({
	matches: false,
	media: query,
	onchange: null,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	addListener: vi.fn(),
	removeListener: vi.fn(),
	dispatchEvent: vi.fn()
}));

class NoopObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
	takeRecords() {
		return [];
	}
}
window.ResizeObserver ??= NoopObserver as unknown as typeof ResizeObserver;
window.IntersectionObserver ??= NoopObserver as unknown as typeof IntersectionObserver;

// Svelte runs transitions through element.animate(); finish them on the next task.
Element.prototype.animate ??= function () {
	const animation = {
		cancel() {},
		finish() {},
		play() {},
		pause() {},
		finished: Promise.resolve(),
		onfinish: null as null | (() => void)
	};
	setTimeout(() => animation.onfinish?.(), 0);
	return animation as unknown as Animation;
};
Element.prototype.getAnimations ??= () => [];
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.scrollTo ??= () => {};
```

Run one file while you work (`npx vitest run src/lib/Profile.test.ts`), the suite before you
report.

## Which tool for what

| Check                                                        | Tool                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| Your callbacks, submitted values, validation messages, state | Vitest + Testing Library in jsdom                      |
| What an agent can do under `<Theme webmcp>`                  | Vitest with a fake `document.modelContext` (see below) |
| Server rendering: no error, no duplicated markup             | `render` from `svelte/server` in a Node test           |
| Layout, color contrast, real focus rings, WebMCP in Chrome   | Playwright in a real browser (`@axe-core/playwright`)  |

## Write the tests

- **Find elements as a person does**: `getByRole('button', { name: 'Save' })`,
  `getByLabelText('Email')`, `getByRole('tab', { name: 'Billing' })`. A query by role and name
  that finds nothing usually means a missing `label`, which an agent would miss too. Never query
  generated ids or theme classes.
- **Act with `@testing-library/user-event`** or `fireEvent`, then assert on what changed: the
  value your `onValueChange` received, the payload `onSubmit` received, the text on screen.
- **Overlays render in a portal** at the end of `document.body`: query `screen`, not the
  `container`. Open them through their trigger, close them with Escape, and assert the `reason`
  your `onOpenChange` received when it matters.
- **Validation messages come from the i18n catalog.** Assert the English text, such as
  `This field is required` or `Enter a valid email address`, or the field's own `messages`
  override.
- **Asynchronous work**: `await tick()` after a prop change, `await waitFor(...)` for anything
  that loads, animates or debounces.
- **Disabled is not submitted**: when a field can be disabled, assert it is absent from the
  submitted value; `readOnly` fields stay in it.

A form, end to end:

```ts nocheck
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import ProfileForm from './ProfileForm.svelte';

test('saves a valid profile and explains an invalid one', async () => {
	const user = userEvent.setup();
	const onSave = vi.fn();
	render(ProfileForm, { onSave });

	await user.type(screen.getByLabelText(/Name/), 'Ada');
	await user.type(screen.getByLabelText(/Email/), 'not an email');
	await user.click(screen.getByRole('button', { name: 'Save' }));
	expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
	expect(onSave).not.toHaveBeenCalled();

	await user.clear(screen.getByLabelText(/Email/));
	await user.type(screen.getByLabelText(/Email/), 'ada@example.com');
	await user.click(screen.getByRole('button', { name: 'Save' }));
	await waitFor(() =>
		expect(onSave).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@example.com' })
	);
});
```

## Server rendering

A page that throws or renders twice on the server is a bug a jsdom test cannot see. In a test
that runs in Node (a `*.ssr.test.ts` file with `// @vitest-environment node` on its first line):

```ts nocheck
// @vitest-environment node
import { render } from 'svelte/server';
import { expect, test } from 'vitest';
import ProfilePage from './ProfilePage.svelte';

test('renders on the server, once', () => {
	const { body } = render(ProfilePage);
	// A heading the page renders exactly once: twice means a bound value started undefined.
	expect(body.split('Edit your profile').length - 1).toBe(1);
});
```

Give every bound value a starting value (`$state('')`, `$state(false)`): a bound `undefined` is
written during server rendering and renders the parent's markup twice.

## The agent test

Every interface gets one: render it under `<Theme webmcp>` with a fake `document.modelContext`,
then call its tools. The harness and a complete example are in
[agent-ready.md](agent-ready.md#prove-it-with-a-test).

## Break it on purpose

Before you trust a new test, break the code it covers (remove a `required`, rename a label, drop
the `color="danger"`) and watch it fail, then restore the code. A test that still passes tests
nothing.

## A real browser

jsdom has no layout and no color. When the interface has custom colors, a custom theme or a
responsive layout, check it in a browser with Playwright: text against its background needs a
4.5:1 contrast and control edges and focus rings 3:1, and `@axe-core/playwright` reports both.
When you cannot run a browser, say so in your report.
