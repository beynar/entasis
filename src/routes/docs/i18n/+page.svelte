<script lang="ts">
	import { I18n, locales, localeList, type LocaleCode } from '$lib/i18n/index.js';
	import Combobox from '$lib/components/Form/Combobox/Combobox.svelte';
	import Code from '$lib/components/Code/Code.svelte';
	import Tabs from '$lib/components/Tabs/Tabs.svelte';

	// The active locale. The <I18n> wrapper below provides it to every component.
	let locale = $state<LocaleCode>('en');

	// Direct catalog read for the live readouts / code generation below.
	const t = $derived(locales[locale].messages);

	const options = [
		{ value: 'a', label: 'Alpha' },
		{ value: 'b', label: 'Beta' }
	];
	let comboValue = $state<string | null>(null);

	const scriptCode = `
<s${'cript'}>
	import { I18n } from '$lib/i18n/index.js';
	let locale = $state<'en' | 'fr' | 'ar'>('en');
</s${'cript'}>
		`;
	const setupCode = `<!-- +layout.svelte — wrap the app once -->
${scriptCode}

<I18n bind:locale>
	{@render children()}
</I18n>

<!--
  That's it. <I18n> provides the messages to every descendant AND
  keeps <html dir> / <html lang> in sync (rtl for Arabic).
  Bind \`locale\` to a picker to switch languages live.

  Override individual keys on top of the locale:
    <I18n bind:locale messages={{ search: 'Rechercher' }}>...</I18n>

  Headless alternative (no wrapper): setI18n(locales.fr.messages)
-->`;

	const instanceCode = `<!-- Override for a single component instance -->
<Combobox i18n={{ noOptions: 'Rien à afficher' }} items={options} />`;

	// The complete key set, generated from the live catalog so it is always current and
	// reflects the selected locale. Copy it, translate the values, keep the keys.
	const fullCode = $derived(
		`import { setI18n } from 'entasis/i18n';\n\n// Full ${locale} key set (${Object.keys(t).length} keys)\nsetI18n({\n` +
			Object.entries(t)
				.map(([k, v]) => `\t${k}: ${typeof v === 'function' ? String(v) : JSON.stringify(v)},`)
				.join('\n') +
			'\n});'
	);

	const codeTabs = [{ label: 'Setup' }, { label: 'Full key set' }, { label: 'Per instance' }];
	let codeTab = $state('Setup');
</script>

<I18n bind:locale>
	<div class="mx-auto flex max-w-3xl flex-col gap-6 p-6">
		<div>
			<h1 class="text-neutral-light text-2xl font-semibold">Internationalization</h1>
			<p class="text-neutral/70 mt-1 text-sm">
				Wrap the app in <code>&lt;I18n&gt;</code> and every component translates. Switch the locale to
				see it update — Arabic also flips the document direction to RTL.
			</p>
		</div>

		<label class="flex items-center gap-3 text-sm">
			<span class="text-neutral-light">Locale</span>
			<select
				bind:value={locale}
				class="border-neutral-muted bg-surface-raised text-neutral rounded border px-3 py-2"
			>
				{#each localeList as l, index (index)}
					<option value={l.code}>{l.name} ({l.code}{l.dir === 'rtl' ? ', rtl' : ''})</option>
				{/each}
			</select>
		</label>

		<div class="max-w-sm">
			<h2 class="text-neutral-light mb-2 text-sm font-medium">
				Live component — placeholder & empty state translate
			</h2>
			<Combobox placeholder={t.search} items={options} bind:value={comboValue} />
		</div>

		<div>
			<h2 class="text-neutral-light mb-2 text-sm font-medium">Set the keys</h2>
			<Tabs items={codeTabs} bind:value={codeTab}>
				{#snippet children({ index })}
					<div class="p-4">
						{#if index === 0}
							<Code language="svelte" code={setupCode} />
						{:else if index === 1}
							<p class="text-neutral/70 mb-2 text-xs">
								The complete key set for the selected locale ({Object.keys(t).length} keys) — copy it,
								translate the values, keep the keys. Function keys are self-contained per locale.
							</p>
							<Code language="ts" code={fullCode} maxHeight={480} />
						{:else}
							<Code language="svelte" code={instanceCode} />
						{/if}
					</div>
				{/snippet}
			</Tabs>
		</div>
	</div>
</I18n>
