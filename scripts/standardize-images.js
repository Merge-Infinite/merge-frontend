#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to standardize image filenames:
 * - Remove spaces and replace with hyphens
 * - Convert to lowercase
 * - Organize into proper folder structure
 */

const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];

function standardizeFilename(filename) {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);

  // Remove spaces, convert to lowercase, replace special chars with hyphens
  const standardized = name
    .toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/[^a-z0-9-_]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens

  return standardized + ext.toLowerCase();
}

function findImagesRecursive(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findImagesRecursive(filePath, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

function renameImagesWithSpaces(projectRoot, dryRun = true) {
  const imageFiles = findImagesRecursive(projectRoot);
  const renameMap = [];

  console.log(`Found ${imageFiles.length} image files\n`);

  imageFiles.forEach(filePath => {
    const dir = path.dirname(filePath);
    const filename = path.basename(filePath);
    const standardizedName = standardizeFilename(filename);

    if (filename !== standardizedName) {
      const newPath = path.join(dir, standardizedName);

      renameMap.push({
        oldPath: filePath,
        newPath: newPath,
        oldName: filename,
        newName: standardizedName,
        relativeOld: path.relative(projectRoot, filePath),
        relativeNew: path.relative(projectRoot, newPath)
      });
    }
  });

  if (renameMap.length === 0) {
    console.log('✅ All image filenames are already standardized!');
    return;
  }

  console.log(`Found ${renameMap.length} files that need renaming:\n`);

  renameMap.forEach((item, index) => {
    console.log(`${index + 1}. ${item.relativeOld}`);
    console.log(`   → ${item.relativeNew}\n`);
  });

  if (dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No files were renamed');
    console.log('Run with --execute flag to perform the actual renaming');
    console.log('\nCommand: node scripts/standardize-images.js --execute\n');
    return renameMap;
  }

  // Perform actual renaming
  let successCount = 0;
  let errorCount = 0;

  renameMap.forEach((item) => {
    try {
      // Check if target file already exists
      if (fs.existsSync(item.newPath)) {
        console.error(`❌ Cannot rename: ${item.relativeOld}`);
        console.error(`   Target file already exists: ${item.relativeNew}\n`);
        errorCount++;
        return;
      }

      fs.renameSync(item.oldPath, item.newPath);
      console.log(`✅ Renamed: ${item.relativeOld} → ${item.newName}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error renaming ${item.relativeOld}:`, error.message);
      errorCount++;
    }
  });

  console.log(`\n✅ Successfully renamed: ${successCount} files`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} files`);
  }

  return renameMap;
}

function findCodeReferences(projectRoot, oldFilename, newFilename) {
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'];
  const references = [];

  function searchInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (line.includes(oldFilename)) {
        references.push({
          file: path.relative(projectRoot, filePath),
          line: index + 1,
          content: line.trim()
        });
      }
    });
  }

  function searchRecursive(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
          searchRecursive(filePath);
        }
      } else {
        const ext = path.extname(file);
        if (codeExtensions.includes(ext)) {
          searchInFile(filePath);
        }
      }
    });
  }

  searchRecursive(projectRoot);
  return references;
}

function generateUpdateReport(projectRoot, renameMap) {
  console.log('\n📋 CODE UPDATE REPORT\n');
  console.log('The following files may need to be updated with new image paths:\n');

  renameMap.forEach((item) => {
    const references = findCodeReferences(projectRoot, item.oldName, item.newName);

    if (references.length > 0) {
      console.log(`\n📷 ${item.oldName} → ${item.newName}`);
      console.log(`   Found ${references.length} reference(s):\n`);

      references.forEach(ref => {
        console.log(`   ${ref.file}:${ref.line}`);
        console.log(`   ${ref.content}\n`);
      });
    }
  });
}

// Main execution
const args = process.argv.slice(2);
const execute = args.includes('--execute');
const report = args.includes('--report');

const projectRoot = path.join(__dirname, '..');

console.log('🖼️  Image Standardization Script\n');
console.log(`Project: ${projectRoot}\n`);
console.log('─'.repeat(60) + '\n');

const renameMap = renameImagesWithSpaces(projectRoot, !execute);

if (report && renameMap && renameMap.length > 0) {
  generateUpdateReport(projectRoot, renameMap);
}
