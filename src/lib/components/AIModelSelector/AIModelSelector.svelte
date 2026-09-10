<script lang="ts">
	import { caretUpDownIcon } from '../Icons/caretUpDown.js';
	import { checkIcon } from '../Icons/check.js';
	import Button from '../Button/Button.svelte';
	import type { MenuItem } from '../Menu/menu.props.js';
	import type { PopoverState } from '../Popover/popover.state.svelte.js';
	import PopupMenu from '../PopupMenu/PopupMenu.svelte';
	import Slot from '../Slot/Slot.svelte';
	import TextInput from '../Form/TextInput/TextInput.svelte';
	import { getAIConversation } from '../AIConversation/aiConversation.state.svelte.js';
	import { SvelteMap } from 'svelte/reactivity';
	import type {
		AIModelSelectorGroup,
		AIModelSelectorLabels,
		AIModelSelectorMenuItem,
		AIModelSelectorModel,
		AIModelSelectorProps,
		AIModelSelectorState
	} from './aiModelSelector.props.js';
	import { useAIModelSelectorTheme } from './aiModelSelector.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		ref = $bindable(),
		models = [],
		groups = [],
		value = $bindable<string | null | undefined>(),
		defaultValue,
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		query = $bindable(''),
		searchable = true,
		menuItems: supplementalItems = [],
		disabled = false,
		placeholder,
		searchPlaceholder,
		emptyLabel,
		labels,
		children,
		search,
		empty,
		onValueChange,
		class: className,
		theme,
		...attachments
	}: AIModelSelectorProps = $props();
	const valueState = createBindableValue<string | null | undefined>(
		() => value,
		(nextValue) => (value = nextValue),
		() => defaultValue
	);
	const openState = createBindableValue(
		() => open,
		(nextOpen) => (open = nextOpen),
		() => defaultOpen
	);
	const conversation = getAIConversation();
	const groupedModels = $derived(collectModels(groups));
	const groupedModelIds = $derived(
		new Set(groupedModels.map((model: AIModelSelectorModel) => model.id))
	);
	const standaloneModels = $derived(
		models.filter((model: AIModelSelectorModel) => !groupedModelIds.has(model.id))
	);
	const allModels = $derived([...models, ...groupedModels]);
	const hasModelSources = $derived(allModels.length > 0);
	const searchQuery = $derived(searchable ? query : '');
	const filteredModels = $derived(
		standaloneModels.filter((model: AIModelSelectorModel) => modelMatchesQuery(model, searchQuery))
	);
	const filteredGroups = $derived(filterGroups(groups, searchQuery));
	const modelsById = $derived(new Map(allModels.map((model) => [model.id, model])));
	const selectedValue = $derived(
		valueState.value === undefined ? conversation?.selectedModel : (valueState.value ?? undefined)
	);
	const selectedModel = $derived(selectedValue ? modelsById.get(selectedValue) : undefined);
	const resolvedLabels = $derived<AIModelSelectorLabels>({
		placeholder:
			(placeholder === undefined
				? (labels?.placeholder ?? conversation?.labels.modelSelector.placeholder ?? 'Select model')
				: placeholder) ?? '',
		triggerAriaLabel: labels?.triggerAriaLabel ?? 'Select model',
		searchPlaceholder: searchPlaceholder ?? labels?.searchPlaceholder ?? 'Search models...',
		empty: emptyLabel ?? labels?.empty ?? 'No models found',
		providerFallback: labels?.providerFallback ?? 'Models'
	});
	const classes = $derived(useAIModelSelectorTheme(theme));
	const selectorState = $derived<AIModelSelectorState>({
		model: selectedModel,
		value: selectedValue,
		open: openState.value,
		query,
		searchable,
		disabled,
		labels: resolvedLabels,
		select: selectModel,
		setQuery,
		setOpen,
		toggle
	});

	function collectModels(source: readonly AIModelSelectorGroup[]): AIModelSelectorModel[] {
		return source.flatMap((group) => [
			...(group.models ?? []),
			...collectModels(group.groups ?? [])
		]);
	}
	function selectModel(model: AIModelSelectorModel) {
		if (disabled || model.disabled) return;
		if (selectedValue !== model.id) {
			if (valueState.value === undefined && conversation) conversation.setSelectedModel(model.id);
			else valueState.value = model.id;
			onValueChange?.({ value: model.id, model });
		}
		setOpen(false);
		query = '';
	}
	function setQuery(nextQuery: string) {
		query = nextQuery;
	}
	function setOpen(nextOpen: boolean) {
		if (disabled && nextOpen) return;
		if (openState.value === nextOpen) return;
		openState.value = nextOpen;
		onOpenChange?.(nextOpen);
	}
	function toggle() {
		setOpen(!openState.value);
	}
	function contextLabel(tokens?: number): string | undefined {
		if (tokens === undefined) return undefined;
		if (tokens >= 1_000_000) return `${tokens / 1_000_000}M`;
		if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
		return `${tokens}`;
	}
	function modelItem(model: AIModelSelectorModel): MenuItem {
		return {
			type: 'option',
			title: model.label,
			description: model.description ?? model.provider,
			prefix: model.icon,
			suffix: selectedValue === model.id ? checkIcon : contextLabel(model.contextWindow),
			disabled: disabled || model.disabled,
			active: selectedValue === model.id,
			class: classes.option({ selected: selectedValue === model.id }),
			attrs: {
				'data-slot': 'ai-model-selector-option',
				'data-model-id': model.id,
				'data-selected': selectedValue === model.id ? 'true' : undefined
			},
			onclick: () => selectModel(model)
		};
	}
	function groupItem(group: AIModelSelectorGroup): MenuItem {
		const modelItems = (group.models ?? []).map(modelItem);
		const groupItems = (group.groups ?? []).map(groupItem);
		const menu = [
			...modelItems,
			...(modelItems.length > 0 && groupItems.length > 0
				? [{ type: 'separator' } satisfies MenuItem]
				: []),
			...groupItems
		];
		return {
			type: 'submenu',
			title: group.label,
			prefix: group.icon,
			menu,
			class: classes.group(),
			attrs: { 'data-slot': 'ai-model-selector-group' },
			disabled: disabled || group.disabled || menu.length === 0
		};
	}
	function filterGroups(
		source: readonly AIModelSelectorGroup[],
		searchQuery: string
	): AIModelSelectorGroup[] {
		const normalizedQuery = searchQuery.trim().toLowerCase();
		return source.flatMap((group) => {
			if (normalizedQuery && group.label.toLowerCase().includes(normalizedQuery)) {
				return [group];
			}
			const nestedGroups = filterGroups(group.groups ?? [], searchQuery);
			const matchingModels = (group.models ?? []).filter((model) =>
				modelMatchesQuery(model, searchQuery)
			);
			if (matchingModels.length === 0 && nestedGroups.length === 0) return [];
			return [{ ...group, models: matchingModels, groups: nestedGroups }];
		});
	}
	function modelMatchesQuery(model: AIModelSelectorModel, searchQuery: string): boolean {
		const normalizedQuery = searchQuery.trim().toLowerCase();
		if (!normalizedQuery) return true;
		return [
			model.id,
			model.label,
			model.provider,
			model.description,
			...(model.keywords ?? [])
		].some((value) => value?.toLowerCase().includes(normalizedQuery));
	}
	function modelsToMenuItems(source: readonly AIModelSelectorModel[]): MenuItem[] {
		const providers = new SvelteMap<string, AIModelSelectorModel[]>();
		for (const model of source) {
			const provider = model.provider ?? resolvedLabels.providerFallback;
			providers.set(provider, [...(providers.get(provider) ?? []), model]);
		}
		if (providers.size === 1 && providers.has(resolvedLabels.providerFallback))
			return source.map(modelItem);
		return [...providers.entries()].flatMap(([provider, providerModels], index) => [
			...(index > 0 ? [{ type: 'separator' } satisfies MenuItem] : []),
			{
				type: 'button',
				children: provider,
				disabled: true,
				variant: 'ghost',
				fullWidth: true,
				class: classes.provider()
			} satisfies MenuItem,
			...providerModels.map(modelItem)
		]);
	}
	function resolveSupplementalItems(source: readonly AIModelSelectorMenuItem[]): MenuItem[] {
		return source.map((item) => {
			if (item.type === 'separator') return item;
			if (item.type === 'submenu') {
				return {
					...item,
					disabled: disabled || item.disabled,
					menu: resolveSupplementalItems(item.menu)
				};
			}
			return disabled ? { ...item, disabled: true } : item;
		});
	}
	const flatMenuItems = $derived(modelsToMenuItems(filteredModels));
	const modelMenuItems = $derived<MenuItem[]>([
		...flatMenuItems,
		...(flatMenuItems.length > 0 && filteredGroups.length > 0
			? [{ type: 'separator' } satisfies MenuItem]
			: []),
		...filteredGroups.map(groupItem),
		...(hasModelSources && filteredModels.length === 0 && filteredGroups.length === 0
			? [
					{
						type: 'button',
						children: emptyContent,
						disabled: true,
						variant: 'ghost',
						fullWidth: true,
						class: classes.empty()
					} satisfies MenuItem
				]
			: [])
	]);
	const resolvedSupplementalItems = $derived(resolveSupplementalItems(supplementalItems));
	const menuItems = $derived<MenuItem[]>([
		...modelMenuItems,
		...(modelMenuItems.length > 0 && resolvedSupplementalItems.length > 0
			? [{ type: 'separator' } satisfies MenuItem]
			: []),
		...resolvedSupplementalItems,
		...(!hasModelSources && resolvedSupplementalItems.length === 0
			? [
					{
						type: 'button',
						children: emptyContent,
						disabled: true,
						variant: 'ghost',
						fullWidth: true,
						class: classes.empty()
					} satisfies MenuItem
				]
			: [])
	]);
</script>

{#snippet emptyContent()}
	<span data-slot="ai-model-selector-empty">
		<Slot render={empty ?? resolvedLabels.empty} payload={selectorState} />
	</span>
{/snippet}

{#snippet searchHeader()}
	<div data-slot="ai-model-selector-search" class={classes.search()}>
		{#if search}<Slot render={search} payload={selectorState} />{:else}<TextInput
				value={query}
				size="small"
				placeholder={resolvedLabels.searchPlaceholder}
				label={resolvedLabels.searchPlaceholder}
				theme={{ label: { base: 'sr-only' } }}
				onValueChange={(nextValue: string | null) => setQuery(nextValue ?? '')}
			/>{/if}
	</div>
{/snippet}

{#snippet selectorTrigger(popover: PopoverState)}
	{#if children}
		<button
			type="button"
			data-slot="ai-model-selector-trigger"
			data-custom="true"
			class="inline-flex"
			{disabled}
			aria-haspopup="menu"
			aria-expanded={openState.value}
			{@attach popover.reference}
			onclick={() => popover.toggle()}
		>
			<Slot render={children} payload={selectorState} />
		</button>
	{:else}
		<Button
			type="button"
			data-slot="ai-model-selector-trigger"
			variant="soft"
			size="small"
			{disabled}
			aria-haspopup="menu"
			aria-expanded={openState.value}
			label={selectedModel || resolvedLabels.placeholder
				? undefined
				: resolvedLabels.triggerAriaLabel}
			class={classes.trigger()}
			{@attach popover.reference}
			onclick={() => popover.toggle()}
		>
			<span class="contents">
				<span class={classes.triggerContent()}>
					{#if selectedModel?.icon}
						<span class={classes.triggerIcon()}><Slot render={selectedModel.icon} /></span>
					{/if}
					<span class={classes.triggerLabel({ selected: Boolean(selectedModel) })}
						>{selectedModel?.label ?? resolvedLabels.placeholder}</span
					>
				</span>
				{@render caretUpDownIcon({ size: 14 })}
			</span>
		</Button>
	{/if}
{/snippet}

<div
	bind:this={ref}
	data-slot="ai-model-selector"
	data-state={openState.value ? 'open' : 'closed'}
	data-disabled={disabled || undefined}
	data-searchable={searchable || undefined}
	data-value={selectedValue}
	class={classes.root({ className })}
	{...attachments}
>
	<PopupMenu
		bind:open={() => openState.value, setOpen}
		trigger={selectorTrigger}
		fitTrigger={false}
		class={classes.popover()}
		menu={{
			items: menuItems,
			class: classes.menu(),
			header: searchable && hasModelSources ? searchHeader : undefined
		}}
	/>
</div>
