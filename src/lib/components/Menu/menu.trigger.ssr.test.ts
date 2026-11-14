// Law 4 in the server markup: a trigger announces its popup (`aria-haspopup`, `aria-expanded`)
// before the page hydrates, the built-in one and a snippet one spreading `triggerAttributes`.
// `aria-controls` stays client-side: the popup it would name is not part of the server render.
import { describe, expect, test } from 'vitest';
import { serverTriggerTag } from '../Popover/triggerAriaSsr.test-helper.js';

describe('Menu trigger on the server', () => {
	test.each(['menu-snippet', 'menu-button'] as const)('%s carries its popup ARIA', (scenario) => {
		const tag = serverTriggerTag(scenario, 'Actions');
		expect(tag).toContain('aria-haspopup="menu"');
		expect(tag).toContain('aria-expanded="false"');
		expect(tag).not.toContain('aria-controls');
	});
});
