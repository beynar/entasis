<script lang="ts">
	import { Chart } from 'entasis/chart';

	type Capability = {
		name: string;
		score: number;
	};

	const capabilities: readonly Capability[] = [
		{ name: 'Research', score: 82 },
		{ name: 'Design', score: 74 },
		{ name: 'Delivery', score: 91 },
		{ name: 'Quality', score: 78 },
		{ name: 'Operations', score: 68 }
	];

	const marks = [
		{
			type: 'polar',
			variant: 'radar',
			angle: 'name',
			radius: 'score',
			domain: [0, 100],
			area: true,
			line: true,
			points: true,
			color: 'secondary'
		}
	] as const;
</script>

<Chart
	data={capabilities}
	{marks}
	label="Product capability profile"
	ariaDescription="A radar chart compares five product capabilities on a zero to one hundred scale."
	aspectRatio={720 / 480}
	class="w-full"
/>
