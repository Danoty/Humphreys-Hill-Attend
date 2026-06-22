# Humphreys Hill Attend

**Humphreys Hill Attend** is a simple GitHub Pages-ready attendance management system for conferences, meetings, trainings, workshops, AGMs, seminars, hotel events, university events, and corporate functions.

## Features

- Create events
- Register participants
- Generate QR codes
- Print participant badges
- Scan QR codes using camera
- Manual QR check-in
- Prevent duplicate check-ins per session
- Download attendance CSV
- Download participant CSV
- Works on GitHub Pages
- Uses browser localStorage

## How to Run Locally

Open `index.html` in your browser.

## How to Host on GitHub Pages

1. Create a new GitHub repository.
2. Upload these files:
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`
3. Go to **Settings**.
4. Open **Pages**.
5. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Click **Save**.
7. GitHub will give you a live link.

## Important Note

This version stores data in the browser using localStorage. It is best for demos, small events, and single-device usage.

For a full professional multi-user system, connect it to Firebase, Supabase, MySQL, or another backend database.

## System Name

Humphreys Hill Attend

## Tagline

Smart Attendance for Every Event.
