<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import Button from '../Button/Button.svelte';
	import type { CardProps, CardActionSlot } from './card.props.js';
	import type { ButtonProps } from '../Button/button.props.js';
	import { useCardTheme } from './card.theme.js';

	let {
		ref = $bindable(),
		class: className,
		disabled = false,
		color = 'neutral',
		variant = 'solid',
		size = 'normal',
		density = 'normal',
		href,
		target,
		rel,
		onclick = null,
		onpointerenter = null,
		onpointerleave = null,
		showBorders = false,
		theme,
		header,
		title,
		description,
		action,
		content,
		footer,
		children,
		...attachments
	}: CardProps = $props();

	const classes = $derived(useCardTheme(theme));

	const hasHeader = $derived(!!(header || title || description || action));
	const hasContent = $derived(!!(content || children));
	const hasFooter = $derived(!!footer);
	const hasHeaderBorder = $derived(showBorders && hasHeader && hasContent);
	const hasFooterBorder = $derived(showBorders && hasFooter && (hasHeader || hasContent));
	const hasAction = $derived(!!action);

	const element = $derived(href ? 'a' : 'div');
	const role = $derived(href ? 'link' : onclick ? 'button' : undefined);
	const clickable = $derived(!disabled && (!!href || !!onclick));

	// Interactive descendants (footer buttons, the header action, links, form
	// controls…) must keep working inside a clickable card: a click on them must
	// not ALSO trigger the card's own click handler / navigation.
	const INTERACTIVE_SELECTOR =
		'button, a[href], input, select, textarea, label, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [contenteditable="true"]';

	const hitsInnerInteractive = (event: Event): boolean => {
		const target = event.target;
		const root = event.currentTarget;
		if (!(target instanceof Element) || !(root instanceof Element)) return false;
		const hit = target.closest(INTERACTIVE_SELECTOR);
		return !!hit && hit !== root && root.contains(hit);
	};

	const handleClick = (event: MouseEvent) => {
		if (disabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if (hitsInnerInteractive(event)) {
			// Inner control owns this click; on link cards also stop the navigation.
			if (href) event.preventDefault();
			return;
		}
		onclick?.(event);
	};
	// A role="button" div is not keyboard-operable by itself: make it focusable
	// and activate on Enter/Space like a real button (links handle their own).
	// Only when the card itself is focused — keystrokes on inner controls bubble
	// here too and must not re-trigger the card.
	const handleKeydown = (event: KeyboardEvent) => {
		if (href || !onclick || disabled) return;
		if (event.target !== event.currentTarget) return;
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (event.currentTarget instanceof HTMLElement) event.currentTarget.click();
		}
	};
	const handleEnter = (event: PointerEvent) => {
		if (!disabled) onpointerenter?.(event);
	};
	const handleLeave = (event: PointerEvent) => {
		if (!disabled) onpointerleave?.(event);
	};

	const isButtonProps = (value: CardActionSlot | undefined): value is Omit<ButtonProps, 'as'> => {
		if (!value) return false;
		// Snippets are functions, strings are strings
		if (typeof value === 'function' || typeof value === 'string') return false;
		// Objects with Button-like properties are ButtonProps
		return typeof value === 'object' && value !== null;
	};
</script>

<svelte:element
	this={element}
	bind:this={ref}
	data-slot="card"
	data-color={color}
	data-size={size}
	data-density={density}
	data-variant={variant}
	data-clickable={clickable}
	href={href && !disabled ? href : undefined}
	{target}
	{rel}
	{role}
	tabindex={href ? (disabled ? -1 : undefined) : onclick && !disabled ? 0 : undefined}
	class={classes.root({ color, variant, size, density, clickable, disabled, className })}
	onclick={handleClick}
	onkeydown={handleKeydown}
	onpointerenter={handleEnter}
	onpointerleave={handleLeave}
	aria-disabled={disabled || undefined}
	{...attachments}
>
	<Slot
		renderIf={hasHeader}
		render={header}
		attrs={{
			'data-color': color
		}}
		class={classes.header({ density, hasAction, hasBorder: hasHeaderBorder, variant })}
	>
		<Slot render={title} class={classes.title({ size, variant })} />
		<Slot render={description} class={classes.description({ size, variant })} />

		{#if action}
			{#if isButtonProps(action)}
				{@const actionClass = classes.action({ class: action.class })}
				{@const actionWithoutClass = { ...action, class: undefined }}
				<Button size="small" variant="ghost" {...actionWithoutClass} class={actionClass} />
			{:else}
				<Slot render={action} class={classes.action()} />
			{/if}
		{/if}
	</Slot>

	<Slot
		renderIf={hasContent}
		render={content}
		class={classes.content({ density, hasBorderBottom: false, hasBorderTop: false })}
	>
		<Slot render={children} />
	</Slot>

	<Slot render={footer} class={classes.footer({ density, hasBorder: hasFooterBorder })} />
</svelte:element>
