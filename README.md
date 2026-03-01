# Bayt – My jobs (front-end demo)

A static front-end replica of the "My jobs" dashboard. No build step required.

## Run locally

**Option 1 – Open in browser**  
Double-click `index.html` or drag it into your browser. Works offline.

**Option 2 – Local server (recommended)**  
From this folder in a terminal:

```bash
# If you have Node.js:
npx serve .

# Or with Python 3:
python -m http.server 8080
```

Then open: `http://localhost:3000` (serve) or `http://localhost:8080` (Python).

## Share with client (get a link)

1. **Vercel (recommended)** – Push this repo to GitHub, then connect it at [vercel.com](https://vercel.com). You get a live URL like `https://your-project.vercel.app`.
2. **Netlify Drop** – Go to [app.netlify.com/drop](https://app.netlify.com/drop), drag the project folder, and get a public URL.
3. **GitHub Pages** – Push the repo to GitHub, enable Pages for the branch, and use the generated `https://<user>.github.io/<repo>/` link.
4. **Zip** – Zip the folder and send it; the client can open `index.html` in a browser.

## Contents

- **My jobs:** `index.html` – Your applications (header, tabs, job cards, info strip)
- **Find Jobs (tag experience):** `find-jobs.html` – Tag-based job search with:
  - Filters: Industry, Skills, Seniority, Employment Type, Experience Level (multi-select + typeahead)
  - AND between categories, OR within category
  - Saved searches (stored in localStorage) with alert subscription UI
  - Keyword search and “Recommended for you” section
- `styles.css` / `find-jobs.css` – Layout and styling
- `script.js` / `find-jobs.js` – Interactivity; `find-jobs-data.js` – Mock tags and jobs

No dependencies to install; Font Awesome is loaded from a CDN for icons.
