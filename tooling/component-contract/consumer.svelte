<script lang="ts">
	import { Button } from 'svelai/button';
	import { Field, createFieldState, type FieldState } from 'svelai/field';
	import { Form } from 'svelai/form';
	import { Grid, GridSpan } from 'svelai/grid';
	import { Slot } from 'svelai/slot';
	import { TextInput } from 'svelai/text-input';
	import { checkIcon } from 'svelai/icons/check';

	let name = $state<string | null>('');
	const field = createFieldState({
		id: 'name',
		type: 'text',
		value: '',
		errors: [],
		focused: false,
		required: true
	});
</script>

{#snippet customControl(controller: FieldState<'text'>)}
	<input
		{...controller.controlAttrs}
		{@attach controller.control}
		value={controller.value ?? ''}
		oninput={(event) => controller.setValue(event.currentTarget.value)}
	/>
{/snippet}

<Grid>
	<GridSpan>
		<Field {field} label="Name">
			{@render customControl(field)}
		</Field>
		<TextInput
			bind:value={name}
			defaultValue="Initial name"
			onValueChange={(value) => (name = value)}
			inputAttrs={{ autocomplete: 'name', 'aria-label': 'Controlled name' }}
			fieldAttrs={{ 'data-field': 'name' }}
		/>
	</GridSpan>
</Grid>

<Form
	inputs={{
		displayName: {
			type: 'field',
			fieldType: 'text',
			required: true,
			snippet: customControl
		}
	}}
	onSubmit={(value) => {
		name = value.displayName;
	}}
>
	{#snippet children(form)}
		<Button
			onclick={(event) => {
				event.preventDefault();
				form.submit();
			}}
		>
			<Slot render={checkIcon} payload={{ size: 16 }} />
			Save
		</Button>
	{/snippet}
</Form>
