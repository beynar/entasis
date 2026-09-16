import { describe, expect, test } from 'vitest';
import { containerBreakpoints, responsiveContainerClasses } from '../Theme/responsive.js';
import { stackTheme } from './stack.theme.js';

// The five chains in stack.theme.ts are hand-written literals: Tailwind only generates candidates
// it can scan in source text, so a chain concatenated at runtime would produce no CSS at all.
// These tests are the guard that keeps the literals and the shared container table in step — move
// a width in `containerBreakpoints` and they fail until the literals follow.
const axes = [
	['stack-direction', 'flex-direction'],
	['stack-gap', 'gap'],
	['stack-align', 'align-items'],
	['stack-justify', 'justify-content'],
	['stack-wrap', 'flex-wrap']
] as const;

describe('stack theme', () => {
	test.each(axes)('%s reads the shared container table', (name, property) => {
		const expected = responsiveContainerClasses(name, property, 'stack');
		for (const className of expected.split(' ')) {
			expect(stackTheme.inner()).toContain(className);
		}
	});

	test('every breakpoint survives the class merge', () => {
		const inner = stackTheme.inner().split(' ');
		for (const [name, property] of axes) {
			for (const className of responsiveContainerClasses(name, property, 'stack').split(' ')) {
				expect(inner).toContain(className);
			}
		}
		// Five axes at five steps, plus the flex line's own classes.
		expect(inner.filter((className) => className.includes('--stack-'))).toHaveLength(25);
	});

	test('the layout element is inside the container, never the container itself', () => {
		// A container query cannot style its own container, so the `@container/stack` root must not
		// carry the chains and the element that does must not declare the container.
		expect(stackTheme.root()).toContain('@container/stack');
		expect(stackTheme.root()).not.toContain('--stack-');
		expect(stackTheme.inner()).not.toContain('@container');
	});

	test('inline-size containment keeps a definite width on the root', () => {
		// Containment strips the root of intrinsic width; without these it measures zero inside a
		// flex or grid parent and every breakpoint resolves to `xs`.
		expect(stackTheme.root()).toContain('w-full');
		expect(stackTheme.root()).toContain('min-w-0');
	});

	test('the chains use container variants, never viewport ones', () => {
		for (const className of stackTheme.inner().split(' ')) {
			// The variant prefix is what sits before the first colon OUTSIDE the brackets; the colon
			// inside `[flex-direction:…]` belongs to the declaration, not to a variant.
			let depth = 0;
			for (let index = 0; index < className.length; index += 1) {
				const character = className[index];
				if (character === '[') depth += 1;
				else if (character === ']') depth -= 1;
				else if (character === ':' && depth === 0) {
					expect(className.slice(0, index)).toMatch(/^@min-\[\d+rem\]\/stack$/);
					break;
				}
			}
		}
		for (const width of Object.values(containerBreakpoints)) {
			expect(stackTheme.inner()).toContain(`@min-[${width}]/stack:`);
		}
	});
});
