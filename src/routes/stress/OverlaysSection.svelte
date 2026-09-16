<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import { Command } from '$lib/components/Command/index.js';
	import { ContextMenu } from '$lib/components/ContextMenu/index.js';
	import { Dialog } from '$lib/components/Dialog/index.js';
	import { HoverCard } from '$lib/components/HoverCard/index.js';
	import type { MenuItem } from '$lib/components/Menu/index.js';
	import { Popover } from '$lib/components/Popover/index.js';
	import { PopupMenu } from '$lib/components/PopupMenu/index.js';
	import { toast } from '$lib/components/Toast/index.js';
	import { Tooltip, tooltip } from '$lib/components/Tooltip/index.js';
	import { chartBarIcon } from '$lib/components/Icons/chartBar.js';
	import { folderIcon } from '$lib/components/Icons/folder.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { houseIcon } from '$lib/components/Icons/house.js';
	import { trashIcon } from '$lib/components/Icons/trash.js';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import Matrix from './Matrix.svelte';
	import Section from './Section.svelte';
	import { colors, densities, sizes } from './fixtures.js';

	let { size = 'normal', density = 'normal' }: { size?: Sizes; density?: Density } = $props();

	const tooltipVariants = ['solid', 'outline', 'soft'] as const;
	const dialogTypes = [
		'modal',
		'alert',
		'fullScreen',
		'drawerRight',
		'drawerLeft',
		'drawerTop',
		'drawerBottom'
	] as const;

	const menuItems: MenuItem[] = [
		{ type: 'option', title: 'Open', prefix: houseIcon },
		{ type: 'option', title: 'Reports', prefix: chartBarIcon },
		{ type: 'separator' },
		{ type: 'option', title: 'Settings', prefix: gearIcon },
		{ type: 'option', title: 'Delete', prefix: trashIcon, color: 'danger' }
	];

	const commandGroups = [
		{
			heading: 'Navigation',
			items: [
				{ value: 'home', label: 'Go home', icon: houseIcon, shortcut: 'g h' },
				{ value: 'files', label: 'Open files', icon: folderIcon, shortcut: 'g f' }
			]
		},
		{
			heading: 'Actions',
			items: [
				{ value: 'settings', label: 'Open settings', icon: gearIcon },
				{ value: 'delete', label: 'Delete project', icon: trashIcon, disabled: true }
			]
		}
	];
</script>

<Section
	id="overlays"
	title="Overlays"
	description="Triggers for Dialog, Tooltip, HoverCard, Toast, PopupMenu and ContextMenu, plus the two overlays with a real non-portal mode rendered open in flow: Popover (inline) and Command (dialog=false)."
>
	<Matrix
		caption="Tooltip"
		varies="color, variant, size, trigger form"
		note="Component triggers hover to show the shared surface; the last row uses the tooltip() attachment directly."
	>
		{#each colors as color (color)}
			<Tooltip
				content={`Tooltip ${color}`}
				{color}
				trigger={{ content: color, variant: 'outline', color, size }}
			/>
		{/each}
		{#each tooltipVariants as variant (variant)}
			<Tooltip
				content={`Variant ${variant}`}
				{variant}
				color="neutral"
				trigger={{ content: variant, variant: 'soft', color: 'neutral', size }}
			/>
		{/each}
		{#each sizes as tooltipSize (tooltipSize)}
			<Button
				variant="ghost"
				color="primary"
				{size}
				{@attach tooltip({ content: `Size ${tooltipSize}`, size: tooltipSize })}
			>
				size {tooltipSize}
			</Button>
		{/each}
	</Matrix>

	<Matrix caption="Popover — triggers" varies="position, size, openOnHover">
		{#each ['top', 'right', 'bottom', 'left'] as const as position (position)}
			<Popover {position} trigger={{ content: `Popover ${position}`, variant: 'outline', size }}>
				<div class="gap-xs p-sm grid text-sm">
					<p class="text-neutral font-medium">Popover {position}</p>
					<p class="text-neutral/70">Floating surface anchored to its trigger.</p>
				</div>
			</Popover>
		{/each}
		{#each sizes as popoverSize (popoverSize)}
			<Popover
				size={popoverSize}
				trigger={{ content: `Size ${popoverSize}`, variant: 'soft', color: 'primary', size }}
			>
				<p class="p-sm text-neutral/70 text-sm">Size {popoverSize}</p>
			</Popover>
		{/each}
		<Popover openOnHover trigger={{ content: 'Open on hover', variant: 'ghost', size }}>
			<p class="p-sm text-neutral/70 text-sm">Hover-opened popover.</p>
		</Popover>
	</Matrix>

	<Matrix
		caption="Popover — inline (open, in flow)"
		varies="size, closeOnEscape, trigger"
		note="`inline` renders the panel in normal document flow instead of portaling to a fixed layer, so an open panel can be screenshot in place."
		layout="grid"
		class="items-start"
	>
		{#each sizes as popoverSize (popoverSize)}
			<Popover inline open closeOnEscape={false} trigger={false} size={popoverSize}>
				<div class="gap-xs grid text-sm">
					<p class="text-neutral font-medium">Inline {popoverSize}</p>
					<p class="text-neutral/70">Same panel classes and motion as a floating popover.</p>
				</div>
			</Popover>
		{/each}
		<Popover
			inline
			defaultOpen
			closeOnEscape={false}
			{size}
			trigger={{ content: 'Inline with trigger', variant: 'outline', size }}
		>
			<p class="text-neutral/70 text-sm">The trigger still toggles this panel.</p>
		</Popover>
	</Matrix>

	<Matrix caption="HoverCard" varies="size, density, card variant, position">
		{#each sizes as cardSize (cardSize)}
			<HoverCard
				size={cardSize}
				{density}
				title="Ari Martin"
				description="Design systems lead."
				trigger={{ content: `Size ${cardSize}`, variant: 'outline', size }}
			/>
		{/each}
		<HoverCard
			card={{ variant: 'soft', color: 'primary' }}
			title="Soft card"
			description="Alternate card treatment."
			trigger={{ content: 'Soft', variant: 'ghost', size }}
		/>
		<HoverCard
			openOnClick
			title="Click to open"
			description="Opens on click instead of hover."
			trigger={{ content: 'Click', variant: 'soft', size }}
		/>
	</Matrix>

	<Matrix caption="PopupMenu" varies="position, menu density">
		{#each densities as menuDensity (menuDensity)}
			<PopupMenu
				menu={{ items: menuItems, density: menuDensity }}
				trigger={{ content: `Density ${menuDensity}`, variant: 'outline', size }}
			/>
		{/each}
		<PopupMenu
			position="right"
			menu={{ items: menuItems }}
			trigger={{ content: 'Right', variant: 'soft', color: 'primary', size }}
		/>
	</Matrix>

	<Matrix caption="ContextMenu" varies="right-click target" layout="block">
		<ContextMenu items={menuItems}>
			<div
				class="border-neutral-muted text-neutral/60 grid h-24 w-full place-items-center rounded-lg border border-dashed text-xs"
			>
				Right-click anywhere in this area
			</div>
		</ContextMenu>
	</Matrix>

	<Matrix caption="Toast" varies="color, size (imperative API)">
		{#each colors as color (color)}
			<Button
				variant="soft"
				{color}
				{size}
				onclick={() => toast[color]({ title: `Toast ${color}`, description: 'Imperative toast.' })}
			>
				toast {color}
			</Button>
		{/each}
	</Matrix>

	<Matrix
		caption="Command — inline (dialog=false)"
		varies="size, density, showInput"
		layout="grid"
		class="items-start"
	>
		{#each sizes as commandSize (commandSize)}
			<div class="border-neutral-muted bg-surface rounded-lg border">
				<Command dialog={false} size={commandSize} {density} items={commandGroups} />
			</div>
		{/each}
		<div class="border-neutral-muted bg-surface rounded-lg border">
			<Command dialog={false} {size} {density} showInput={false} items={commandGroups} />
		</div>
	</Matrix>

	<Matrix caption="Command — dialog trigger" varies="shortcut disabled to keep the page inert">
		<Command items={commandGroups} shortcut={false} trigger="Open command palette" />
	</Matrix>

	<Matrix
		caption="Dialog — triggers"
		varies="type (modal, alert, fullScreen, drawer*), size"
		note="Triggers only; opening any of these portals a panel over the page."
	>
		{#each dialogTypes as type (type)}
			<Dialog
				{type}
				title="Dialog {type}"
				description="Portalled overlay panel."
				trigger={{ content: type, variant: 'outline', size }}
			>
				<p class="p-sm text-neutral/70 text-sm">Dialog body for the {type} type.</p>
			</Dialog>
		{/each}
		{#each sizes as dialogSize (dialogSize)}
			<Dialog
				size={dialogSize}
				title="Size {dialogSize}"
				trigger={{ content: `size ${dialogSize}`, variant: 'soft', color: 'primary', size }}
			>
				<p class="p-sm text-neutral/70 text-sm">Dialog body.</p>
			</Dialog>
		{/each}
	</Matrix>
</Section>
