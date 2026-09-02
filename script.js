const pageLoader = document.querySelector("#page-loader");
const isAdminView = new URLSearchParams(window.location.search).get("view") === "admin";
let isAdminMode = false;
let aboutPhotoEntries = [];
let visibleProjectCount = 3;
let certificationCarouselTimer = null;

const formatDate = (date) => date ? new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${date}T00:00:00`)) : "";
const escapeUrl = (url) => String(url || "").replace(/"/g, "%22");

/*
const hiddenBuiltInProjectsKey = "portfolio-hidden-built-in-projects";
const aboutPhotosKey = "portfolio-about-photos";
const ePortfolioImageMigrationKey = "portfolio-e-portfolio-dsa-image-updated";
const defaultAboutPhotos = [
	"assets/aboutme/20260318_074443.jpeg",
	"assets/aboutme/20260422_090819_459.jpeg",
	"assets/aboutme/20260513_172033.jpeg",
	"assets/aboutme/FB_IMG_1722431886016.jpeg"
];

const hidePageLoader = () => {
	if (pageLoader) window.setTimeout(() => pageLoader.classList.add("is-hidden"), 1450);
};

window.addEventListener("load", hidePageLoader, { once: true });
if (document.readyState === "complete") hidePageLoader();

const syncSharedContent = () => {
	renderEntries("project");
	renderEntries("certification");
	renderEntries("education");
	renderBuiltInProjects();
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

const updateEPortfolioImage = () => {
	if (localStorage.getItem(ePortfolioImageMigrationKey)) return;
	const projects = getEntries("project");
	const ePortfolio = projects.find((project) => project.title?.trim().toLowerCase() === "e-portfolio");
	if (!ePortfolio) return;
	ePortfolio.image = "assets/workexp/dsa.png";
	localStorage.setItem(storageKeys.project, JSON.stringify(projects));
	localStorage.setItem(ePortfolioImageMigrationKey, "true");
};

const getHiddenBuiltInProjects = () => JSON.parse(localStorage.getItem(hiddenBuiltInProjectsKey) || "[]");

const getAboutPhotos = () => {
	const savedPhotos = JSON.parse(localStorage.getItem(aboutPhotosKey) || "[]");
	return savedPhotos.length ? savedPhotos : defaultAboutPhotos;
};

const saveAboutPhotos = (photos) => {
	localStorage.setItem(aboutPhotosKey, JSON.stringify(photos));
	renderAboutPhotos();
};

const setupCertificationCarousel = () => {
	if (!certificationGrid) return;
	let isDragging = false;
	let didDrag = false;
	let activeCard = null;
	let startX = 0;
	let startScrollLeft = 0;
	const updateCardRotation = () => {
		const gridCenter = certificationGrid.getBoundingClientRect().left + certificationGrid.clientWidth / 2;
		certificationGrid.querySelectorAll(".certification-card").forEach((card) => {
			const cardCenter = card.getBoundingClientRect().left + card.clientWidth / 2;
			const offset = Math.max(-1, Math.min(1, (cardCenter - gridCenter) / certificationGrid.clientWidth));
			card.style.setProperty("--carousel-rotation", `${offset * -18}deg`);
			card.style.setProperty("--carousel-lift", `${Math.abs(offset) * 8}px`);
		});
	};
	certificationGrid.addEventListener("pointerdown", (event) => {
		if (event.target.closest("button")) return;
		activeCard = event.target.closest(".certification-card");
		isDragging = true;
		didDrag = false;
		startX = event.clientX;
		startScrollLeft = certificationGrid.scrollLeft;
		certificationGrid.classList.add("is-dragging");
		certificationGrid.setPointerCapture(event.pointerId);
	});
	certificationGrid.addEventListener("pointermove", (event) => {
		if (!isDragging) return;
		if (Math.abs(event.clientX - startX) > 8) didDrag = true;
		certificationGrid.scrollLeft = startScrollLeft - (event.clientX - startX);
		updateCardRotation();
	});
	const stopDragging = (event) => {
		if (!isDragging) return;
		isDragging = false;
		certificationGrid.classList.remove("is-dragging");
		if (certificationGrid.hasPointerCapture(event.pointerId)) certificationGrid.releasePointerCapture(event.pointerId);
		updateCardRotation();
		if (event.type === "pointerup" && !didDrag && activeCard) {
			const image = activeCard.querySelector(".entry-image");
			if (image?.src) openPhotoModal(image.src);
		}
		didDrag = false;
		activeCard = null;
	};
	certificationGrid.addEventListener("pointerup", stopDragging);
	certificationGrid.addEventListener("pointercancel", stopDragging);
	certificationGrid.addEventListener("scroll", updateCardRotation, { passive: true });
	window.addEventListener("resize", updateCardRotation);
	const autoMove = () => {
		const loopStart = certificationGrid.querySelector(".carousel-clone")?.offsetLeft || 0;
		const maxScroll = certificationGrid.scrollWidth - certificationGrid.clientWidth;
		if (!isDragging && maxScroll > 0) {
			certificationGrid.scrollLeft += 1;
			if (loopStart && certificationGrid.scrollLeft >= loopStart) certificationGrid.scrollLeft -= loopStart;
		}
	};
	window.setInterval(autoMove, 16);
	updateCardRotation();
};

const openPhotoModal = (source) => {
	if (!photoModal || !photoModalImage) return;
	photoModalImage.src = source;
	photoModal.removeAttribute("hidden");
	photoModal.style.display = "grid";
*/
const openFullImage = (source, label = "Enlarged certificate image") => {
	const modal = document.querySelector("#photo-modal");
	const modalImage = document.querySelector("#photo-modal-image");
	if (!modal || !modalImage || !source) return;
	modalImage.src = source;
	modalImage.alt = label;
	modal.hidden = false;
	modal.style.display = "grid";
	document.body.classList.add("modal-open");
};

const createCard = (entry, contentType) => {
	const card = document.createElement("article");
	card.className = contentType === "certification" ? "certification-card custom-entry" : "project-card custom-entry";
	const image = document.createElement("img");
	image.src = escapeUrl(entry.image);
	image.alt = entry.title;
	image.className = "entry-image";
	const content = document.createElement("div");
	content.className = "entry-content";
	if (entry.date) {
		const date = document.createElement("time");
		date.dateTime = entry.date;
		date.textContent = formatDate(entry.date);
		content.append(date);
	}
	const title = document.createElement("h3");
	title.textContent = entry.title;
	const description = document.createElement("p");
	description.textContent = entry.description || entry.organization || "";
	content.append(title, description);
	if (contentType === "education") (entry.badges || []).forEach((badge) => {
		const honor = document.createElement("span");
		honor.className = "education-honor";
		honor.style.setProperty("--badge-color", badge.color || "#fbbf24");
		honor.textContent = `★ ${badge.label || badge}`;
		content.append(honor);
	});
	card.append(image, content);
	if (contentType === "certification") {
		card.addEventListener("click", (event) => {
			if (!event.target.closest("button")) openFullImage(image.src, `${entry.title} certificate`);
		});
	}
	if (isAdminMode) {
		const actions = document.createElement("div");
		actions.className = "entry-actions";
		const edit = document.createElement("button");
		edit.type = "button";
		edit.className = "entry-action admin-entry-edit";
		edit.textContent = "Edit";
		edit.addEventListener("click", () => window.openPortfolioUploadModal?.(contentType, entry));
		actions.append(edit);
		const remove = document.createElement("button");
		remove.type = "button";
		remove.className = "entry-action entry-action-danger";
		remove.textContent = "Delete";
		remove.addEventListener("click", () => window.confirmPortfolioDelete?.(entry));
		actions.append(remove);
		card.append(actions);
	}
	return card;
};

const renderCards = (selector, entries, contentType) => {
	const grid = document.querySelector(selector);
	if (!grid) return;
	grid.replaceChildren(...entries.map((entry) => createCard(entry, contentType)));
};

const setupCertificationCarousel = () => {
	const grid = document.querySelector("#certification-grid");
	if (!grid) return;
	window.clearInterval(certificationCarouselTimer);
	grid.classList.toggle("is-carousel", grid.children.length > 1);
	if (grid.children.length < 2) return;
	certificationCarouselTimer = window.setInterval(() => {
		const maxScroll = grid.scrollWidth - grid.clientWidth;
		if (maxScroll <= 0) return;
		grid.scrollLeft = grid.scrollLeft >= maxScroll - 1 ? 0 : grid.scrollLeft + 0.65;
	}, 16);
};

const renderProjects = (projects) => {
	const visibleProjects = projects.slice(0, visibleProjectCount);
	renderCards("#project-grid", visibleProjects, "project");
	const seeMore = document.querySelector("#see-more-projects");
	if (seeMore) {
		seeMore.hidden = projects.length <= visibleProjectCount;
		seeMore.onclick = () => { visibleProjectCount += 3; renderProjects(projects); };
	}
};

const renderHeroStats = (content) => {
	document.querySelector("[data-stat='certifications']")?.replaceChildren(String(content.certifications.length));
	document.querySelector("[data-stat='projects']")?.replaceChildren(String(content.projects.length));
};

const renderAboutPhotos = (photos) => {
	const stack = document.querySelector("#about-photo-stack");
	if (!stack) return;
	aboutPhotoEntries = photos;
	stack.classList.toggle("has-photos", photos.length > 0);
	stack.replaceChildren(...photos.slice(0, 2).map((photo, index) => {
		const image = document.createElement("img");
		image.src = escapeUrl(photo.image);
		image.alt = photo.title || `About me photo ${index + 1}`;
		image.loading = "lazy";
		image.className = index === 0 ? "about-photo-back" : "about-photo-front";
		image.addEventListener("click", () => {
			const modal = document.querySelector("#photo-modal");
			const modalImage = document.querySelector("#photo-modal-image");
			if (modal && modalImage) openFullImage(image.src, image.alt);
		});
		return image;
	}));
};

const renderSkills = (skills) => {
	const set = document.querySelector(".skills-set");
	const track = set?.parentElement;
	if (!set || !track) return;
	track.querySelectorAll(".skills-set[aria-hidden='true']").forEach((duplicate) => duplicate.remove());
	set.replaceChildren(...skills.map((skill) => {
		const item = document.createElement("div");
		item.className = "skill-icon";
		const image = document.createElement("img");
		image.src = escapeUrl(skill.image);
		image.alt = skill.title;
		item.append(image);
		if (isAdminMode) {
			const actions = document.createElement("div");
			actions.className = "skill-entry-actions";
			const edit = document.createElement("button");
			edit.type = "button";
			edit.className = "entry-action";
			edit.textContent = "Edit";
			edit.addEventListener("click", () => window.openPortfolioUploadModal?.("skill", skill));
			const remove = document.createElement("button");
			remove.type = "button";
			remove.className = "entry-action entry-action-danger";
			remove.textContent = "Delete";
			remove.addEventListener("click", () => window.confirmPortfolioDelete?.(skill));
			actions.append(edit, remove);
			item.append(actions);
		}
		return item;
	}));
	track.style.setProperty("--skills-duration", `${Math.max(16, skills.length * 4.5)}s`);
	track.classList.toggle("has-carousel", skills.length > 1);
	if (skills.length > 1) {
		const duplicate = set.cloneNode(true);
		duplicate.setAttribute("aria-hidden", "true");
		track.append(duplicate);
	}
};

const renderProfile = (profile) => {
	document.querySelectorAll("[data-profile]").forEach((element) => {
		const value = profile[element.dataset.profile];
		if (value !== undefined) {
			element.textContent = value;
			element.style.whiteSpace = "pre-line";
		}
	});
	const heroName = document.querySelector(".hero-name");
	if (heroName) heroName.textContent = profile.name.replace(/\n/g, " ").toUpperCase();
	const heroHeading = document.querySelector(".hero h1[data-profile='name']");
	if (heroHeading) {
		const nameParts = profile.name.replace(/\n/g, " ").trim().toUpperCase().split(/\s+/);
		const firstLine = document.createElement("span");
		firstLine.textContent = nameParts.slice(0, -1).join(" ");
		firstLine.style.whiteSpace = "nowrap";
		heroHeading.replaceChildren(firstLine, document.createElement("br"), document.createTextNode(nameParts.at(-1) || ""));
	}
	const portrait = document.querySelector(".hero-portrait img");
	if (portrait && profile.profileImage) portrait.src = profile.profileImage;
	const email = document.querySelector(".contact-details a[href^='mailto:']");
	if (email) { email.href = `mailto:${profile.email}`; email.textContent = profile.email; }
	const phone = document.querySelector(".contact-details a[href^='tel:']");
	if (phone) { phone.href = `tel:${profile.phone}`; phone.textContent = profile.phone; }
	if (profile.socials) document.querySelectorAll(".social-links a").forEach((link, index) => {
		const social = profile.socials[index];
		if (social) { link.href = social.url || "#"; link.textContent = social.shortLabel; link.setAttribute("aria-label", social.label); }
	});
};

const setupInteractions = () => {
	document.querySelectorAll("[data-close-photo-modal]").forEach((element) => element.addEventListener("click", () => {
		const modal = document.querySelector("#photo-modal");
		if (modal) { modal.hidden = true; modal.style.removeProperty("display"); }
	}));
	const themeToggle = document.querySelector("#theme-toggle");
	themeToggle?.addEventListener("click", () => {
		const light = document.documentElement.classList.toggle("light-theme");
		localStorage.setItem("portfolio-theme", light ? "light" : "dark");
	});
	const accessModal = document.querySelector("#access-modal");
	const adminLogin = document.querySelector("#access-login-form");
	document.querySelector("#open-admin-login")?.addEventListener("click", () => {
		document.querySelector(".access-choices").hidden = true;
		adminLogin.hidden = false;
		document.querySelector("#access-password")?.focus();
	});
	adminLogin?.addEventListener("submit", async (event) => {
		event.preventDefault();
		const warning = document.querySelector("#access-warning");
		try {
			const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: document.querySelector("#access-password").value }) });
			if (!response.ok) throw new Error("Wrong password. Please try again.");
			window.location.href = "/?view=admin";
		} catch (error) { warning.textContent = error.message; }
	});
	if (accessModal && !new URLSearchParams(window.location.search).has("view")) {
		window.setTimeout(() => { accessModal.hidden = false; document.body.classList.add("modal-open"); }, 250);
	}
	const uploadModal = document.querySelector("#section-upload-modal");
	const uploadForm = document.querySelector("#section-upload-form");
	const uploadFields = document.querySelector("#section-upload-fields");
	const uploadTitle = document.querySelector("#section-upload-title");
	const uploadRequirements = document.querySelector("#section-upload-requirements");
	const deleteModal = document.querySelector("#delete-confirm-modal");
	const deleteMessage = document.querySelector("#delete-message");
	const confirmDelete = document.querySelector("#confirm-entry-delete");
	const sectionLabels = { project: "project", certification: "certificate", education: "school", skill: "technology", about_photo: "about photo" };
	const sectionRequirements = {
		project: "Required: project title, date, description, and image.",
		certification: "Required: certificate name, issuing organization, date, description, and certificate image. Credential URL is optional.",
		education: "Required: school name, degree or program, dates, description, and school image.",
		skill: "Required: technology image only. The filename will identify it.",
		about_photo: "Required: photo image only. A title is optional."
	};
	const input = (label, name, type = "text", required = false) => `<label class="upload-field">${label}${required ? ' <span class="required-mark">*</span>' : ""}<span class="date-picker-field"><input name="${name}" type="${type}" ${required ? "required" : ""}>${type === "date" ? '<button type="button" class="calendar-picker" aria-label="Open calendar">▣</button>' : ""}</span></label>`;
	let editingEntry = null;
	let editingBadges = [];
	const openUploadModal = (contentType, entry = null) => {
		if (!uploadModal || !uploadForm) return;
		editingEntry = entry;
		uploadForm.dataset.contentType = contentType;
		uploadForm.dataset.entryId = entry?.id || "";
		uploadTitle.textContent = `${entry ? "Edit" : "Add"} ${sectionLabels[contentType]}`;
		uploadRequirements.textContent = sectionRequirements[contentType];
		let fields = contentType === "skill" || contentType === "about_photo" ? "" : input(contentType === "education" ? "School name" : contentType === "certification" ? "Certificate name" : "Project title", "title", "text", true);
		if (contentType === "certification") fields += input("Issuing organization", "organization", "text", true) + input("Date issued", "date", "date", true) + input("Description", "description", "text", true) + input("Credential URL", "credential_url", "url");
		if (contentType === "education") fields += input("Degree / program", "degree", "text", true) + input("Start date", "start_date", "date", true) + input("End date", "end_date", "date", true) + input("Description", "description", "text", true);
		if (contentType === "project") fields += input("Date", "date", "date", true) + input("Description", "description", "text", true);
		fields += `<label class="upload-field">${contentType === "about_photo" || contentType === "skill" ? "Image" : "Upload image"}${entry ? "" : ' <span class="required-mark">*</span>'}<input name="file" type="file" accept="image/*" ${entry ? "" : "required"}></label>`;
		if (contentType === "education") fields += `<div class="badge-editor"><strong>Education badges</strong><div class="badge-entry-row"><input id="education-badge-label" type="text" placeholder="e.g. Cum Laude"><input id="education-badge-color" type="color" value="#fbbf24"><button type="button" id="add-education-badge">Add badge</button></div><div id="education-badge-list"></div></div>`;
		uploadFields.innerHTML = fields;
		uploadFields.querySelectorAll(".calendar-picker").forEach((button) => button.addEventListener("click", () => { const dateInput = button.previousElementSibling; if (typeof dateInput.showPicker === "function") dateInput.showPicker(); else dateInput.focus(); }));
		editingBadges = (entry?.badges || []).map((badge) => typeof badge === "string" ? { label: badge, color: "#fbbf24" } : { label: badge.label, color: badge.color || "#fbbf24" });
		const badgeList = uploadFields.querySelector("#education-badge-list");
		const renderBadges = () => { if (badgeList) badgeList.innerHTML = editingBadges.map((badge, index) => `<span class="badge-editor-item" style="--badge-color:${badge.color}">${badge.label}<button type="button" data-remove-badge="${index}" aria-label="Remove ${badge.label}">×</button></span>`).join(""); };
		uploadFields.querySelector("#add-education-badge")?.addEventListener("click", () => { const label = uploadFields.querySelector("#education-badge-label").value.trim(); if (!label) return; editingBadges.push({ label, color: uploadFields.querySelector("#education-badge-color").value }); uploadFields.querySelector("#education-badge-label").value = ""; renderBadges(); });
		badgeList?.addEventListener("click", (event) => { const remove = event.target.closest("[data-remove-badge]"); if (remove) { editingBadges.splice(Number(remove.dataset.removeBadge), 1); renderBadges(); } });
		renderBadges();
		if (entry) ["title", "organization", "date", "start_date", "end_date", "description", "degree", "credential_url"].forEach((name) => { const field = uploadFields.querySelector(`[name="${name}"]`); if (field) field.value = name === "degree" ? entry.description || "" : entry[name] || ""; });
		uploadModal.hidden = false;
		uploadModal.style.display = "grid";
		document.body.classList.add("modal-open");
		uploadFields.querySelector("input")?.focus();
	};
	window.openPortfolioUploadModal = openUploadModal;
	const closeUploadModal = () => { if (uploadModal) { uploadModal.hidden = true; uploadModal.style.removeProperty("display"); document.body.classList.remove("modal-open"); } };
	document.querySelector("#edit-about-photo")?.addEventListener("click", () => { const photo = aboutPhotoEntries[0]; if (photo) openUploadModal("about_photo", photo); });
	document.querySelector("#remove-about-photo")?.addEventListener("click", () => { const photo = aboutPhotoEntries[0]; if (photo) window.confirmPortfolioDelete?.(photo); });
	document.querySelectorAll(".admin-only").forEach((button) => button.addEventListener("click", () => { if (isAdminMode) openUploadModal(button.dataset.contentType); }));
	document.querySelectorAll("[data-close-upload-modal]").forEach((element) => element.addEventListener("click", closeUploadModal));
	uploadForm?.addEventListener("submit", async (event) => {
		event.preventDefault();
		const formData = new FormData(uploadForm);
		const contentType = uploadForm.dataset.contentType;
		const file = formData.get("file");
		try {
			let imageUrl = editingEntry?.image || "";
			if (file && file.size) {
				const imageData = new FormData();
				imageData.append("file", file);
				const uploadResponse = await fetch("/api/admin/upload", { method: "POST", body: imageData });
				if (!uploadResponse.ok) throw new Error("Image upload failed.");
				imageUrl = (await uploadResponse.json()).url;
			}
			const body = { type: contentType, title: formData.get("title") || (editingEntry?.title || (file ? file.name.replace(/\.[^.]+$/, "") : "Uploaded item")), organization: formData.get("organization"), date: formData.get("date"), start_date: formData.get("start_date"), end_date: formData.get("end_date"), description: formData.get("description") || formData.get("degree"), credential_url: formData.get("credential_url"), badges: editingBadges, image: imageUrl, published: true, sort_order: editingEntry?.sort_order || 0 };
			const saveResponse = await fetch(editingEntry ? `/api/admin/entries/${editingEntry.id}` : "/api/admin/entries", { method: editingEntry ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
			if (!saveResponse.ok) throw new Error("Could not save content.");
			closeUploadModal();
			window.location.reload();
		} catch (error) { uploadRequirements.textContent = error.message; }
	});
	let pendingDelete = null;
	window.confirmPortfolioDelete = (entry) => { pendingDelete = entry; deleteMessage.textContent = `"${entry.title}" will be removed from your portfolio.`; deleteModal.hidden = false; deleteModal.style.display = "grid"; document.body.classList.add("modal-open"); };
	const closeDeleteModal = () => { pendingDelete = null; deleteModal.hidden = true; deleteModal.style.removeProperty("display"); document.body.classList.remove("modal-open"); };
	document.querySelectorAll("[data-close-delete-modal]").forEach((element) => element.addEventListener("click", closeDeleteModal));
	confirmDelete?.addEventListener("click", async () => { if (!pendingDelete) return; try { const response = await fetch(`/api/admin/entries/${pendingDelete.id}`, { method: "DELETE" }); if (!response.ok) throw new Error("Could not delete entry."); closeDeleteModal(); window.location.reload(); } catch (error) { deleteMessage.textContent = error.message; } });
};

const setupScrollReveal = () => {
	const items = document.querySelectorAll("main > section:not(#home), .project-card, .certification-card, .skills span");
	if (!("IntersectionObserver" in window)) { items.forEach((item) => item.classList.add("is-visible")); return; }
	const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
		if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
	}), { threshold: 0.12 });
	items.forEach((item, index) => { item.classList.add("scroll-reveal"); item.style.setProperty("--reveal-delay", `${(index % 4) * 80}ms`); observer.observe(item); });
};


const accessCheck = isAdminView ? fetch("/api/auth/me").then((response) => response.json()) : Promise.resolve({ authenticated: false });
accessCheck.then((auth) => {
	if (isAdminView && !auth.authenticated) { window.location.href = "/"; return null; }
	isAdminMode = Boolean(auth.authenticated && isAdminView);
	if (isAdminMode) document.querySelectorAll(".admin-only").forEach((element) => element.classList.add("is-admin-visible"));
	return fetch("/api/public");
})
	.then((response) => { if (!response) return null; if (!response.ok) throw new Error("Portfolio content unavailable"); return response.json(); })
	.then((content) => {
		if (!content) return;
		renderProfile(content.profile);
		renderHeroStats(content);
		renderProjects(content.projects);
		renderCards("#certification-grid", content.certifications, "certification");
		setupCertificationCarousel();
		renderCards("#education-grid", content.education, "education");
		renderAboutPhotos(content.aboutPhotos);
		renderSkills(content.skills);
		if (!isAdminMode) document.querySelectorAll("main .add-button, main .entry-actions, main .about-photo-controls, #entry-modal, #confirm-modal").forEach((element) => element.remove());
		setupInteractions();
		setupScrollReveal();
	})
	.catch((error) => console.error(error));

window.addEventListener("load", () => pageLoader?.classList.add("is-hidden"), { once: true });
