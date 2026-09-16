<script lang="ts">
	import DocPage from '../../DocPage.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { Separator } from '$lib/components/Separator/index.js';
	import { MenuOption } from '$lib/components/MenuOption/index.js';
	import { userIcon } from '$lib/components/Icons/user.js';
	import { gearIcon } from '$lib/components/Icons/gear.js';
	import { signOutIcon } from '$lib/components/Icons/signOut.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const separatorOrientations = ['horizontal', 'vertical'] as const;
	const controls = createComponentControls([
		{
			name: 'orientation',
			type: 'segmented',
			label: 'Orientation',
			value: 'horizontal',
			options: separatorOrientations
		},
		{ name: 'decorative', type: 'switch', label: 'Decorative', value: false }
	]);
</script>

<DocPage
	title="Separator"
	subtitle="A visual divider between content or sections."
	component="Separator"
	features={[
		{ label: 'role=separator with aria-orientation', test: 'a11y:separator.role' },
		'decorative mode skips semantics',
		'Horizontal & vertical orientations',
		'Optional centred label slot'
	]}
>
	<ComponentCard
		{controls}
		description="A horizontal separator dividing related content."
		code={`<div class="w-full max-w-xl">
	<div class="space-y-1">
		<h4 class="text-sm font-medium leading-none">Svelai</h4>
		<p class="text-neutral/70 text-sm">The foundation for your design system.</p>
	</div>
	<Separator class="my-4" orientation="${controls.value.orientation}" decorative={${controls.value.decorative}} />
	<p class="text-sm leading-relaxed">
		A set of beautifully designed Svelte components that you can customize, extend, and build on.
	</p>
</div>`}
	>
		<div
			class={controls.value.orientation === 'vertical'
				? 'flex h-24 w-full max-w-xl items-center gap-4'
				: 'w-full max-w-xl'}
		>
			<div class="space-y-1">
				<h4 class="text-sm leading-none font-medium">Svelai</h4>
				<p class="text-neutral/70 text-sm">The foundation for your design system.</p>
			</div>
			<Separator
				class={controls.value.orientation === 'vertical' ? 'mx-4 h-full' : 'my-4'}
				orientation={controls.value.orientation}
				decorative={controls.value.decorative}
			/>
			<p class="text-sm leading-relaxed">
				A set of beautifully designed Svelte components that you can customize, extend, and build
				on.
			</p>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Centered label between divider lines.">
			<div class="space-y-6">
				<div>
					<p>Sign in with email</p>
					<Separator children="OR" />
					<p>Sign in with Google</p>
				</div>

				<div>
					<p>Section A</p>
					<Separator>CONTINUE</Separator>
					<p>Section B</p>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Divider color tokens from the design system." class="!min-h-fit">
			<div class="space-y-4">
				<div>
					<p class="text-neutral/70 mb-2 text-sm">Background (default)</p>
					<Separator color="neutral" />
				</div>

				<div>
					<p class="text-neutral/70 mb-2 text-sm">Primary</p>
					<Separator color="primary" />
				</div>

				<div>
					<p class="text-neutral/70 mb-2 text-sm">Secondary</p>
					<Separator color="secondary" />
				</div>

				<div>
					<p class="text-neutral/70 mb-2 text-sm">Success</p>
					<Separator color="success" />
				</div>

				<div>
					<p class="text-neutral/70 mb-2 text-sm">Danger</p>
					<Separator color="danger" />
				</div>

				<div>
					<p class="text-neutral/70 mb-2 text-sm">With Label</p>
					<Separator color="primary" children="Primary Section" />
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Border thickness from 1px to 4px." class="!min-h-fit">
			<div class="space-y-4">
				<div>
					<p class="text-neutral/70 mb-2 text-sm">Thickness 1 (default)</p>
					<Separator thickness={1} />
				</div>

				<div>
					<p class="text-neutral/70 mb-2 text-sm">Thickness 2</p>
					<Separator thickness={2} />
				</div>

				<div>
					<p class="text-neutral/70 mb-2 text-sm">Thickness 4</p>
					<Separator thickness={4} />
				</div>

				<div>
					<p class="text-neutral/70 mb-2 text-sm">Thickness 4 with Color</p>
					<Separator thickness={4} color="primary" />
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Side-by-side content separated vertically." class="!min-h-fit">
			<div class="space-y-6">
				<div class="flex h-24 items-center gap-4">
					<div class="flex-1 text-center">Left Content</div>
					<Separator orientation="vertical" />
					<div class="flex-1 text-center">Right Content</div>
				</div>

				<div class="flex h-32 items-center gap-4">
					<div class="flex-1 text-center">Section A</div>
					<Separator orientation="vertical" color="primary" thickness={2} />
					<div class="flex-1 text-center">Section B</div>
					<Separator orientation="vertical" color="primary" thickness={2} />
					<div class="flex-1 text-center">Section C</div>
				</div>
			</div>
		</ComponentCard>

		<ComponentCard description="Dividing groups inside a menu panel.">
			<div class="bg-surface border-neutral-muted w-64 rounded-xl border p-1">
				<MenuOption prefix={userIcon} title="Profile" description="View your profile" />
				<MenuOption prefix={gearIcon} title="Settings" description="Manage preferences" />

				<Separator class="my-1" />

				<MenuOption color="danger" prefix={signOutIcon} title="Log Out" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Section headings with labelled separators."
			class="!min-h-fit max-w-2xl"
		>
			<div class="space-y-4">
				<section>
					<h3 class="text-xl font-semibold">Personal Information</h3>
					<p class="text-neutral/70">Manage your personal details</p>
				</section>

				<Separator color="primary" thickness={2} children="Account Settings" />

				<section>
					<h3 class="text-xl font-semibold">Security</h3>
					<p class="text-neutral/70">Password and authentication settings</p>
				</section>

				<Separator color="secondary" children="Preferences" />

				<section>
					<h3 class="text-xl font-semibold">Notifications</h3>
					<p class="text-neutral/70">Manage your notification preferences</p>
				</section>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
