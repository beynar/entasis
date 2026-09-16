export const fileInputDescription = `
# FileInput Component

The FileInput component provides file upload functionality with drag-and-drop support and an inline list of the selected files (image files get a thumbnail preview). It supports a single-file mode and a multiple-file mode.

## Basic Usage

\`\`\`svelte
<script lang="ts">
	let file = $state<File | null>(null);
</script>

<FileInput label="Upload File" bind:value={file} />
\`\`\`

## Props

Extends all Field component props plus:

### Core Props
- **mode**: 'single' | 'multiple' (default: 'single') - Single-file or multiple-file mode
- **value**: File | null in single mode, File[] | null in multiple mode (bindable) - Selected file(s)
- **defaultValue**: same type as \`value\` - Initial selection when \`value\` is omitted
- **types**: string[] (default: ['image/*']) - Accepted MIME types or extensions (e.g. ['image/*'], ['.pdf', '.docx']); used for the native \`accept\` attribute and drag validation
- **maxSize**: number (default: 50 MB) - Maximum file size in bytes; larger files are rejected
- **maxFiles**: number (default: 1) - Maximum number of files (multiple mode caps the combined selection)
- **clickable**: boolean (default: true) - Whether clicking the dropzone opens the native file picker

### Display Props
- **placeholder**: string (default: 'Click or drag files here') - Text shown in the empty dropzone
- **fileList**: Snippet - Custom rendering of the selected files list
- **file**: Snippet - Custom rendering of each selected file row
- **fileListClass** / **fileClass** / **placeholderClass**: string - Extra classes for those parts

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **required**: boolean - Mark as required
- **disabled**: boolean - Disable input
- **size**: 'small' | 'normal' | 'large'

### Event Props
- **onValueChange**: (value: File | null) => void in single mode, (value: File[] | null) => void in multiple mode - Called when the selection changes
- **onReject**: (rejections: { file: File; reason: 'type' | 'size' | 'duplicate' | 'limit' }[]) => void - Called with the files rejected by type, size, duplicate or count validation

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<Field>
	<Label />
	<Description />
	<Dropzone>            <!-- inputContainer -->
		<Placeholder />     <!-- shown while no file is selected -->
		<FileList>          <!-- shown once files are selected -->
			<File />          <!-- thumbnail, name, size, remove button -->
			<AddMoreButton /> <!-- multiple mode, while below maxFiles -->
		</FileList>
	</Dropzone>
	<Error />
</Field>
\`\`\`

## Examples

### Basic File Input
\`\`\`svelte
<script lang="ts">
	let file = $state<File | null>(null);
</script>

<FileInput
	label="Upload Document"
	types={['.pdf', '.doc', '.docx']}
	bind:value={file}
/>
\`\`\`

### Multiple Files
\`\`\`svelte
<script lang="ts">
	let files = $state<File[]>([]);
</script>

<FileInput
	mode="multiple"
	maxFiles={5}
	label="Upload Documents"
	types={['.pdf', '.doc', '.docx']}
	bind:value={files}
/>
\`\`\`

### Image Upload with Preview
\`\`\`svelte
<script lang="ts">
	let avatar = $state<File | null>(null);
</script>

<FileInput
	label="Profile Picture"
	bind:value={avatar}
	types={['image/*']}
/>
\`\`\`

### Restrict File Types
\`\`\`svelte
<script lang="ts">
	let document = $state<File | null>(null);
</script>

<FileInput
	label="Upload PDF"
	bind:value={document}
	types={['.pdf']}
	description="PDF files only"
/>
\`\`\`

### With File Size Limit
\`\`\`svelte
<script lang="ts">
	let image = $state<File | null>(null);
</script>

<FileInput
	label="Upload Image"
	bind:value={image}
	types={['image/*']}
	maxSize={5 * 1024 * 1024}
	description="Maximum 5MB"
/>
\`\`\`

### Required File
\`\`\`svelte
<script lang="ts">
	let resume = $state<File | null>(null);
</script>

<FileInput
	label="Resume"
	bind:value={resume}
	types={['.pdf', '.doc', '.docx']}
	required
/>
\`\`\`

### Disabled State
\`\`\`svelte
<FileInput
	label="Uploaded File"
	value={existingFile}
	disabled
/>
\`\`\`

### Avatar Upload
\`\`\`svelte
<script lang="ts">
	let avatar = $state<File | null>(null);

	function handleUpload(file: File | null) {
		if (!file) return;
		console.log('Uploading:', file.name);
		// Upload to server
	}
</script>

<FileInput
	label="Profile Picture"
	bind:value={avatar}
	types={['image/png', 'image/jpeg']}
	maxSize={2 * 1024 * 1024}
	description="PNG or JPEG, max 2MB"
	onValueChange={handleUpload}
/>
\`\`\`

### Handling Rejected Files
\`\`\`svelte
<script lang="ts">
	let image = $state<File | null>(null);
	let rejectionMessage = $state('');
</script>

<FileInput
	label="Upload Image"
	bind:value={image}
	types={['image/*']}
	maxSize={1024 * 1024}
	onReject={(rejections) => {
		rejectionMessage = rejections
			.map((rejection) => \`\${rejection.file.name}: \${rejection.reason}\`)
			.join(', ');
	}}
/>

{#if rejectionMessage}
	<p class="text-danger-readable text-sm">{rejectionMessage}</p>
{/if}
\`\`\`

### Document Upload Form
\`\`\`svelte
<script lang="ts">
	let documents = $state<File[]>([]);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const formData = new FormData();
		documents.forEach((file, i) => {
			formData.append(\`document\${i}\`, file);
		});

		await fetch('/api/upload', {
			method: 'POST',
			body: formData
		});
	}
</script>

<form onsubmit={handleSubmit}>
	<FileInput
		mode="multiple"
		maxFiles={10}
		label="Supporting Documents"
		bind:value={documents}
		types={['.pdf', '.doc', '.docx']}
		description="Upload relevant documents"
		required
	/>

	<Button type="submit" disabled={documents.length === 0}>
		Submit Application
	</Button>
</form>
\`\`\`

### Image Gallery Upload
\`\`\`svelte
<script lang="ts">
	let images = $state<File[]>([]);
</script>

<FileInput
	mode="multiple"
	maxFiles={20}
	label="Upload Photos"
	bind:value={images}
	types={['image/*']}
	maxSize={10 * 1024 * 1024}
	description="Select multiple images (max 10MB each)"
/>

<p>Selected: {images.length} images</p>
\`\`\`

### With Upload Progress
\`\`\`svelte
<script lang="ts">
	let file = $state<File | null>(null);
	let progress = $state(0);
	let uploading = $state(false);

	async function handleUpload(selectedFile: File | null) {
		if (!selectedFile) return;
		uploading = true;
		progress = 0;

		const formData = new FormData();
		formData.append('file', selectedFile);

		// Simulate upload progress
		const interval = setInterval(() => {
			progress += 10;
			if (progress >= 100) {
				clearInterval(interval);
				uploading = false;
			}
		}, 200);
	}
</script>

<FileInput
	label="Upload File"
	bind:value={file}
	onValueChange={handleUpload}
	disabled={uploading}
/>

{#if uploading}
	<Meter value={progress} />
{/if}
\`\`\`

### CV Upload
\`\`\`svelte
<script lang="ts">
	let cv = $state<File | null>(null);
</script>

<FileInput
	label="Upload CV/Resume"
	bind:value={cv}
	types={['.pdf', '.doc', '.docx']}
	maxSize={5 * 1024 * 1024}
	description="PDF or Word document, max 5MB"
	required
/>
\`\`\`

### Attachment Field
\`\`\`svelte
<script lang="ts">
	let attachments = $state<File[]>([]);

	function removeFile(index: number) {
		attachments = attachments.filter((_, i) => i !== index);
	}
</script>

<FileInput
	mode="multiple"
	maxFiles={Infinity}
	label="Attachments"
	types={['*/*']}
	bind:value={attachments}
	description="Add any supporting files"
/>

{#if attachments.length > 0}
	<div class="file-list">
		{#each attachments as file, i}
			<div class="file-item">
				<span>{file.name}</span>
				<Button
					size="small"
					variant="ghost"
					onclick={() => removeFile(i)}
				>
					Remove
				</Button>
			</div>
		{/each}
	</div>
{/if}
\`\`\`

## Drag and Drop

FileInput supports drag-and-drop:
- Drag files over the drop zone
- Visual feedback while dragging (the dropzone reflects an idle / potential / valid / invalid state)
- Drop to select files
- Works alongside click-to-browse (disable with \`clickable={false}\`)

## File List

Once files are selected the dropzone shows them inline:
- Images show a thumbnail preview
- Other files show their name
- File size displayed
- Remove button for each file
- In multiple mode, an "Add more files" button appears while below \`maxFiles\`

## Validation

FileInput validates:
- **required**: At least one file selected
- **types**: File type matches the accepted types (rejected with reason 'type')
- **maxSize**: File size within limit (rejected with reason 'size')
- **maxFiles**: Number of files in multiple mode (rejected with reason 'limit')
- Duplicate files (same name and size) are rejected with reason 'duplicate'

Rejected files never enter \`value\`; listen to \`onReject\` to surface them.

## File Type Patterns

Entries accepted in \`types\`:
- \`'image/*'\` - All images
- \`'image/png'\`, \`'image/jpeg'\` - Specific image types
- \`'.pdf'\` - PDF files
- \`'.pdf'\`, \`'.doc'\`, \`'.docx'\` - Documents
- \`'video/*'\` - Videos
- \`'audio/*'\` - Audio files
- \`'*/*'\` - Any file

## Accessibility

- Proper label association
- Keyboard accessible (Enter/Space to open file picker)
- ARIA attributes for drop zone
- File selection announced to screen readers
- Error states communicated

## Notes

- Supports drag-and-drop file upload
- Preview images before upload
- Validates file types and sizes
- Works with FormData for upload
- Can handle single or multiple files
- File objects are returned for processing

## Theme Customization

The FileInput component uses a theme object that can be customized using the \`theme\` prop or by setting a global theme.

### Theme Structure

The theme object contains the following parts:
- **inputContainer**: The dropzone container
- **placeholder**: The empty-state placeholder (icon and text)
- **fileList**: The list wrapping the selected files
- **file**: Each selected file row

Field theme parts (label, description, error, ...) are also accepted on the same \`theme\` prop.

### Available Variants

**inputContainer**:
- base: Base classes for the dropzone
- Variants:
  - size: 'small' | 'normal' | 'large' - Minimum height
  - state: 'idle' | 'potential' | 'valid' | 'invalid' - Drag state styling
  - disabled: boolean - Disabled state styling

**placeholder**:
- base: Base classes for the placeholder
- Variants:
  - size: 'small' | 'normal' | 'large' - Text size and gap

**fileList**:
- base: Base classes for the file list
- Variants:
  - size: 'small' | 'normal' | 'large' - Gap between rows

**file**:
- base: Base classes for each file row
- Variants:
  - size: 'small' | 'normal' | 'large' - Padding, text size and gap

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<FileInput
  label="Upload Files"
  bind:value={files}
  theme={{
    inputContainer: {
      base: 'border-2 border-dashed rounded-lg',
      state: {
        valid: 'border-primary bg-primary/10'
      }
    }
  }}
/>
\`\`\`

**Custom Dropzone Styling**:
\`\`\`svelte
<FileInput
  label="Custom Upload"
  bind:value={files}
  theme={{
    inputContainer: {
      base: 'border-2 border-dashed border-neutral-muted rounded-xl p-8 hover:border-primary transition-colors',
      state: {
        potential: 'border-primary',
        valid: 'border-primary bg-primary/5',
        invalid: 'border-danger bg-danger/5'
      }
    },
    fileList: {
      base: 'mt-4 grid grid-cols-2 gap-4'
    },
    file: {
      base: 'rounded-md border border-neutral-muted'
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setFileInputTheme } from 'svelai/file-input';

  setFileInputTheme({
    inputContainer: {
      base: 'border-2 border-dashed rounded-lg transition-all',
      state: {
        valid: 'border-primary bg-primary/5'
      }
    },
    fileList: {
      base: 'mt-4'
    }
  });
</script>
\`\`\`

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
