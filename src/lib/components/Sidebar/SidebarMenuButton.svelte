<script lang="ts">
	import PopupMenu from '$lib/components/PopupMenu/PopupMenu.svelte';
	import { caretDownIcon } from '$lib/components/Icons/caretDown.js';
	import { caretUpDownIcon } from '$lib/components/Icons/caretUpDown.js';
	import type {
		SidebarApi,
		SidebarDensity,
		SidebarMenuActionDescriptor,
		SidebarMenuButtonItem,
		SidebarSize
	} from './sidebar.props.js';
	import { getSidebarMenuPosition } from './sidebar-position.js';
	import SidebarAction from './SidebarAction.svelte';
	import SidebarIcon from './SidebarIcon.svelte';
	import { useSidebarTheme, type SidebarThemeProps } from './sidebar.theme.js';

	type Props = SidebarMenuButtonItem & {
		/** Sidebar API handed to `onclick` and to a trailing action descriptor. */
		api?: SidebarApi;
		/** Uses the mobile menu placement when true. */
		mobile?: boolean;
		/** Default alignment when the item does not provide menuAlign. */
		defaultAlign?: 'start' | 'center' | 'end';
		/** Typography, icon, and row geometry scale. */
		size?: SidebarSize;
		/** Internal whitespace scale. */
		density?: SidebarDensity;
		/** Sidebar theme overrides for this menu row. */
		theme?: SidebarThemeProps;
	};

	let {
		icon,
		avatar,
		variant = 'default',
		title,
		subtitle,
		trailing,
		href,
		onclick,
		menu,
		menuSide,
		menuAlign,
		menuClass,
		menuIconClass,
		menuShowLabel = false,
		openStyle,
		class: className,
		mediaClass,
		api,
		mobile = false,
		defaultAlign = 'start',
		size = 'normal',
		density = 'normal',
		theme
	}: Props = $props();

	let avatarImageFailed = $state(false);
	let previousAvatarSrc = $state<string | undefined>();

	const classes = $derived(useSidebarTheme(theme));
	const compact = $derived(variant === 'compact');
	const brand = $derived(variant === 'brand');
	// A descriptor is an object that is neither a snippet nor a string: it becomes a real control
	// beside the row, because a button cannot be nested inside a button.
	const trailingAction = $derived<SidebarMenuActionDescriptor | undefined>(
		trailing && typeof trailing === 'object' ? (trailing as SidebarMenuActionDescriptor) : undefined
	);
	const trailingActionSize = $derived(trailingAction?.size ?? size);
	const resolvedTrailing = $derived(
		trailing === false || trailingAction
			? undefined
			: ((trailing as Exclude<typeof trailing, false | SidebarMenuActionDescriptor>) ??
					(menu ? (compact ? caretDownIcon : caretUpDownIcon) : undefined))
	);
	const resolvedOpenStyle = $derived(openStyle ?? (avatar ? 'muted' : 'accent'));
	const openClass = $derived(
		menu && !compact
			? resolvedOpenStyle === 'muted'
				? 'aria-expanded:bg-neutral-muted'
				: 'aria-expanded:bg-primary-muted aria-expanded:text-primary-muted-readable'
			: ''
	);
	const collapsedMediaPadding = $derived(
		compact
			? 'group-data-[collapsible=icon]:![padding-inline:calc((var(--sidebar-icon-button-width)-var(--sidebar-compact-media-size))/2)]'
			: 'group-data-[collapsible=icon]:![padding-inline:calc((var(--sidebar-icon-button-width)-var(--sidebar-media-size))/2)]'
	);
	const buttonClass = $derived(
		classes.menuButton({
			componentSize: size,
			density,
			size: compact ? 'default' : 'lg',
			className: [
				compact && 'w-fit group-data-[collapsible=icon]:w-full',
				trailingAction && 'min-w-0 flex-1 group-data-[collapsible=icon]:flex-none',
				collapsedMediaPadding,
				openClass,
				className
			]
		})
	);
	const menuPosition = $derived(
		getSidebarMenuPosition(
			menuSide ?? (compact || brand ? 'bottom' : undefined),
			menuAlign ?? defaultAlign,
			mobile
		)
	);

	$effect(() => {
		const avatarSrc = avatar?.src;
		if (avatarSrc === previousAvatarSrc) return;

		previousAvatarSrc = avatarSrc;
		avatarImageFailed = false;
	});
</script>

{#snippet media()}
	{#if avatar}
		<div class={classes.avatar({ componentSize: size, className: mediaClass })}>
			{#if avatar.src && !avatarImageFailed}
				<img
					src={avatar.src}
					alt={avatar.alt ?? ''}
					class="size-full object-cover"
					onerror={() => (avatarImageFailed = true)}
				/>
			{:else}
				{avatar.fallback ?? title.slice(0, 2).toUpperCase()}
			{/if}
		</div>
	{:else if icon}
		<div
			class={classes.media({
				size: compact ? 'compact' : 'default',
				componentSize: size,
				className: mediaClass
			})}
		>
			<SidebarIcon {icon} />
		</div>
	{/if}
{/snippet}

{#snippet rowText()}
	{#if compact}
		<span class={classes.menuLabel({ className: 'font-medium' })}>{title}</span>
	{:else if brand}
		<div class={classes.menuLabel({ className: 'flex flex-col gap-0.5 leading-none' })}>
			<span class="truncate font-medium">{title}</span>
			{#if subtitle}
				<span class={classes.menuSecondary({ componentSize: size })}>{subtitle}</span>
			{/if}
		</div>
	{:else}
		<div class={classes.menuLabel({ className: 'grid text-left leading-tight' })}>
			<span class="truncate font-medium">{title}</span>
			{#if subtitle}
				<span class={classes.menuSecondary({ componentSize: size })}>{subtitle}</span>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet buttonInner()}
	{@render media()}
	{@render rowText()}
	{#if resolvedTrailing}
		<SidebarIcon
			icon={resolvedTrailing}
			class={classes.menuTrailing({
				componentSize: size,
				className: compact ? 'opacity-50' : undefined
			})}
		/>
	{/if}
{/snippet}

{#snippet identityRow()}
	<div class="flex items-center gap-2 px-2 py-1 text-left">
		{@render media()}
		<div class="grid min-w-0 flex-1 leading-tight">
			<span class="text-neutral truncate font-medium">{title}</span>
			{#if subtitle}
				<span class={classes.menuSecondary({ componentSize: size })}>{subtitle}</span>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet control()}
	{#if menu}
		<PopupMenu
			menu={{
				items: menu,
				header: menuShowLabel ? identityRow : undefined,
				theme: menuIconClass ? { option: { prefix: { base: menuIconClass } } } : undefined
			}}
			position={menuPosition}
			class={menuClass ?? 'min-w-56 rounded-lg'}
			fitTrigger={!compact}
		>
			{#snippet trigger(popover)}
				<button
					type="button"
					data-slot="sidebar-menu-button"
					data-size={compact ? 'default' : 'lg'}
					class={buttonClass}
					aria-expanded={popover.isOpen}
					aria-haspopup="menu"
					aria-controls={popover.isOpen ? popover.id : undefined}
					{@attach popover.reference}
					onclick={() => popover.toggle()}
				>
					{@render buttonInner()}
				</button>
			{/snippet}
		</PopupMenu>
	{:else if href}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- Package consumers supply URLs; library links cannot depend on SvelteKit routing. -->
		<a
			{href}
			data-slot="sidebar-menu-button"
			data-size={compact ? 'default' : 'lg'}
			class={buttonClass}
		>
			{@render buttonInner()}
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{:else}
		<button
			type="button"
			onclick={(event) => onclick?.(event, api as SidebarApi)}
			data-slot="sidebar-menu-button"
			data-size={compact ? 'default' : 'lg'}
			class={buttonClass}
		>
			{@render buttonInner()}
		</button>
	{/if}
{/snippet}

{#if trailingAction}
	<div data-slot="sidebar-menu-button-row" class={classes.buttonRow()}>
		{@render control()}
		<div
			class={classes.actionSlot({
				componentSize: trailingActionSize,
				className: 'group-data-[collapsible=icon]:hidden'
			})}
		>
			<SidebarAction
				action={trailingAction}
				api={api as SidebarApi}
				size={trailingActionSize}
				{theme}
			/>
		</div>
	</div>
{:else}
	{@render control()}
{/if}
