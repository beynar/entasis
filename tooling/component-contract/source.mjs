import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

export const repositoryRoot = path.resolve(import.meta.dirname, '../..');

export async function loadManifest() {
	const filename = path.join(repositoryRoot, 'tooling/component-contract/manifest.ts');
	const source = await readFile(filename, 'utf8');
	const output = ts.transpileModule(source, {
		compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
		fileName: filename,
		reportDiagnostics: true
	});
	if (output.diagnostics?.length) {
		throw new Error(
			ts.formatDiagnosticsWithColorAndContext(output.diagnostics, {
				getCanonicalFileName: (name) => name,
				getCurrentDirectory: () => repositoryRoot,
				getNewLine: () => '\n'
			})
		);
	}
	return (
		await import(`data:text/javascript;base64,${Buffer.from(output.outputText).toString('base64')}`)
	).componentContract;
}

export async function listSources(directory, predicate = (filename) => filename.endsWith('.ts')) {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const filename = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await listSources(filename, predicate)));
		else if (predicate(filename)) files.push(filename);
	}
	return files.sort();
}

export function createSourceProgram(files, virtualSources = new Map()) {
	const options = {
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		baseUrl: repositoryRoot,
		paths: { '$lib/*': ['src/lib/*'] },
		strict: true,
		skipLibCheck: true,
		noEmit: true
	};
	const host = ts.createCompilerHost(options);
	const readSource = host.getSourceFile;
	host.getSourceFile = (filename, languageVersion, onError, shouldCreateNewSourceFile) => {
		const source = virtualSources.get(filename);
		return source === undefined
			? readSource(filename, languageVersion, onError, shouldCreateNewSourceFile)
			: ts.createSourceFile(filename, source, languageVersion, true);
	};
	return ts.createProgram([...files, ...virtualSources.keys()], options, host);
}

export function moduleExports(program, filename) {
	const source = program.getSourceFile(filename);
	if (!source) throw new Error(`Missing TypeScript source: ${filename}`);
	const checker = program.getTypeChecker();
	const symbol = checker.getSymbolAtLocation(source);
	return symbol ? checker.getExportsOfModule(symbol) : [];
}

export function propertyName(node) {
	return node.name && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
		? node.name.text
		: null;
}
