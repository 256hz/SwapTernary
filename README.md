# Ternary Swap

## Demos

<img src="https://j.gifs.com/oV5V2L.gif" width="476" height="238"/>
<br />
<br />

<img src="https://j.gifs.com/JyoyZK.gif" width="476" height="331"/>

## Features

This extension automatically swaps the logic in a ternary expression for you.  It will preserve formatting/whitespace, and a semicolon at the end, if included.

It supports nested ternaries and will ignore the `?` and `:` characters if they are included as part of a string.  It will show an error if the ternary won't resolve (unbalanced if/then).

## Known Issues

- Quotes in comments are not ignored and will mess up the parse (especially `'`, as in `don't`).
- Testing that the error message is shown is not done, pending finding a way to mock some VS Code internals properly.

## Release Notes

### 1.0.0

Initial release of TernarySwap.swapTernary
