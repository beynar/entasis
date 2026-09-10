import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'svelte/compiler';
import ts from 'typescript';
import {
	createSourceProgram,
	listSources,
	propertyName,
	repositoryRoot
} from './component-contract/source.mjs';

const componentsDirectory = path.join(repositoryRoot, 'src/lib/components');
const errors = new Set();
const themeOwners = new Set();
const files = await listSources(
	path.join(repositoryRoot, 'src/lib'),
	(name) =>
		/\.(ts|svelte)$/.test(name) &&
		!/\.(mcp|test|spec|bench)\./.test(name) &&
		!name.includes('/generated/') &&
		!name.includes('/utils/cva/')
);
const program = createSourceProgram(files.filter((name) => name.endsWith('.ts')));
const checker = program.getTypeChecker();
const geometryExceptions = new Map([
	['MiniCalendar/miniCalendar.theme.ts', new Map([['-m-0.5', 'Calendar cell border overlap']])],
	['AudioPlayer/audioPlayer.theme.ts', new Map([['gap-[3px]', 'Fixed waveform bar separation']])],
	[
		'Spinner/spinner.theme.ts',
		new Map([
			['gap-[calc(var(--spinner-size)*0.1)]', 'Pulse geometry scales with spinner diameter']
		])
	],
	[
		'Avatar/avatar.theme.ts',
		new Map([['p-[0.25rem]', 'Status badge clearance around the circular avatar']])
	],
	[
		'Avatar/avatarGroup.theme.ts',
		new Map([
			['gap-[-0.25rem]', 'Avatar stack overlap'],
			['ml-[0.3rem]', 'Leading compensation for avatar overlap'],
			['[&>[data-avatar]]:ml-[-0.45rem]', 'Normal avatar stack overlap'],
			['[&>[data-avatar]]:ml-[-0.4rem]', 'Small avatar stack overlap'],
			['[&>[data-avatar]]:ml-[-0.5rem]', 'Large avatar stack overlap'],
			['ml-[-0.75rem]', 'Overflow counter overlap']
		])
	],
	[
		'Popover/popover.theme.ts',
		new Map([
			[
				'pb-[calc(env(safe-area-inset-bottom)+1rem)]',
				'Mobile sheet clearance includes the device safe area'
			]
		])
	],
	[
		'Command/command.dialog.theme.ts',
		new Map([['pt-[15vh]', 'Command palette offset from the viewport top']])
	]
]);

const lowerOwner = (name) =>
	name
		.replace(/^[A-Z]+(?=[A-Z][a-z]|$)/, (prefix) => prefix.toLowerCase())
		.replace(/^[A-Z]/, (letter) => letter.toLowerCase());
const unwrap = (node) =>
	node &&
	(ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))
		? unwrap(node.expression)
		: node;
const isExported = (node) =>
	node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

function utilityPart(token) {
	let depth = 0;
	let start = 0;
	for (let index = 0; index < token.length; index += 1) {
		if (token[index] === '[' || token[index] === '(') depth += 1;
		else if (token[index] === ']' || token[index] === ')') depth -= 1;
		else if (token[index] === ':' && depth === 0) start = index + 1;
	}
	return token.slice(start).replace(/^!|!$/g, '');
}

function checkClasses(source, filename) {
	const relative = path.relative(componentsDirectory, filename);
	for (const token of source.split(/\s+/)) {
		if (!token || geometryExceptions.get(relative)?.has(token)) continue;
		const utility = utilityPart(token);
		const spacing = utility.match(
			/^-?(?:gap(?:-[xy])?|space-[xy]|p[trblxyse]?|m[trblxyse]?)-(.+)$/
		);
		if (spacing) {
			const value = spacing[1];
			if (/^\d+(?:\.\d+)?$/.test(value) && Number(value) !== 0)
				errors.add(`${relative}: numeric spacing utility ${token}`);
			if (value.startsWith('[') && !/^\[(?:var\(--|calc\(.*var\(--)/.test(value))
				errors.add(
					`${relative}: arbitrary spacing needs a documented geometry exception: ${token}`
				);
		}
		if (
			utility.startsWith('rounded') &&
			!/^rounded(?:-(?:[trblse]|tl|tr|br|bl|ss|se|ee|es))?-(?:none|full|sm|md|lg|\[inherit\]|\[var\(--[^\]]+\])$/.test(
				utility
			)
		)
			errors.add(`${relative}: unsupported radius utility ${token}`);
	}
}

async function inspectSource(filename, source) {
	const relative = path.relative(componentsDirectory, filename);
	const sourceFile =
		program.getSourceFile(filename) ??
		ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
	const cvaNames = new Set(['cva']);
	const cvaNamespaces = new Set();
	const themeTypes = new Set();
	const bindings = new Map();
	const exportedThemes = [];
	const cvaCalls = new Set();
	const presets = [];
	const isThemeFile = filename.endsWith('.theme.ts');
	const ownerName = path.basename(filename).split('.')[0];

	for (const statement of sourceFile.statements) {
		if (ts.isImportDeclaration(statement)) {
			const imports = statement.importClause?.namedBindings;
			if (imports && ts.isNamedImports(imports))
				for (const imported of imports.elements) {
					const original = (imported.propertyName ?? imported.name).text;
					if (original === 'cva') cvaNames.add(imported.name.text);
					if (original.endsWith('ThemeProps')) themeTypes.add(imported.name.text);
				}
			if (imports && ts.isNamespaceImport(imports)) cvaNamespaces.add(imports.name.text);
		}
		if (ts.isVariableStatement(statement))
			for (const declaration of statement.declarationList.declarations) {
				if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
				bindings.set(declaration.name.text, declaration.initializer);
				if (
					isExported(statement) &&
					/Theme$/.test(declaration.name.text) &&
					ts.isObjectLiteralExpression(unwrap(declaration.initializer))
				)
					exportedThemes.push(declaration);
			}
		if (ts.isFunctionDeclaration(statement) && statement.name && statement.body)
			bindings.set(statement.name.text, statement.body);
		if (
			ts.isFunctionDeclaration(statement) &&
			isExported(statement) &&
			/Theme$/.test(statement.name?.text ?? '')
		)
			exportedThemes.push(statement);
	}

	function isCva(expression, seen = new Set()) {
		if (ts.isIdentifier(expression)) {
			if (cvaNames.has(expression.text)) return true;
			if (seen.has(expression.text)) return false;
			seen.add(expression.text);
			const binding = unwrap(bindings.get(expression.text));
			return binding ? isCva(binding, seen) : false;
		}
		return (
			ts.isPropertyAccessExpression(expression) &&
			expression.name.text === 'cva' &&
			ts.isIdentifier(expression.expression) &&
			cvaNamespaces.has(expression.expression.text)
		);
	}

	const hasStaticClasses = (node) => {
		let hasClasses = false;
		const visitProperty = (child) => {
			if (ts.isPropertyAssignment(child) && propertyName(child) === 'base') {
				const visitValue = (value) => {
					if (
						(ts.isStringLiteralLike(value) ||
							ts.isTemplateHead(value) ||
							ts.isTemplateMiddle(value) ||
							ts.isTemplateTail(value)) &&
						value.text.trim()
					)
						hasClasses = true;
					ts.forEachChild(value, visitValue);
				};
				visitValue(child.initializer);
			}
			ts.forEachChild(child, visitProperty);
		};
		visitProperty(node);
		return hasClasses;
	};
	const visit = (node) => {
		if (ts.isCallExpression(node) && isCva(node.expression)) cvaCalls.add(node);
		if (
			ts.isVariableDeclaration(node) &&
			ts.isIdentifier(node.name) &&
			(/theme$/i.test(node.name.text) ||
				(node.type &&
					ts.isTypeReferenceNode(node.type) &&
					(node.type.typeName.getText(sourceFile).endsWith('ThemeProps') ||
						themeTypes.has(node.type.typeName.getText(sourceFile))))) &&
			node.initializer &&
			hasStaticClasses(node.initializer)
		)
			presets.push(node);
		if (ts.isSatisfiesExpression(node) && ts.isTypeReferenceNode(node.type)) {
			const typeName = node.type.typeName.getText(sourceFile);
			if (typeName.endsWith('ThemeProps') || themeTypes.has(typeName)) {
				// A dynamic bridge between already-owned classes is not a new preset.
				if (hasStaticClasses(node.expression) || isThemeFile) presets.push(node);
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	if (!isThemeFile && (cvaCalls.size || presets.length))
		errors.add(`${relative}: hidden theme definition must live in its <owner>.theme.ts file`);
	if (!isThemeFile) return;
	themeOwners.add(relative);
	const siblings = await readdir(path.dirname(filename));
	const owners = new Set(
		siblings.flatMap((name) =>
			name.endsWith('.svelte')
				? [lowerOwner(name.slice(0, -7))]
				: /\.(props|svelte)\.ts$/.test(name)
					? [name.split('.')[0]]
					: []
		)
	);
	// CalendarInput and CalendarPrimitive deliberately share the public Calendar theme contract.
	const sharedCalendarOwner =
		relative === 'Form/Calendar/calendar.theme.ts' &&
		owners.has('calendarInput') &&
		owners.has('calendarPrimitive');
	if (!owners.has(ownerName) && !sharedCalendarOwner)
		errors.add(`${relative}: theme filename does not name a sibling component owner`);
	if (!exportedThemes.length)
		errors.add(`${relative}: theme file must export its named theme or preset factory`);
	if (
		cvaCalls.size &&
		!exportedThemes.some((declaration) => declaration.name.text === `${ownerName}Theme`)
	)
		errors.add(`${relative}: CVA parts must belong to exported ${ownerName}Theme`);
	for (const declaration of exportedThemes)
		if (!declaration.name.text.toLowerCase().includes(ownerName.toLowerCase()))
			errors.add(`${relative}: theme export ${declaration.name.text} does not name its owner`);
	const reached = new Set();
	const reach = (node) => {
		if (!node || reached.has(node)) return;
		reached.add(node);
		if (ts.isIdentifier(node)) {
			if (node.getSourceFile() === sourceFile && bindings.has(node.text))
				reach(bindings.get(node.text));
			let symbol = checker.getSymbolAtLocation(node);
			if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
			const declaration = symbol?.valueDeclaration;
			const origin = declaration?.getSourceFile().fileName;
			if (
				origin?.startsWith(path.join(repositoryRoot, 'src/lib/')) &&
				!origin.includes('/utils/cva/')
			) {
				if (ts.isVariableDeclaration(declaration)) reach(declaration.initializer);
				if (ts.isFunctionDeclaration(declaration)) reach(declaration.body);
			}
		}
		if (
			ts.isStringLiteralLike(node) ||
			ts.isTemplateHead(node) ||
			ts.isTemplateMiddle(node) ||
			ts.isTemplateTail(node)
		)
			checkClasses(node.text, node.getSourceFile().fileName);
		ts.forEachChild(node, reach);
	};
	for (const declaration of exportedThemes) reach(declaration.initializer ?? declaration.body);
	for (const call of cvaCalls)
		if (!reached.has(call))
			errors.add(
				`${relative}: unowned CVA part ${propertyName(call.parent) ?? call.getStart(sourceFile)}`
			);
}

for (const filename of files) {
	const source = await readFile(filename, 'utf8');
	if (!filename.endsWith('.svelte')) await inspectSource(filename, source);
	else {
		const parsed = parse(source, { filename, modern: true });
		for (const script of [parsed.instance, parsed.module])
			if (script)
				await inspectSource(filename, source.slice(script.content.start, script.content.end));
	}
}
if (errors.size)
	throw new Error(`Semantic theme token check failed:\n- ${[...errors].join('\n- ')}`);
console.log(
	`Semantic theme token check passed (${themeOwners.size} theme owners; TypeScript and Svelte AST inventory).`
);
