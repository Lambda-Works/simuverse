const { Project } = require('ts-morph');

async function main() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
  });

  const sourceFiles = project.getSourceFiles();
  console.log(`Processing ${sourceFiles.length} files...`);
  
  let modifiedFiles = 0;

  for (const sourceFile of sourceFiles) {
    const importDeclarations = sourceFile.getImportDeclarations();
    let modified = false;

    // A simpler approach: use fixMissingImports which can also remove unused ones in some TypeScript versions
    // but the most reliable way in ts-morph for unused imports is 'organizeImports'
    sourceFile.organizeImports();
    
    // organizeImports doesn't always remove unused variables that aren't imports, but it organizes and removes unused imports
    // Sometimes it needs a save
    if (!sourceFile.isSaved()) {
      modifiedFiles++;
      await sourceFile.save();
    }
  }

  console.log(`Finished processing. Modified ${modifiedFiles} files.`);
}

main().catch(console.error);
