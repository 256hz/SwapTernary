# Ternary Swap

## Features

This extension automatically swaps the logic in a ternary expression for you.  It will preserve formatting/whitespace, and a semicolon at the end, if included.

It supports nested ternaries and will ignore the `?` and `:` characters if they are included as part of a string.  It will show an error if quotes don't terminate properly, or if the ternary won't resolve (unbalanced if/then).

## Known Issues

Testing that the error message is shown is not done, pending npm finding a way to mock some VS Code internals properly.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of SwapTernary
