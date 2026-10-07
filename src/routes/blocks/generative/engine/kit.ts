import type { Colors, Sizes } from '$lib/types/theme.js';
import type { ButtonVariant } from '$lib/components/Button/button.props.js';
import type { Params, SectionType } from './types.js';

/**
 * The component kit: page-level levers over the props every Entasis component shares. Because
 * the library normalises them — `size` is always small | normal | large, `variant` always draws
 * from solid | outline | soft | ghost, `color` always takes a semantic role — one kit restyles
 * every button, chip, field and badge on the page at once, and stays coherent while it does.
 *
 * It is enumerated, filtered and picked exactly like a section type (category `kit`), so
 * directions narrow and weight it with the same tables.
 */
export const kitType: SectionType = {
	id: 'kit',
	category: 'kit',
	title: 'Component kit',
	description: 'Shared component props: control size, accent role, and the variants actions use.',
	file: '',
	dims: {
		size: ['normal', 'small', 'large'],
		accent: ['primary', 'neutral', 'secondary'],
		primary: ['solid', 'soft'],
		secondary: ['outline', 'ghost', 'soft', 'link'],
		chip: ['soft', 'outline', 'solid']
	},
	meta: {
		size: {
			label: 'Control size',
			values: { small: 'Small', normal: 'Normal', large: 'Large' },
			hint: 'Every Button, field, Chip and Avatar steps from this size.'
		},
		accent: {
			label: 'Accent',
			values: { primary: 'Primary', neutral: 'Neutral', secondary: 'Secondary' },
			hint: 'The colour role emphasis components take.'
		},
		primary: {
			label: 'Primary action',
			values: { solid: 'Solid', soft: 'Soft' },
			hint: 'Button variant of the main call to action.'
		},
		secondary: {
			label: 'Secondary action',
			values: { outline: 'Outline', ghost: 'Ghost', soft: 'Soft', link: 'Link' }
		},
		chip: {
			label: 'Chips',
			values: { soft: 'Soft', outline: 'Outline', solid: 'Solid' },
			hint: 'Chip variant for eyebrows, badges and tags.'
		}
	},
	rules: [
		{
			id: 'distinct-actions',
			text: 'The two actions never share a variant',
			test: (p) => p.primary !== p.secondary
		},
		{
			id: 'soft-needs-colour',
			text: 'A soft main action needs a coloured role; on neutral it reads as disabled',
			test: (p) => p.primary !== 'soft' || p.accent === 'primary'
		},
		{
			id: 'soft-pair-contrast',
			text: 'A soft main action pairs with a quieter ghost or link, never an outline',
			test: (p) => p.primary !== 'soft' || p.secondary === 'ghost' || p.secondary === 'link'
		},
		{
			id: 'secondary-solid',
			text: 'The secondary role is pale in the default palette: it only works as a solid action',
			test: (p) => p.accent !== 'secondary' || (p.primary === 'solid' && p.chip !== 'soft')
		},
		{
			id: 'link-size',
			text: 'A link action at small size loses its hit area: links need normal or large controls',
			test: (p) => p.secondary !== 'link' || p.size !== 'small'
		}
	]
};

export const defaultKitParams: Params = {
	size: 'normal',
	accent: 'primary',
	primary: 'solid',
	secondary: 'outline',
	chip: 'soft'
};

const sizeSteps: Sizes[] = ['small', 'normal', 'large'];

export interface SectionKit {
	/** Base control size; sections step up or down from it to keep their own hierarchy. */
	size: Sizes;
	accent: Colors;
	primary: ButtonVariant;
	secondary: ButtonVariant;
	chip: 'soft' | 'outline' | 'solid';
	/** The base size moved `offset` steps along small → normal → large, clamped. */
	step: (offset: number) => Sizes;
	/**
	 * Avatar stacks step like everything else but never below normal: at small, the group's
	 * overlap clips two-letter initials into each other.
	 */
	stack: (offset: number) => Sizes;
	/** Props for a main action; on a brand-coloured surface it takes the neutral role. */
	action: (onBrand?: boolean) => { color: Colors; variant: ButtonVariant };
	/** Props for a secondary action, always neutral so it never competes with the main one. */
	quiet: () => { color: Colors; variant: ButtonVariant };
}

export function resolveKit(params: Params = defaultKitParams): SectionKit {
	const read = <T>(name: string) => (params[name] ?? defaultKitParams[name]) as T;
	const size = read<Sizes>('size');
	const accent = read<Colors>('accent');
	const primary = read<ButtonVariant>('primary');
	const secondary = read<ButtonVariant>('secondary');
	return {
		size,
		accent,
		primary,
		secondary,
		chip: read('chip'),
		step: (offset) =>
			sizeSteps[Math.min(2, Math.max(0, sizeSteps.indexOf(size) + offset))] ?? 'normal',
		stack: (offset) =>
			sizeSteps[Math.min(2, Math.max(1, sizeSteps.indexOf(size) + offset))] ?? 'normal',
		action: (onBrand = false) =>
			onBrand ? { color: 'neutral', variant: 'solid' } : { color: accent, variant: primary },
		quiet: () => ({ color: 'neutral', variant: secondary })
	};
}
