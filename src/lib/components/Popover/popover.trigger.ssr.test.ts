// Law 4 in the server markup: a trigger announces its popup (`aria-haspopup`, `aria-expanded`)
// before the page hydrates, the built-in one and a snippet one spreading `triggerAttributes`.
// `aria-controls` stays client-side: the popup it would name is not part of the server render.
import { describe, expect, test } from 'vitest';
import { serverTriggerTag } from './triggerAriaSsr.test-helper.js';

describe('Popover trigger on the server', () => {
	test.each(['popover-snippet', 'popover-button'] as const)(
		'%s carries its popup ARIA',
		(scenario) => {
			const tag = serverTriggerTag(scenario, 'Filters');
			expect(tag).toContain('aria-haspopup="dialog"');
			expect(tag).toContain('aria-expanded="false"');
			expect(tag).not.toContain('aria-controls');
		}
	);
});
