<script lang="ts">
	import { Grid } from 'entasis/grid';
	import { Stack } from 'entasis/stack';
	import { Avatar } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Meter } from 'entasis/meter';
	import { Stat } from 'entasis/stat';

	let guests = $state([
		{ name: 'Alex Morgan', room: '204', nights: 3, checkedIn: false },
		{ name: 'Maya Chen', room: '318', nights: 2, checkedIn: false },
		{ name: 'Sam Rivera', room: '112', nights: 4, checkedIn: true },
		{ name: 'Jordan Lee', room: '407', nights: 1, checkedIn: false }
	]);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header class="gap-lg flex flex-wrap items-center justify-between">
		<div>
			<p class="text-primary-readable text-sm">The Linden House / Front desk</p>
			<h2 class="mt-sm text-3xl font-semibold">A warm welcome, every time.</h2>
		</div>
		<Chip color="neutral">Monday, June 15</Chip>
	</header>
	<Grid columns={{ minWidth: 220, max: 3 }} gap="md">
		<Stat label="Occupancy" value="84%" /><Stat
			label="Arrivals remaining"
			value={String(guests.filter((guest) => !guest.checkedIn).length)}
		/><Stat label="Rooms ready" value="12" />
	</Grid>
	<div class="gap-lg grid lg:grid-cols-3">
		<Card
			title="Today’s arrivals"
			description="Check guests in to update this local desk."
			class="lg:col-span-2"
			><Stack gap="lg">
				{#each guests as guest (guest)}<div
						class="gap-md border-neutral-muted pb-lg flex flex-wrap items-center justify-between border-b"
					>
						<div class="gap-md flex items-center">
							<Avatar name={guest.name} />
							<div>
								<strong class="text-sm">{guest.name}</strong>
								<p class="text-neutral/70 text-xs">Room {guest.room} · {guest.nights} nights</p>
							</div>
						</div>
						<Button
							size="small"
							variant={guest.checkedIn ? 'soft' : 'outline'}
							disabled={guest.checkedIn}
							onclick={() => (guest.checkedIn = true)}
							>{guest.checkedIn ? 'Checked in' : 'Check in'}</Button
						>
					</div>{/each}
			</Stack></Card
		>
		<Stack gap="lg">
			<Card title="Room readiness"
				><Stack gap="lg">
					<Meter label="Clean and inspected" value={38} color="success" max={48} /><Meter
						label="Housekeeping"
						value={7}
						color="warning"
						max={48}
					/><Meter label="Maintenance" value={3} color="neutral" max={48} />
				</Stack></Card
			><Card title="Front desk note" description="A small detail makes a memorable stay."
				><p class="text-neutral/65 text-sm">
					Room 204 is celebrating an anniversary. A welcome note is ready at reception.
				</p></Card
			>
		</Stack>
	</div>
</Stack>
