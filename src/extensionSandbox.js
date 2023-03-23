const Part = {
  Condition: 'condition',
  TrueCaseBeginFormatting: 'trueCaseBeginFormatting',
  TrueCase: 'trueCase',
  TrueCaseEndFormatting: 'trueCaseEndFormatting',
  FalseCaseBeginFormatting: 'falseCaseBeginFormatting',
  FalseCase: 'falseCase',
  FalseCaseEndFormatting: 'falseCaseEndFormatting',
  EndCharacters: 'endCharacters',
};

const isOpeningBrace = (char) => ['(', '{', '['].includes(char);
const isClosingBrace = (char) => [')', '}', ']'].includes(char);
const isQuote = (char) => ['"', "'", '`'].includes(char);
const endingBraceFor = {
  '(': ')',
  '{': '}',
  '[': ']',
};
const isWhitespace = (char) => !!char?.match(/\s/);

const formatExpression = (expression) => {
  const condition = expression[Part.Condition].join('');
  const trueCaseBeginFormatting = expression[Part.TrueCaseBeginFormatting].join('');
  const trueCase = expression[Part.TrueCase].join('');
  const trueCaseEndFormatting = expression[Part.TrueCaseEndFormatting].join('');
  const falseCaseBeginFormatting = expression[Part.FalseCaseBeginFormatting].join('');
  const falseCase = expression[Part.FalseCase].join('');
  const falseCaseEndFormatting = expression[Part.FalseCaseEndFormatting].join('');
  const endCharacters = expression[Part.EndCharacters].join('');

  return (
    condition
    + '?'
    + trueCaseBeginFormatting
    + falseCase
    + trueCaseEndFormatting
    + ':'
    + falseCaseBeginFormatting
    + trueCase
    + endCharacters
    + falseCaseEndFormatting
  );
};

const swapTernary = (ternary) => {
  const expression = {
    [Part.Condition]: [],
    [Part.TrueCaseBeginFormatting]: [],
    [Part.TrueCase]: [],
    [Part.TrueCaseEndFormatting]: [],
    [Part.FalseCaseBeginFormatting]: [],
    [Part.FalseCase]: [],
    [Part.FalseCaseEndFormatting]: [],
    [Part.EndCharacters]: [],
    errors: [],
  };
  const state = {
    part: Part.Condition,
    quote: '',
    braceStack: [],
    ternaryDepth: 0,
    inComment: 'none',
    jsxDepth: 0,
  }
  const characters = ternary.split('');

  const transferWhitespace = (fromPart, toBeginningPart, toEndPart) => {
    const from = expression[fromPart];
    const toBeginning = expression[toBeginningPart];
    const toEnd = expression[toEndPart];
    while (isWhitespace(from[0])) {
      toBeginning.push(from.shift());
    }
    while (isWhitespace(from[from.length - 1])) {
      toEnd.unshift(from.pop());
    }
  }

  while (characters[0]) {
    const char = characters.shift();
    const prev = expression[state.part][expression[state.part].length - 1];
    const next = characters[0];
    const currentPart = expression[state.part];

    // if we're in a string, check if it ends
    if (state.quote) {
      if (char === state.quote) state.quote = '';
      currentPart.push(char);
      continue;
    }

    // if we're not in a string/comment, but the char is a quote, save the quote and wait for close
    if (isQuote(char) && !state.quote && !state.inComment) {
      state.quote = char;
      currentPart.push(char);
      continue;
    }

    // check for start of JSX
    if (char === '<' && next.match(/[a-z>]/i)) {
      state.jsxDepth += 1;
      currentPart.push(char);
      continue;
    }

    // check for end of JSX
    if (state.jsxDepth && (char === '/' && next === '>') || (char === '<' && next === '/')) {
      state.jsxDepth -= 1;
      currentPart.push(char);
      continue;
    }

    // if in comment
    if (state.inComment !== 'none') {
      const endsBlock = state.inComment === 'block' && prev === '*' && char === '/';
      const endsLine = state.inComment === 'line' && char === '\n';
      if (endsBlock || endsLine) {
        state.inComment = 'none';
      }
      currentPart.push(char);
      continue;
    }

    // if start of a new comment
    if (state.inComment === 'none') {
      if ((char === '/' && next === '*') || (char === '#' && next === ' ')) {
        state.inComment = 'block';
        currentPart.push(char);
        continue;
      }
      if (char === '/' && next === '/') {
        state.inComment = 'line';
        currentPart.push(char);
        continue;
      }
    }

    // check for braces/parens/quotes
    if (isOpeningBrace(char)) {
      currentPart.push(char);
      state.braceStack.push(char)
      continue;
    };
    if (isClosingBrace(char)) {
      const lastOpenBrace = state.braceStack[state.braceStack.length - 1];
      if (char === endingBraceFor[lastOpenBrace]) {
        state.braceStack.pop();
      } else {
        expression.errors.push(`Mismatched closing brace: ${char}`);
      }
      currentPart.push(char);
      if (next === undefined) {
        transferWhitespace(Part.FalseCase, Part.FalseCaseBeginFormatting, Part.FalseCaseEndFormatting);
        break;
      }
      continue;
    }

    // check for end of condition
    if (state.part === Part.Condition && char === '?' && next !== '.') {
      state.ternaryDepth = 1;
      state.part = Part.TrueCase;
      continue;
    }

    // check for nested ternary
    if (state.part !== Part.Condition && char === '?' && next !== '.') {
      state.ternaryDepth += 1;
      currentPart.push(char);
      continue;
    }

    // check for end of nested ternary
    if (state.part !== Part.Condition && char === ':' && state.ternaryDepth > 1) {
      state.ternaryDepth -= 1;
      currentPart.push(char);
      continue;
    }

    // check for end of true case
    if (state.part === Part.TrueCase && char === ':' && state.ternaryDepth === 1 && !state.jsxDepth) {
      transferWhitespace(Part.TrueCase, Part.TrueCaseBeginFormatting, Part.TrueCaseEndFormatting);
      state.part = Part.FalseCase;
      continue;
    }

    // check for end of false case
    if (state.part === Part.FalseCase && state.ternaryDepth === 1 && next === undefined) {
      console.log('end')
      currentPart.push(char);
      transferWhitespace(Part.FalseCase, Part.FalseCaseBeginFormatting, Part.FalseCaseEndFormatting);
      break;
    }

    currentPart.push(char);
  }

  // check for stuff at the end of the expression that we want to stay at the end
  const { falseCase } = expression;
  while (falseCase[falseCase.length - 1] === '}' || falseCase[falseCase.length - 1] === ';') {
    expression[Part.EndCharacters].unshift(falseCase.pop());
  };

  // if we're still in a nested section, add errors
  if (state.quote) {
    expression.errors.push(`Missing string terminator: ${state.quote}`);
  }
  if (state.inComment !== 'none') {
    expression.errors.push(`Unclosed comment: ${state.inComment}`);
  }
  if (state.braceStack.length) {
    expression.errors.push(`Unclosed brace: ${state.braceStack[state.braceStack.length - 1]}`);
  }
  if (state.ternaryDepth > 1) {
    expression.errors.push(`Unclosed ternaries: ${state.ternaryDepth - 1}`);
  }
  if (state.jsxDepth) {
    expression.errors.push(`Unclosed JSX tags: ${state.jsxDepth}`);
  }
  if (!expression.trueCase.length || !expression.falseCase.length) {
    expression.errors.push('Ternary not found');
  }

  if (expression.errors.length) {
    console.log('Errors:\n', expression.errors.join('\n\t - '));
  }

  console.log({
    ...expression,
    trueCase: expression.trueCase.join(''),
    falseCase: expression.falseCase.join(''),
  });
  console.log(formatExpression(expression));
  return expression;
}

swapTernary(`{isLoading ? (
  <Loading size='small' color={colors.forest} />
) : (
  <>
    <Icon name='rewardsStar' style={styles.icon} fill={colors.forest} />
    <Text style={styles.points}>
      {points}
      <View style={{ width: 1 }} />
      <Text style={styles.text}>pts</Text>
    </Text>
  </>
)}`);
