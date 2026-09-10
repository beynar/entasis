export const fileInputDescription = `
# FileInput Component

The FileInput component provides file upload functionality with drag-and-drop support, file preview, and progress tracking. Supports both single and multiple file uploads.

## Basic Usage

\`\`\`svelte
<script>
	let file = $state(null);
</script>

<FileInput label="Upload File" bind:value={file} />
\`\`\`

## Props

Extends all Field component props plus:

### Core Props
- **value**: File | File[] (bindable) - Selected file(s)
- **type**: 'file' | 'files' - Single or multiple file mode
- **accept**: string - Accepted file types (e.g., 'image/*', '.pdf,.doc')
- **maxSize**: number - Maximum file size in bytes
- **multiple**: boolean - Allow multiple files (when type='files')

### Display Props
- **showPreview**: boolean (default: true) - Show file preview
- **placeholder**: string - Placeholder text for drop zone

### Field Props (inherited)
- **label**: string | Snippet - Field label
- **description**: string | Snippet - Helper text
- **error**: string - Error message
- **required**: boolean - Mark as required
- **disabled**: boolean - Disable input
- **size**: 'small' | 'normal' | 'large'

### Event Props
- **onUpload**: (files: File | File[]) => void - Called when files are selected

### Styling Props
- **class**: string - Additional CSS classes
- **theme**: ComponentTheme - Custom theme overrides

## Structure

\`\`\`
<Field>
	<Label />
	<Description />
	<FileDropZone>
		<FilePreview />
		<UploadButton />
		<FileList />
	</FileDropZone>
	<Error />
</Field>
\`\`\`

## Examples

### Basic File Input
\`\`\`svelte
<script>
	let file = $state(null);
</script>

<FileInput 
	label="Upload Document"
	bind:value={file}
/>
\`\`\`

### Multiple Files
\`\`\`svelte
<script>
	let files = $state([]);
</script>

<FileInput 
	type="files"
	label="Upload Documents"
	bind:value={files}
	multiple
/>
\`\`\`

### Image Upload with Preview
\`\`\`svelte
<FileInput 
	label="Profile Picture"
	bind:value={avatar}
	accept="image/*"
	showPreview
/>
\`\`\`

### Restrict File Types
\`\`\`svelte
<FileInput 
	label="Upload PDF"
	bind:value={document}
	accept=".pdf"
	description="PDF files only"
/>
\`\`\`

### With File Size Limit
\`\`\`svelte
<FileInput 
	label="Upload Image"
	bind:value={image}
	accept="image/*"
	maxSize={5 * 1024 * 1024}
	description="Maximum 5MB"
/>
\`\`\`

### Required File
\`\`\`svelte
<FileInput 
	label="Resume"
	bind:value={resume}
	accept=".pdf,.doc,.docx"
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
<script>
	let avatar = $state(null);
	
	function handleUpload(file) {
		console.log('Uploading:', file);
		// Upload to server
	}
</script>

<FileInput 
	label="Profile Picture"
	bind:value={avatar}
	accept="image/png,image/jpeg"
	maxSize={2 * 1024 * 1024}
	description="PNG or JPEG, max 2MB"
	showPreview
	onUpload={handleUpload}
/>
\`\`\`

### Document Upload Form
\`\`\`svelte
<script>
	let documents = $state([]);
	
	async function handleSubmit() {
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
		type="files"
		label="Supporting Documents"
		bind:value={documents}
		accept=".pdf,.doc,.docx"
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
<script>
	let images = $state([]);
</script>

<FileInput 
	type="files"
	label="Upload Photos"
	bind:value={images}
	accept="image/*"
	multiple
	maxSize={10 * 1024 * 1024}
	description="Select multiple images (max 10MB each)"
	showPreview
/>

<p>Selected: {images.length} images</p>
\`\`\`

### With Upload Progress
\`\`\`svelte
<script>
	let file = $state(null);
	let progress = $state(0);
	let uploading = $state(false);
	
	async function handleUpload(selectedFile) {
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
	onUpload={handleUpload}
	disabled={uploading}
/>

{#if uploading}
	<Meter value={{ value: progress }} />
{/if}
\`\`\`

### CV Upload
\`\`\`svelte
<FileInput 
	label="Upload CV/Resume"
	bind:value={cv}
	accept=".pdf,.doc,.docx"
	maxSize={5 * 1024 * 1024}
	description="PDF or Word document, max 5MB"
	required
/>
\`\`\`

### Attachment Field
\`\`\`svelte
<script>
	let attachments = $state([]);
	
	function removeFile(index) {
		attachments = attachments.filter((_, i) => i !== index);
	}
</script>

<FileInput 
	type="files"
	label="Attachments"
	bind:value={attachments}
	multiple
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
- Visual feedback on hover
- Drop to select files
- Works alongside click-to-browse

## File Preview

When \`showPreview={true}\`:
- Images show thumbnail preview
- Other files show icon and name
- File size displayed
- Remove button for each file

## Validation

FileInput validates:
- **required**: At least one file selected
- **accept**: File type matches accepted types
- **maxSize**: File size within limit
- **multiple**: Number of files (if limited)

## File Type Patterns

Common accept patterns:
- \`image/*\` - All images
- \`image/png,image/jpeg\` - Specific image types
- \`.pdf\` - PDF files
- \`.pdf,.doc,.docx\` - Documents
- \`video/*\` - Videos
- \`audio/*\` - Audio files

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
- **fileInput**: Main file input container styles
- **fileInputDropzone**: Drop zone area styles
- **fileInputPreview**: File preview container styles
- **fileInputPreviewItem**: Individual file preview item styles

### Available Variants

**fileInput**:
- base: Base classes for main container

**fileInputDropzone**:
- base: Base classes for drag-and-drop zone
- Variants:
  - disabled: boolean - Disabled state styling
  - dragging: boolean - Active drag state styling

**fileInputPreview**:
- base: Base classes for preview container

**fileInputPreviewItem**:
- base: Base classes for individual preview items

### Usage Examples

**Basic Theme Override**:
\`\`\`svelte
<FileInput 
  label="Upload Files"
  bind:value={files}
  theme={{
    fileInputDropzone: {
      base: 'border-2 border-dashed rounded-lg',
      dragging: {
        true: 'border-primary bg-primary/10'
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
    fileInputDropzone: {
      base: 'border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-primary transition-colors',
      dragging: {
        true: 'border-primary bg-blue-50'
      }
    },
    fileInputPreview: {
      base: 'mt-4 grid grid-cols-2 gap-4'
    }
  }}
/>
\`\`\`

**Global Theme Setting**:
\`\`\`svelte
<script>
  import { setFileInputTheme } from 'svelai/file-input';
  
  setFileInputTheme({
    fileInputDropzone: {
      base: 'border-2 border-dashed rounded-lg transition-all',
      dragging: {
        true: 'border-primary bg-primary/5'
      }
    },
    fileInputPreview: {
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
