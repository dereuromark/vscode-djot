# Changelog

All notable changes to the Djot extension are documented here.

## [0.1.0] - 2026-06-02

Initial release.

### Added

- Syntax highlighting via a TextMate grammar covering core Djot plus djot-php enhanced syntax:
  emphasis, strong, highlight, insert, delete, superscript, subscript, verbatim, inline and
  block math, symbols, footnotes, spans and attributes, links, images, autolinks, headings,
  thematic breaks, block quotes, lists (ordered, unordered, task, definition), tables with
  captions, fenced code with embedded language highlighting, raw blocks, divs (including
  admonition, tabs and code-group classes), comments, and frontmatter (YAML/TOML).
- Snippets for djot-php features (admonitions, tabs, code groups, definition lists, footnotes,
  math, tables, abbreviations, mermaid, and more).
- Language configuration: comment toggling, bracket matching, auto-closing pairs, and folding
  for div blocks.
- Live HTML preview rendered by the djot-php CLI, with safe-mode support and configurable PHP
  and CLI paths. Refreshes on type or on save.
