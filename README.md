# SwapTernary

## Features

This extension automatically swaps the logic in a ternary expression for you.  It will preserve formatting/whitespace, and a semicolon at the end, if included.

It supports nested ternaries and will ignore the `?` and `:` characters if they are included as part of a string.  It will show an error if the ternary won't resolve (unbalanced if/then).

## Demos

<img src="https://j.gifs.com/oV5V2L.gif" width="476" height="238"/>
<br />
<br />

<img src="https://j.gifs.com/JyoyZK.gif" width="476" height="331"/>

## Usage

1. Highlight ternary (don't select anything after the ternary except a `;` or whitespace)
2. Open the Command Palette (Mac: ⇧⌘P, Windows: ^⇧P)
3. type "Swap Ternary"
4. Press the Enter key down for 0.1-ish seconds and release it back to the up (or "idle") position

## Known Issues

- Quotes in comments are not ignored and an odd number of them will mess up the parse.
- Testing that the error message is shown is not done, pending finding a way to mock some VS Code internals properly.

## Release Notes

### 0.1.1

Initial release
