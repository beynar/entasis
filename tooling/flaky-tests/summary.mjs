// Tests that failed and then passed on a CI retry. They do not fail the run, but each one is
// written to the job summary ($GITHUB_STEP_SUMMARY) and annotated as a warning, so a flake is
// seen and fixed instead of silently retried. Shared by the Vitest and Playwright reporters.
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

/**
 * @param {string} runner  "Vitest" or "Playwright"
 * @param {{ name: string, file?: string, line?: number, project?: string, retries: number }[]} flaky
 */
export function reportFlaky(runner, flaky) {
	if (!flaky.length) return;
	const relative = (file) => (file ? path.relative(process.cwd(), file) : '');
	const escape = (text) => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ');
	const plural = flaky.length === 1 ? 'test' : 'tests';

	if (process.env.GITHUB_ACTIONS) {
		for (const test of flaky) {
			const where = test.file
				? ` file=${relative(test.file)}${test.line ? `,line=${test.line}` : ''},`
				: ' ';
			const project = test.project ? ` [${test.project}]` : '';
			const message = `${test.name}${project} passed after ${test.retries} ${test.retries === 1 ? 'retry' : 'retries'}`;
			// Workflow commands: `%`, CR and LF are the characters a message must encode.
			const encoded = message
				.replaceAll('%', '%25')
				.replaceAll('\r', '%0D')
				.replaceAll('\n', '%0A');
			process.stdout.write(`::warning${where}title=Flaky ${runner} test::${encoded}\n`);
		}
	} else {
		console.warn(`\n${flaky.length} flaky ${runner} ${plural} passed only on retry:`);
		for (const test of flaky) console.warn(`  - ${test.name} (${relative(test.file)})`);
	}

	const summary = process.env.GITHUB_STEP_SUMMARY;
	if (!summary) return;
	const rows = flaky.map(
		(test) =>
			`| ${escape(test.name)} | ${escape(test.project ?? '')} | \`${escape(relative(test.file))}${test.line ? `:${test.line}` : ''}\` | ${test.retries} |`
	);
	appendFileSync(
		summary,
		[
			`### :warning: ${flaky.length} flaky ${runner} ${plural}`,
			'',
			'These failed, then passed on retry. The run is green; fix or report them.',
			'',
			'| Test | Project | File | Retries |',
			'| --- | --- | --- | --- |',
			...rows,
			'',
			''
		].join('\n')
	);
}
