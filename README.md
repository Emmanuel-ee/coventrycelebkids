# Coventry Celeb Kids — Sign In / Sign Out

A simple web app for a children’s class to:

- **Register a child** on their first visit
- **Sign in** at drop-off
- **Sign out** at pick-up
- **Export CSV** (Admin) for record keeping

## What it stores (important)

This app currently stores data in the browser using **localStorage**.

- Great for a quick setup.
- Data is **device-specific** (e.g., the iPad at the door).
- Clearing browser storage clears the data.

If you later want shared data across multiple devices, we can add a backend (Firebase / Supabase / etc.).

## Run locally

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow that builds and deploys to Pages on every push to `main`.

1. In GitHub, go to **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Make sure Pages is **Enabled** for this repo (if it’s disabled, deploy can fail with a 404 “Failed to create deployment”)
4. Push to `main` (or re-run the workflow)

After the first deploy, your site should be available at:

`https://<your-github-username>.github.io/coventrycelebkids/`

## QR code (for parents)

Scan to open the sign in/out site:

[![Open the Children’s Class Sign In/Out site](public/qr-coventrycelebkids.png)](https://emmanuel-ee.github.io/coventrycelebkids/)

Direct link: https://emmanuel-ee.github.io/coventrycelebkids/

## Usage tips

- Register first-time children using **First-time registration**.
- Use **Sign in** for drop-off and **Sign out** for pick-up.
