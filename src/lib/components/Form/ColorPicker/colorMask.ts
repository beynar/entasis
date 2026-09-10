import { untrack } from 'svelte';
import { Maskito, type MaskitoOptions } from '@maskito/core';
import { maskitoNumberOptionsGenerator } from '@maskito/kit';
import type { ColorFormat } from './colorPicker.state.svelte.js';

// Hex entry: a fixed leading '#' (auto-inserted) followed by up to 8 hex digits, covering
// #rgb, #rgba, #rrggbb and #rrggbbaa. Typing "f00" yields "#f00".
const hexMask: MaskitoOptions = {
	mask: ['#', ...Array.from({ length: 8 }, () => /[0-9a-f]/i)]
};

type Segment = { width: number; suffix?: string; decimal?: boolean };

// Dynamic Maskito mask for functional notations (same principle as Maskito's IP-address recipe:
// the mask function receives the candidate value on every input, so the template mirrors what has
// been typed so far). It auto-inserts the `name(` prefix and the `, ` separators / `%` suffixes as
// digits flow in; segment widths cap the digits per channel; `)` closes once every segment exists.
const functionalMask = (name: string, segments: Segment[], alpha: Segment): MaskitoOptions => ({
	mask: ({ value }) => {
		// The displayed value switches to the `rgba(`/`hsla(` form when alpha < 1.
		const hasAlpha = value.toLowerCase().startsWith(`${name}a`);
		const specs = hasAlpha ? [...segments, alpha] : segments;
		const template: Array<string | RegExp> = [...(hasAlpha ? `${name}a(` : `${name}(`)];
		const inner = value.slice(value.indexOf('(') + 1).replace(/[^\d.,%]/g, '');
		const parts = inner.replace(/\)/g, '').split(',').slice(0, specs.length);
		parts.forEach((part, index) => {
			const spec = specs[index];
			if (index > 0) template.push(',', ' ');
			const digits = part.replace(/[^\d.]/g, '').length;
			const slots = Math.min(Math.max(digits, 1), spec.width);
			for (let i = 0; i < slots; i++) template.push(spec.decimal ? /[\d.]/ : /\d/);
			if (spec.suffix) template.push(spec.suffix);
			// A full segment flows straight into the next one: expose the separator and one slot so
			// continuous digit entry auto-inserts ", " (date-mask style).
			const isLast = index === parts.length - 1;
			if (isLast && digits >= spec.width && index < specs.length - 1) {
				template.push(',', ' ', specs[index + 1].decimal ? /[\d.]/ : /\d/);
			}
		});
		if (parts.length === specs.length) template.push(')');
		return template;
	}
});

const alphaSegment: Segment = { width: 4, decimal: true };

const rgbMask = functionalMask('rgb', [{ width: 3 }, { width: 3 }, { width: 3 }], alphaSegment);

const hslMask = functionalMask(
	'hsl',
	[{ width: 3 }, { width: 3, suffix: '%' }, { width: 3, suffix: '%' }],
	alphaSegment
);

export const colorMaskOptions = (format: ColorFormat): MaskitoOptions =>
	format === 'rgb' ? rgbMask : format === 'hsl' ? hslMask : hexMask;

// 0-100 integer mask for the alpha percentage input (values are clamped by Maskito on blur).
const alphaMaskOptions = maskitoNumberOptionsGenerator({ min: 0, max: 100 });

// Attachment masking a color text input for the current format; reads the format through a
// getter BEFORE untrack so the attachment re-runs (destroy + re-mask) when the format changes.
export const colorMask = (opts: { format: () => ColorFormat | undefined }) => {
	return (node: HTMLInputElement) => {
		const format = opts.format() ?? 'hex';
		return untrack(() => {
			const maskito = new Maskito(node, colorMaskOptions(format));
			return () => maskito.destroy();
		});
	};
};

// Attachment masking the alpha percentage input.
export const alphaMask = (node: HTMLInputElement) => {
	return untrack(() => {
		const maskito = new Maskito(node, alphaMaskOptions);
		return () => maskito.destroy();
	});
};

// Typed values often stop just short of the closing paren (the mask can't force it); complete it
// before parsing so "rgb(255, 0, 0" commits.
export const closeFunctional = (input: string): string =>
	input.includes('(') && !input.trimEnd().endsWith(')') ? `${input.trimEnd()})` : input;
