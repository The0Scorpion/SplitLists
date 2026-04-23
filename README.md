# List Splitter for GitHub Pages

A static web app that splits an uploaded CSV into multiple CSV files by record count.

## Features

- Upload one CSV list
- Set records per file (default: 10000)
- Works with irregular rows and quoted CSV values
- Downloads each output file in-browser (no backend required)
- Ready for GitHub Pages hosting

## Run Locally

Open `index.html` in your browser.

## Deploy to GitHub Pages

1. Create a new GitHub repository and push the contents of this folder.
2. In GitHub, go to **Settings > Pages**.
3. Under **Build and deployment** choose:
   - **Source**: Deploy from a branch
   - **Branch**: `main` and folder `/ (root)`
4. Save and wait for deployment.
5. Your app will be available at:
   `https://<your-username>.github.io/<repo-name>/`
