<script lang="ts" module>
	import Button from '$lib/components/Button/Button.svelte';
	import { createBindableStateClass, bind } from '$lib/utils/state.svelte.js';

	class Test extends createBindableStateClass<{
		name: string;
		age: number;
		test: boolean;
		record: {
			test: boolean;
		};
	}>() {}
</script>

<script lang="ts">
	const getSet = <T extends Record<string, any>>(obj: T) => {
		return Object.entries(obj).reduce((acc, [key, value]) => {
			Object.defineProperty(acc, key, {
				get: () => value,
				set: (newValue) => {
					value = newValue;
				},
				enumerable: true
			});
			return acc;
		}, {} as T);
	};
	let {
		name = $bindable(),
		age = $bindable(),
		record = $bindable({
			test: true
		})
	}: {
		name: string;
		age: number;
		record: {
			test: boolean;
		};
	} = $props();

	const test = new Test({
		get name() {
			return name;
		},
		set name(value: string) {
			name = value;
		},
		get age() {
			return age;
		},
		set age(value: number) {
			age = value;
		},
		get record() {
			return record;
		},
		test: true
	});

	const bp = $state();
</script>

<div class="flex flex-col gap-2">
	<h1>Component value</h1>
	<div class="flex gap-2">
		<Button
			size="small"
			onclick={() => {
				record.test = record.test === true ? false : true;
			}}
		>
			Update component record.test to {!record.test}
		</Button>
		<Button
			size="small"
			onclick={() => {
				test.record.test = test.record.test === true ? false : true;
			}}
		>
			Update class record.test to {!test.record.test}
		</Button>

		<Button
			size="small"
			onclick={() => {
				test.age++;
			}}
		>
			Update component age
		</Button>
	</div>
	<p>name: {test.name}</p>
	<p>age: {test.age}</p>
</div>
