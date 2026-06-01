# Djot for Visual Studio Code

Language support for [Djot](https://djot.net) with full
[djot-php](https://github.com/php-collective/djot) enhanced-syntax coverage: rich syntax
highlighting, snippets, editor configuration, and a live HTML preview rendered by the djot-php
CLI.

## Features

### Syntax highlighting

A TextMate grammar built from the Djot grammar, covering both core Djot and the djot-php
enhancements:

- Inline: emphasis `_x_`, strong `*x*`, highlight `{=x=}`, insert `{+x+}`, delete `{-x-}`,
  superscript `^x^`, subscript `~x~`, verbatim `` `x` ``, inline math `` $`x` ``, symbols
  `:name:`, footnote references `[^id]`, spans `[text]{.class}`, links, images, autolinks,
  attributes `{.class #id key="value"}`, and comments `{% ... %}`.
- Block: headings, thematic breaks, block quotes, ordered / unordered / task / definition
  lists, tables with captions, fenced code (with embedded highlighting for PHP, JS, TS, JSON,
  HTML, CSS, shell, Python, SQL, YAML, XML and more), raw blocks `` ```=html ``, display math
  `` $$`x` ``, divs `:::` (including admonition, `tabs` and `code-group` classes), block
  attributes, and frontmatter (YAML / TOML).

### Snippets

Type a prefix and press <kbd>Tab</kbd>: `note`, `tabs`, `codegroup`, `deflist`, `table`, `fn`,
`math`, `abbr`, `mermaid`, `link`, `img`, `frontmatter`, and more.

### Live preview

Render the current document to HTML using the djot-php CLI, so the preview reflects the full
djot-php output (admonitions, tabs, code groups, definition lists, captions, and so on).

- **Open Preview to the Side**: <kbd>Ctrl</kbd>+<kbd>K</kbd> <kbd>V</kbd>
  (<kbd>Cmd</kbd>+<kbd>K</kbd> <kbd>V</kbd> on macOS)
- **Open Preview**: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd>
  (<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> on macOS)

## Installation

### From the Marketplace

Once published, search for **Djot** (publisher `dereuromark`) in the Extensions view
(<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>), or install from the command line:

```bash
code --install-extension dereuromark.vscode-djot
```

### From a local build (VSIX)

Build a `.vsix` and install it locally:

```bash
npm install
npm run package    # produces vscode-djot-<version>.vsix
code --install-extension vscode-djot-0.1.0.vsix
```

Or run it without installing: open this folder in VS Code and press <kbd>F5</kbd> to launch an
Extension Development Host (see [Development](#development)).

## Requirements

The preview shells out to the djot-php CLI, so it needs PHP and the
[php-collective/djot](https://github.com/php-collective/djot) library:

```bash
composer require php-collective/djot
```

The extension auto-detects `vendor/bin/djot` in your workspace. If it lives elsewhere, set
`djot.cli.path`. Syntax highlighting and snippets work without PHP; only the preview needs it.

## Settings

| Setting | Default | Description |
|---|---|---|
| `djot.php.binary` | `php` | Path to the PHP binary used to run the CLI. |
| `djot.cli.path` | _(empty)_ | Path to the `djot` CLI script. Empty auto-detects `vendor/bin/djot` in the workspace. |
| `djot.safeMode` | `off` | HTML sanitization: `off`, `default`, or `strict`. Use for untrusted content. |
| `djot.preview.refresh` | `onType` | Refresh the preview `onType` (debounced) or `onSave`. |

## Development

```bash
npm install
npm run build      # bundle with esbuild
npm run watch      # rebuild on change
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # grammar snapshot tests
npm run package    # produce a .vsix
```

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host.

## License

[MIT](LICENSE) - Mark Scherer.
