// A diagram's source decides what its `img` metadata loads, so an app showing text it did not write
// can turn that off, on the option `config` cannot reach.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MermaidImagesHarness from './MermaidImagesHarness.test.svelte';

const win = window as unknown as { pele?: unknown };
const stub = () => {
	const renderSpy = vi.fn(() => ({ svg: '<svg></svg>', width: 10, height: 10, type: 'flowchart' }));
	win.pele = { render: renderSpy };
	return renderSpy;
};

afterEach(() => {
	delete win.pele;
});

describe('Mermaid images', () => {
	const SOURCE = 'flowchart TD\n  A@{ img: "https://example.test/x.png" }';
	const FENCE = `\`\`\`mermaid\n${SOURCE}\n\`\`\``;

	test.each([
		['a Mermaid', { chart: SOURCE }, true],
		['a Mermaid with `images={false}`', { chart: SOURCE, images: false }, false],
		['a fence in a message', { fence: FENCE }, true],
		['a fence with `peleOptions.images` off', { fence: FENCE, images: false }, false]
	])('%s', async (_, props, images) => {
		const renderSpy = stub();
		await render(MermaidImagesHarness, { props });
		await expect.poll(() => renderSpy.mock.calls.length).toBeGreaterThan(0);
		expect(renderSpy.mock.lastCall?.at(1)).toMatchObject({ images });
	});
});
