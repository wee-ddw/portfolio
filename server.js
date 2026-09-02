const express = require("express");
const session = require("express-session");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { database, getSetting, setSetting, getEntries, parseEntry } = require("./db");

const app = express();
const port = Number(process.env.PORT || 3000);
const uploadDirectory = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({ dest: uploadDirectory, limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, /^image\/(jpeg|png|gif|webp|svg\+xml)$/.test(file.mimetype)) });
const adminPassword = process.env.ADMIN_PASSWORD || "ssy";
const sessionSecret = process.env.SESSION_SECRET || "development-session-secret";

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: sessionSecret, resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 8 } }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadDirectory));

const authenticated = (req, res, next) => req.session.authenticated ? next() : res.status(401).json({ error: "Authentication required" });
const normalize = (value) => String(value || "").trim();
const publicPayload = () => ({ profile: getSetting("profile", {}), projects: getEntries("project"), certifications: getEntries("certification"), education: getEntries("education"), skills: getEntries("skill"), aboutPhotos: getEntries("about_photo") });

app.get("/api/public", (_req, res) => res.json(publicPayload()));
app.post("/api/auth/login", (req, res) => {
  if (normalize(req.body.password) !== adminPassword) return res.status(401).json({ error: "Invalid password" });
  req.session.authenticated = true;
  res.json({ authenticated: true });
});
app.post("/api/auth/logout", authenticated, (req, res) => req.session.destroy(() => res.json({ authenticated: false })));
app.get("/api/auth/me", (req, res) => res.json({ authenticated: Boolean(req.session.authenticated) }));
app.get("/api/admin/content", authenticated, (_req, res) => res.json({ profile: getSetting("profile", {}), projects: getEntries("project", true), certifications: getEntries("certification", true), education: getEntries("education", true), skills: getEntries("skill", true), aboutPhotos: getEntries("about_photo", true) }));

app.patch("/api/admin/profile", authenticated, (req, res) => {
  const current = getSetting("profile", {});
  const next = { ...current, ...req.body, socials: Array.isArray(req.body.socials) ? req.body.socials : current.socials };
  setSetting("profile", next);
  res.json(next);
});

app.post("/api/admin/upload", authenticated, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "An image is required" });
  const extension = path.extname(req.file.originalname).toLowerCase() || ".bin";
  const finalName = `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${extension}`;
  const finalPath = path.join(uploadDirectory, finalName);
  fs.renameSync(req.file.path, finalPath);
  res.json({ url: `/uploads/${finalName}` });
});

const validTypes = new Set(["project", "certification", "education", "skill", "about_photo"]);
app.post("/api/admin/entries", authenticated, (req, res) => {
  const body = req.body;
  if (!validTypes.has(body.type) || !normalize(body.title)) return res.status(400).json({ error: "Entry type and title are required" });
  const result = database.prepare("INSERT INTO entries (type, title, organization, date, start_date, end_date, description, image, credential_url, badges, sort_order, published, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)").run(body.type, normalize(body.title), normalize(body.organization), normalize(body.date), normalize(body.start_date), normalize(body.end_date), normalize(body.description), normalize(body.image), normalize(body.credential_url), JSON.stringify(body.badges || []), Number(body.sort_order || 0), body.published === false ? 0 : 1);
  res.status(201).json(parseEntry(database.prepare("SELECT * FROM entries WHERE id = ?").get(result.lastInsertRowid)));
});
app.patch("/api/admin/entries/:id", authenticated, (req, res) => {
  const current = database.prepare("SELECT * FROM entries WHERE id = ?").get(req.params.id);
  if (!current) return res.status(404).json({ error: "Entry not found" });
  const body = { ...parseEntry(current), ...req.body };
  database.prepare("UPDATE entries SET title=?, organization=?, date=?, start_date=?, end_date=?, description=?, image=?, credential_url=?, badges=?, sort_order=?, published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(normalize(body.title), normalize(body.organization), normalize(body.date), normalize(body.start_date), normalize(body.end_date), normalize(body.description), normalize(body.image), normalize(body.credential_url), JSON.stringify(body.badges || []), Number(body.sort_order || 0), body.published === false ? 0 : 1, req.params.id);
  res.json(parseEntry(database.prepare("SELECT * FROM entries WHERE id = ?").get(req.params.id)));
});
app.delete("/api/admin/entries/:id", authenticated, (req, res) => {
  const entry = database.prepare("SELECT image FROM entries WHERE id = ?").get(req.params.id);
  if (!entry) return res.status(404).json({ error: "Entry not found" });
  database.prepare("DELETE FROM entries WHERE id = ?").run(req.params.id);
  if (entry.image.startsWith("/uploads/")) fs.rmSync(path.join(__dirname, entry.image.slice(1)), { force: true });
  res.status(204).end();
});

app.get("/admin", (_req, res) => res.redirect("/?view=admin"));
app.listen(port, () => console.log(`Portfolio CMS running at http://localhost:${port}`));
