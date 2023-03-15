import * as assert from 'assert';

import * as vscode from 'vscode';
import { swapTernary, formatExpression } from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('One-line ternary', () => {
		const original = '0 ? true : false';
		const expected = '0 ? false : true';

		assert.strictEqual(formatExpression(swapTernary(original)), expected);
	});

	test('One-line ternary with ?: chars in strings', () => {
		const original = '0 ? ":?:???::?" : "?:?:::??:"';
		const expected = '0 ? "?:?:::??:" : ":?:???::?"';

		assert.strictEqual(formatExpression(swapTernary(original)), expected);
	});

	test('Two-line ternary', () => {
		const original = `
isThisTrue
	? yaBetterBelieveIt : nope
`;
		const expected = `
isThisTrue
	? nope : yaBetterBelieveIt
`;
		assert.strictEqual(formatExpression(swapTernary(original)), expected);
	});

	test('Two-line ternary with ternaries in strings with semicolon and whitespace at end', () => {
		const original = `
isThisTrue
	? "x ? y : z" : "a ? b : c";
\n
\n
`;
		const expected = `
isThisTrue
	? "a ? b : c" : "x ? y : z";
\n
\n
`;

		assert.strictEqual(formatExpression(swapTernary(original)), expected);
	});

	test('Three-line ternary with semicolon end', () => {
		const original = `
isThisTrue
	? yaBetterBelieveIt
	: nope;
`;
		const expected = `
isThisTrue
	? nope
	: yaBetterBelieveIt;
`;
		assert.strictEqual(formatExpression(swapTernary(original)), expected);
	});

	test('Three-line ternary with ternaries in strings and extra tabs in the false case', () => {
		const original = `
isThisTrue
\t? "x ? y : z"
\t\t\t: "a ? b : c";
`;
		const expected = `
isThisTrue
\t? "a ? b : c"
\t\t\t: "x ? y : z";
`;

		assert.strictEqual(formatExpression(swapTernary(original)), expected);
	});



	test('Deep nested ternary with strings and semicolon end', () => {
		const original = `
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

		const expected = `
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
		
		assert.strictEqual(formatExpression(swapTernary(original)), expected);
	});

  test('JSX ternary', () => {
    const original = `
      {selectedBankAccount && edit ? (
        <Pressable
          onPress={edit}
          style={styles.editContainer}
          accessibilityLabel={
            editIcon === 'edit'
              ? messages.accessibilityLabelEdit
              : messages.accessibilityLabelRemove
          }
          testID={TestId.ActionButton}
        >
          {editIcon === 'edit' ? (
            <Icon name='pencil' width={18} height={18} fill={colors.primaryText} />
          ) : (
            <Icon name='bin' width={18} height={18} fill={colors.text.mediumGray} />
          )}
        </Pressable>
      ) : null}
    `;
    const expected = `
      {selectedBankAccount && edit ? null : (
        <Pressable
          onPress={edit}
          style={styles.editContainer}
          accessibilityLabel={
            editIcon === 'edit'
              ? messages.accessibilityLabelEdit
              : messages.accessibilityLabelRemove
          }
          testID={TestId.ActionButton}
        >
          {editIcon === 'edit' ? (
            <Icon name='pencil' width={18} height={18} fill={colors.primaryText} />
          ) : (
            <Icon name='bin' width={18} height={18} fill={colors.text.mediumGray} />
          )}
        </Pressable>
      )}
    `;

    assert.strictEqual(formatExpression(swapTernary(original)), expected);
  });
});
