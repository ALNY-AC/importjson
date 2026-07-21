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

function getImportInsertPosition(document: vscode.TextDocument): vscode.Position {

  const text = document.getText();

  // 1. 找最后一个 import
  const importRegex = /^[ \t]*import[\s\S]*?;?[ \t]*$/gm;

  let lastImport: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(text)) !== null) {
    lastImport = match;
  }

  if (lastImport) {
    const end = document.positionAt(lastImport.index + lastImport[0].length);
    return new vscode.Position(end.line + 1, 0);
  }

  // 2. Vue：找 <script ...>
  const scriptRegex = /<script\b[^>]*>/i;
  const scriptMatch = scriptRegex.exec(text);

  if (scriptMatch) {
    const end = document.positionAt(scriptMatch.index + scriptMatch[0].length);
    return new vscode.Position(end.line + 1, 0);
  }

  // 3. 默认文件开头
  return new vscode.Position(0, 0);
}

function getUseGitIgnore(): boolean {
  return getConfig().get('useGitIgnore', true);
}

function getSearchPaths(): string[] {
  return getConfig().get('searchPaths', []);
}

function getExcludePaths(): string[] {
  return getConfig().get('excludePaths', []);
}


async function buildIncludeGlob(): Promise<string> {

  const paths = getSearchPaths()
    .map(v => v.trim())
    .filter(Boolean);

  if (!paths.length) {
    return '**/*.json';
  }

  return `{${paths.map(v => `${v}/**/*.json`).join(',')}}`;

}
async function buildExcludeGlob(): Promise<string | undefined> {

  const excludes = new Set<string>();

  // 配置排除目录
  for (const dir of getExcludePaths()) {

    const value = dir.trim();

    if (value) {
      excludes.add(value);
    }

  }

  // .gitignore
  if (getUseGitIgnore()) {

    const folders = vscode.workspace.workspaceFolders ?? [];

    for (const folder of folders) {

      try {

        const uri = vscode.Uri.joinPath(folder.uri, '.gitignore');

        const bytes = await vscode.workspace.fs.readFile(uri);

        const text = Buffer.from(bytes).toString('utf8');

        for (let line of text.split(/\r?\n/)) {

          line = line.trim();

          if (
            !line ||
            line.startsWith('#') ||
            line.startsWith('!')
          ) {
            continue;
          }

          line = line.replace(/^\/|\/$/g, '');

          if (line) {
            excludes.add(line);
          }

        }

      } catch { }

    }

  }

  if (!excludes.size) {
    return undefined;
  }

  return `**/{${[...excludes].join(',')}}/**`;

}
async function findJsonFiles(): Promise<vscode.Uri[]> {

  return vscode.workspace.findFiles(
    await buildIncludeGlob(),
    await buildExcludeGlob()
  );

}
export function activate(context: vscode.ExtensionContext) {

  const provider = vscode.languages.registerCompletionItemProvider(
    getLanguages(),
    {
      async provideCompletionItems(document) {

        const text = document.getText();
        const files = await findJsonFiles();
        // const files = await vscode.workspace.findFiles('**/*.json', '**/{node_modules,dist}/**');
        console.log(files.map(f => f.fsPath).join('\n'));


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
                getImportInsertPosition(document),
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
        const edit = new vscode.DocumentDropEdit('');

        edit.additionalEdit = new vscode.WorkspaceEdit();

        edit.additionalEdit.insert(
          document.uri,
          getImportInsertPosition(document),
          info.importCode + '\n'
        );

        return edit;
      }
    }
  );

  context.subscriptions.push(provider, dropProvider);
}

export function deactivate() { }