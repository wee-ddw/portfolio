const pageLoader = document.querySelector("#page-loader");
const photoModal = document.querySelector("#photo-modal");
const photoModalImage = document.querySelector("#photo-modal-image");
const themeToggle = document.querySelector("#theme-toggle");
const menuToggle = document.querySelector("#menu-toggle");
const nav = document.querySelector("nav");
const scrollProgress = document.querySelector("#scroll-progress");

const updateThemeToggle = () => {
    if (!themeToggle) return;
    const isLightTheme = document.documentElement.classList.contains("light-theme");
    themeToggle.setAttribute("aria-label", isLightTheme ? "Switch to dark mode" : "Switch to light mode");
    themeToggle.setAttribute("title", isLightTheme ? "Switch to dark mode" : "Switch to light mode");
    themeToggle.setAttribute("aria-pressed", String(isLightTheme));
};

themeToggle?.addEventListener("click", () => {
    const isLightTheme = document.documentElement.classList.toggle("light-theme");
    localStorage.setItem("portfolio-theme", isLightTheme ? "light" : "dark");
    updateThemeToggle();
});

updateThemeToggle();

menuToggle?.addEventListener("click", () => {
    const isOpen = nav?.classList.toggle("menu-open") || false;
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
});

document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
        nav?.classList.remove("menu-open");
        menuToggle?.setAttribute("aria-expanded", "false");
        menuToggle?.setAttribute("aria-label", "Open navigation menu");
    });
});

const updateScrollState = () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;
    scrollProgress?.style.setProperty("--scroll-progress", `${progress}%`);
    nav?.classList.toggle("is-scrolled", window.scrollY > 24);
};

window.addEventListener("scroll", updateScrollState, { passive: true });
updateScrollState();

const sectionLinks = [...document.querySelectorAll(".nav-links a")];
const sections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            sectionLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`));
        });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach((section) => sectionObserver.observe(section));
}

const openPhotoModal = (source, label) => {
    if (!photoModal || !photoModalImage) return;
    photoModalImage.src = source;
    photoModalImage.alt = label;
    photoModal.hidden = false;
    document.body.classList.add("modal-open");
};

const closePhotoModal = () => {
    if (!photoModal) return;
    photoModal.hidden = true;
    document.body.classList.remove("modal-open");
};

const aboutPhotoStack = document.querySelector("#about-photo-stack");
const aboutPhotos = [...document.querySelectorAll(".about-photo-stack img")];
let activeAboutPhoto = 0;

const showAboutPhoto = (index) => {
    activeAboutPhoto = index;
    aboutPhotos.forEach((image, photoIndex) => {
        image.classList.toggle("is-active", photoIndex === activeAboutPhoto);
        image.setAttribute("aria-hidden", String(photoIndex !== activeAboutPhoto));
    });
};

aboutPhotos.forEach((image) => {
    image.draggable = false;
    image.addEventListener("click", () => openPhotoModal(image.currentSrc || image.src, image.alt));
});

if (aboutPhotoStack && aboutPhotos.length) {
    showAboutPhoto(0);
    window.setInterval(() => showAboutPhoto((activeAboutPhoto + 1) % aboutPhotos.length), 2000);
}

document.querySelectorAll(".entry-image").forEach((image) => {
    image.addEventListener("click", () => openPhotoModal(image.currentSrc || image.src, image.alt));
});

document.querySelectorAll("[data-close-photo-modal]").forEach((element) => {
    element.addEventListener("click", closePhotoModal);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePhotoModal();
});

const certificationGrid = document.querySelector("#certification-grid");
let certificationCarouselTimer = null;

const setupCertificationCarousel = () => {
    if (!certificationGrid) return;
    certificationGrid.classList.add("is-carousel");
    certificationGrid.querySelectorAll(".carousel-clone").forEach((clone) => clone.remove());
    const certificationCards = [...certificationGrid.querySelectorAll(".certification-card")];
    const clones = certificationCards.map((card) => {
        const clone = card.cloneNode(true);
        clone.classList.add("carousel-clone");
        clone.setAttribute("aria-hidden", "true");
        clone.style.pointerEvents = "none";
        clone.querySelectorAll("img").forEach((image) => image.setAttribute("alt", ""));
        return clone;
    });
    certificationGrid.append(...clones);
    let isDragging = false;
    let didDrag = false;
    let startX = 0;
    let startScrollLeft = 0;
    let autoScrollPosition = certificationGrid.scrollLeft;

    const updateCardRotation = () => {
        const center = certificationGrid.getBoundingClientRect().left + certificationGrid.clientWidth / 2;
        certificationGrid.querySelectorAll(".certification-card").forEach((card) => {
            const cardCenter = card.getBoundingClientRect().left + card.clientWidth / 2;
            const offset = Math.max(-1, Math.min(1, (cardCenter - center) / certificationGrid.clientWidth));
            card.style.setProperty("--carousel-rotation", `${offset * -18}deg`);
            card.style.setProperty("--carousel-lift", `${Math.abs(offset) * 8}px`);
        });
    };

    certificationGrid.addEventListener("pointerdown", (event) => {
        if (event.target.closest("img")) return;
        isDragging = true;
        didDrag = false;
        startX = event.clientX;
        startScrollLeft = certificationGrid.scrollLeft;
        autoScrollPosition = startScrollLeft;
        certificationGrid.classList.add("is-dragging");
        certificationGrid.setPointerCapture(event.pointerId);
    });
    certificationGrid.addEventListener("pointermove", (event) => {
        if (!isDragging) return;
        if (Math.abs(event.clientX - startX) > 8) didDrag = true;
        certificationGrid.scrollLeft = startScrollLeft - (event.clientX - startX);
        autoScrollPosition = certificationGrid.scrollLeft;
        updateCardRotation();
    });
    const stopDragging = (event) => {
        if (!isDragging) return;
        isDragging = false;
        certificationGrid.classList.remove("is-dragging");
        if (certificationGrid.hasPointerCapture(event.pointerId)) certificationGrid.releasePointerCapture(event.pointerId);
        updateCardRotation();
        didDrag = false;
    };
    certificationGrid.addEventListener("pointerup", stopDragging);
    certificationGrid.addEventListener("pointercancel", stopDragging);
    certificationGrid.addEventListener("scroll", () => {
        if (!isDragging) autoScrollPosition = certificationGrid.scrollLeft;
        updateCardRotation();
    }, { passive: true });
    window.addEventListener("resize", updateCardRotation);

    window.clearInterval(certificationCarouselTimer);
    certificationCarouselTimer = window.setInterval(() => {
        if (isDragging) return;
        const maxScroll = certificationGrid.scrollWidth - certificationGrid.clientWidth;
        if (maxScroll <= 0) return;
        autoScrollPosition += 0.35;
        const loopWidth = clones[0]?.offsetLeft || 0;
        if (loopWidth && autoScrollPosition >= loopWidth) {
            autoScrollPosition -= loopWidth;
        } else if (autoScrollPosition <= 0) {
            autoScrollPosition = 0;
        }
        certificationGrid.scrollLeft = autoScrollPosition;
    }, 16);
    updateCardRotation();
};

setupCertificationCarousel();

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".project-card").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            const bounds = card.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            card.style.setProperty("--tilt-x", `${y * -3}deg`);
            card.style.setProperty("--tilt-y", `${x * 3}deg`);
        });
        card.addEventListener("pointerleave", () => {
            card.style.setProperty("--tilt-x", "0deg");
            card.style.setProperty("--tilt-y", "0deg");
        });
    });
}

const revealItems = document.querySelectorAll("main > section:not(#home), .project-card, .certification-card");
if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        }
    }), { threshold: 0.12 });
    revealItems.forEach((item, index) => {
        item.classList.add("scroll-reveal");
        item.style.setProperty("--reveal-delay", `${(index % 4) * 80}ms`);
        observer.observe(item);
    });

    const revealItemsAlreadyInView = () => {
        revealItems.forEach((item) => {
            const bounds = item.getBoundingClientRect();
            if (bounds.top < window.innerHeight && bounds.bottom > 0) item.classList.add("is-visible");
        });
    };
    revealItemsAlreadyInView();
}

window.addEventListener("load", () => pageLoader?.classList.add("is-hidden"), { once: true });
