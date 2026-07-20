import * as vscode from 'vscode';
import * as path from 'path';

const CONFIG = 'jsonAutoImport';

function getConfig() {
  return vscode.workspace.getConfiguration(CONFIG);
}

function getLanguages(): string[] {
  return getConfig().get('languages', [
    'typescript',
    'typescriptreact',
    'javascript',
    'javascriptreact',
    'vue',
  ]);
}

function convertName(fileName: string): string {

  const style = getConfig().get<string>('variableName', 'keep');

  const ext = path.extname(fileName);

  const base = path.basename(fileName, ext);

  const words = base
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .split(/[-_\s.]+/)
    .filter(Boolean);

  switch (style) {

    case 'lowercase':
      return base.toLowerCase();

    case 'UPPERCASE':
      return base.toUpperCase();

    case 'snake_case':
      return words.map(v => v.toLowerCase()).join('_');

    case 'SCREAMING_SNAKE_CASE':
      return words.map(v => v.toUpperCase()).join('_');

    case 'camelCase':
      return words.map((v, i) =>
        i === 0
          ? v.toLowerCase()
          : v[0].toUpperCase() + v.slice(1).toLowerCase()
      ).join('');

    case 'PascalCase':
      return words.map(v =>
        v[0].toUpperCase() + v.slice(1).toLowerCase()
      ).join('');

    case 'kebab-case':
      return words.map(v => v.toLowerCase()).join('-');

    case 'keep':
    default:
      return base;
  }

}

function buildImport(document: vscode.TextDocument, file: vscode.Uri) {

  let importPath = path.relative(
    path.dirname(document.uri.fsPath),
    file.fsPath
  );

  importPath = importPath.split(path.sep).join('/');

  if (!importPath.startsWith('.')) {
    importPath = './' + importPath;
  }

  if (!getConfig().get('keepExtension', true)) {
    importPath = importPath.replace(/\.[^.]+$/i, '');
  }

  const fileName = path.basename(file.fsPath);

  const variableName = convertName(fileName);

  return {
    variableName,
    importPath,
    importCode: `import ${variableName} from '${importPath}'`,
  };
}

export function activate(context: vscode.ExtensionContext) {

  const provider = vscode.languages.registerCompletionItemProvider(
    getLanguages(),
    {
      async provideCompletionItems(document) {

        const text = document.getText();
        const files = await vscode.workspace.findFiles('**/*.json');

        return files.map(file => {

          const info = buildImport(document, file);

          const item = new vscode.CompletionItem(
            info.variableName,
            vscode.CompletionItemKind.File
          );

          item.detail = info.importCode;

          item.documentation = new vscode.MarkdownString(
            `\`\`\`ts
${info.importCode}
\`\`\`
`
          );

          if (!text.includes(info.importCode)) {
            item.additionalTextEdits = [
              vscode.TextEdit.insert(
                new vscode.Position(0, 0),
                info.importCode + '\n'
              )
            ];
          }

          return item;
        });
      }
    }
  );

  const dropProvider = vscode.languages.registerDocumentDropEditProvider(
    getLanguages(),
    {
      async provideDocumentDropEdits(document, position, dataTransfer) {

        const item = dataTransfer.get('text/uri-list');
        if (!item) {
          return;
        }

        const uri = vscode.Uri.parse((await item.asString()).trim());

        if (path.extname(uri.fsPath).toLowerCase() !== '.json') {
          return;
        }

        const info = buildImport(document, uri);

        return new vscode.DocumentDropEdit(
          new vscode.SnippetString(info.importCode)
        );
      }
    }
  );

  context.subscriptions.push(provider, dropProvider);
}

export function deactivate() { }