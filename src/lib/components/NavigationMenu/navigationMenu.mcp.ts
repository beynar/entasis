export const navigationMenuDescription = `
# NavigationMenu Component

NavigationMenu is site navigation: a \`<nav>\` landmark with a row of links and disclosure buttons, and one panel area that shows the panel of whichever button is open. Use it for a header with mega-menu panels. MenuBar is the application-menu pattern (\`role="menubar"\`) and the wrong choice for site navigation; Tabbar is a tablist.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	import { NavigationMenu, type NavigationMenuItem } from 'entasis/navigation-menu';

	const items: NavigationMenuItem[] = [
		{
			type: 'panel',
			value: 'product',
			label: 'Product',
			content: [
				{ label: 'Components', href: '/components', description: 'The essential interface pieces.' },
				{ label: 'Blocks', href: '/blocks', description: 'Complete patterns in context.' }
			]
		},
		{ type: 'link', label: 'Pricing', href: '/pricing', active: true },
		{ type: 'link', label: 'Docs', href: '/docs' }
	];
</script>

<NavigationMenu {items} label="Main" />
\`\`\`

## Controlled value

\`\`\`svelte
<script lang="ts">
	import { NavigationMenu, type NavigationMenuItem } from 'entasis/navigation-menu';

	type Section = 'product' | 'company';
	let open = $state<Section | null>(null);

	const items: NavigationMenuItem<Section>[] = [
		{ type: 'panel', value: 'product', label: 'Product', content: [{ label: 'Blocks', href: '/blocks' }] },
		{ type: 'panel', value: 'company', label: 'Company', content: [{ label: 'About', href: '/about' }] }
	];
</script>

<NavigationMenu {items} bind:value={open} onValueChange={(next, details) => console.log(next, details.reason)} />
\`\`\`

## Items

- A **link** (\`type: 'link'\`) is a plain entry of the bar: \`label\`, \`href\`, optional \`prefix\`, \`iconOnly\` (paint only the prefix; the string label becomes the accessible name), \`active\` (renders \`aria-current="page"\`), \`disabled\`, \`target\`, \`rel\` and \`onclick\`.
- A **panel** (\`type: 'panel'\`) is a disclosure button: \`value\` (unique), \`label\`, optional \`prefix\`, \`iconOnly\` (paint only the prefix; the string label becomes the accessible name), \`disabled\`, and the body in \`content\`: a list of links (\`label\`, \`href\`, \`description\`, \`prefix\`, \`active\`, \`disabled\`, \`target\`, \`rel\`, \`onclick\`), or a snippet \`{#snippet content({ close })}\` that renders anything. \`items\` adds a nested level under \`content\`: links, and more panels that expand in place.
- \`Value\` is generic: \`NavigationMenuItem<'product' | 'company'>\` types \`value\`, \`defaultValue\` and \`onValueChange\`.

## Props

- **items**: NavigationMenuItem[] (required) - Entries of the bar.
- **label**: string - Accessible name of the nav landmark. Give it when the page has more than one nav.
- **value** / **defaultValue**: Value | null - The open panel's \`value\`; \`null\` while all are closed. \`value\` is bindable.
- **onValueChange**: (value: Value | null, details: OpenChangeDetails) => void - Called before the open panel changes. \`details.reason\` is \`trigger-press\`, \`trigger-hover\`, \`list-navigation\`, \`escape-key\`, \`outside-press\`, \`focus-out\`, \`item-press\`, \`close-press\` or \`trigger-unmount\`; \`details.event\` carries the DOM event; \`details.cancel()\` keeps the current panel. A link press closes every level and calls it once with \`null\`. Not called for the initial state or for changes the parent assigns to \`value\`.
- **openOnHover**: boolean (default: true) - Resting the pointer on a trigger opens its panel. Touch never hovers.
- **delay**: number (default: 50) - Milliseconds before a hovered trigger opens. Switching between triggers while a panel is open is immediate.
- **closeDelay**: number (default: 100) - Milliseconds the pointer may stay outside the triggers and the panel before a hover-opened panel closes.
- **keepMounted**: boolean (default: false) - Keeps every panel in the DOM under \`hidden\`, so crawlers and the server-rendered HTML see their links. A kept-mounted popup hides at once when closed, without an exit animation.
- **onAfterOpen** / **onAfterClose**: () => void - Called once each time the panel area finishes opening or closing (at once when no animation plays). Not called for the initial state.
- **size**: 'small' | 'normal' | 'large' (default: 'normal') - Size of triggers, links and panel text.
- **density**: 'compact' | 'normal' | 'comfortable' (default: 'normal') - Spacing inside the panel area and between its rows.
- **color**: Colors - Semantic role of the triggers and the selected look. Falls back to the Theme's default color.
- **dir**: 'ltr' | 'rtl' - Text direction. When omitted it follows the i18n direction, else the element's computed direction. It mirrors the arrow keys and the panel alignment.
- **transition**: FSOProps - Popup enter and exit overrides (numeric \`x\`, \`y\`, \`scale\`, \`opacity\`, \`duration\`, \`easing\`).
- **ref**: HTMLElement | null - Bindable reference to the nav element.
- **class**: string - Class name of the nav.
- **theme**: NavigationMenuThemeProps - Theme overrides: \`root\`, \`list\`, \`item\`, \`trigger\`, \`link\`, \`caret\`, \`viewport\`, \`popup\`, \`panel\`, \`contentList\`, \`contentLink\`, \`contentPrefix\`, \`contentText\`, \`contentTitle\`, \`contentDescription\`, \`nestedTrigger\` and \`motion\`.

## Behavior

- The markup is \`<nav aria-label><ul>\`: each panel trigger is a \`<button>\` with \`aria-expanded\` and \`aria-controls\` (no \`aria-haspopup\`: it is a disclosure, not a menu), each link an \`<a>\`. There is no \`aria-orientation\`.
- **One inline panel area.** The panel area is rendered inside the nav, after the trigger list, never portaled. It animates its width and height as the open panel changes, and aligns to the open trigger's inline edge inside the layout viewport.
- **Opening.** Click, Enter or Space toggle a trigger; ArrowDown opens it. Opening by keyboard keeps focus on the trigger. Tab from an open trigger enters the panel's links; Tab past the last link continues after the trigger and closes the panel; Shift+Tab from the first link returns to the trigger. ArrowDown on an open trigger moves into the panel.
- **Moving along the bar.** ArrowLeft and ArrowRight (mirrored in RTL), Home and End move between the bar's enabled triggers and links; Tab still visits each. With a panel open, landing on another trigger switches to its panel and landing on a link closes it.
- **Hover.** Resting on a trigger opens its panel after \`delay\`; moving to another trigger switches at once. A panel opened by hover closes when the pointer leaves the trigger and the panel (with a diagonal-safe area) after \`closeDelay\`, unless focus is inside it. Pressing the trigger of a hover-opened panel keeps it open; pressing again closes it.
- **Closing.** Escape closes and returns focus to the trigger. A press outside, focus moving out, and a press on any link close it. A link press closes every level, once. A consumer \`onclick\` runs first and \`event.preventDefault()\` there skips the built-in close.
- **Disabled.** A disabled panel trigger never opens and is skipped by the arrow keys; it renders \`disabled\` and \`data-disabled\`. A disabled link drops its \`href\` and leaves the tab order.
- **Removed panels.** If the open panel is removed or disabled, the value resets to \`null\` (\`onValueChange\` with reason \`trigger-unmount\`).
- **Nested levels.** \`items\` under a panel render inline; a nested panel is a disclosure button that expands in place (click only).

## Styling hooks

Data attributes (presence attributes, \`""\` while the state holds):

- \`data-open\` / \`data-closed\`: on the nav, the popup and each panel.
- \`data-entering\` / \`data-exiting\`: on the popup while its animation plays.
- \`data-popup-open\`: on a panel trigger while its panel is open.
- \`data-disabled\`: on a disabled trigger, link or nested trigger.
- \`data-selected\`: on the link of the current page.
- \`data-side="bottom"\` and \`data-align="start"\`: on the viewport and popup.
- \`data-activation-direction="left" | "right"\`: on a panel that replaced another, the physical direction its trigger lies in from the previously open one.

CSS variables on the viewport: \`--anchor-width\` and \`--anchor-height\`, the open trigger's size in px. The typed maps \`navigationMenuDataAttributes\` and \`navigationMenuCssVariables\` (from \`entasis/navigation-menu\`) list each name with its meaning.

## Structure

\`\`\`
<nav aria-label>
	<ul>
		<li><button aria-expanded aria-controls /></li>
		<li><a href /></li>
	</ul>
	<div data-side="bottom">        <!-- viewport, in flow, positioned under the active trigger -->
		<div>                        <!-- popup, animates its size -->
			<div id>                 <!-- one panel per open trigger -->
				<ul><li><a href /></li></ul>
			</div>
		</div>
	</div>
</nav>
\`\`\`

## Accessibility

Disclosure navigation: every trigger and link keeps its place in the natural Tab order, panels follow in the document, and arrow keys are a shortcut between triggers. Escape returns focus to the trigger and keyboard closes show the focus ring. A current-page link renders \`aria-current="page"\`.
`;
