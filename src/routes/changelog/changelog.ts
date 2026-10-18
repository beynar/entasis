// Splits CHANGELOG.md into one entry per release for the /changelog page. The file's preamble (how
// releases are cut) is for maintainers and is left out, and so is an empty Unreleased section.
export type ChangelogRelease = {
	/** Anchor id, e.g. `v0-12-0` or `unreleased`. */
	id: string;
	/** `0.12.0`, or `Unreleased`. */
	version: string;
	/** ISO date, when the heading carries one. */
	date?: string;
	/** The release's markdown, without its `## ` heading. */
	body: string;
};

export function parseChangelog(source: string): ChangelogRelease[] {
	return source
		.split(/^## /m)
		.slice(1)
		.map((section) => {
			const newline = section.indexOf('\n');
			const heading = (newline === -1 ? section : section.slice(0, newline)).trim();
			const body = newline === -1 ? '' : section.slice(newline + 1).trim();
			const [version, date] = heading.split(/\s+—\s+/);
			const id = version === 'Unreleased' ? 'unreleased' : `v${version.replaceAll('.', '-')}`;
			return { id, version, date, body };
		})
		.filter((release) => release.body.length > 0);
}
