// Maskito options for one MaskedInput: the mask array the engine computes for each edit, the token
// transforms, and the placeholder. The placeholder follows `maskitoWithPlaceholder` from
// `@maskito/kit`, but its template follows the pattern the text fits, so optional, repeating and
// alternative patterns show the right empty slots.
import {
	maskitoTransform,
	maskitoUpdateElement,
	type MaskitoOptions,
	type MaskitoPlugin,
	type MaskitoPostprocessor,
	type MaskitoPreprocessor
} from '@maskito/core';
import { maskitoCaretGuard, maskitoEventHandler } from '@maskito/kit';
import type { MaskEngine } from './maskedInput.mask.js';

/** When the empty slots show: always, while the input has focus, or never. */
export type MaskedInputShowMask = 'always' | 'focus' | 'never';

export type MaskedInputMaskito = {
	/** The options the input's Maskito instance runs. */
	options: MaskitoOptions;
	/** The text the input shows for a value, with the placeholder when it shows. */
	display: (value: string, focused: boolean) => string;
	/** The masked text without the placeholder, from what the input shows. */
	strip: (shown: string) => string;
	/** Records the clean text the input was set to from outside Maskito. */
	sync: (clean: string) => void;
};

/** The masked text Maskito makes of a value, transforms applied, without any placeholder. */
export const maskValue = (engine: MaskEngine, value: string): string =>
	maskitoTransform(value, baseOptions(engine));

const baseOptions = (engine: MaskEngine): MaskitoOptions => ({
	mask: ({ value }) => engine.expression(value),
	postprocessors: [({ value, selection }) => ({ value: engine.transform(value), selection })]
});

export const createMaskedInputMaskito = (
	engine: MaskEngine,
	showMask: MaskedInputShowMask
): MaskedInputMaskito => {
	const base = baseOptions(engine);
	const shows = (focused: boolean) => showMask === 'always' || (showMask === 'focus' && focused);
	const display = (value: string, focused: boolean) => {
		const clean = maskitoTransform(value, base);
		return shows(focused) ? `${clean}${engine.tail(clean)}` : clean;
	};
	if (showMask === 'never') {
		return { options: base, display, strip: (shown) => shown, sync: () => {} };
	}

	let lastClean = '';
	let action: Parameters<MaskitoPreprocessor>[1] = 'validation';
	let focused = false;

	// Whatever follows the last clean text and still reads as its template is placeholder.
	const strip = (shown: string) => {
		const template = `${lastClean}${engine.tail(lastClean)}`;
		for (let index = shown.length - 1; index >= lastClean.length; index -= 1) {
			if (shown[index] !== template[index]) return shown.slice(0, index + 1);
		}
		return shown.slice(0, lastClean.length);
	};

	const removePlaceholder: MaskitoPreprocessor = ({ elementState, data }, actionType) => {
		action = actionType;
		return {
			elementState: { selection: elementState.selection, value: strip(elementState.value) },
			data
		};
	};

	const addPlaceholder: MaskitoPostprocessor = ({ value, selection }, initial) => {
		lastClean = value;
		const tail = engine.tail(value);
		const onlyPlaceholderRemoved =
			`${value}${tail.slice(0, Math.max(0, initial.value.length - value.length))}` ===
			initial.value;
		// A value patched from outside (a plugin, the component) keeps the placeholder it was given.
		if (action === 'validation' && onlyPlaceholderRemoved) {
			return { selection, value: initial.value };
		}
		const next = shows(focused) ? `${value}${tail}` : value;
		if (next === initial.value && action === 'deleteBackward') {
			const [caret] = initial.selection;
			return { value: next, selection: [caret, caret] };
		}
		return { value: next, selection };
	};

	const plugins: MaskitoPlugin[] = [maskitoCaretGuard((shown) => [0, strip(shown).length])];
	if (showMask === 'focus') {
		plugins.push(
			maskitoEventHandler(
				'focus',
				(element) => {
					// A read-only or disabled input shows its value as it is.
					const input = element as HTMLInputElement;
					if (input.readOnly || input.disabled) return;
					focused = true;
					lastClean = element.value;
					maskitoUpdateElement(element, `${element.value}${engine.tail(element.value)}`);
				},
				{ capture: true }
			),
			maskitoEventHandler(
				'blur',
				(element) => {
					if (!focused) return;
					focused = false;
					maskitoUpdateElement(element, strip(element.value));
				},
				{ capture: true }
			)
		);
	}

	return {
		options: {
			...base,
			preprocessors: [removePlaceholder],
			postprocessors: [...(base.postprocessors ?? []), addPlaceholder],
			plugins
		},
		display: (value, isFocused) => {
			focused = isFocused;
			return display(value, isFocused);
		},
		strip,
		sync: (clean) => {
			lastClean = clean;
		}
	};
};
