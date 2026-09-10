<script lang="ts">
	import Popover from '$lib/components/Popover/Popover.svelte';
	import type { Snippet } from 'svelte';
	import { createRawSnippet } from 'svelte';

	import {} from 'svelte/compiler';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import { tooltip } from '$lib/components/Tooltip/tooltip.svelte.js';
	import { sizes } from '$lib/utils/tokens.js';

	const placements = ['top', 'bottom', 'left', 'right'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'position',
			type: 'segmented',
			label: 'Position',
			value: 'bottom',
			options: placements
		}
	]);

	const text = `Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor`;

	const wrapper2 = createRawSnippet<[Snippet]>((snippet) => {
		return {
			setup(element) {
				// snippet()(element);
			},
			render() {
				return `<div>
					<h1>Hello</h1>
					
				</div>`;
			}
		};
	});

	let buttonRef = $state<HTMLButtonElement | null>(null);
</script>

{#snippet wrapper(children: Snippet)}
	{@render children()}
{/snippet}

{#snippet children()}
	render children
{/snippet}

<DocPage
	title="Popover"
	subtitle="Floating content anchored to a trigger element."
	component="Popover"
	features={[
		'Positioned with Floating UI flip & offset',
		'Bindable open, external ref support',
		'Click, hover, or custom trigger snippet',
		'Escape & click-outside dismissal, both toggleable',
		'Directed enter/exit transitions by placement'
	]}
>
	<ComponentCard
		{controls}
		description="A floating panel opened from a trigger button."
		code={`<Popover
	trigger={{
		content: 'Open',
		color: 'primary'
	}}
	size="${controls.value.size}"
	position="${controls.value.position}"
>
	<div>
		<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor</p>
	</div>
</Popover>`}
	>
		<Popover
			trigger={{
				content: 'Open',
				color: 'primary'
			}}
			size={controls.value.size}
			position={controls.value.position}
		>
			<div>
				<p>{text}</p>
			</div>
		</Popover>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Positions, hover open, nested popovers, and custom triggers."
			class="mt-40"
		>
			{@render wrapper(children)}
			{@render wrapper2(children)}

			<Button
				{@attach tooltip({
					content: children,
					position: 'top',
					offset: 5
				})}
			>
				tooltip here
			</Button>
			<Button
				{@attach tooltip({
					content: children,
					position: 'bottom',
					offset: 5
				})}
			>
				tooltip here
			</Button>

			<Popover
				mobileSheet
				position="bottom"
				trigger={{
					content: 'mobile sheet',
					color: 'primary'
				}}
			>
				<div class="grid gap-2">
					<h2 class="text-neutral text-base font-semibold">Mobile sheet</h2>
					<p class="text-neutral/60 text-sm">{text}</p>
				</div>
			</Popover>

			<Popover trigger={false} open ref={buttonRef} position="bottom"
				>default opened with external ref</Popover
			>

			<Popover
				closeOnMouseLeave={true}
				openOnHover
				hoverDelay={1000}
				trigger={{
					content: 'hover open',
					color: 'danger'
				}}
				position="bottom"
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				closeOnEscape
				position="top"
				trigger={{
					content: 'top',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				position="left"
				trigger={{
					content: 'left',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				position="bottom-end"
				trigger={{
					content: 'bottom-end',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				position="bottom-start"
				trigger={{
					content: 'bottom-start',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				position="top-start"
				trigger={{
					content: 'top-start',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
				</div>
			</Popover>
			<Popover
				position="top-end"
				trigger={{
					content: 'top-end',
					color: 'danger'
				}}
			>
				<div>
					<h1>Hello</h1>
					<p>{text}</p>
					<Popover
						position="top-end"
						trigger={{
							content: 'top-end',
							color: 'danger'
						}}
					>
						<div>
							<h1>Hello</h1>
							<p>{text}</p>
						</div>
					</Popover>
				</div>
			</Popover>

			<Popover position="bottom-start">
				{#snippet trigger(popover)}
					<Button
						variant="soft"
						size="small"
						{@attach popover.reference}
						onclick={() => {
							console.log(popover);
							popover.toggle();
						}}
					>
						yo
					</Button>
				{/snippet}
				content
			</Popover>
		</ComponentCard>
	{/snippet}
</DocPage>
