import type { EdytorProps } from 'edytor';
import { describe, expectTypeOf, test } from 'vitest';
import type { RichTextInputCollaboration } from './richTextInput.props.js';

// RichTextInputCollaboration restates edytor's collaboration props so that the shipped
// declarations never import the optional edytor peer. These assertions run under svelte-check and
// fail when edytor changes one of those props in a way the restated type no longer accepts.
describe('RichTextInputCollaboration', () => {
	test('accepts every collaboration value edytor accepts', () => {
		expectTypeOf<
			Pick<EdytorProps, keyof RichTextInputCollaboration>
		>().toExtend<RichTextInputCollaboration>();
	});

	test('covers only settings edytor has', () => {
		expectTypeOf<keyof RichTextInputCollaboration>().toExtend<keyof EdytorProps>();
	});
});
