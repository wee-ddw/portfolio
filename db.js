const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const database = new DatabaseSync(path.join(__dirname, "portfolio.db"));
database.exec("PRAGMA journal_mode = WAL");
database.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('project', 'certification', 'education', 'skill', 'about_photo')),
    title TEXT NOT NULL,
    organization TEXT DEFAULT '',
    date TEXT DEFAULT '',
    start_date TEXT DEFAULT '',
    end_date TEXT DEFAULT '',
    description TEXT DEFAULT '',
    image TEXT DEFAULT '',
    credential_url TEXT DEFAULT '',
    badges TEXT DEFAULT '[]',
    sort_order INTEGER DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const defaultSettings = {
  name: "JUAN MIGUEL\nWEE",
  subtitle: "COMPUTER ENGINEERING GRADUATE",
  role: "VIBECODER\nTECHNOLOGY ENTHUSIAST",
  heroDescription: "Building thoughtful hardware and software experiences with a practical engineering mindset.",
  contactDescription: "You can find me through my professional and project profiles.",
  about: "I’m a Bachelor of Science in Computer Engineering graduate at the beginning of my journey as a developer. I believe every challenge is an opportunity to learn, build, and improve. With a strong technical foundation and a curiosity for technology, I’m eager to turn ideas into practical solutions and grow into a developer whose work creates meaningful impact.",
  email: "luegimwee@gmail.com",
  phone: "09291174616",
  profileImage: "/assets/profile-image.png",
  socials: []
};

const getSetting = (key, fallback) => {
  const row = database.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? JSON.parse(row.value) : fallback;
};
const setSetting = (key, value) => database.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, JSON.stringify(value));

if (!database.prepare("SELECT 1 FROM settings WHERE key = 'profile'").get()) setSetting("profile", defaultSettings);
else {
  const currentProfile = getSetting("profile", {});
  setSetting("profile", {
    ...defaultSettings,
    ...currentProfile,
    name: currentProfile.name === "Juan Miguel Wee" ? defaultSettings.name : (currentProfile.name || defaultSettings.name),
    subtitle: currentProfile.subtitle || defaultSettings.subtitle,
    role: currentProfile.role || defaultSettings.role,
    heroDescription: currentProfile.heroDescription || defaultSettings.heroDescription,
    contactDescription: currentProfile.contactDescription || defaultSettings.contactDescription,
    about: currentProfile.about || defaultSettings.about,
    email: currentProfile.email || defaultSettings.email,
    phone: currentProfile.phone || defaultSettings.phone,
    profileImage: currentProfile.profileImage || defaultSettings.profileImage
  });
}
const parseEntry = (entry) => ({ ...entry, badges: JSON.parse(entry.badges || "[]"), published: Boolean(entry.published) });
const getEntries = (type, includeUnpublished = false) => {
  const query = includeUnpublished ? "SELECT * FROM entries WHERE type = ? ORDER BY sort_order, id" : "SELECT * FROM entries WHERE type = ? AND published = 1 ORDER BY sort_order, id";
  return database.prepare(query).all(type).map(parseEntry);
};

module.exports = { database, getSetting, setSetting, getEntries, parseEntry };
