<script lang="ts">
	import { NetworkIndicator } from '$lib/components/NetworkIndicator/index.js';
	import NetworkIndicatorPreview from './NetworkIndicatorPreview.svelte';
</script>

<div class="grid w-full gap-4">
	<NetworkIndicatorPreview label="650ms pass, no gap">
		<NetworkIndicator
			loading
			variant="trail"
			color="primary"
			height={4}
			trailDuration={650}
			trailGap={0}
			class="!absolute !z-10"
		/>
	</NetworkIndicatorPreview>
	<NetworkIndicatorPreview label="450ms pass, 120ms gap">
		<NetworkIndicator
			loading
			variant="trail"
			color="success"
			height={5}
			trailDuration={450}
			trailGap={120}
			class="!absolute !z-10"
		/>
	</NetworkIndicatorPreview>
	<NetworkIndicatorPreview label="Exit, then reverse">
		<NetworkIndicator
			loading
			variant="trail-bounce"
			color="info"
			height={4}
			trailDuration={700}
			trailGap={80}
			class="!absolute !z-10"
		/>
	</NetworkIndicatorPreview>
</div>
