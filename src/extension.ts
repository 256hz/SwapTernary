import * as vscode from 'vscode';

enum Part {
	'condition',
  'trueCaseFormatting',
	'trueCase',
  'trueCaseEndFormatting',
	'falseCaseFormatting',
  'falseCase',
  'falseCaseEndFormatting',
}

type Expression = {
  [key in Part]: string[];
} & {
  errors: string[];
};

const regex = {
	quotes: /['"\`]/g,
	spaceChar: /\s/g,
  endSpace: /\s+$/g,
  singleLineComment: /^[\s]{0,}[/][/].+/g,
  singleLineBlockComment: /.{0,}[/][*].{0,}[*][/][\s]{0,}/g,
  blockCommentBegin: /.{0,}[/][*].{0,}/g,
  blockCommentEnd: /.{0,}[*][/].{0,}/g,
};

enum CommentResult {
  true,
  false,
  endBlock,
}

export const swapTernary = (selection: string) => {
  const selectionArray = [ ...selection ];

	const expression: Expression = {
		[Part.condition]: [] as string[],
		[Part.trueCaseFormatting]: [] as string[],
		[Part.trueCase]: [] as string[],
		[Part.trueCaseEndFormatting]: [] as string[],
		[Part.falseCaseFormatting]: [] as string[],
    [Part.falseCase]: [] as string[],
		[Part.falseCaseEndFormatting]: [] as string[],
    errors: [] as string[],
	};
  // so we can make sure we're not paying attention to ?: inside strings
  // TODO: ignore quotes inside comments, they currently break the swap
	const quoteStack = [] as string[];
	// we are matching `?`s with `:`s, so we don't need to keep the characters, just the depth
  let ternaryStackDepth = 0;
  // oversees which part of the expression we are parsing
  let activePart: Part = Part.condition;
  // tracks if we are inside a comment, so we can ignore characters
  const insideComment = {
    single: false,
    block: false,
  };
  // hack to get the end of a block comment
  let skipNext = false;

  // processes whitespace at the end of sections.  Advances to nextPartName on a non-space character
	const advancePartAtEndOfFormatting = (
		nextPartName: Part,
		currentChar: string,
	) => {
		if (currentChar.match(regex.spaceChar)) {
			expression[activePart].push(currentChar);
		} else {
			activePart = nextPartName;
			expression[activePart].push(currentChar);
		}
	};

	const handleIfQuote = (currentChar: string) => {
		if (currentChar.match(regex.quotes)) {
      // If the current quote matches the end of our quote stack, pop the end off.  Otherwise, add to the stack.
      currentChar === quoteStack.slice(-1)[0]
        ? quoteStack.pop()
        : quoteStack.push(currentChar);
		}
  };

  const isInsideComment = (currentChar: string, index: number) => {
    // end single
    if (insideComment.single && currentChar === '\n') {
      insideComment.single = false;
      return CommentResult.false;
    }

    // end block
    if (insideComment.block && currentChar === '*' && selectionArray[index + 1] === '/') {
      insideComment.block = false;
      return CommentResult.endBlock;
    }

    // start single
    if (currentChar === '/' && selectionArray[index + 1] === '/') {
      insideComment.single = true;
      return CommentResult.true;
    }

    // start block
    if (currentChar === '/' && selectionArray[index + 1] === '*') {
      insideComment.block = true;
      return CommentResult.true;
    }

    return Object.values(insideComment).some(x => x)
      ? CommentResult.true
      : CommentResult.false;
  };


	selectionArray.forEach((char, index) => {
		switch (activePart) {
			case Part.condition: {
        if (skipNext) {
          expression[activePart].push(char);
          skipNext = false;
          break;
        }

        const inComment = isInsideComment(char, index);
        if (inComment === CommentResult.true) {
          expression[activePart].push(char);
					break;
        }

        if (inComment === CommentResult.endBlock) {
          expression[activePart].push(char);
          skipNext = true;
          break;
        }

				handleIfQuote(char);

				if (quoteStack.length) {
					expression[activePart].push(char);
					break;
				}

				if (char === '?' && !quoteStack.length && selectionArray[index + 1] !== '.') {
					activePart = Part.trueCaseFormatting;
					ternaryStackDepth = 1;
					break;
				}

				expression[activePart].push(char);
				break;
      }

			case Part.trueCaseFormatting:
				handleIfQuote(char);
				advancePartAtEndOfFormatting(
					Part.trueCase,
					char,
				);
				break;

			case Part.trueCase: {
        if (skipNext) {
          expression[activePart].push(char);
          skipNext = false;
          break;
        }

        const inComment = isInsideComment(char, index);
        if (inComment === CommentResult.true) {
          expression[activePart].push(char);
					break;
        }

        if (inComment === CommentResult.endBlock) {
          expression[activePart].push(char);
          skipNext = true;
          break;
        }

				handleIfQuote(char);

				if (quoteStack.length) {
					expression[activePart].push(char);
					break;
				}

				if (char === '?' && selectionArray[index + 1] !== '.') {
					ternaryStackDepth += 1;
				} else if (char === ':') {
					ternaryStackDepth -= 1;
				}

				if (ternaryStackDepth === 0) {
					activePart = Part.falseCaseFormatting;
					break;
				}

				expression[activePart].push(char);
				break;
      }

			case Part.falseCaseFormatting:
				handleIfQuote(char);
				advancePartAtEndOfFormatting(
					Part.falseCase,
					char,
				);
				break;

			case Part.falseCase:
        if (skipNext) {
          expression[activePart].push(char);
          skipNext = false;
          break;
        }

        const inComment = isInsideComment(char, index);
        if (inComment === CommentResult.true) {
          expression[activePart].push(char);
					break;
        }

        if (inComment === CommentResult.endBlock) {
          expression[activePart].push(char);
          skipNext = true;
          break;
        }

				handleIfQuote(char);
				expression[activePart].push(char);
				break;

			default:
		}
	});

	if (ternaryStackDepth !== 0) {
    const neededNumber = Math.abs(ternaryStackDepth);
    const usePlural = neededNumber !== 1;
		expression.errors.push(`Need ${neededNumber} more \`${ternaryStackDepth < 0 ? '?' : ':'}\`${usePlural ? 's' : ''}`);
  }

  if (!expression[Part.trueCase].length || !expression[Part.falseCase].length) {
    expression.errors.push('Empty true or false case');
  }

  if (quoteStack.length > 0) {
    expression.errors.push('Unterminated string');
  }

  return expression;
};

export const formatExpression = (expression: Expression) => {
  const endOfOriginalExpression = expression[Part.falseCase].join('').trimRight();
	const hasSemicolonEnd = endOfOriginalExpression.slice(-1) === ';';

  const condition = expression[Part.condition].join('');

  const trueCaseFormatting = expression[Part.trueCaseFormatting].join('');

  const trueCase = expression[Part.trueCase].join('').trimRight();

  const trueCaseEndFormatting = expression[Part.trueCase].join('').match(regex.endSpace)?.join('');

  const falseCaseFormatting = expression[Part.falseCaseFormatting].join('');

  const falseCase = hasSemicolonEnd
    ? [ ...endOfOriginalExpression ].slice(0, -1).join('')
    : endOfOriginalExpression;

    const falseCaseEndFormatting = expression[Part.falseCase].join('').match(regex.endSpace)?.join('') || '';

  return (
    condition
      + '?'
      + trueCaseFormatting
      + falseCase
      + trueCaseEndFormatting
      + ':'
      + falseCaseFormatting
      + trueCase
      + (hasSemicolonEnd ? ';' : '')
      + falseCaseEndFormatting
  );
};

export function activate(context: vscode.ExtensionContext) {
	console.log('SwapTernary: highlight ternary & hit ⇧⌥s (or ⇧⌘P, type "Swap Ternary")');

	let disposable = vscode.commands.registerCommand('256hz.swapTernary', () => {
		const activeEditor = vscode.window.activeTextEditor;

		if (!activeEditor) {
			return;
		}

		const { document, selection } = activeEditor;

		// Get the expression within the selection
		const expression = document.getText(selection);
		if (!expression) {
			vscode.window.showInformationMessage('No selection');
			return;
		}

      const newExpression = swapTernary(expression);

      if (newExpression.errors.length) {
        vscode.window.showErrorMessage(newExpression.errors[0]);

        activeEditor.edit(editBuilder => {
          editBuilder.replace(selection, JSON.stringify(newExpression, null, 2));
        });
        return;
      }

			activeEditor.edit(editBuilder => {
				editBuilder.replace(selection, formatExpression(newExpression));
			});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
  console.log('SwapTernary deactivated');
}

/* test statements

x ? y : z

x
  ? y
  : z;

object?.withProperty?.thing
  ? rejoice()
  : weep();

x
  // commen't
  ? things
  // comment'n't? '
  : other things

*/
