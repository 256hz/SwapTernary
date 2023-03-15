# SwapTernary (an extension for VS Code)

## Features

This extension automatically swaps the logic in a ternary expression for you.  It will preserve formatting/whitespace if included.

Supports nested ternaries.  `?` and `:` are ignored in strings.  `//` and `/* */` comments are ignored.  It will show an error if the ternary won't resolve (unbalanced if/then, unterminated string).

## Demos

<img src="https://j.gifs.com/oV5V2L.gif" width="476" height="238"/>
<br />
<br />

<img src="https://j.gifs.com/JyoyZK.gif" width="476" height="331"/>

## Usage

1. Highlight ternary (nothing after the ternary except a `;` or formatting)
2. Hit ⇧⌥s (`shift + alt + s`)

## Known Issues

- Comments are grouped with the condition that precedes them, so they will not switch with the true/false cases.

## Release Notes

### 0.4.2

- better handling for quotes, braces, parens, JSX
- rewrite for author's sanity

### 0.2.0

- Add support for Typscript `?.` operator
- Ignore `//` and `/* */` comments (fix single quotes in comments breaking parse)

### 0.1.7

Add keyboard shortcut

### 0.1.1

Initial release
