<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import {
		JsonEditor,
		type JsonSchema,
		type JsonValue
	} from '$lib/components/Form/JsonEditor/index.js';
	import { densities, sizes } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const controls = createComponentControls([
		{ name: 'size', type: 'segmented', label: 'Size', value: 'small', options: sizes },
		{ name: 'density', type: 'segmented', label: 'Density', value: 'normal', options: densities },
		{ name: 'typeIcons', type: 'switch', label: 'Type icons', value: true },
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false },
		{ name: 'readOnly', type: 'switch', label: 'Read only', value: false }
	]);

	const deployment: JsonSchema = {
		title: 'Deployment',
		type: 'object',
		required: ['name', 'replicas', 'region', 'image'],
		properties: {
			name: {
				type: 'string',
				title: 'Name',
				description: 'Lowercase letters, digits and dashes.',
				pattern: '^[a-z][a-z0-9-]*$',
				maxLength: 32,
				examples: ['api-gateway']
			},
			replicas: { type: 'integer', title: 'Replicas', minimum: 1, maximum: 20, default: 2 },
			cpu: { type: 'number', title: 'CPU limit', minimum: 0.25, multipleOf: 0.25 },
			region: {
				title: 'Region',
				oneOf: [
					{ const: 'eu-west', title: 'Europe (Paris)' },
					{ const: 'us-east', title: 'US East (Virginia)' },
					{ const: 'ap-south', title: 'Asia (Mumbai)' }
				]
			},
			public: { type: 'boolean', title: 'Publicly reachable', default: false },
			owner: { type: 'string', format: 'email', title: 'Owner' },
			docs: { type: 'string', format: 'uri', title: 'Documentation' },
			releaseDate: { type: 'string', format: 'date', title: 'Release date' },
			maintenance: { type: 'string', format: 'date-time', title: 'Maintenance window' },
			accent: { type: 'string', format: 'color', title: 'Accent color' },
			image: {
				type: 'object',
				title: 'Image',
				required: ['repository'],
				properties: {
					repository: { type: 'string', title: 'Repository', examples: ['ghcr.io/acme/api'] },
					tag: { type: 'string', title: 'Tag', default: 'latest' },
					pullPolicy: { enum: ['Always', 'IfNotPresent', 'Never'], title: 'Pull policy' }
				}
			},
			env: {
				type: 'array',
				title: 'Environment',
				minItems: 1,
				maxItems: 6,
				items: {
					type: 'object',
					required: ['key'],
					properties: {
						key: { type: 'string', pattern: '^[A-Z_][A-Z0-9_]*$', title: 'Key' },
						value: { type: 'string', title: 'Value' },
						secret: { type: 'boolean', title: 'Secret' }
					}
				}
			},
			ports: {
				type: 'array',
				title: 'Ports',
				uniqueItems: true,
				items: { type: 'integer', minimum: 1, maximum: 65535 }
			},
			capabilities: {
				type: 'array',
				title: 'Capabilities',
				uniqueItems: true,
				items: { enum: ['logs', 'metrics', 'tracing', 'profiling'] }
			},
			labels: {
				type: 'object',
				title: 'Labels',
				description: 'Free-form metadata.',
				additionalProperties: { type: 'string' }
			},
			probe: {
				title: 'Health check',
				oneOf: [
					{
						title: 'HTTP',
						type: 'object',
						required: ['path'],
						properties: {
							kind: { const: 'http' },
							path: { type: 'string', default: '/healthz' },
							port: { type: 'integer', default: 8080 }
						}
					},
					{
						title: 'Command',
						type: 'object',
						required: ['command'],
						properties: {
							kind: { const: 'exec' },
							command: { type: 'array', items: { type: 'string' }, minItems: 1 }
						}
					}
				]
			},
			notes: { type: ['string', 'null'], title: 'Notes', format: 'textarea' }
		}
	};

	let deploymentValue = $state<JsonValue | null>({
		name: 'api-gateway',
		replicas: 3,
		cpu: 1.5,
		region: 'eu-west',
		public: true,
		owner: 'ada@acme.dev',
		docs: 'https://docs.acme.dev/api',
		releaseDate: '2026-11-04',
		maintenance: '2026-11-08T02:30:00Z',
		accent: '#5f62ef',
		image: { repository: 'ghcr.io/acme/api', tag: '2.4.1', pullPolicy: 'IfNotPresent' },
		env: [
			{ key: 'NODE_ENV', value: 'production', secret: false },
			{ key: 'API_TOKEN', value: 'hunter2', secret: true }
		],
		ports: [443, 8080],
		capabilities: ['logs', 'metrics'],
		labels: { team: 'platform', tier: 'edge' },
		probe: { kind: 'http', path: '/healthz', port: 8080 }
	});

	let freeValue = $state<JsonValue | null>({
		id: '7f1c0a52-9a3e-4c7b-8a55-2c0e7d9b1f10',
		title: 'Quarterly report',
		published: true,
		views: 18203,
		score: 4.75,
		archivedAt: null,
		createdAt: '2026-09-14T08:15:00Z',
		contact: { name: 'Ada Lovelace', email: 'ada@acme.dev', website: 'https://ada.dev' },
		tags: ['finance', 'q3'],
		sections: [
			{ heading: 'Summary', pages: 2 },
			{ heading: 'Revenue', pages: 8 }
		]
	});

	const signup: JsonSchema = {
		type: 'object',
		required: ['email', 'password', 'age'],
		properties: {
			email: { type: 'string', format: 'email', title: 'Email' },
			password: { type: 'string', format: 'password', minLength: 8, title: 'Password' },
			age: { type: 'integer', minimum: 18, title: 'Age' },
			website: { type: 'string', format: 'uri', title: 'Website' }
		}
	};
	let signupValue = $state<JsonValue | null>({ email: 'not-an-email', age: 12, website: 'nope' });
</script>

<DocPage
	title="JSON editor"
	subtitle="Edit a JSON value through the right control for each field, from a JSON Schema or from the value itself."
	component="JsonEditor"
	features={[
		'A control for each type and format: text, number, switch, select, date, time, color, password',
		'Guards from the schema: required, min and max, length, pattern, enum, const, unique items',
		'Objects and arrays with add, remove, duplicate, rename and drag to reorder',
		'oneOf, anyOf, $ref, allOf, if/then and dependentRequired',
		'Without a schema, types are inferred from the value and stay changeable',
		'A JSON text view that stays in sync',
		'Works as a Form field and in a native form'
	]}
>
	<ComponentCard
		{controls}
		description="Fill a deployment from its schema"
		code={`<JsonEditor
	schema={deployment}
	bind:value
	label="Deployment"
	size="${controls.value.size}"
	density="${controls.value.density}"
	typeIcons={${controls.value.typeIcons}}
	disabled={${controls.value.disabled}}
	readOnly={${controls.value.readOnly}}
/>`}
	>
		<div class="w-full max-w-3xl" data-demo="schema">
			<JsonEditor
				schema={deployment}
				bind:value={deploymentValue}
				label="Deployment"
				size={controls.value.size}
				density={controls.value.density}
				typeIcons={controls.value.typeIcons}
				disabled={controls.value.disabled}
				readOnly={controls.value.readOnly}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Without a schema: the shape comes from the value. Every key can be renamed and removed, and the icon changes a value's type."
			code="<JsonEditor bind:value />"
		>
			<div class="w-full max-w-3xl" data-demo="free">
				<JsonEditor bind:value={freeValue} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="Problems show once a field has been left, and all at once on validate. They come from the i18n catalog."
			code={`<JsonEditor {schema} bind:value validationMode="change" />`}
		>
			<div class="w-full max-w-2xl" data-demo="errors">
				<JsonEditor
					schema={signup}
					bind:value={signupValue}
					validationMode="change"
					controls={false}
				/>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
