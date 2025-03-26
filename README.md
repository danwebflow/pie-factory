# Pie Factory Scripts

This repository contains the JavaScript files used for the Pie Factory website.

## Development Mode

The scripts support a development mode that allows you to work with local versions of the files during development.

### How to Enable Development Mode

Add the `devMode="true"` attribute to the script tag:

```html
<script defer devMode="true" src="https://danwebflow.github.io/pie-factory/scrips/load.js"></script>
```

### How Development Mode Works

When development mode is enabled:

1. The script checks if a local development server is running at `localhost:5500`
2. If available, it loads scripts from the local server first
3. If a local script fails to load, it falls back to the remote version
4. A visual indicator appears in the bottom right corner of the page

### Setting Up Your Local Environment

1. Start a local development server at `localhost:5500` (e.g., using Live Server in VS Code)
2. Create a `/scrips/` directory in your local server root
3. Copy the scripts you want to modify to this directory:
   - `load.js` (main script)
   - `tabs.js` (tab functionality)
   - `functions.js` (utility functions)
   - `controls.js` (UI controls)
4. Make your changes to the local files
5. Refresh your page to see the changes

### Testing Development Mode

You can use the included `test-dev-mode.html` file to verify that development mode is working correctly.

## Script Dependencies

The main `load.js` script requires the following external libraries:

- jQuery
- GSAP (with Draggable and InertiaPlugin)
- Vimeo Player API

Make sure these are included in your HTML before the `load.js` script.

## File Structure

- `load.js` - Main script that loads all other scripts
- `tabs.js` - Tab functionality
- `functions.js` - Utility functions
- `controls.js` - UI controls

## Troubleshooting

If development mode is not working:

1. Check that your local server is running at `localhost:5500`
2. Verify that you have the correct files in your `/scrips/` directory
3. Check the browser console for any error messages
4. Make sure the `devMode="true"` attribute is set on the script tag# Pie Factory
