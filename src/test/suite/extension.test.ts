import * as assert from 'assert';
import * as sinon from 'sinon';

import * as vscode from 'vscode';
import { swapTernary, formatExpression } from '../../extension';

const showErrorMessage = sinon.stub(vscode.window, "showErrorMessage");

// sinon.stub(vscode, 'window');
// const executeCommand = sinon.stub(vscode.commands, 'executeCommand');
// executeCommand.callThrough();

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('One-line ternary', () => {
		const ternary = '0 ? true : false';
		const swapped = '0 ? false : true';

		assert.strictEqual(formatExpression(swapTernary(ternary)), swapped);
	});

	test('One-line ternary with ?: chars in strings', () => {
		const ternary = '0 ? ":?:???::?" : "?:?:::??:"';
		const swapped = '0 ? "?:?:::??:" : ":?:???::?"';

		assert.strictEqual(formatExpression(swapTernary(ternary)), swapped);
	});

	test('Two-line ternary', () => {
		const ternary = `
isThisTrue
	? yaBetterBelieveIt : nope
`;
		const swapped = `
isThisTrue
	? nope : yaBetterBelieveIt
`;
		assert.strictEqual(formatExpression(swapTernary(ternary)), swapped);
	});

	test('Two-line ternary with ternaries in strings with semicolon and whitespace at end', () => {
		const ternary = `
isThisTrue
	? "x ? y : z" : "a ? b : c";
\n
\n
`;
		const swapped = `
isThisTrue
	? "a ? b : c" : "x ? y : z";
\n
\n
`;

		assert.strictEqual(formatExpression(swapTernary(ternary)), swapped);
	});

	test('Three-line ternary with semicolon end', () => {
		const ternary = `
isThisTrue
	? yaBetterBelieveIt
	: nope;
`;
		const swapped = `
isThisTrue
	? nope
	: yaBetterBelieveIt;
`;
		assert.strictEqual(formatExpression(swapTernary(ternary)), swapped);
	});

	test('Three-line ternary with ternaries in strings and extra tabs in the false case', () => {
		const ternary = `
isThisTrue
\t? "x ? y : z"
\t\t\t: "a ? b : c";
`;
		const swapped = `
isThisTrue
\t? "a ? b : c"
\t\t\t: "x ? y : z";
`;

		assert.strictEqual(formatExpression(swapTernary(ternary)), swapped);
	});



	test('Deep nested ternary with strings and semicolon end', () => {
		const nested = `
'x'
	? "x ? y : z"
		? true
			? true
			: 'false'
				? true
				: "false"
		: false
	: \`false\`
		? true
		: \`${false}\`;
`;

		const swapped = `
'x'
	? \`false\`
		? true
		: \`${false}\`
	: "x ? y : z"
		? true
			? true
			: 'false'
				? true
				: "false"
		: false;
`;
		
		assert.strictEqual(formatExpression(swapTernary(nested)), swapped);
	});

// 	test('should show error when strings are not properly terminated', () => {
//     const missingQuoteTernary = 'x ? "true : `false`;';

//     swapTernary(missingQuoteTernary);
// 		assert.ok(showErrorMessage.calledOnce);
// 		showErrorMessage.restore();
// 	});

// 	test('should show error when nested ternary does not resolve', () => {
//     const missingResolutionTernary = `
// isThisTrue
// 	? yeahButIsThisTrueToo
// 		? ohYeahItsTrue
// 		: nopeAreWeDoneHere
// `;

//     swapTernary(missingResolutionTernary);
// 		assert.ok(showErrorMessage.calledOnce);
// 		showErrorMessage.restore();
// 	});
});
