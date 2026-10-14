import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import TabsBuildCountHarness from './TabsBuildCountHarness.test.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';

const items = ['Inbox', 'Drafts', 'Sent'];

describe('panel build counter attached from a docs card', () => {
	test('an untracked counter bump runs once per built panel', async () => {
		renderInTheme(TabsBuildCountHarness, { items });
		expect(screen.getByTestId('built')).toHaveTextContent('1');

		await fireEvent.click(screen.getByRole('tab', { name: 'Drafts' }));
		expect(screen.getByTestId('built')).toHaveTextContent('2');
	});
});
