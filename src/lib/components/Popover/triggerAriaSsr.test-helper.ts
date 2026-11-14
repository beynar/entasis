import { render } from 'svelte/server';
import TriggerAriaSsrHarness from './TriggerAriaSsrHarness.test.svelte';

export type TriggerAriaScenario = Parameters<typeof TriggerAriaSsrHarness>[1]['scenario'];

/**
 * The opening tag of the `<button>` whose text starts with `name`, in the server render of one
 * `TriggerAriaSsrHarness` scenario. Shared by the Popover, Dialog and Menu trigger SSR tests.
 */
export const serverTriggerTag = (scenario: TriggerAriaScenario, name: string) => {
	const { body } = render(TriggerAriaSsrHarness, { props: { scenario } });
	const tag = [...body.matchAll(/<button\b[^>]*>/g)].find((candidate) =>
		body
			.slice((candidate.index ?? 0) + candidate[0].length)
			.replace(/<!--[^]*?-->|<[^>]+>/g, '')
			.trimStart()
			.startsWith(name)
	);
	return tag?.[0] ?? '';
};
