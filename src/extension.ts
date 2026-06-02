import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { buildConvertArgs, escapeHtml, findCliInRoots } from './cli';

const LANGUAGE_ID = 'djot';

export function activate(context: vscode.ExtensionContext): void {
  const preview = new DjotPreview(context);
  context.subscriptions.push(preview);

  context.subscriptions.push(
    vscode.commands.registerCommand('djot.showPreview', () => {
      preview.show(vscode.ViewColumn.Active);
    }),
    vscode.commands.registerCommand('djot.showPreviewToSide', () => {
      preview.show(vscode.ViewColumn.Beside);
    }),
  );
}

export function deactivate(): void {
  // Disposables are cleaned up via context.subscriptions.
}

class DjotPreview implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private sourceUri: vscode.Uri | undefined;
  private debounce: ReturnType<typeof setTimeout> | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (this.refreshMode() !== 'onType') {
          return;
        }
        if (this.sourceUri && event.document.uri.toString() === this.sourceUri.toString()) {
          this.scheduleUpdate();
        }
      }),
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (this.sourceUri && document.uri.toString() === this.sourceUri.toString()) {
          this.scheduleUpdate(0);
        }
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && editor.document.languageId === LANGUAGE_ID && this.panel) {
          this.sourceUri = editor.document.uri;
          this.scheduleUpdate(0);
        }
      }),
    );
  }

  show(column: vscode.ViewColumn): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== LANGUAGE_ID) {
      void vscode.window.showInformationMessage('Open a .djot file to preview it.');
      return;
    }
    this.sourceUri = editor.document.uri;

    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'djotPreview',
        'Djot Preview',
        column,
        {
          enableScripts: false,
          localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
        },
      );
      this.panel.onDidDispose(() => {
        this.panel = undefined;
      }, undefined, this.disposables);
    } else {
      this.panel.reveal(column);
    }

    this.scheduleUpdate(0);
  }

  private refreshMode(): string {
    return vscode.workspace.getConfiguration('djot').get<string>('preview.refresh', 'onType');
  }

  private scheduleUpdate(delay = 300): void {
    if (this.debounce) {
      clearTimeout(this.debounce);
    }
    this.debounce = setTimeout(() => {
      void this.update();
    }, delay);
  }

  private async update(): Promise<void> {
    if (!this.panel || !this.sourceUri) {
      return;
    }
    const document = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === this.sourceUri?.toString(),
    );
    if (!document) {
      return;
    }

    this.panel.title = `Preview ${path.basename(document.fileName)}`;

    const config = vscode.workspace.getConfiguration('djot');
    const phpBinary = config.get<string>('php.binary', 'php');
    const cliPath = this.resolveCliPath(document.uri, config.get<string>('cli.path', ''));

    if (!cliPath) {
      this.renderError(
        'djot-php CLI not found.',
        'Set "djot.cli.path" to the djot script, or install the library so that "vendor/bin/djot" exists:\n\n  composer require php-collective/djot',
      );
      return;
    }

    const args = buildConvertArgs(config.get<string>('safeMode', 'off'));

    try {
      const html = await this.runCli(phpBinary, cliPath, args, document.getText());
      this.renderHtml(html);
    } catch (error) {
      const err = error as { message?: string; stderr?: string };
      this.renderError(
        'Failed to render Djot.',
        err.stderr?.trim() || err.message || String(error),
      );
    }
  }

  private resolveCliPath(documentUri: vscode.Uri, configured: string): string | undefined {
    if (configured) {
      return configured;
    }
    const folder = vscode.workspace.getWorkspaceFolder(documentUri);
    const roots = folder ? [folder.uri.fsPath] : [];
    if (vscode.workspace.workspaceFolders) {
      for (const wf of vscode.workspace.workspaceFolders) {
        if (!roots.includes(wf.uri.fsPath)) {
          roots.push(wf.uri.fsPath);
        }
      }
    }
    return findCliInRoots(roots, fs.existsSync);
  }

  private runCli(
    phpBinary: string,
    cliPath: string,
    args: string[],
    input: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn(phpBinary, [cliPath, ...args], {
        cwd: path.dirname(cliPath),
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('error', (error) => {
        reject({ message: `Could not run "${phpBinary}": ${error.message}`, stderr });
      });
      child.on('close', (codeValue) => {
        if (codeValue === 0) {
          resolve(stdout);
        } else {
          reject({ message: `djot-php exited with code ${codeValue}.`, stderr });
        }
      });
      child.stdin.end(input);
    });
  }

  private renderHtml(body: string): void {
    if (!this.panel) {
      return;
    }
    const cssUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'preview.css'),
    );
    const csp = [
      "default-src 'none'",
      `style-src ${this.panel.webview.cspSource} 'unsafe-inline'`,
      `img-src ${this.panel.webview.cspSource} https: data:`,
      'font-src https: data:',
    ].join('; ');

    this.panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${cssUri.toString()}">
</head>
<body class="djot-preview">
${body}
</body>
</html>`;
  }

  private renderError(title: string, detail: string): void {
    if (!this.panel) {
      return;
    }
    const csp = `default-src 'none'; style-src ${this.panel.webview.cspSource} 'unsafe-inline'`;
    this.panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<style>
body { font-family: var(--vscode-font-family); padding: 1rem; color: var(--vscode-foreground); }
.title { color: var(--vscode-errorForeground); font-weight: 600; margin-bottom: 0.5rem; }
pre { white-space: pre-wrap; background: var(--vscode-textCodeBlock-background); padding: 0.75rem; border-radius: 4px; }
</style>
</head>
<body>
<div class="title">${escapeHtml(title)}</div>
<pre>${escapeHtml(detail)}</pre>
</body>
</html>`;
  }

  dispose(): void {
    if (this.debounce) {
      clearTimeout(this.debounce);
    }
    this.panel?.dispose();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
