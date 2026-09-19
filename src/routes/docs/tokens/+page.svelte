<script lang="ts">
	import Code from '$lib/components/Code/Code.svelte';
	import Table from '$lib/components/Table/Table.svelte';
	import { themeColorRoles } from '$lib/components/Theme/theme.designTokens.js';
	import { breakpoints, containerBreakpoints } from '$lib/components/Theme/responsive.js';
	import { variants } from '$lib/tailwind/colors.js';
	import { geometryVariables } from '$lib/tailwind/geometry.js';
	import {
		defaultMotionTokens,
		defaultThemeSpacingScale,
		elevationLevels,
		motionDurationSteps,
		motionEasingRoles,
		radiusFactors,
		radiusSteps,
		spacingFactors,
		typeScalePresets,
		typeScaleRatios,
		typeScaleSteps
	} from '$lib/tailwind/scales.js';

	type Row = { name: string; detail: string; meaning: string };

	// --- Design tokens -------------------------------------------------------------
	// Every key of `ThemeDesignTokens`, with the default the compiler falls back to when the
	// key is omitted. A state-role key that is omitted emits no variable at all, so each use
	// site keeps following the control's own role.
	const roleUnion = themeColorRoles.map((role) => `'${role}'`).join(' | ');
	const spacingPresets = Object.keys(spacingFactors)
		.map((preset) => `'${preset}'`)
		.join(' | ');
	const radiusPresets = Object.keys(radiusFactors)
		.map((preset) => `'${preset}'`)
		.join(' | ');
	const typeScalePresetUnion = Object.keys(typeScalePresets)
		.map((preset) => `'${preset}'`)
		.join(' | ');
	const spacingScaleDefault = Object.entries(defaultThemeSpacingScale)
		.map(([step, multiplier]) => `${step}: ${multiplier}`)
		.join(', ');

	const designTokenRows: Array<{
		token: string;
		type: string;
		default: string;
		meaning: string;
	}> = [
		{
			token: 'spacing',
			type: `${spacingPresets} | number`,
			default: "'normal'",
			meaning:
				'Factor on the 0.25rem base unit, so every space, control height, row and icon scales together. Writes --spacing and redeclares the geometry family under it.'
		},
		{
			token: 'spacingScale',
			type: 'Partial<Record<"xs" | "sm" | "md" | "lg" | "xl", number>>',
			default: `{ ${spacingScaleDefault} }`,
			meaning:
				'Multiplier per named space step, applied to --spacing. Must stay strictly increasing; writes --space-xs … --space-xl.'
		},
		{
			token: 'radius',
			type: `${radiusPresets} | number`,
			default: "'normal'",
			meaning:
				'Factor on the whole radius ramp. Writes --radius and --radius-xs … --radius-4xl, so one value rounds or squares the entire library.'
		},
		{
			token: 'typeScale',
			type: `${typeScalePresetUnion} | TypeScaleOptions`,
			default: "'default'",
			meaning:
				'Fluid type ramp: base size at the narrow and wide viewport, plus the ratio between steps. Writes every --text-* step as a clamp().'
		},
		{
			token: 'elevation',
			type: "'flat' | 'normal' | 'high'",
			default: "'normal'",
			meaning:
				'Strength of the shadow ramp raised-* and lift-* read. flat removes shadows entirely. Writes --elevation-N, --elevation-tint-N and the bleed allowance.'
		},
		{
			token: 'motion',
			type: 'DeepPartial<{ duration, easing }>',
			default: `duration ${defaultMotionTokens.duration.normal}ms normal, easing '${defaultMotionTokens.easing.standard}' standard`,
			meaning:
				'The five duration steps in ms and the four easing roles. Writes --duration-* and --ease-*, which both the CSS utilities and the Svelte transitions read.'
		},
		{
			token: 'raisedWithBorder',
			type: 'boolean',
			default: 'true',
			meaning:
				'Whether raised-* draws its hairline border alongside the shadow. false keeps the shadow and drops the border. Writes --raised-border.'
		},
		{
			token: 'defaultColor',
			type: roleUnion,
			default: "'neutral'",
			meaning:
				'The semantic role chrome inherits when a control omits color. Repoints the whole current-role family (--color and companions).'
		},
		{
			token: 'focusColor',
			type: roleUnion,
			default: 'unset — each ring follows --color',
			meaning:
				'State role for the focus ring. Pinned once, every ring-focus in the library rings in this role instead of the control’s own. Writes --color-focus.'
		},
		{
			token: 'selectedColor',
			type: roleUnion,
			default: 'unset — each selection follows --color',
			meaning:
				'State role for a persistent highlight: active sidebar row, current menu option, selected table row, pressed toggle. Writes the whole --color-selected* kit.'
		},
		{
			token: 'hoverColor',
			type: roleUnion,
			default: 'unset — the layer tints with currentColor',
			meaning: 'State role for the transient hover tint state-layer paints. Writes --color-hover.'
		},
		{
			token: 'pressedColor',
			type: roleUnion,
			default: 'unset — falls back to hoverColor',
			meaning:
				'State role for the transient pressed tint. Writes --color-pressed, which falls back to --color-hover before currentColor.'
		}
	];

	const designTokensSnippet = `<script lang="ts">
	import { Theme } from 'svelai/theme';

	let { children } = $props();
</scr${'ipt'}>

<Theme
	designTokens={{
		light: {
			spacing: 'normal',
			radius: 'large',
			typeScale: 'comfortable',
			elevation: 'high',
			motion: { duration: { normal: 180 } },
			raisedWithBorder: true,
			defaultColor: 'neutral',
			focusColor: 'primary',
			selectedColor: 'primary',
			hoverColor: 'primary',
			pressedColor: 'primary'
		}
	}}
>
	{@render children()}
</Theme>`;

	// --- CSS variables -------------------------------------------------------------
	const roleVariantSuffixes = [
		'',
		...variants.map((variant) => `-${variant.toLowerCase()}`),
		'-readable',
		'-muted-readable'
	];

	const roleKitRows: Row[] = [
		{ name: '--color-<role>', detail: 'the solid fill', meaning: 'Buttons, badges, bars.' },
		{
			name: '--color-<role>-light / -lighter',
			detail: 'lifted steps',
			meaning: 'Hover fills and soft accents above the solid step.'
		},
		{
			name: '--color-<role>-dark',
			detail: 'a darker step',
			meaning: 'Pressed fills and borders that must read against the solid step.'
		},
		{
			name: '--color-<role>-muted',
			detail: 'a soft tint of the surface',
			meaning: 'Soft backgrounds: tags, tinted rows, tracks.'
		},
		{
			name: '--color-<role>-contrast',
			detail: 'ink ON the solid fill',
			meaning: 'Black or white, whichever clears AA on that fill.'
		},
		{
			name: '--color-<role>-readable',
			detail: 'ink on the plain surface',
			meaning: 'Coloured body text, pinned to a lightness that clears AA on --color-surface.'
		},
		{
			name: '--color-<role>-muted-readable',
			detail: 'ink on the muted tint',
			meaning: 'Coloured text inside a soft fill.'
		}
	];

	const surfaceRows: Row[] = [
		{
			name: '--color-surface',
			detail: 'the default page surface',
			meaning: 'Cards, panels, rows.'
		},
		{
			name: '--color-surface-recessed',
			detail: 'a step below the surface',
			meaning: 'Wells, tracks, inset areas.'
		},
		{
			name: '--color-surface-canvas',
			detail: 'the backdrop a surface floats on',
			meaning: 'The app canvas; also the ring offset colour.'
		},
		{
			name: '--color-surface-raised',
			detail: 'a step above the surface',
			meaning: 'Raised cards and sheets.'
		},
		{
			name: '--color-surface-floating',
			detail: 'the highest step',
			meaning: 'Popovers, menus, tooltips, dialogs.'
		}
	];

	const currentRoleRows: Row[] = [
		{
			name: '--color',
			detail: `var(--color-<role>)`,
			meaning:
				'The role the current subtree paints in. Points at designTokens.defaultColor, and [data-color] repoints it for that element and its children.'
		},
		{
			name: '--color-light, --color-lighter, --color-dark, --color-muted, --color-contrast, --color-readable, --color-muted-readable',
			detail: 'the same companions, for the current role',
			meaning: 'Every step of the kit above, following --color rather than a fixed role.'
		},
		{
			name: '--default-color',
			detail: 'the role NAME as a string',
			meaning: 'What designTokens.defaultColor resolved to; read by components that need the name.'
		}
	];

	const stateRoleRows: Row[] = [
		{
			name: '--color-focus',
			detail: 'undeclared by default',
			meaning:
				'Read by ring-focus and border-focus, which fall back to --color. Set by designTokens.focusColor.'
		},
		{
			name: '--color-selected, --color-selected-muted, --color-selected-contrast, --color-selected-muted-readable, --color-selected-readable',
			detail: 'undeclared by default',
			meaning:
				'The selection kit: a fill, its muted tint and the inks tuned for them. Each falls back to the matching current-role variable. Set by designTokens.selectedColor.'
		},
		{
			name: '--color-hover',
			detail: 'undeclared by default',
			meaning:
				'The tint state-layer paints on hover; falls back to currentColor. Set by designTokens.hoverColor.'
		},
		{
			name: '--color-pressed',
			detail: 'undeclared by default',
			meaning:
				'The tint state-layer paints on press; falls back to --color-hover, then currentColor. Set by designTokens.pressedColor.'
		},
		{
			name: '--state-hover-opacity / --state-pressed-opacity',
			detail: '0.05 / 0.1 light, 0.16 / 0.32 dark',
			meaning: 'How strong the state layer paints. Generated with the palette, per colour scheme.'
		},
		{
			name: '--state-selected-opacity',
			detail: '0.07 light, 0.10 dark',
			meaning:
				'How strong bg-selected-muted tints. The fill is a translucent tint of --color-selected, not an opaque colour, so a selected row reads the same on surface, surface-raised and surface-floating.'
		}
	];

	const elevationRows: Row[] = [
		{
			name: `--elevation-0 … --elevation-${elevationLevels[elevationLevels.length - 1]}`,
			detail: 'a box-shadow stack per level',
			meaning: 'What raised-N and lift-N cast. Scaled by designTokens.elevation.'
		},
		{
			name: `--elevation-tint-0 … --elevation-tint-${elevationLevels[elevationLevels.length - 1]}`,
			detail: 'a white overlay in dark mode, transparent in light',
			meaning: 'The tonal lift that makes a raised surface read in dark mode, where shadows do not.'
		},
		{
			name: '--elevation-bleed-x / --elevation-bleed-y',
			detail: 'how far the largest shadow reaches past its box',
			meaning:
				'The allowance a scroll or clip container pays so content flush with its edge is never cropped.'
		},
		{
			name: '--raised-border',
			detail: '1px solid var(--current-border, var(--color-neutral-muted))',
			meaning: 'The hairline raised-* draws. Set by designTokens.raisedWithBorder.'
		},
		{
			name: '--current-border',
			detail: 'undeclared by default',
			meaning:
				'Set it in your own CSS to recolour the raised hairline for a subtree without touching the shadow.'
		}
	];

	// `--space-micro` and the `--layout-space-*` family are declared by the spacing engine in
	// src/lib/tailwind/spacing.ts; the `--space-xs … --space-xl` multipliers come from
	// `defaultThemeSpacingScale` and are derived below.
	const spacingRows: Row[] = [
		{
			name: '--spacing',
			detail: '0.25rem × the spacing factor',
			meaning: 'The base unit every other size is a multiple of.'
		},
		{
			name: '--space-micro',
			detail: 'calc(var(--spacing) * 0.5)',
			meaning: 'Hairline gaps inside a control.'
		},
		...(Object.entries(defaultThemeSpacingScale) as Array<[string, number]>).map(
			([step, multiplier]) => ({
				name: `--space-${step}`,
				detail: `calc(var(--spacing) * ${multiplier})`,
				meaning: `The ${step} step of the component spacing scale; retune with designTokens.spacingScale.`
			})
		),
		{
			name: '--layout-space-sm / -md / -lg / -xl',
			detail: '5 / 6 / 8 / 12 × --spacing',
			meaning:
				'The page-level scale: section gutters and page padding, coarser than component gaps.'
		}
	];

	const radiusRows: Row[] = [
		{
			name: '--radius',
			detail: 'an alias of --radius-md',
			meaning: 'The control radius, so a bare rounded reads as a control.'
		},
		{
			name: '--radius-parent',
			detail: 'var(--radius-<step>) on the children of a rounded-<step>',
			meaning:
				'Engine-internal, never declared by hand: every rounded-<step> publishes its own radius to its children, and it inherits, so an unrounded wrapper in between is transparent. rounded-<step>-concentric reads it, falling back to an infinite radius outside any rounded container — where the child is then exactly its own step.'
		},
		{
			name: '--pad-parent-x / -y',
			detail: 'var(--space-<step>) on the children of a p / px / py',
			meaning:
				'Engine-internal, the other half of the cap rounded-<step>-concentric computes. It inherits like the radius, but every rounded-<step> resets it to 0px for its children, so padding never crosses a rounded boundary and a rounded box with no padding of its own passes nothing through.'
		},
		...(Object.entries(radiusSteps) as Array<[string, number]>).map(([step, rem]) => ({
			name: `--radius-${step}`,
			detail: `${rem}rem × the radius factor`,
			meaning:
				step === 'md'
					? 'Controls: buttons and inputs.'
					: step === 'lg'
						? 'Panels: cards, popovers, menus, alerts.'
						: step === 'xl'
							? 'Dialogs, drawers, large surfaces.'
							: 'A distinct step on the ramp.'
		}))
	];

	const nestedRadiusSnippet = `<!-- Nothing to declare: rounded-lg publishes --radius-parent to its children
     and p-xs publishes --pad-parent-x/-y, both halves of the cap. -->
<div class="bg-surface-raised rounded-lg p-xs">
  <!-- Flush against the padding box: keeps the md step, capped at what the corner allows. -->
  <button class="rounded-md-concentric px-md h-row-sm w-full">Concentric at every preset</button>
</div>

<!-- rounded-md-concentric: min(var(--radius-md),
                                calc(var(--radius-parent, calc(infinity * 1px))
                                     - max(var(--pad-parent-x, 0px), var(--pad-parent-y, 0px))))
     Outside any rounded container the parent radius is infinite, so the button is exactly md.
     No floor: CSS clamps a negative radius to 0, the square corner such a box really has. -->`;

	const typeRows: Row[] = [
		{
			name: `--text-${typeScaleSteps[0]} … --text-${typeScaleSteps[typeScaleSteps.length - 1]}`,
			detail: `${typeScaleSteps.length} fluid steps, each a clamp()`,
			meaning:
				'The whole type ramp, interpolating between the narrow- and wide-viewport base size. Retune with designTokens.typeScale.'
		},
		{
			name: 'the two steps below base',
			detail: 'floored at 12px and 14px',
			meaning: 'A legibility floor: no ratio can push xs or sm below a readable size.'
		}
	];

	const geometryFamilies: Array<{ prefix: string; meaning: string }> = [
		{
			prefix: '--control-height-',
			meaning: 'Interactive control heights: buttons, inputs, triggers.'
		},
		{
			prefix: '--row-height-',
			meaning: 'List, table and menu row heights — the density scale, tracked apart from controls.'
		},
		{ prefix: '--icon-size-', meaning: 'Icon box sizes.' },
		{ prefix: '--hit-area-', meaning: 'Minimum touch target for an icon-only control.' },
		{ prefix: '--indent-', meaning: 'Inline-start indent for nested rows in a tree.' }
	];
	const geometryRows: Row[] = geometryFamilies.map(({ prefix, meaning }) => {
		const entries = Object.entries(geometryVariables).filter(([name]) => name.startsWith(prefix));
		return {
			name: entries.map(([name]) => name).join(', '),
			detail:
				entries
					.map(([, value]) => value.replace('calc(var(--spacing) * ', '').replace(')', ''))
					.join(' / ') + ' × --spacing',
			meaning
		};
	});

	const motionRows: Row[] = [
		{
			name: motionDurationSteps.map((step) => `--duration-${step}`).join(', '),
			detail: motionDurationSteps
				.map((step) => `${defaultMotionTokens.duration[step]}ms`)
				.join(' / '),
			meaning:
				'The duration steps. Zeroed to 0.01ms while reduced motion is on, so CSS transitions stop with the Svelte ones.'
		},
		{
			name: motionEasingRoles.map((role) => `--ease-${role}`).join(', '),
			detail: motionEasingRoles.map((role) => defaultMotionTokens.easing[role]).join(' / '),
			meaning:
				'The easing roles as cubic-bezier() strings; the same curves the Svelte transitions resolve.'
		}
	];

	const windowRows: Row[] = [
		{
			name: '--window-height',
			detail: 'the real visual viewport height in px',
			meaning: 'Written by Theme. h-window reads it, falling back to 100dvh.'
		},
		{
			name: '--window-width',
			detail: 'window.innerWidth in px',
			meaning: 'Written by Theme and read by w-window.'
		}
	];

	// --- Utilities -----------------------------------------------------------------
	const colorUtilityValues = [
		'(bare)',
		'light',
		'lighter',
		'dark',
		'muted',
		'contrast',
		'readable',
		'muted-readable'
	].join(', ');

	const utilityRows: Array<{ family: string; values: string; sets: string }> = [
		{
			family:
				'text-color*, bg-color*, border-color* (and -top/-right/-bottom/-left/-s/-e), ring-color*, ring-offset-color*, shadow-color*, fill-color*, stroke-color*',
			values: colorUtilityValues,
			sets: 'The matching current-role variable, so the utility follows --color and [data-color]. Every one takes an opacity modifier (text-color-muted-readable/70).'
		},
		{
			family: 'ring-focus, border-focus',
			values: '(bare)',
			sets: 'var(--color-focus, var(--color)) — the focus state role, falling back to the current role.'
		},
		{
			family:
				'bg-selected, bg-selected-muted, text-selected, text-selected-contrast, text-selected-muted-readable, border-selected, ring-selected',
			values: '(bare) plus the suffix in the name',
			sets: 'The matching --color-selected* variable, falling back to the current role. Opacity modifiers work (bg-selected/12).'
		},
		{
			family: 'raised-*',
			values: '(bare) = 2, none, 0–5, xs, sm, md, lg, xl, 2xl',
			sets: 'The elevation shadow stack, the dark-mode tonal tint and the hairline border. Composes with ring-* rather than replacing box-shadow.'
		},
		{
			family: 'lift-*',
			values: 'the same value map as raised-*',
			sets: 'The same shadow and tint with no border — thumbs, indicators, pills, drag previews, tooltips.'
		},
		{
			family: 'state-layer',
			values: '—',
			sets: 'A ::before tint layer that paints --color-hover on hover and --color-pressed on press, at --state-hover-opacity / --state-pressed-opacity.'
		},
		{
			family: 'h-control-*, h-row-*, min-h-row-*, size-icon-*, min-size-hit-*, ps-indent-*',
			values: 'sm/md/lg (icons xs–xl, indents sm–xl)',
			sets: 'The matching geometry variable, so every control, row and icon follows --spacing.'
		},
		{
			family: 'gap*, p*, m*, top/right/bottom/left',
			values: 'micro, xs, sm, md, lg, xl, layout-sm, layout-md, layout-lg, layout-xl',
			sets: 'The --space-* / --layout-space-* families. Margins accept negative values.'
		},
		{
			family: 'duration-*, ease-*',
			values: `${motionDurationSteps.join(', ')} / ${motionEasingRoles.join(', ')}`,
			sets: 'The motion tokens, as both the longhand and the --tw-duration / --tw-ease variables core transition-* reads.'
		},
		{
			family: 'h-window, w-window',
			values: '—',
			sets: '--window-height (falling back to 100dvh) and --window-width.'
		},
		{
			family: 'shimmer, shimmer-once, shimmer-reverse, shimmer-none',
			values: '—',
			sets: 'The loading sweep. See the Shimmer utility page.'
		},
		{
			family:
				'scroll-fade, scroll-fade-x/-y, scroll-fade-t/-b/-l/-r/-s/-e, scroll-fade-static, scroll-fade-none',
			values: '—',
			sets: 'Mask a scroll container’s overflowing edges. See the Scroll fade utility page.'
		},
		{
			family: 'ui-spinner',
			values: '—',
			sets: 'The shared spinner animation, picked by the plugin’s spinner option.'
		},
		{
			family: '@min-[…] container variants',
			values: Object.values(containerBreakpoints).join(', '),
			sets: 'Not a token, but the mechanism responsive layout props compile to: a container query on the component’s own width.'
		}
	];

	const containerRows = breakpoints.map((breakpoint) => ({
		breakpoint,
		width:
			breakpoint === 'xs'
				? 'below sm'
				: `${containerBreakpoints[breakpoint as Exclude<typeof breakpoint, 'xs'>]} (${Number.parseFloat(containerBreakpoints[breakpoint as Exclude<typeof breakpoint, 'xs'>]) * 16}px)`,
		viewport:
			breakpoint === 'xs'
				? 'below 640px'
				: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' }[breakpoint]
	}));

	const cssSnippet = `/* Read or set the public families in your own CSS. */
.my-panel {
	background: var(--color-surface-raised);
	color: var(--color-neutral-readable);
	padding: var(--space-lg);
	border-radius: var(--radius-lg);
	font-size: var(--text-sm);
	box-shadow: var(--elevation-2);
	transition: opacity var(--duration-normal) var(--ease-standard);
}

/* Recolour the raised hairline for one subtree. */
.my-section {
	--current-border: var(--color-primary-muted);
}`;

	const typeScaleRatioList = Object.entries(typeScaleRatios)
		.map(([name, ratio]) => `${name} ${ratio}`)
		.join(' · ');
</script>

<article class="text-neutral mx-auto flex w-full max-w-5xl flex-col gap-14 pb-24">
	<header class="flex max-w-3xl flex-col gap-3">
		<h1 class="text-3xl font-semibold">Tokens</h1>
		<p class="text-balance">
			Every consumer-facing token in one place: the <code>designTokens</code> keys a
			<code>&lt;Theme&gt;</code>
			sets, the CSS variables those keys write — which you may also read or set in your own CSS — and
			the utility families that read them back.
		</p>
	</header>

	<section id="design-tokens" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">1. Design tokens</h2>
			<p class="mt-1 text-sm leading-relaxed">
				<code>designTokens</code> is keyed by theme name, and every key below is optional: a theme
				that declares only <code>radius</code> inherits every other default instead of resetting it. The
				four state roles are the exception to "has a default" — omit one and no variable is emitted at
				all, so each use site keeps following the control's own role.
			</p>
		</div>
		<Table
			density="compact"
			header={{ token: 'Token', type: 'Type', default: 'Default', meaning: 'What it does' }}
			items={designTokenRows.map((row) => ({
				cells: {
					token: { content: row.token, class: 'font-mono text-xs whitespace-nowrap' },
					type: { content: row.type, class: 'font-mono text-xs' },
					default: { content: row.default, class: 'font-mono text-xs' },
					meaning: row.meaning
				}
			}))}
		/>
		<Code language="svelte" code={designTokensSnippet} />
		<p class="max-w-3xl text-sm leading-relaxed">
			The type ramp's <code>scale</code> option takes one of {typeScaleRatioList}. An unknown role,
			preset or easing name throws, naming the token that carried it.
		</p>
	</section>

	<section id="color-variables" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">2. Colour variables</h2>
			<p class="mt-1 text-sm leading-relaxed">
				Each of the {themeColorRoles.length} semantic roles ({themeColorRoles.join(', ')}) is
				generated as a kit of {roleVariantSuffixes.length} variables —
				<code>--color-&lt;role&gt;</code>
				plus every suffix below. A role is a fill and the inks that stay legible on it, not a hue you
				pick per element.
			</p>
		</div>
		<Table
			density="compact"
			header={{ name: 'Variable', detail: 'Value', meaning: 'Use' }}
			items={roleKitRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs' },
					detail: row.detail,
					meaning: row.meaning
				}
			}))}
		/>

		<h3 class="mt-4 text-base font-semibold">Surfaces</h3>
		<Table
			density="compact"
			header={{ name: 'Variable', detail: 'Value', meaning: 'Use' }}
			items={surfaceRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs' },
					detail: row.detail,
					meaning: row.meaning
				}
			}))}
		/>

		<h3 class="mt-4 text-base font-semibold">The current role</h3>
		<p class="max-w-3xl text-sm leading-relaxed">
			Components paint in <code>--color</code> and its companions rather than a named role, which is
			what lets one <code>color</code> prop — or a <code>[data-color]</code> attribute — repoint a whole
			subtree.
		</p>
		<Table
			density="compact"
			header={{ name: 'Variable', detail: 'Points at', meaning: 'Notes' }}
			items={currentRoleRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs' },
					detail: row.detail,
					meaning: row.meaning
				}
			}))}
		/>

		<h3 class="mt-4 text-base font-semibold">The four state roles</h3>
		<Table
			density="compact"
			header={{ name: 'Variable', detail: 'Default', meaning: 'Read by' }}
			items={stateRoleRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs' },
					detail: row.detail,
					meaning: row.meaning
				}
			}))}
		/>
	</section>

	<section id="scale-variables" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">3. Scale variables</h2>
			<p class="mt-1 text-sm leading-relaxed">
				One base unit and four ramps derived from it. A custom property resolves where it is
				declared, so any scope that overrides <code>--spacing</code> also redeclares the geometry family
				under it.
			</p>
		</div>

		<h3 class="text-base font-semibold">Spacing</h3>
		<Table
			density="compact"
			header={{ name: 'Variable', detail: 'Value', meaning: 'Use' }}
			items={spacingRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs whitespace-nowrap' },
					detail: { content: row.detail, class: 'font-mono text-xs' },
					meaning: row.meaning
				}
			}))}
		/>

		<h3 class="mt-4 text-base font-semibold">Radius</h3>
		<Table
			density="compact"
			header={{ name: 'Variable', detail: 'Value', meaning: 'Use' }}
			items={radiusRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs whitespace-nowrap' },
					detail: { content: row.detail, class: 'font-mono text-xs' },
					meaning: row.meaning
				}
			}))}
		/>

		<h4 class="mt-4 text-sm font-semibold">Concentric radius</h4>
		<p class="text-neutral/70 mt-1 max-w-3xl text-sm leading-relaxed">
			Two concentric rounded boxes look concentric only when the inner radius is no larger than the
			outer one minus the gap between them, and that gap is the container's padding. Both halves are
			already on the container as utilities, so they publish themselves:
			<code>rounded-&lt;step&gt;</code> hands <code>--radius-parent</code> to its children,
			<code>p</code> / <code>px</code> / <code>py</code> hand over <code>--pad-parent-x/-y</code>,
			and every child flush against the padding box writes
			<code>rounded-&lt;step&gt;-concentric</code> (also
			<code>rounded-t-&lt;step&gt;-concentric</code> and
			<code>rounded-b-&lt;step&gt;-concentric</code>) to keep its own step capped at that
			difference. Nothing is declared and nothing is eyeballed. Both halves ride the
			<code>radius</code> and <code>spacing</code> design tokens, so a theme that rounds or squares
			the library can never let the child cut across the container's corner;
			<code>rounded-&lt;step&gt;-concentric</code> with no rounded container above it is exactly its step,
			and one whose cap would fall below zero is simply square.
		</p>
		<div class="bg-surface-raised raised-1 gap-md p-lg mt-4 grid rounded-lg sm:grid-cols-3">
			{#each [['sm', 'rounded-lg p-xs'], ['md', 'rounded-xl p-md'], ['lg', 'rounded-2xl p-lg']] as [label, container] (label)}
				<div class="gap-xs grid">
					<span class="text-neutral/70 font-mono text-xs">{container}</span>
					<div class="bg-surface-floating {container}">
						<div
							class="bg-primary-muted text-primary-muted-readable px-md py-sm rounded-md-concentric text-xs"
						>
							rounded-md-concentric
						</div>
					</div>
				</div>
			{/each}
		</div>
		<Code language="svelte" code={nestedRadiusSnippet} />

		<h3 class="mt-4 text-base font-semibold">Type</h3>
		<Table
			density="compact"
			header={{ name: 'Variable', detail: 'Value', meaning: 'Use' }}
			items={typeRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs' },
					detail: row.detail,
					meaning: row.meaning
				}
			}))}
		/>

		<h3 class="mt-4 text-base font-semibold">Geometry</h3>
		<Table
			density="compact"
			header={{ name: 'Variables', detail: 'Multiples of --spacing', meaning: 'Use' }}
			items={geometryRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs' },
					detail: { content: row.detail, class: 'font-mono text-xs' },
					meaning: row.meaning
				}
			}))}
		/>

		<h3 class="mt-4 text-base font-semibold">Elevation</h3>
		<Table
			density="compact"
			header={{ name: 'Variable', detail: 'Value', meaning: 'Use' }}
			items={elevationRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs' },
					detail: { content: row.detail, class: 'font-mono text-xs' },
					meaning: row.meaning
				}
			}))}
		/>

		<h3 class="mt-4 text-base font-semibold">Motion</h3>
		<Table
			density="compact"
			header={{ name: 'Variables', detail: 'Defaults', meaning: 'Notes' }}
			items={motionRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs' },
					detail: { content: row.detail, class: 'font-mono text-xs' },
					meaning: row.meaning
				}
			}))}
		/>

		<h3 class="mt-4 text-base font-semibold">Window</h3>
		<Table
			density="compact"
			header={{ name: 'Variable', detail: 'Value', meaning: 'Notes' }}
			items={windowRows.map((row) => ({
				cells: {
					name: { content: row.name, class: 'font-mono text-xs whitespace-nowrap' },
					detail: row.detail,
					meaning: row.meaning
				}
			}))}
		/>

		<Code language="css" code={cssSnippet} />
	</section>

	<section id="breakpoints" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">4. Breakpoints</h2>
			<p class="mt-1 text-sm leading-relaxed">
				<code>xs | sm | md | lg | xl</code> name five steps in two different resolvers. Overlays and
				chrome measure the <strong>viewport</strong>; host-sized layout (Grid, GridSpan, Stack,
				Carousel) measures the <strong>container</strong> — the width the component was actually handed
				— and the two ladders do not step at the same widths. A prop's JSDoc says which one it uses.
			</p>
		</div>
		<Table
			density="compact"
			header={{
				breakpoint: 'Step',
				width: 'Container width (from containerBreakpoints)',
				viewport: 'Viewport width'
			}}
			items={containerRows.map((row) => ({
				cells: {
					breakpoint: { content: row.breakpoint, class: 'font-mono text-xs' },
					width: { content: row.width, class: 'font-mono text-xs' },
					viewport: { content: row.viewport, class: 'font-mono text-xs' }
				}
			}))}
		/>
	</section>

	<section id="utilities" class="flex flex-col gap-5">
		<div class="max-w-3xl">
			<h2 class="text-lg font-semibold">5. Utility families</h2>
			<p class="mt-1 text-sm leading-relaxed">
				The classes that read the variables above. Nothing here hard-codes a colour or a size: each
				one resolves a token, so retuning a design token moves every use at once.
			</p>
		</div>
		<Table
			density="compact"
			header={{ family: 'Family', values: 'Values', sets: 'What it sets' }}
			items={utilityRows.map((row) => ({
				cells: {
					family: { content: row.family, class: 'font-mono text-xs' },
					values: { content: row.values, class: 'font-mono text-xs' },
					sets: row.sets
				}
			}))}
		/>
	</section>

	<section id="private-variables" class="flex max-w-3xl flex-col gap-3">
		<h2 class="text-lg font-semibold">6. Private variables</h2>
		<p class="text-sm leading-relaxed">
			Anything named after a component — <code>--page-shell-*</code>,
			<code>--sidebar-*</code>, <code>--carousel-*</code>, <code>--stack-*</code>,
			<code>--grid-*</code>, <code>--timeline-*</code>, <code>--gantt-*</code>,
			<code>--event-calendar-*</code>, <code>--spinner-size</code>, and the rest — is an
			implementation detail, not a token. A component writes those properties on its own elements to
			hand a resolved value down to its parts, or to feed its container queries, and both the name
			and the value can change in any release without notice. Do not declare one in your own CSS and
			do not read one: reach for the component's prop, its <code>theme</code> override, or a design token
			from this page instead. The families documented above are the whole public surface.
		</p>
	</section>
</article>
