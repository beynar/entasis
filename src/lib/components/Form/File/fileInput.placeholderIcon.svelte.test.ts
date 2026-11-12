import { render } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import Harness from './FileInputIconHarness.test.svelte';
import { fileIcon } from '../../Icons/file.js';
import { plusIcon } from '../../Icons/plus.js';
import IconProbe from './FileInputIconProbe.test.svelte';

// The markup an icon draws at the dropzone's size, to recognise it in the dropzone.
const markupOf = (icon: typeof fileIcon) => {
	const { container, unmount } = render(IconProbe, { props: { icon } });
	const svg = container.querySelector('svg')!.outerHTML;
	unmount();
	return svg;
};

test('the empty dropzone draws the file icon by default, or the one passed', () => {
	const file = markupOf(fileIcon);
	const plus = markupOf(plusIcon);
	expect(file).not.toBe(plus);

	const byDefault = render(Harness);
	expect(byDefault.container.querySelector('svg')!.outerHTML).toBe(file);
	byDefault.unmount();

	const custom = render(Harness, { props: { custom: true } });
	// Drawn at the dropzone's size: the same markup as the icon called with { size: 40 }.
	expect(custom.container.querySelector('svg')!.outerHTML).toBe(plus);
	expect(custom.container.textContent).toContain('Add');
});
