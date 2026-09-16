<script lang="ts">
	import { Alert } from 'svelai/alert';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { FileInput, type FileInputProps } from 'svelai/file-input';
	import { Meter } from 'svelai/meter';
	import { arrowCounterClockwiseIcon } from 'svelai/icons/arrowCounterClockwise';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	import { fileIcon } from 'svelai/icons/file';
	import { uploadSimpleIcon } from 'svelai/icons/uploadSimple';

	type UploadStatus = 'ready' | 'uploading' | 'success';

	const maxFileSize = 10 * 1024 * 1024;

	let selectedFile = $state<File | null>(null);
	let status = $state<UploadStatus>('ready');
	let progress = $state(0);
	let rejectionMessage = $state('');
	let uploadTimer: ReturnType<typeof setInterval> | undefined;

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const stopUpload = () => {
		if (uploadTimer) clearInterval(uploadTimer);
		uploadTimer = undefined;
	};

	const resetUpload = () => {
		stopUpload();
		selectedFile = null;
		status = 'ready';
		progress = 0;
		rejectionMessage = '';
	};

	const handleFileChange: NonNullable<FileInputProps<'single'>['onValueChange']> = (file) => {
		stopUpload();
		selectedFile = file;
		status = 'ready';
		progress = 0;
		rejectionMessage = '';
	};

	const handleFileRejection: NonNullable<FileInputProps<'single'>['onReject']> = (rejections) => {
		const rejection = rejections[0];
		if (!rejection) return;

		selectedFile = null;
		status = 'ready';
		progress = 0;
		rejectionMessage =
			rejection.reason === 'size'
				? `${rejection.file.name} is larger than 10 MB.`
				: `${rejection.file.name} is not a supported PDF or image.`;
	};

	const startUpload = () => {
		if (!selectedFile || status === 'uploading') return;

		stopUpload();
		rejectionMessage = '';
		status = 'uploading';
		progress = 8;
		uploadTimer = setInterval(() => {
			progress = Math.min(100, progress + 12);
			if (progress === 100) {
				stopUpload();
				status = 'success';
			}
		}, 240);
	};

	$effect(() => stopUpload);
</script>

<section
	class="bg-surface-recessed p-lg sm:p-xl flex min-h-96 w-full items-center justify-center rounded-lg"
>
	<Card
		variant="outline"
		density="comfortable"
		class="w-full max-w-2xl shadow-lg"
		title="Upload your project brief"
		description="Add one PDF or image. Files are encrypted while they are transferred."
	>
		<div class="gap-lg flex flex-col">
			{#if rejectionMessage}
				<Alert
					color="danger"
					variant="soft"
					title="File not accepted"
					description={rejectionMessage}
					dismissible
					onDismiss={() => (rejectionMessage = '')}
				/>
			{/if}

			{#if status === 'ready'}
				<div class="gap-md flex flex-col">
					<FileInput
						label="Project file"
						description="PDF, PNG, or JPG · 10 MB maximum"
						mode="single"
						types={['application/pdf', 'image/png', 'image/jpeg']}
						maxSize={maxFileSize}
						bind:value={selectedFile}
						onValueChange={handleFileChange}
						onReject={handleFileRejection}
						placeholder="Drop your file here or click to browse"
					/>

					<div class="gap-sm flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between">
						<p class="text-neutral/70 text-sm">
							{selectedFile ? 'Ready to upload securely.' : 'Your file stays private.'}
						</p>
						<Button color="primary" disabled={!selectedFile} onclick={startUpload}>
							{#snippet prefix()}{@render uploadSimpleIcon({ size: 18 })}{/snippet}
							Upload file
						</Button>
					</div>
				</div>
			{:else if status === 'uploading' && selectedFile}
				<div class="gap-lg flex flex-col" aria-live="polite">
					<div
						class="border-neutral-muted bg-surface gap-md p-md flex items-center rounded-lg border"
					>
						<span
							class="bg-primary-muted text-primary-muted-readable flex size-10 shrink-0 items-center justify-center rounded-lg"
						>
							{@render fileIcon({ size: 20 })}
						</span>
						<div class="min-w-0 flex-1">
							<p class="text-neutral truncate text-sm font-medium">{selectedFile.name}</p>
							<p class="text-neutral/70 text-sm">{formatFileSize(selectedFile.size)}</p>
						</div>
						<span class="text-neutral text-sm font-semibold">{progress}%</span>
					</div>

					<Meter value={progress} color="primary" max={100} showIndicatorAs="percentage" />

					<div class="flex justify-end">
						<Button variant="ghost" onclick={resetUpload}>Cancel upload</Button>
					</div>
				</div>
			{:else if selectedFile}
				<div class="gap-lg flex flex-col items-center text-center" aria-live="polite">
					<span
						class="bg-success-muted text-success-muted-readable flex size-12 items-center justify-center rounded-full"
					>
						{@render checkCircleIcon({ size: 28 })}
					</span>
					<div class="gap-sm flex flex-col">
						<h3 class="text-neutral text-xl font-semibold">Upload complete</h3>
						<p class="text-neutral/70 text-sm">
							{selectedFile.name} is ready for your workspace.
						</p>
					</div>
					<Button variant="outline" onclick={resetUpload}>
						{#snippet prefix()}{@render arrowCounterClockwiseIcon({ size: 18 })}{/snippet}
						Upload another file
					</Button>
				</div>
			{/if}
		</div>
	</Card>
</section>
