<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { AlertProps } from './alert.props.js';
	import { useAlertTheme } from './alert.theme.js';
	import { checkCircleIconFill } from '$lib/components/Icons/checkCircle.js';
	import { infoIconFill } from '$lib/components/Icons/info.js';
	import { warningIconFill } from '$lib/components/Icons/warning.js';
	import { xCircleIconFill } from '$lib/components/Icons/xCircle.js';
	import { xIcon } from '$lib/components/Icons/x.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		ref = $bindable(),
		class: className,
		disabled = false,
		color = 'neutral',
		variant = 'outline',
		dismissible = false,
		onDismiss,
		size = 'normal',
		i18n,
		theme,
		prefix,
		title,
		description,
		children,
		...attachments
	}: AlertProps = $props();

	const classes = $derived(useAlertTheme(theme));
	const t = $derived(useI18n(i18n));

	// A filled status icon shown automatically when no `prefix` is given.
	// Non-status colors have no default icon.
	const defaultIcon = $derived(
		color === 'danger'
			? xCircleIconFill
			: color === 'warning'
				? warningIconFill
				: color === 'info'
					? infoIconFill
					: color === 'success'
						? checkCircleIconFill
						: undefined
	);
	const resolvedIcon = $derived(prefix ?? defaultIcon);

	const hasIcon = $derived(!!resolvedIcon);
	const hasDescription = $derived(!!description || !!children);
	const hasTitle = $derived(!!title);
</script>

<div
	bind:this={ref}
	role="alert"
	data-color={color}
	data-size={size}
	data-variant={variant}
	class={classes.root({
		color,
		variant,
		size,
		hasIcon,
		disabled,
		className,
		hasDescription,
		hasTitle
	})}
	{...attachments}
>
	<Slot render={resolvedIcon} class={classes.prefix({ size, variant, hasDescription })} />
	<div class={classes.content()}>
		<Slot render={title} class={classes.title({ size })} />
		<Slot render={description} class={classes.description({ size, variant })}>
			<Slot render={children} />
		</Slot>
	</div>
	{#if dismissible}
		<button
			type="button"
			aria-label={t.dismiss}
			class={classes.close({ size, variant })}
			onclick={() => onDismiss?.()}
		>
			<Slot render={xIcon} />
		</button>
	{/if}
</div>
