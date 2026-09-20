<script lang="ts">
	import { Button } from 'entasis/button';
	import { Field, createFieldState, type FieldState } from 'entasis/field';
	import { Form } from 'entasis/form';
	import { Grid, GridSpan } from 'entasis/grid';
	import { Slot } from 'entasis/slot';
	import { TextInput } from 'entasis/text-input';
	import { checkIcon } from 'entasis/icons/check';

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
