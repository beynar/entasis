<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { appleLogoIcon } from 'svelai/icons/appleLogo';
	import { downloadSimpleIcon } from 'svelai/icons/downloadSimple';
	import { terminalWindowIcon } from 'svelai/icons/terminalWindow';
	import { windowsLogoIcon } from 'svelai/icons/windowsLogo';
	const platforms = [
		{
			name: 'macOS',
			description: 'A short guide for your terminal workflow.',
			icon: appleLogoIcon,
			file: 'macos-setup.txt',
			notes:
				'SVELAI ON MACOS\n\nOpen your Svelte project in Terminal.\nInstall the library: npm install svelai\nFollow the project documentation for theme configuration.\n'
		},
		{
			name: 'Windows',
			description: 'The same workflow in PowerShell or Terminal.',
			icon: windowsLogoIcon,
			file: 'windows-setup.txt',
			notes:
				'SVELAI ON WINDOWS\n\nOpen your Svelte project in PowerShell.\nInstall the library: npm install svelai\nFollow the project documentation for theme configuration.\n'
		},
		{
			name: 'Linux',
			description: 'Bring Svelai into your preferred environment.',
			icon: terminalWindowIcon,
			file: 'linux-setup.txt',
			notes:
				'SVELAI ON LINUX\n\nOpen your Svelte project in your shell.\nInstall the library: npm install svelai\nFollow the project documentation for theme configuration.\n'
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="max-w-2xl">
		<Heading as="h2" size="h2" weight="bold">Your tools. Your environment.</Heading>
		<p class="mt-lg text-neutral/70">
			Save the setup notes for your machine and bring the same component library into your workflow.
		</p>
	</div>
	<div class="gap-lg grid md:grid-cols-3">
		{#each platforms as platform (platform.name)}<Card variant="outline"
				><div class="gap-xl flex min-h-72 flex-col items-start">
					<span class="text-primary-readable">{@render platform.icon({ size: 38 })}</span>
					<div>
						<Heading as="h3" size="h3">{platform.name}</Heading>
						<p class="mt-md text-neutral/70 text-sm">{platform.description}</p>
					</div>
					<Chip variant="outline" size="small">Node.js + a Svelte project</Chip><Button
						class="mt-auto"
						href={'data:text/plain;charset=utf-8,' + encodeURIComponent(platform.notes)}
						download={platform.file}
						variant="outline"
						prefix={downloadSimpleIcon}>Download setup notes</Button
					>
				</div></Card
			>{/each}
	</div>
	<p class="text-neutral/70 text-sm">
		These downloads contain installation notes, not application binaries.
	</p>
</section>
