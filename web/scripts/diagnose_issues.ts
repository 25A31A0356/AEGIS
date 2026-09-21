import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

function runDiagnostics() {
  const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) {
    console.error('Could not find tsconfig.json');
    return;
  }

  const readConfigFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedCommandLine = ts.parseJsonConfigFileContent(
    {
      ...readConfigFile.config,
      include: ['src/**/*', 'server/**/*', 'scripts/**/*', 'vite.config.ts'],
      compilerOptions: {
        ...readConfigFile.config.compilerOptions,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noEmit: true,
      },
    },
    ts.sys,
    process.cwd()
  );

  const program = ts.createProgram({
    rootNames: parsedCommandLine.fileNames,
    options: parsedCommandLine.options,
  });

  const diagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
    ...program.getDeclarationDiagnostics(),
  ].filter((diag) => {
    if (!diag.file) return false;
    const rel = path.relative(process.cwd(), diag.file.fileName).replace(/\\/g, '/');
    return !rel.startsWith('node_modules') && !rel.startsWith('dist');
  });

  const items = diagnostics.map((diag) => {
    const file = diag.file?.fileName ? path.relative(process.cwd(), diag.file.fileName).replace(/\\/g, '/') : 'unknown';
    const { line, character } = diag.file && diag.start !== undefined
      ? diag.file.getLineAndCharacterOfPosition(diag.start)
      : { line: 0, character: 0 };
    const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
    const isError = diag.code !== 6133 && diag.code !== 6192 && diag.code !== 6196 && diag.category === ts.DiagnosticCategory.Error;
    return {
      file,
      line: line + 1,
      character: character + 1,
      code: diag.code,
      type: isError ? 'ERROR' : 'WARNING',
      message,
    };
  });

  // Group by files
  const fileGroups: Record<string, typeof items> = {};
  items.forEach((item) => {
    fileGroups[item.file] = fileGroups[item.file] || [];
    fileGroups[item.file].push(item);
  });

  fs.writeFileSync(path.join(process.cwd(), 'scripts/diagnostics_report.json'), JSON.stringify({
    total: items.length,
    errors: items.filter((i) => i.type === 'ERROR'),
    warnings: items.filter((i) => i.type === 'WARNING'),
    byFile: fileGroups,
  }, null, 2));

  console.log(`Saved report to scripts/diagnostics_report.json: ${items.length} total diagnostics (${items.filter((i) => i.type === 'ERROR').length} errors, ${items.filter((i) => i.type === 'WARNING').length} warnings) across ${Object.keys(fileGroups).length} files.`);
}

runDiagnostics();
