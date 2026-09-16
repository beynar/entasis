// `npm run release <patch|minor|major|x.y.z>` — the only way a version leaves this repo.
// 1. refuses a dirty tree or a branch other than master
// 2. runs the full prepack gate (contracts, tokens, public API, packed library, consumer,
//    doc fences, publint)
// 3. moves CHANGELOG.md "## Unreleased" under the new version with today's date
// 4. bumps package.json, commits, tags v<version> and pushes with tags
// .github/workflows/release.yml then re-runs the gate on CI and publishes with provenance.
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const run = (command, args, options = {}) =>
	execFileSync(command, args, { cwd: root, stdio: 'inherit', ...options });
const read = (command, args) => execFileSync(command, args, { cwd: root, encoding: 'utf8' }).trim();

const bump = process.argv[2];
if (!bump) {
	console.error('Usage: npm run release <patch|minor|major|x.y.z>');
	process.exit(1);
}

const branch = read('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== 'master') {
	console.error(`Release from master only (current branch: ${branch}).`);
	process.exit(1);
}
if (read('git', ['status', '--porcelain'])) {
	console.error('Working tree is not clean. Commit or stash before releasing.');
	process.exit(1);
}

run('npm', ['run', 'prepack']);

const version = read('npm', ['version', bump, '--no-git-tag-version']).replace(/^v/, '');
const today = new Date().toISOString().slice(0, 10);
const changelogPath = path.join(root, 'CHANGELOG.md');
const changelog = await readFile(changelogPath, 'utf8');
if (!/^## Unreleased\s*$/m.test(changelog)) {
	console.error('CHANGELOG.md needs a "## Unreleased" section to release from.');
	process.exit(1);
}
await writeFile(
	changelogPath,
	changelog.replace(/^## Unreleased\s*$/m, `## Unreleased\n\n## ${version} — ${today}`)
);

run('git', ['add', 'package.json', 'CHANGELOG.md']);
run('git', ['commit', '-m', `release: v${version}`]);
run('git', ['tag', '-a', `v${version}`, '-m', `v${version}`]);
run('git', ['push', '--follow-tags']);
console.log(`Released v${version}. CI publishes on the tag.`);
