# Portfolio CMS

This portfolio now runs as a small Node.js CMS while preserving the existing HTML, CSS, and Three.js presentation.

## Run locally

1. Install Node.js 24 or newer.
2. Run `npm install`.
3. Set `ADMIN_PASSWORD` and `SESSION_SECRET` in the environment.
4. Run `npm start`.
5. Open `http://localhost:3000/admin` to manage content, or `http://localhost:3000` to view the site.

The first server start creates `portfolio.db` and seeds the current portfolio content. Uploaded images are stored in `uploads/`; back up both that folder and the database when deploying.

## Deployment

Deploy the folder to a Node-compatible host with persistent disk storage. Set a strong `ADMIN_PASSWORD`, a random `SESSION_SECRET`, and `NODE_ENV=production`. The public site reads published records from `/api/public`; the password-protected dashboard at `/admin` manages profile information, projects, certificates, education, skills, about photos, and uploads.