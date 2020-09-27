import * as vscode from 'vscode';

enum Part {
	'condition',
  'trueCaseFormatting',
  'trueCaseEndFormatting',
	'trueCase',
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
};

export const swapTernary = (selection: string) => {
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
	const quoteStack = [] as string[];
	// we are matching `?`s with `:`s, so we don't need to keep the characters, just the depth
  let ternaryStackDepth = 0;
  // oversees which part of the expression we are parsing.  Advanced according to logic below.
	let activePart: Part = Part.condition;

	const advancePartAtEndOfFormatting = (
		currentPartName: Part,
		nextPartName: Part,
		currentChar: string,
	) => {
		if (currentChar.match(regex.spaceChar)) {
			expression[currentPartName].push(currentChar);
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

	selection.split('').forEach(char => {
		switch (activePart) {
			case Part.condition:
				handleIfQuote(char);

				if (quoteStack.length) {
					expression[activePart].push(char);
					break;
				}
	
				if (char === '?' && !quoteStack.length) {
					activePart = Part.trueCaseFormatting;
					ternaryStackDepth = 1;
					break;
				}
	
				expression[activePart].push(char);
				break;

			case Part.trueCaseFormatting:
				handleIfQuote(char);
				advancePartAtEndOfFormatting(
					Part.trueCaseFormatting, 
					Part.trueCase,
					char,
				);
				break;

			case Part.trueCase:
				handleIfQuote(char);
		
				if (quoteStack.length) {
					expression[activePart].push(char);
					break;
				}
		
				if (char === '?') {
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

			case Part.falseCaseFormatting:
				handleIfQuote(char);
				advancePartAtEndOfFormatting(
					Part.falseCaseFormatting,
					Part.falseCase,
					char,
				);
				break;

			case Part.falseCase:
				handleIfQuote(char);
				expression[activePart].push(char);
				break;

			default:
		}
	});

	if (ternaryStackDepth !== 0) {
    const neededNumber = Math.abs(ternaryStackDepth);
    const usePlural = neededNumber !== 1;
		expression.errors.push(`Error parsing ternary: need ${neededNumber} more \`${ternaryStackDepth < 0 ? '?' : ':'}\`${usePlural ? 's' : ''}`);
  }
  
  return expression;
};

export const formatExpression = (expression: Expression) => {
  const endOfOriginalExpression = expression[Part.falseCase].join('').trimRight();
	const hasSemicolonEnd = endOfOriginalExpression.slice(-1) === ';';

  const condition = expression[Part.condition].join('');
  const trueCaseFormatting = expression[Part.trueCaseFormatting].join('');
  const trueCase = expression[Part.trueCase].join('').trimRight().concat(hasSemicolonEnd ? ';' : '');
  const trueCaseEndFormatting = expression[Part.trueCase].join('').match(regex.endSpace)?.join('');
  const falseCaseFormatting = expression[Part.falseCaseFormatting].join('');
  const falseCase = hasSemicolonEnd
    ? endOfOriginalExpression.split('').slice(0, -1).join('')
    : endOfOriginalExpression;
  const falseCaseEndFormatting = expression[Part.falseCase].join('').match(regex.endSpace)?.join('');

	return `${condition}?${trueCaseFormatting}${falseCase}${trueCaseEndFormatting}:${falseCaseFormatting}${trueCase}${falseCaseEndFormatting || ''}`;
};

export function activate(context: vscode.ExtensionContext) {
	console.log('SwapTernary active: ⇧⌘P, "Swap Ternary"');

	let disposable = vscode.commands.registerCommand('ternaryswap.swapTernary', () => {
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
        newExpression.errors.forEach(error => {
			    vscode.window.showErrorMessage(error);
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
