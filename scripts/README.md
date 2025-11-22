# Image Standardization Script

This script standardizes all image filenames in the project by:
- Removing spaces and replacing them with hyphens
- Converting filenames to lowercase
- Replacing special characters with hyphens
- Organizing images with consistent naming

## Usage

### Preview changes (dry-run mode)
```bash
npm run standardize:images
```

This will show you what files will be renamed without actually renaming them.

### Execute the standardization
```bash
npm run standardize:images:execute
```

This will perform the actual file renaming.

### Generate a code reference report
```bash
npm run standardize:images:report
```

This will show you where in your code the old filenames are referenced, so you can update them.

## What it does

The script:
1. Scans all image files (.png, .jpg, .jpeg, .gif, .svg, .webp, .ico) in the project
2. Identifies files with:
   - Spaces in the name
   - Uppercase letters
   - Special characters
3. Renames them to a standardized format:
   - `"My Image File.png"` → `"my-image-file.png"`
   - `"Team Logo.svg"` → `"team-logo.svg"`
   - `"Icon Copy.svg"` → `"icon-copy.svg"`

## After running

After executing the script:
1. Update any code references to the old filenames
2. Use the `--report` flag to find where old filenames are used
3. Test your application to ensure all images load correctly

## Example

```bash
# 1. Preview changes
npm run standardize:images

# 2. Execute if everything looks good
npm run standardize:images:execute

# 3. Find code references that need updating
npm run standardize:images:report
```
