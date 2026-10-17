import { describe, expect, test } from 'vitest';
import { resolveAIComposerSources } from './aiComposerSourceAdapter.js';

const customIcon = 'icon';

describe('suggestion icons per token kind', () => {
	test('items without an icon get one for their kind, so a mixed @ list reads at a glance', () => {
		const { triggers } = resolveAIComposerSources({
			commands: [{ id: 'summarize', label: 'Summarize' }],
			mentions: { items: [{ id: 'team', label: 'Platform team' }] },
			references: { items: [{ id: 'brief', label: 'brief.md' }] },
			skills: [{ id: 'review', label: 'Review' }],
			mentionItems: [{ id: 'notes', label: 'notes.md', type: 'file' }]
		});
		const at = triggers['@'].items ?? [];
		const icon = (id: string) => at.find((item) => item.id === id)?.icon;
		expect(icon('team')).toBeTypeOf('function');
		expect(icon('brief')).toBeTypeOf('function');
		expect(icon('notes')).toBeTypeOf('function');
		expect(new Set([icon('team'), icon('brief'), icon('notes')]).size).toBe(3);
		expect(triggers['/'].items?.[0].icon).toBeTypeOf('function');
		expect(triggers['$'].items?.[0].icon).toBeTypeOf('function');
		expect(triggers['/'].items?.[0].icon).not.toBe(triggers['$'].items?.[0].icon);
	});

	test('an icon the app supplies wins', () => {
		const { triggers } = resolveAIComposerSources({
			commands: [{ id: 'summarize', label: 'Summarize', icon: customIcon }]
		});
		expect(triggers['/'].items?.[0].icon).toBe(customIcon);
	});
});
