import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'svelte/compiler';
import ts from 'typescript';
import {
	createSourceProgram,
	listSources,
	propertyName,
	repositoryRoot
} from './component-contract/source.mjs';

const componentsDirectory = path.join(repositoryRoot, 'src/lib/components');
const errors = new Set();
const themeOwners = new Set();
const files = await listSources(
	path.join(repositoryRoot, 'src/lib'),
	(name) =>
		/\.(ts|svelte)$/.test(name) &&
		!/\.(mcp|test|spec|bench)\./.test(name) &&
		!name.includes('/generated/') &&
		!name.includes('/utils/cva/')
);
const program = createSourceProgram(files.filter((name) => name.endsWith('.ts')));
const checker = program.getTypeChecker();
const geometryExceptions = new Map([
	['MiniCalendar/miniCalendar.theme.ts', new Map([['-m-0.5', 'Calendar cell border overlap']])],
	[
		'Dialog/dialog.theme.ts',
		new Map([
			[
				'p-(--drawer-inset)',
				'Drawer stand-off is the drawerInset design token (--drawer-inset), a step chosen per theme'
			]
		])
	],
	[
		'AudioPlayer/audioPlayer.theme.ts',
		new Map([
			['gap-[3px]', 'Fixed waveform bar separation'],
			['h-8', 'Small seek track hit area sized around the bar it draws (before:h-1.5)'],
			['h-10', 'Normal seek track hit area sized around the bar it draws (before:h-2)'],
			['h-12', 'Large seek track hit area sized around the bar it draws (before:h-2.5)']
		])
	],
	[
		'Spinner/spinner.theme.ts',
		new Map([
			['gap-[calc(var(--spinner-size)*0.1)]', 'Pulse geometry scales with spinner diameter']
		])
	],
	[
		'Avatar/avatar.theme.ts',
		new Map([['p-[0.25rem]', 'Status badge clearance around the circular avatar']])
	],
	[
		'Avatar/avatarGroup.theme.ts',
		new Map([
			['gap-[-0.25rem]', 'Avatar stack overlap'],
			['ml-[0.3rem]', 'Leading compensation for avatar overlap'],
			['[&>[data-avatar]]:ml-[-0.45rem]', 'Normal avatar stack overlap'],
			['[&>[data-avatar]]:ml-[-0.4rem]', 'Small avatar stack overlap'],
			['[&>[data-avatar]]:ml-[-0.5rem]', 'Large avatar stack overlap'],
			['ml-[-0.75rem]', 'Overflow counter overlap']
		])
	],
	[
		'Popover/popover.theme.ts',
		new Map([
			[
				'pb-[calc(env(safe-area-inset-bottom)+1rem)]',
				'Mobile sheet clearance includes the device safe area'
			]
		])
	],
	[
		'Command/command.dialog.theme.ts',
		new Map([['pt-[15vh]', 'Command palette offset from the viewport top']])
	],
	[
		'Form/Slider/slider.theme.ts',
		new Map([
			['h-7', 'Thumb length paired with the track it rides, not a control height'],
			['h-8', 'Contained small track, its label gutter and the large thumb share one geometry'],
			['h-9', 'Large vertical thick thumb length'],
			['h-10', 'Contained normal track, mark rail and label gutter share one geometry'],
			['h-12', 'Contained large track, mark rail and label gutter share one geometry']
		])
	],
	[
		'Form/Switch/switch.theme.ts',
		new Map([['h-7', 'Large toggle track height, paired with its w-12 rail and size-6 thumb']])
	],
	[
		'Dialog/dialog.theme.ts',
		new Map([['h-12', 'Drawer grab handle length is an affordance, not a control height']])
	],
	[
		'Resizable/resizable.theme.ts',
		new Map([
			['h-7', 'Grip pill sized around its two dot columns'],
			['h-8', 'Thumb handle length along the split']
		])
	],
	[
		'Sidebar/sidebar.theme.ts',
		new Map([
			['after:h-8', 'Rail grip thumb length'],
			['hover:after:h-10', 'Rail grip grows under the pointer']
		])
	],
	[
		'Toast/toast.theme.ts',
		new Map([['max-h-10', 'Media cap keeps a suffix from growing the toast']])
	],
	[
		'Form/Calendar/calendar.theme.ts',
		new Map([['max-h-10', 'Day cell stays square; the cap bounds its aspect-driven height']])
	],
	[
		'Form/VoiceInput/voiceInput.theme.ts',
		new Map([
			['h-8', 'Waveform canvas height, drawn geometry rather than a control'],
			['h-9', 'Large waveform canvas height, drawn geometry rather than a control'],
			['min-h-8', 'Collapsed compact pill wraps the round action button and shares its size'],
			['min-h-9', 'Collapsed compact pill wraps the round action button and shares its size'],
			['min-h-10', 'Collapsed compact pill wraps the round action button and shares its size']
		])
	],
	[
		'VideoPlayer/videoPlayer.theme.ts',
		new Map([['h-11', 'Seek bar hit area and its native range overlay are one pointer target']])
	],
	[
		'FloatingWindow/floatingWindow.theme.ts',
		new Map([['h-9', 'Window chrome height shared by the title bar and the docked item']])
	]
]);
const usedGeometryExceptions = new Set();

// Motion literals must come from the semantic scale (`duration-fast`, `ease-standard`, …)
// so a theme retuning `--duration-*` / `--ease-*` moves every component with it. Exceptions
// are per file + per utility and must carry a justification; an unused one fails the check
// so the map cannot rot after a component is migrated.
const motionExceptions = new Map([]);
const usedMotionExceptions = new Set();
// Reveal-on-hover affordances that must paint a fill instead of riding `state-layer`. Same
// shape, justification and rot check as `motionExceptions`.
const hoverExceptions = new Map([]);
const usedHoverExceptions = new Set();
// `ease-linear` stays: constant-rate loops (spinners, progress sweeps) must not ease.
const allowedEasings = new Set([
	'ease-linear',
	'ease-standard',
	'ease-enter',
	'ease-exit',
	'ease-emphasized'
]);

const lowerOwner = (name) =>
	name
		.replace(/^[A-Z]+(?=[A-Z][a-z]|$)/, (prefix) => prefix.toLowerCase())
		.replace(/^[A-Z]/, (letter) => letter.toLowerCase());
const unwrap = (node) =>
	node &&
	(ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))
		? unwrap(node.expression)
		: node;
const isExported = (node) =>
	node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

function utilityPart(token) {
	let depth = 0;
	let start = 0;
	for (let index = 0; index < token.length; index += 1) {
		if (token[index] === '[' || token[index] === '(') depth += 1;
		else if (token[index] === ']' || token[index] === ')') depth -= 1;
		else if (token[index] === ':' && depth === 0) start = index + 1;
	}
	return token.slice(start).replace(/^!|!$/g, '');
}

// Motion literals are checked everywhere classes are written — theme files *and* component
// markup — because the whole point of the scale is that a `<Theme motion>` retune reaches
// every animated element. The geometry rules below stay theme-file-only.
function checkMotionClasses(source, filename) {
	const relative = path.relative(componentsDirectory, filename);
	for (const token of source.split(/\s+/)) {
		if (!token) continue;
		const utility = utilityPart(token);
		if (motionExceptions.get(relative)?.has(utility)) {
			usedMotionExceptions.add(`${relative}::${utility}`);
			continue;
		}
		if (/^duration-(?:\d|\[)/.test(utility))
			errors.add(`${relative}: raw motion duration ${token} — use a duration-* scale token`);
		if (/^ease-/.test(utility) && !allowedEasings.has(utility))
			errors.add(`${relative}: raw easing ${token} — use an ease-* role token`);
		if (utility === 'transition-all')
			errors.add(
				`${relative}: ${token} transitions every property — list the animated properties explicitly`
			);
	}
}

// Disabled controls dim to one opacity and focus rings sit at one opacity of their role
// colour, so every component reads as one family. Both used to drift (50/55/60, five ring
// opacities); these rules keep the single value from regressing.
const DISABLED_OPACITY = '50';
const FOCUS_RING_OPACITY = '50';
// One ring colour for the whole library: the `focus` STATE ROLE. `ring-focus` falls back to the
// current role, so neutral chrome still rings neutral and a coloured control still rings in its
// own colour — but a theme that sets `designTokens.focusColor` now moves every ring at once,
// which `ring-color/50` could never do. `danger` is the single other role allowed — an errored
// field rings red whatever its role is.
const FOCUS_RING_ROLE = 'focus';
const FOCUS_RING_ROLES = new Set([FOCUS_RING_ROLE, 'danger']);
const RESTING_RING =
	/^ring-(?:selected|color|primary|secondary|neutral|current|danger|success|warning|info|white|black)(?:-[a-z-]+)?\/\d+$/;
// Rings that are a *selection* or *alert* emphasis rather than a hairline: they have to read
// louder than `ring-neutral-muted` to mark the one chosen row, swatch, cell or cluster. Same
// shape, justification and rot check as the other exception maps.
const ringExceptions = new Map([
	[
		'Form/PinInput/pinInput.theme.ts',
		new Map([['ring-selected/40', 'Filled-cell marker, louder than the empty cells it sits among']])
	],
	[
		'Form/ColorPicker/colorPicker.theme.ts',
		new Map([['ring-selected/60', 'Selected swatch marker over an arbitrary user colour']])
	],
	[
		'GanttChart/ganttChart.theme.ts',
		new Map([
			['ring-selected/60', 'Selected task bar marker'],
			['data-[gantt-reorder-parent]:ring-selected/25', 'Drop-target parent row during a reorder'],
			['data-[critical]:ring-danger/55', 'Critical-path alert ring']
		])
	],
	[
		'EventCalendar/eventCalendar.theme.ts',
		new Map([['ring-selected/60', 'Selected event marker']])
	],
	['Timeline/timeline.theme.ts', new Map([['ring-selected/45', 'Active timeline node marker']])],
	['DataTable/dataTable.theme.ts', new Map([['ring-selected/70', 'Keyboard-focused cell marker']])]
]);
const usedRingExceptions = new Set();
// `focus`, `focus-visible` and `focus-within` on their own, and inside a composed variant:
// `has-[input:focus-visible]`, `group-focus-visible`, `peer-focus`, `data-[focus]`.
const FOCUS_SEGMENT = /(?:^|[^a-z])focus(?:-visible|-within)?(?:$|[^a-z-])/;
const isFocusVariant = (token) =>
	variantSegments(token).some((segment) => FOCUS_SEGMENT.test(segment));
function checkStateClasses(source, filename) {
	const relative = path.relative(componentsDirectory, filename);
	const dimsDisabled = /(?:^|[\s:])(?:disabled|cursor-not-allowed)\b/.test(source);
	for (const token of source.split(/\s+/)) {
		if (!token) continue;
		const utility = utilityPart(token);
		const opacity = utility.match(/^opacity-(\d+)$/);
		if (dimsDisabled && opacity && !['0', '100', DISABLED_OPACITY].includes(opacity[1]))
			errors.add(
				`${relative}: disabled state uses ${token} — every disabled control dims to opacity-${DISABLED_OPACITY}`
			);
		// A focus ring is any ring written behind a *focus* variant, however that variant is
		// composed: `focus-visible:`, but also the `has-[input:focus-visible]:` a media control
		// wears (the ring is on the box, the focus is on the range input inside it),
		// `group-focus-visible:` on a thumb and `peer-focus:` on a sibling. Matching the bare
		// `focus*:` prefix alone is what let AudioPlayer's waveform, its scrubber and VoiceInput's
		// waveform keep `ring-color/60` through the state-role sweep.
		const ring = isFocusVariant(token)
			? utility.match(
					/^ring-(focus|selected|color|primary|secondary|neutral|current|danger|success|warning|info)(?:\/(\d+))?$/
				)
			: null;
		if (ring && ring[2] !== FOCUS_RING_OPACITY)
			errors.add(
				`${relative}: focus ring ${token} — focus rings are ring-${FOCUS_RING_ROLE}/${FOCUS_RING_OPACITY} (ring-danger/${FOCUS_RING_OPACITY} for error states)`
			);
		if (ring && !FOCUS_RING_ROLES.has(ring[1]))
			errors.add(
				`${relative}: focus ring ${token} — focus rings use the focus state role (ring-${FOCUS_RING_ROLE}/${FOCUS_RING_OPACITY})`
			);
		// A ring at an opacity is the focus affordance and nothing else. A *resting* hairline —
		// a card, a floating window, a popover edge — drifted across `/10`, `/15`, `/25`, so it
		// now names the border token the rest of the library draws (`ring-neutral-muted`, or
		// `ring-color-muted` when the chrome follows the current role) and moves with it.
		if (!isFocusVariant(token) && RESTING_RING.test(utility)) {
			if (ringExceptions.get(relative)?.has(token)) usedRingExceptions.add(`${relative}::${token}`);
			else
				errors.add(
					`${relative}: resting ring ${token} — ring-<role>/NN is a focus ring (focus*:ring-<role>/${FOCUS_RING_OPACITY}); resting rings use ring-neutral-muted / ring-color-muted`
				);
		}
	}
}

// Layout axis: a component that fills its host lays itself out by CONTAINER query. Its root
// carries `@container` and its breakpoints are `@md:` / `@max-3xl:`, which measure the width the
// component was actually handed; a viewport variant (`md:`, `max-lg:`, `max-[360px]:`) measures the
// device instead, so the same box reflows one way in a page and another in a split pane or a
// sidebar even though nothing about its own width changed. Only app chrome that spans the viewport
// and overlays that size to their content keep the device breakpoints. Checked in theme files and
// in component markup — the two places a class is written. Exceptions are per path prefix and must
// carry a justification; a prefix whose files this run inspected without spending it fails the
// check so the map cannot rot after a component is converted.
const VIEWPORT_SEGMENT = /^(?:max-)?(?:sm|md|lg|xl|2xl)$|^(?:min|max)-\[[^\]]+\]$/;
const viewportExceptions = new Map([
	[
		'src/lib/components/Sidebar/',
		'Drawer on a phone versus a docked shell is a device decision, not a host-width one'
	],
	['src/lib/components/AppShell/', 'App chrome spans the viewport, so the viewport is its host'],
	['src/lib/components/PageShell/', 'App chrome spans the viewport, so the viewport is its host'],
	[
		'src/lib/components/Form/DateSelector/',
		'Lives inside a content-sized Popover; inline-size containment would collapse the panel it sizes'
	],
	['src/lib/components/DesignSystem/', 'Docs-only palette page, not a shipped component']
]);
const usedViewportExceptions = new Set();

// The variant segments of a token are its depth-0 colon-separated prefixes, so a bracketed
// selector or an arbitrary value that happens to contain a colon is not mistaken for one.
function variantSegments(token) {
	const segments = [];
	let depth = 0;
	let start = 0;
	for (let index = 0; index < token.length; index += 1) {
		const character = token[index];
		if (character === '[' || character === '(') depth += 1;
		else if (character === ']' || character === ')') depth -= 1;
		else if (character === ':' && depth === 0) {
			segments.push(token.slice(start, index));
			start = index + 1;
		}
	}
	return segments;
}

function checkViewportClasses(source, filename) {
	const relative = path.relative(componentsDirectory, filename);
	const repositoryPath = path.relative(repositoryRoot, filename);
	for (const token of source.split(/\s+/)) {
		// A bare `sm:` with nothing after it is a data key, not a class.
		if (!token || !utilityPart(token)) continue;
		const variant = variantSegments(token).find((segment) => VIEWPORT_SEGMENT.test(segment));
		if (!variant) continue;
		const exception = [...viewportExceptions.keys()].find((prefix) =>
			repositoryPath.startsWith(prefix)
		);
		if (exception) {
			usedViewportExceptions.add(exception);
			continue;
		}
		errors.add(
			`${relative}: viewport breakpoint ${token} — host-sized components lay out by container query (@${variant}: on an @container root); only app chrome and content-sized overlays use the viewport, listed in viewportExceptions`
		);
	}
}

// The seventh axis: the type ramp a `size` variant walks. A control grows its *box* at `large`
// — the `h-control-lg`, the padding — and keeps its type at `text-sm`, so a large button never
// reads as a different typeface from a normal one; a content part (a card, an alert, a stat
// label) takes the one step up to `text-base`; a display value (the Stat figure) rides its own
// ramp. The secondary line inside a part sits exactly one step below that part's primary text
// and never below `text-xs` — which is why each primary ramp below is paired with its
// step-down. Those six triples are the whole allowed set.
const TYPE_RAMPS = new Map([
	['xs/sm/sm', 'control'],
	['xs/xs/xs', 'control secondary'],
	['xs/sm/base', 'content'],
	['xs/xs/sm', 'content secondary'],
	['xl/2xl/3xl', 'display'],
	['lg/xl/2xl', 'display secondary']
]);
const TYPE_RAMP_STEPS = ['small', 'normal', 'large'];
const TYPE_RAMP_VARIANTS = new Set(['size']);
// `text-sm/relaxed` is the same step with its leading pinned, so the pair is read as one size.
const TEXT_SIZE = /^!?text-(xs|sm|base|lg|xl|[2-9]xl)(?:\/[\w.-]+)?$/;
// A type size written as a length is off the ramp whatever it rounds to, so it is banned
// outright rather than measured. Colour keywords and custom properties (`text-[CanvasText]`,
// `text-[var(--x)]`) are not sizes and stay allowed.
const ARBITRARY_TEXT_SIZE = /^!?text-\[(?:length:)?-?\d*\.?\d+[a-z%]*\]$/;
// Type that is off the axis: a ramp that is none of the six, or a size written as a length.
// Same shape, justification and rot check as the other exception maps; keyed by file, then by
// `<part>:<ramp>` for a ramp or by the utility itself for a length.
const typeRampExceptions = new Map([
	[
		'DocumentViewer/documentViewer.theme.ts',
		new Map([
			[
				'text-[5px]',
				'Page thumbnail renders the document at page scale — a miniature of a page, not type the reader sizes'
			]
		])
	]
]);
const usedTypeRampExceptions = new Set();

// The ramp is read off the AST rather than out of a class string: a token-level rule cannot
// tell `text-base` written on the `large` size from `text-base` in a part's base classes, and
// it is the *triple* — what the three sizes do relative to each other — that is the rule.
function checkTypeRamps(sourceFile, relative) {
	const partName = (node) => {
		for (let parent = node.parent; parent; parent = parent.parent) {
			if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
			if (ts.isPropertyAssignment(parent) && propertyName(parent) !== 'variants')
				return propertyName(parent) ?? 'theme part';
		}
		return 'theme part';
	};
	const visit = (node) => {
		ts.forEachChild(node, visit);
		if (
			!ts.isPropertyAssignment(node) ||
			!TYPE_RAMP_VARIANTS.has(propertyName(node)) ||
			!ts.isObjectLiteralExpression(node.initializer) ||
			!node.parent.parent ||
			!ts.isPropertyAssignment(node.parent.parent) ||
			propertyName(node.parent.parent) !== 'variants'
		)
			return;
		const ramp = new Map();
		for (const property of node.initializer.properties) {
			if (!ts.isPropertyAssignment(property)) continue;
			const step = propertyName(property);
			if (!TYPE_RAMP_STEPS.includes(step)) continue;
			const sizes = new Set();
			const collect = (value) => {
				if (
					ts.isStringLiteralLike(value) ||
					ts.isTemplateHead(value) ||
					ts.isTemplateMiddle(value) ||
					ts.isTemplateTail(value)
				)
					for (const token of value.text.split(/\s+/)) {
						const utility = utilityPart(token);
						const named = utility.match(TEXT_SIZE);
						// A responsive or state-prefixed size is not the ramp step itself.
						if (named && token.replace(/^!|!$/g, '') === utility) sizes.add(named[1]);
					}
				ts.forEachChild(value, collect);
			};
			collect(property.initializer);
			ramp.set(step, sizes);
		}
		if (![...ramp.values()].some((sizes) => sizes.size)) return;
		const part = partName(node);
		const missing = TYPE_RAMP_STEPS.filter((step) => !ramp.get(step)?.size);
		if (missing.length) {
			errors.add(
				`${relative}: ${part} names a type size on some sizes only (${missing.join(', ')} missing) — a ramp is read from all three sizes`
			);
			return;
		}
		const ambiguous = TYPE_RAMP_STEPS.find((step) => ramp.get(step).size > 1);
		if (ambiguous) {
			errors.add(
				`${relative}: ${part} size ${ambiguous} names ${[...ramp.get(ambiguous)]
					.map((size) => `text-${size}`)
					.join(' and ')} — one type size per size`
			);
			return;
		}
		const triple = TYPE_RAMP_STEPS.map((step) => [...ramp.get(step)][0]).join('/');
		if (TYPE_RAMPS.has(triple)) return;
		if (typeRampExceptions.get(relative)?.has(`${part}:${triple}`)) {
			usedTypeRampExceptions.add(`${relative}::${part}:${triple}`);
			return;
		}
		errors.add(
			`${relative}: ${part} type ramp ${triple} — a size variant walks one of ${[...TYPE_RAMPS]
				.map(([names, role]) => `${names} (${role})`)
				.join(', ')}; a large control grows its box with h-control-lg, not its type`
		);
	};
	visit(sourceFile);
}

// The same selection surface is spelled three ways in this library. Sidebar writes it as a
// Tailwind *variant prefix* (`data-active:bg-selected-muted`), which `SELECTED_FILL` below reads
// off the class string. Everywhere else it is a cva *variant key* (`active: { true: '…' }` in
// Pagination, MenuBar and the Calendar day cell) or a whole theme part named for the state
// (`thumbnailActive` in DocumentViewer) — neither of which any class string can show. Reading
// only the prefix form is what let `active: { true: 'border-color bg-color-muted
// text-color-muted-readable' }` pass, the exact surface `designTokens.selectedColor` exists to
// move. So the other two forms are read off the AST instead: a variant group that names a
// selection (minus its resting step), a compound variant that pins one true, and a part named
// for the state each paint the `selected` role or an explicitly justified exception.
const SELECTED_VARIANTS = new Set([
	'selected',
	'isSelected',
	'active',
	'isActive',
	'checked',
	'isChecked',
	'pressed',
	'isPressed',
	'current',
	'isCurrent'
]);
// The steps of such a group that are *not* the selection: the resting side of a boolean variant.
const RESTING_VARIANT_STEPS = new Set(['false', 'off', 'none', 'resting']);
// A theme part that *is* the selection, named for it: `thumbnailActive`, `sheetTabActive`.
const SELECTED_PART_NAME = /(?:Active|Selected|Checked|Pressed|Current)$/;
const SELECTED_VARIANT_FILL =
	/^!?bg-(?:color|neutral|primary|secondary|success|warning|info|danger)(?:-muted)?(?:\/\d+)?$/;
// A `hover:`/`focus-visible:`/`data-…:` layer written inside a selected step is a *transient*
// state on top of the selection, which the hover and focus rules already own; only the fill the
// step itself paints (bare, or on the `before:`/`after:` pseudo it draws the indicator with) is
// the selection surface.
const TRANSIENT_SEGMENT = /hover|focus|active|pressed|peer|group|disabled|^data-|^aria-|^in-/;
// Selection surfaces that are deliberately not on the state role, same shape, justification and
// rot check as the other exception maps.
const selectedVariantExceptions = new Map([
	[
		'MiniCalendar/miniCalendar.theme.ts',
		new Map(
			['primary', 'secondary', 'danger', 'success', 'warning', 'info', 'neutral'].map((role) => [
				`bg-${role}`,
				'Per-role selected day: the caller picks the colour with `color`, so the selection is that colour by construction and a pinned selectedColor must not overrule it'
			])
		)
	]
]);
const usedSelectedVariantExceptions = new Set();
function checkSelectedVariants(sourceFile, relative) {
	const flag = (token, where) => {
		if (selectedVariantExceptions.get(relative)?.has(utilityPart(token))) {
			usedSelectedVariantExceptions.add(`${relative}::${utilityPart(token)}`);
			return;
		}
		errors.add(
			`${relative}: selected fill ${token} on ${where} — persistent selection uses the selected state role (selectedSoft / selectedSolid)`
		);
	};
	const check = (node, where) => {
		const collect = (value) => {
			if (
				ts.isStringLiteralLike(value) ||
				ts.isTemplateHead(value) ||
				ts.isTemplateMiddle(value) ||
				ts.isTemplateTail(value)
			)
				for (const token of value.text.split(/\s+/)) {
					if (!token) continue;
					if (variantSegments(token).some((segment) => TRANSIENT_SEGMENT.test(segment))) continue;
					if (SELECTED_VARIANT_FILL.test(utilityPart(token))) flag(token, where);
				}
			ts.forEachChild(value, collect);
		};
		collect(node);
	};
	const visit = (node) => {
		ts.forEachChild(node, visit);
		// A third spelling, and the one no variant can show: the selection is its own theme part,
		// named for the state it paints (`thumbnailActive`, `sheetTabActive`) and merged over the
		// resting part by the component.
		if (
			ts.isVariableDeclaration(node) &&
			ts.isIdentifier(node.name) &&
			SELECTED_PART_NAME.test(node.name.text) &&
			node.initializer &&
			ts.isCallExpression(node.initializer)
		)
			check(node.initializer, `the ${node.name.text} part`);
		if (!ts.isPropertyAssignment(node)) return;
		const name = propertyName(node);
		// `variants: { active: { true: '…' } }`
		if (
			SELECTED_VARIANTS.has(name) &&
			ts.isObjectLiteralExpression(node.initializer) &&
			node.parent.parent &&
			ts.isPropertyAssignment(node.parent.parent) &&
			propertyName(node.parent.parent) === 'variants'
		)
			for (const step of node.initializer.properties) {
				if (!ts.isPropertyAssignment(step)) continue;
				const stepName = propertyName(step);
				if (RESTING_VARIANT_STEPS.has(stepName)) continue;
				check(step.initializer, `variant ${name}:${stepName}`);
			}
		// `compoundVariants: [{ active: true, class: '…' }]`
		if (
			(name === 'class' || name === 'className') &&
			ts.isObjectLiteralExpression(node.parent) &&
			node.parent.properties.some(
				(property) =>
					ts.isPropertyAssignment(property) &&
					SELECTED_VARIANTS.has(propertyName(property)) &&
					property.initializer.kind === ts.SyntaxKind.TrueKeyword
			)
		)
			check(node.initializer, 'a selected compound variant');
	};
	visit(sourceFile);
}

// Elevation, control geometry, muted ink, hover and selected fills only read as drift when the
// library is seen whole: a lone `shadow-md`, `h-10` or `hover:bg-neutral/10` looks fine in its
// own file. So the value lives in the engine — `raised-*` / `lift-*`, `h-control-*` / `h-row-*`,
// `size-icon-*`, `state-layer`, the `selectedSoft` / `selectedSolid` recipes — and the theme
// names the state role, never
// the number. These are theme-file rules; markup keeps the motion and state rules only.
const RAW_SHADOW = /^(?:drop-)?shadow-(?:xs|sm|md|lg|xl|2xl)$/;
// Shadows that cannot go through the engine at all. The elevation engine emits `box-shadow`
// (plus, for `raised-*`, the hairline), so a mark whose silhouette is not a box — an SVG pin,
// a third-party canvas overlay — has no equivalent and keeps its `filter` shadow. Same shape,
// justification and rot check as the other exception maps.
const shadowExceptions = new Map([
	[
		'Map/MapMarkerDefault.svelte',
		new Map([
			[
				'drop-shadow-md',
				'The pin is an SVG silhouette, not a box — only filter: drop-shadow follows its outline'
			]
		])
	]
]);
const usedShadowExceptions = new Set();
// Elevation is checked wherever a class is written — theme files, component markup and the
// `.mcp.ts` snippets the agent docs hand to consumers — because a snippet teaching `shadow-lg`
// re-seeds the drift the engine exists to remove.
function checkShadowClasses(source, filename, tokens) {
	const relative = path.relative(componentsDirectory, filename);
	for (const token of tokens ?? source.split(/\s+/)) {
		if (!token) continue;
		if (!RAW_SHADOW.test(utilityPart(token))) continue;
		if (shadowExceptions.get(relative)?.has(token)) {
			usedShadowExceptions.add(`${relative}::${token}`);
			continue;
		}
		errors.add(
			`${relative}: raw shadow ${token} — elevation comes from raised-N (bordered surfaces) or lift-N (borderless ones)`
		);
	}
}
const SVG_ICON_SIZE = /\[&[_>]svg\]:size-\d/;
const NUMERIC_HEIGHT = /^(?:min-|max-)?h-(?:7|8|9|10|11|12)$/;
// Two steps of muted ink: /70 for secondary text, /45 for decorative ink only (idle icons,
// handles, separators — /45 fails AA as running text).
const MUTED_TEXT_STEPS = new Set(['45', '70']);
const MUTED_TEXT =
	/^text-(?:color|primary|secondary|neutral|danger|success|warning|info|current|white|black)(?:-muted)?(?:-readable|-contrast)?\/(\d+)$/;
// A persistent selection paints the `selected` STATE ROLE (`bg-selected`, `bg-selected-muted`),
// never a named role and no longer the plain current role either: `bg-color-muted` under a
// selected variant is what stopped `designTokens.selectedColor` from being able to move the
// sidebar row, the menu option and the table row together.
const SELECTED_FILL =
	/(?:^|:)(?:checked|data-active|data-\[selected=true\]|data-\[active=true\]|aria-\[selected=true\]|aria-\[pressed=true\]|data-\[state=(?:checked|active|selected|on)\]):bg-(?:color|neutral|primary|secondary|success|warning|info|danger)\b/;
function checkSurfaceClasses(source, filename) {
	const relative = path.relative(componentsDirectory, filename);
	for (const token of source.split(/\s+/)) {
		if (!token) continue;
		const utility = utilityPart(token);
		checkShadowClasses(source, filename, [token]);
		if (SVG_ICON_SIZE.test(token))
			errors.add(`${relative}: icon size ${token} — icons are sized with size-icon-xs…xl`);
		if (ARBITRARY_TEXT_SIZE.test(utility)) {
			if (typeRampExceptions.get(relative)?.has(token))
				usedTypeRampExceptions.add(`${relative}::${token}`);
			else
				errors.add(
					`${relative}: arbitrary type size ${token} — type comes from the text-xs…text-3xl scale`
				);
		}
		if (NUMERIC_HEIGHT.test(utility)) {
			if (geometryExceptions.get(relative)?.has(token))
				usedGeometryExceptions.add(`${relative}::${token}`);
			else
				errors.add(
					`${relative}: numeric height ${token} — controls use h-control-*, rows use h-row-* / min-h-row-*`
				);
		}
		const muted = utility.match(MUTED_TEXT);
		if (muted && !MUTED_TEXT_STEPS.has(muted[1]))
			errors.add(
				`${relative}: muted text ${token} — secondary text is text-<role>/70, decorative ink text-<role>/45`
			);
		if (token.includes('hover:bg-')) {
			if (hoverExceptions.get(relative)?.has(token))
				usedHoverExceptions.add(`${relative}::${token}`);
			else
				errors.add(`${relative}: hover fill ${token} — interactive surfaces tint with state-layer`);
		}
		if (SELECTED_FILL.test(token))
			errors.add(
				`${relative}: selected fill ${token} — persistent selection uses the selected state role (selectedSoft / selectedSolid)`
			);
	}
}

function checkClasses(source, filename) {
	const relative = path.relative(componentsDirectory, filename);
	checkMotionClasses(source, filename);
	checkStateClasses(source, filename);
	checkSurfaceClasses(source, filename);
	checkViewportClasses(source, filename);
	for (const token of source.split(/\s+/)) {
		if (!token) continue;
		if (geometryExceptions.get(relative)?.has(token)) {
			usedGeometryExceptions.add(`${relative}::${token}`);
			continue;
		}
		const utility = utilityPart(token);
		const spacing = utility.match(
			/^-?(?:gap(?:-[xy])?|space-[xy]|p[trblxyse]?|m[trblxyse]?)-(.+)$/
		);
		if (spacing) {
			const value = spacing[1];
			if (/^\d+(?:\.\d+)?$/.test(value) && Number(value) !== 0)
				errors.add(`${relative}: numeric spacing utility ${token}`);
			if (value.startsWith('[') && !/^\[(?:var\(--|calc\(.*var\(--)/.test(value))
				errors.add(
					`${relative}: arbitrary spacing needs a documented geometry exception: ${token}`
				);
		}
		// The utility that reads `--radius-parent` / `--pad-parent-*`. Only the three forms the
		// engine emits are utilities — `rounded-<step>-concentric`, `rounded-t-…`, `rounded-b-…`
		// — so a per-corner spelling stays a typo the checker catches rather than a class that
		// silently does nothing. Concentricity itself is the cascade's job now: the container's
		// own `rounded-*` and `p-*` publish the radius and the gap, so there is no declaration
		// left to enforce.
		if (
			utility.startsWith('rounded') &&
			!/^rounded(?:-[tb])?-(?:xs|sm|md|lg|xl|2xl|3xl|4xl)-concentric$/.test(utility) &&
			!/^rounded(?:-(?:[trblse]|tl|tr|br|bl|ss|se|ee|es))?-(?:none|full|xs|sm|md|lg|xl|2xl|3xl|4xl|\[inherit\]|\[var\(--[^\]]+\])$/.test(
				utility
			)
		)
			errors.add(`${relative}: unsupported radius utility ${token}`);
	}
}

// The `.theme.ts` sweep below only reaches class strings hung off an exported theme, so
// nothing was checking the classes components write straight into their markup. A raw
// `duration-200` there escapes the scale exactly as loudly, so every `class` attribute in
// the template gets the motion rules — text chunks and string literals inside its expression.
// Markup classes get the motion rules, the disabled / focus-ring rules and the layout rule — a
// `md:hidden` written straight onto an element reflows by the device exactly as a theme part
// would; the geometry rules stay theme-file-only.
function checkMarkupClasses(source, filename) {
	checkMotionClasses(source, filename);
	checkStateClasses(source, filename);
	checkShadowClasses(source, filename);
	checkViewportClasses(source, filename);
}

function checkTemplateClasses(root, filename) {
	const skipped = new Set([
		'type',
		'loc',
		'start',
		'end',
		'parent',
		'metadata',
		'leadingComments',
		'trailingComments'
	]);
	const seen = new Set();
	const walk = (node, inClass) => {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const child of node) walk(child, inClass);
			return;
		}
		if (seen.has(node)) return;
		seen.add(node);
		if (inClass) {
			if (node.type === 'Text' && typeof node.data === 'string')
				checkMarkupClasses(node.data, filename);
			if (node.type === 'Literal' && typeof node.value === 'string')
				checkMarkupClasses(node.value, filename);
			if (node.type === 'TemplateElement' && node.value)
				checkMarkupClasses(node.value.cooked ?? node.value.raw ?? '', filename);
		}
		const isClass =
			inClass ||
			(node.type === 'Attribute' && node.name === 'class') ||
			(node.type === 'ClassDirective' && (checkMarkupClasses(node.name, filename), false));
		for (const key in node) {
			if (skipped.has(key)) continue;
			walk(node[key], isClass);
		}
	};
	walk(root, false);
}

async function inspectSource(filename, source) {
	const relative = path.relative(componentsDirectory, filename);
	const sourceFile =
		program.getSourceFile(filename) ??
		ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
	const cvaNames = new Set(['cva']);
	const cvaNamespaces = new Set();
	const themeTypes = new Set();
	const bindings = new Map();
	const exportedThemes = [];
	const cvaCalls = new Set();
	const presets = [];
	const isThemeFile = filename.endsWith('.theme.ts');
	const ownerName = path.basename(filename).split('.')[0];

	for (const statement of sourceFile.statements) {
		if (ts.isImportDeclaration(statement)) {
			const imports = statement.importClause?.namedBindings;
			if (imports && ts.isNamedImports(imports))
				for (const imported of imports.elements) {
					const original = (imported.propertyName ?? imported.name).text;
					if (original === 'cva') cvaNames.add(imported.name.text);
					if (original.endsWith('ThemeProps')) themeTypes.add(imported.name.text);
				}
			if (imports && ts.isNamespaceImport(imports)) cvaNamespaces.add(imports.name.text);
		}
		if (ts.isVariableStatement(statement))
			for (const declaration of statement.declarationList.declarations) {
				if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
				bindings.set(declaration.name.text, declaration.initializer);
				// A theme is an object literal OR a factory that returns one. Reading only the
				// object literal left every class string inside an exported arrow-function
				// factory unswept — `buildMarkdownStreamdownTheme` shipped a raw `shadow`, an
				// off-scale `/80` muted step and a numeric `space-y-2` behind that hole, none of
				// which any rule ever saw.
				if (
					isExported(statement) &&
					/Theme$/.test(declaration.name.text) &&
					(ts.isObjectLiteralExpression(unwrap(declaration.initializer)) ||
						ts.isArrowFunction(declaration.initializer) ||
						ts.isFunctionExpression(declaration.initializer))
				)
					exportedThemes.push(declaration);
			}
		if (ts.isFunctionDeclaration(statement) && statement.name && statement.body)
			bindings.set(statement.name.text, statement.body);
		if (
			ts.isFunctionDeclaration(statement) &&
			isExported(statement) &&
			/Theme$/.test(statement.name?.text ?? '')
		)
			exportedThemes.push(statement);
	}

	function isCva(expression, seen = new Set()) {
		if (ts.isIdentifier(expression)) {
			if (cvaNames.has(expression.text)) return true;
			if (seen.has(expression.text)) return false;
			seen.add(expression.text);
			const binding = unwrap(bindings.get(expression.text));
			return binding ? isCva(binding, seen) : false;
		}
		return (
			ts.isPropertyAccessExpression(expression) &&
			expression.name.text === 'cva' &&
			ts.isIdentifier(expression.expression) &&
			cvaNamespaces.has(expression.expression.text)
		);
	}

	const hasStaticClasses = (node) => {
		let hasClasses = false;
		const visitProperty = (child) => {
			if (ts.isPropertyAssignment(child) && propertyName(child) === 'base') {
				const visitValue = (value) => {
					if (
						(ts.isStringLiteralLike(value) ||
							ts.isTemplateHead(value) ||
							ts.isTemplateMiddle(value) ||
							ts.isTemplateTail(value)) &&
						value.text.trim()
					)
						hasClasses = true;
					ts.forEachChild(value, visitValue);
				};
				visitValue(child.initializer);
			}
			ts.forEachChild(child, visitProperty);
		};
		visitProperty(node);
		return hasClasses;
	};
	const visit = (node) => {
		// The layout rule applies to every string literal in the file, not just the ones hung off an
		// exported theme: a class list assembled in a plain helper (`sidebar-layout.ts`, an
		// `inputActionButton.ts`) reaches the DOM exactly like a theme part, and the `.theme.ts`-only
		// sweep below would never see it. String literals only — AST, not a regex over the source —
		// so the `md:`/`lg:` that the root-recipe comments quote when they document what they replaced
		// is prose, not a class.
		if (
			ts.isStringLiteralLike(node) ||
			ts.isTemplateHead(node) ||
			ts.isTemplateMiddle(node) ||
			ts.isTemplateTail(node)
		)
			checkViewportClasses(node.text, filename);
		if (ts.isCallExpression(node) && isCva(node.expression)) cvaCalls.add(node);
		if (
			ts.isVariableDeclaration(node) &&
			ts.isIdentifier(node.name) &&
			(/theme$/i.test(node.name.text) ||
				(node.type &&
					ts.isTypeReferenceNode(node.type) &&
					(node.type.typeName.getText(sourceFile).endsWith('ThemeProps') ||
						themeTypes.has(node.type.typeName.getText(sourceFile))))) &&
			node.initializer &&
			hasStaticClasses(node.initializer)
		)
			presets.push(node);
		if (ts.isSatisfiesExpression(node) && ts.isTypeReferenceNode(node.type)) {
			const typeName = node.type.typeName.getText(sourceFile);
			if (typeName.endsWith('ThemeProps') || themeTypes.has(typeName)) {
				// A dynamic bridge between already-owned classes is not a new preset.
				if (hasStaticClasses(node.expression) || isThemeFile) presets.push(node);
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	if (!isThemeFile && (cvaCalls.size || presets.length))
		errors.add(`${relative}: hidden theme definition must live in its <owner>.theme.ts file`);
	if (!isThemeFile) return;
	themeOwners.add(relative);
	checkTypeRamps(sourceFile, relative);
	checkSelectedVariants(sourceFile, relative);
	const siblings = await readdir(path.dirname(filename));
	const owners = new Set(
		siblings.flatMap((name) =>
			name.endsWith('.svelte')
				? [lowerOwner(name.slice(0, -7))]
				: /\.(props|svelte)\.ts$/.test(name)
					? [name.split('.')[0]]
					: []
		)
	);
	// CalendarInput and CalendarPrimitive deliberately share the public Calendar theme contract.
	const sharedCalendarOwner =
		relative === 'Form/Calendar/calendar.theme.ts' &&
		owners.has('calendarInput') &&
		owners.has('calendarPrimitive');
	if (!owners.has(ownerName) && !sharedCalendarOwner)
		errors.add(`${relative}: theme filename does not name a sibling component owner`);
	if (!exportedThemes.length)
		errors.add(`${relative}: theme file must export its named theme or preset factory`);
	if (
		cvaCalls.size &&
		!exportedThemes.some((declaration) => declaration.name.text === `${ownerName}Theme`)
	)
		errors.add(`${relative}: CVA parts must belong to exported ${ownerName}Theme`);
	for (const declaration of exportedThemes)
		if (!declaration.name.text.toLowerCase().includes(ownerName.toLowerCase()))
			errors.add(`${relative}: theme export ${declaration.name.text} does not name its owner`);
	const reached = new Set();
	const reach = (node) => {
		if (!node || reached.has(node)) return;
		reached.add(node);
		if (ts.isIdentifier(node)) {
			if (node.getSourceFile() === sourceFile && bindings.has(node.text))
				reach(bindings.get(node.text));
			let symbol = checker.getSymbolAtLocation(node);
			if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
			const declaration = symbol?.valueDeclaration;
			const origin = declaration?.getSourceFile().fileName;
			if (
				origin?.startsWith(path.join(repositoryRoot, 'src/lib/')) &&
				!origin.includes('/utils/cva/')
			) {
				if (ts.isVariableDeclaration(declaration)) reach(declaration.initializer);
				if (ts.isFunctionDeclaration(declaration)) reach(declaration.body);
			}
		}
		if (
			ts.isStringLiteralLike(node) ||
			ts.isTemplateHead(node) ||
			ts.isTemplateMiddle(node) ||
			ts.isTemplateTail(node)
		)
			checkClasses(node.text, node.getSourceFile().fileName);
		ts.forEachChild(node, reach);
	};
	for (const declaration of exportedThemes) reach(declaration.initializer ?? declaration.body);
	for (const call of cvaCalls)
		if (!reached.has(call))
			errors.add(
				`${relative}: unowned CVA part ${propertyName(call.parent) ?? call.getStart(sourceFile)}`
			);
}

for (const filename of files) {
	const source = await readFile(filename, 'utf8');
	if (!filename.endsWith('.svelte')) await inspectSource(filename, source);
	else {
		const parsed = parse(source, { filename, modern: true });
		for (const script of [parsed.instance, parsed.module])
			if (script)
				await inspectSource(filename, source.slice(script.content.start, script.content.end));
		checkTemplateClasses(parsed.fragment, filename);
	}
}
// `.mcp.ts` files are excluded from the inventory above because they are prose, not compiled
// source — but they are the snippets the agent docs paste into consumer code, so a snippet
// teaching `shadow-lg` or `md:grid-cols-3` re-seeds exactly the drift the engine exists to remove.
// The elevation rule and the layout rule apply, and only to class-shaped tokens.
// `@` is part of the token: `@md:grid-cols-3` is a container query, `md:grid-cols-3` is not.
const MCP_CLASS_TOKEN = /[@A-Za-z0-9_:./[\]()&-]+/g;
const mcpFiles = await listSources(componentsDirectory, (name) => name.endsWith('.mcp.ts'));
for (const filename of mcpFiles) {
	const source = await readFile(filename, 'utf8');
	const tokens = source.match(MCP_CLASS_TOKEN) ?? [];
	checkShadowClasses(source, filename, tokens);
	checkViewportClasses(tokens.join(' '), filename);
}

// An exception the run never spent is rot: the component moved on and the map still claims the
// escape hatch. Entries whose file this run did not inspect are left alone — that is a tree
// without the component (a fixture), not a stale justification.
const inspected = new Set(
	[...files, ...mcpFiles].map((name) => path.relative(componentsDirectory, name))
);
for (const [label, exceptions, used] of [
	['motion', motionExceptions, usedMotionExceptions],
	['geometry', geometryExceptions, usedGeometryExceptions],
	['hover', hoverExceptions, usedHoverExceptions],
	['ring', ringExceptions, usedRingExceptions],
	['shadow', shadowExceptions, usedShadowExceptions],
	['type ramp', typeRampExceptions, usedTypeRampExceptions],
	['selected variant', selectedVariantExceptions, usedSelectedVariantExceptions]
])
	for (const [file, tokens] of exceptions)
		for (const [token, justification] of tokens)
			if (inspected.has(file) && !used.has(`${file}::${token}`))
				errors.add(
					`${file}: unused ${label} exception ${token} (${justification}) — delete it from ${label}Exceptions`
				);
// Same rot check, one directory up: a viewport exception is claimed by path prefix, so it is spent
// when any file under that prefix writes a viewport breakpoint. A prefix this run saw no file of is
// a tree without the component (a fixture), not a stale justification.
const inspectedPaths = files.map((name) => path.relative(repositoryRoot, name));
for (const [prefix, justification] of viewportExceptions)
	if (inspectedPaths.some((name) => name.startsWith(prefix)) && !usedViewportExceptions.has(prefix))
		errors.add(
			`${prefix}: unused viewport exception (${justification}) — delete it from viewportExceptions`
		);
if (errors.size)
	throw new Error(`Semantic theme token check failed:\n- ${[...errors].join('\n- ')}`);
console.log(
	`Semantic theme token check passed (${themeOwners.size} theme owners; TypeScript and Svelte AST inventory).`
);
