const projectGrid = document.querySelector("#project-grid");
const certificationGrid = document.querySelector("#certification-grid");
const pageLoader = document.querySelector("#page-loader");

const hidePageLoader = () => {
    if (pageLoader) window.setTimeout(() => pageLoader.classList.add("is-hidden"), 1450);
};

window.addEventListener("load", hidePageLoader, { once: true });
if (document.readyState === "complete") hidePageLoader();

const storageKeys = {
    project: "portfolio-projects",
    certification: "portfolio-certifications"
};

const setupScrollReveal = () => {
    const revealItems = document.querySelectorAll("main > section:not(#home), .project-card, .certification-card, .skills span");
    if (!("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    revealItems.forEach((item, index) => {
        item.classList.add("scroll-reveal");
        item.style.setProperty("--reveal-delay", `${(index % 4) * 80}ms`);
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => observer.observe(item));
    const revealVisibleItems = () => {
        revealItems.forEach((item) => {
            if (item.getBoundingClientRect().top < window.innerHeight * 0.9) item.classList.add("is-visible");
        });
    };
    window.addEventListener("scroll", revealVisibleItems, { passive: true });
    revealVisibleItems();
};

const setupActiveNavigation = () => {
    const sections = [...document.querySelectorAll("main > section:not(#home)")];
    const links = [...document.querySelectorAll(".nav-links a[href^='#']")];
    const updateActiveLink = () => {
        const currentSection = sections.reduce((current, section) => {
            return section.getBoundingClientRect().top <= 110 ? section : current;
        }, null);
        links.forEach((link) => link.classList.toggle("active", currentSection && link.getAttribute("href") === `#${currentSection.id}`));
    };
    window.addEventListener("scroll", updateActiveLink, { passive: true });
    updateActiveLink();
};

const getEntries = (contentType) => JSON.parse(localStorage.getItem(storageKeys[contentType]) || "[]");
const getHiddenBuiltInProjects = () => JSON.parse(localStorage.getItem("portfolio-hidden-built-in-projects") || "[]");

const syncSharedContent = () => {
    document.querySelectorAll("#project-grid .custom-entry, #certification-grid .custom-entry").forEach((entry) => entry.remove());
    document.querySelectorAll(".built-in-project").forEach((project) => {
        project.hidden = getHiddenBuiltInProjects().includes(project.dataset.builtInId);
    });
    renderEntries("project");
    renderEntries("certification");
    renderHeroStats();
};

const formatDate = (date) => new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric"
}).format(new Date(`${date}T00:00:00`));

const createCard = (entry, contentType) => {
    const card = document.createElement("article");
    card.className = contentType === "project" ? "project-card custom-entry" : "certification-card custom-entry";

    const image = document.createElement("img");
    image.src = entry.image;
    image.alt = entry.title;
    image.className = "entry-image";

    const content = document.createElement("div");
    content.className = "entry-content";

    const date = document.createElement("time");
    date.dateTime = entry.date;
    date.textContent = formatDate(entry.date);

    const title = document.createElement("h3");
    title.textContent = entry.title;

    const description = document.createElement("p");
    description.textContent = entry.description;

    content.append(date, title, description);
    card.append(image, content);
    return card;
};

const renderEntries = (contentType) => {
    const grid = contentType === "project" ? projectGrid : certificationGrid;
    getEntries(contentType).forEach((entry) => grid.appendChild(createCard(entry, contentType)));
};

const renderHeroStats = () => {
    const visibleProjects = [...document.querySelectorAll("#project-grid .project-card")].filter((project) => !project.hidden).length;
    const certifications = document.querySelectorAll("#certification-grid .certification-card").length;
    document.querySelector("[data-stat='certifications']")?.replaceChildren(String(certifications));
    document.querySelector("[data-stat='projects']")?.replaceChildren(String(visibleProjects));
};

document.querySelectorAll(".built-in-project").forEach((project) => {
    project.hidden = getHiddenBuiltInProjects().includes(project.dataset.builtInId);
});

renderEntries("project");
renderEntries("certification");
renderHeroStats();
setupScrollReveal();
setupActiveNavigation();

window.addEventListener("storage", (event) => {
    if ([storageKeys.project, storageKeys.certification, "portfolio-hidden-built-in-projects"].includes(event.key)) syncSharedContent();
});

window.addEventListener("focus", syncSharedContent);
