const projectGrid = document.querySelector("#project-grid");
const seeMoreProjectsButton = document.querySelector("#see-more-projects");
const educationGrid = document.querySelector("#education-grid");
const pageLoader = document.querySelector("#page-loader");
const certificationGrid = document.querySelector("#certification-grid");
const modal = document.querySelector("#entry-modal");
const confirmModal = document.querySelector("#confirm-modal");
const form = document.querySelector("#entry-form");
const formTitle = document.querySelector("#form-title");
const formEyebrow = document.querySelector("#form-eyebrow");
const dateInput = document.querySelector("#entry-date");
const calendarButton = document.querySelector("#calendar-button");
const imageInput = document.querySelector("#entry-image");
const imageNote = document.querySelector("#image-note");
const formSubmit = document.querySelector("#form-submit");
const entryTitleLabel = document.querySelector("#entry-title-label");
const entryDateLabel = document.querySelector("#entry-date-label");
const entryDescriptionLabel = document.querySelector("#entry-description-label");
const entryImageLabel = document.querySelector("#entry-image-label");
const educationBadgesField = document.querySelector("#education-badges-field");
const educationBadgeInput = document.querySelector("#education-badge-input");
const addEducationBadgeButton = document.querySelector("#add-education-badge");
const badgeEditorList = document.querySelector("#badge-editor-list");
const confirmTitle = document.querySelector("#confirm-title");
const confirmMessage = document.querySelector("#confirm-message");
const confirmDeleteButton = document.querySelector("#confirm-delete");
const cancelDeleteButton = document.querySelector("#cancel-delete");
const aboutPhotoStack = document.querySelector("#about-photo-stack");
const aboutPhotoInput = document.querySelector("#about-photo-input");
const replaceAboutPhotoInput = document.querySelector("#replace-about-photo-input");
const editAboutPhotoButton = document.querySelector("#edit-about-photo");
const removeAboutPhotoButton = document.querySelector("#remove-about-photo");
const photoModal = document.querySelector("#photo-modal");
const photoModalImage = document.querySelector("#photo-modal-image");
const isVisitorMode = document.documentElement.classList.contains("visitor-mode");

if (isVisitorMode) {
	document.title = "Portfolio | Visitor View";
	const visitorBadge = document.querySelector(".visitor-badge");
	if (visitorBadge) visitorBadge.hidden = false;
}

let activeContentType = "project";
let editingEntryIndex = null;
let pendingDelete = null;
let selectedAboutPhotoIndex = 0;
let activeEducationBadges = [];
let visibleProjectCount = 3;

const storageKeys = {
	project: "portfolio-projects",
	certification: "portfolio-certifications",
	education: "portfolio-education"
};

const hiddenBuiltInProjectsKey = "portfolio-hidden-built-in-projects";
const aboutPhotosKey = "portfolio-about-photos";
const ePortfolioImageMigrationKey = "portfolio-e-portfolio-dsa-image-updated";
const defaultAboutPhotos = [
	"assets/aboutme/20260318_074443.jpg",
	"assets/aboutme/20260422_090819_459.jpg",
	"assets/aboutme/20260513_172033.jpg",
	"assets/aboutme/FB_IMG_1722431886016.jpg"
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
	document.body.classList.add("modal-open");
};

const closePhotoModal = () => {
	if (!photoModal) return;
	photoModal.setAttribute("hidden", "");
	photoModal.style.removeProperty("display");
	document.body.classList.remove("modal-open");
};

const cycleAboutPhotos = () => {
	const [topPhoto, ...remainingPhotos] = getAboutPhotos();
	if (!topPhoto) return;
	selectedAboutPhotoIndex = 0;
	saveAboutPhotos([...remainingPhotos, topPhoto]);
};

const renderAboutPhotos = () => {
	if (!aboutPhotoStack) return;
	const photos = getAboutPhotos().slice(0, 4);
	aboutPhotoStack.replaceChildren();
	aboutPhotoStack.classList.toggle("has-photos", photos.length > 0);
	if (editAboutPhotoButton) editAboutPhotoButton.disabled = !photos.length;
	if (removeAboutPhotoButton) removeAboutPhotoButton.disabled = !photos.length;
	const rotations = [-7, 6, -3, 4];
	photos.reverse().forEach((source, index) => {
		const photoIndex = photos.length - 1 - index;
		const image = document.createElement("img");
		image.src = source;
		image.alt = `About me photo ${photos.length - index}`;
		image.draggable = false;
		image.tabIndex = 0;
		image.setAttribute("role", "button");
		image.setAttribute("aria-label", "View enlarged photo");
		image.style.setProperty("--photo-rotation", `${rotations[index]}deg`);
		image.style.setProperty("--photo-x", `${index * 9}px`);
		image.style.setProperty("--photo-y", `${index * 5}px`);
		image.style.setProperty("--photo-delay", `${index * 60}ms`);
		image.style.zIndex = index + 1;
		if (photoIndex === 0) {
			let startX = 0;
			let startY = 0;
			let isDragging = false;
			image.addEventListener("pointerdown", (event) => {
				event.preventDefault();
				startX = event.clientX;
				startY = event.clientY;
				isDragging = true;
				image.classList.add("is-dragging");
				image.setPointerCapture(event.pointerId);
			});
			image.addEventListener("pointermove", (event) => {
				if (!isDragging) return;
				image.style.setProperty("--photo-drag-x", `${event.clientX - startX}px`);
				image.style.setProperty("--photo-drag-y", `${(event.clientY - startY) * 0.15}px`);
			});
			image.addEventListener("pointerup", (event) => {
				if (!isDragging) return;
				const distance = event.clientX - startX;
				isDragging = false;
				image.classList.remove("is-dragging");
				image.releasePointerCapture(event.pointerId);
				if (Math.abs(distance) > 60) cycleAboutPhotos();
				else openPhotoModal(source);
			});
			image.addEventListener("pointercancel", () => {
				isDragging = false;
				image.classList.remove("is-dragging");
				image.style.removeProperty("--photo-drag-x");
				image.style.removeProperty("--photo-drag-y");
			});
		}
		image.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				openPhotoModal(source);
			}
		});
		aboutPhotoStack.append(image);
	});
};

const renderBuiltInProjects = () => {
	const hiddenProjects = getHiddenBuiltInProjects();
	document.querySelectorAll(".built-in-project").forEach((project) => {
		project.hidden = hiddenProjects.includes(project.dataset.builtInId);
	});
};

const formatDate = (date) => new Intl.DateTimeFormat("en", {
	year: "numeric",
	month: "long",
	day: "numeric"
}).format(new Date(`${date}T00:00:00`));

const normalizeEducationBadge = (badge) => typeof badge === "string"
	? { label: badge, color: "#fbbf24" }
	: { label: badge.label, color: badge.color || "#fbbf24" };

const renderEducationBadgeEditor = () => {
	if (!badgeEditorList) return;
	badgeEditorList.replaceChildren();
	activeEducationBadges.forEach((badge, index) => {
		const item = document.createElement("span");
		item.className = "badge-editor-item";
		item.textContent = badge.label;
		const color = document.createElement("input");
		color.type = "color";
		color.className = "badge-color-input";
		color.value = badge.color;
		color.setAttribute("aria-label", `Change ${badge.label} badge color`);
		color.addEventListener("input", () => {
			activeEducationBadges[index].color = color.value;
		});
		const remove = document.createElement("button");
		remove.type = "button";
		remove.className = "badge-editor-remove";
		remove.setAttribute("aria-label", `Remove ${badge.label}`);
		remove.textContent = "×";
		remove.addEventListener("click", () => {
			activeEducationBadges.splice(index, 1);
			renderEducationBadgeEditor();
		});
		item.append(color, remove);
		badgeEditorList.append(item);
	});
};

const createCard = (entry, contentType) => {
	const card = document.createElement("article");
	card.className = contentType === "certification" ? "certification-card custom-entry" : "project-card custom-entry";
	const image = document.createElement("img");
	image.src = entry.image;
	image.alt = entry.title;
	image.className = "entry-image";
	if (contentType === "certification") image.addEventListener("click", (event) => {
		event.stopPropagation();
		openPhotoModal(entry.image);
	});

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
	if (contentType === "education") (entry.badges || ["Cum Laude"]).map(normalizeEducationBadge).forEach((badge) => {
		const honor = document.createElement("span");
		honor.className = "education-honor";
		const icon = document.createElement("span");
		icon.setAttribute("aria-hidden", "true");
		icon.textContent = "★";
		honor.style.setProperty("--badge-color", badge.color);
		honor.append(icon, document.createTextNode(badge.label));
		content.append(honor);
	});

	const actions = document.createElement("div");
	actions.className = "entry-actions";
	actions.innerHTML = `
		<button type="button" class="entry-action" data-entry-action="edit" data-content-type="${contentType}" data-entry-index="${entry.index}">Edit</button>
		<button type="button" class="entry-action entry-action-danger" data-entry-action="delete" data-content-type="${contentType}" data-entry-index="${entry.index}">Delete</button>
	`;
	card.append(image, content, actions);
	if (contentType === "certification") card.addEventListener("click", (event) => {
		if (!event.target.closest("button")) openPhotoModal(entry.image);
	});
	return card;
};

const renderEntries = (contentType) => {
	const grid = contentType === "project" ? projectGrid : contentType === "education" ? educationGrid : certificationGrid;
	const entries = getEntries(contentType)
		.map((entry, originalIndex) => ({ ...entry, originalIndex }))
		.sort((first, second) => new Date(first.date) - new Date(second.date));
	grid.querySelectorAll(".custom-entry").forEach((entry) => entry.remove());
	const displayedEntries = contentType === "project" ? entries.slice(0, visibleProjectCount) : entries;
	displayedEntries.forEach((entry) => grid.appendChild(createCard({ ...entry, index: entry.originalIndex }, contentType)));
	if (contentType === "project" && seeMoreProjectsButton) seeMoreProjectsButton.hidden = entries.length <= visibleProjectCount;
	if (contentType === "certification" && entries.length) {
		for (let copy = 0; copy < 4; copy += 1) {
			entries.forEach((entry) => {
				const duplicate = createCard({ ...entry, index: entry.originalIndex }, contentType);
				duplicate.classList.add("carousel-clone");
				duplicate.querySelector(".entry-actions")?.remove();
				duplicate.setAttribute("aria-hidden", "true");
				grid.appendChild(duplicate);
			});
		}
		grid.scrollLeft = 0;
	}
	const hasStaticEntries = Boolean(grid.querySelector(".static-entry"));
	grid.classList.toggle("is-empty", entries.length === 0 && !hasStaticEntries);
	if (contentType === "certification") {
		grid.classList.toggle("is-carousel", entries.length > 0);
		grid.dispatchEvent(new Event("scroll"));
	}
	if (contentType === "project") grid.closest("section")?.classList.toggle("is-empty-section", entries.length === 0 && !hasStaticEntries);
};

const openModal = (contentType, entryIndex = null) => {
	activeContentType = contentType;
	editingEntryIndex = entryIndex;
	const label = contentType === "project" ? "project" : contentType === "education" ? "school" : "certification";
	const isEducation = contentType === "education";
	const isEditing = entryIndex !== null;
	const entry = isEditing ? getEntries(contentType)[entryIndex] : null;
	formTitle.textContent = `${isEditing ? "Edit" : "Add"} ${label}`;
	formEyebrow.textContent = isEditing ? `EDIT ${contentType.toUpperCase()}` : `NEW ${contentType.toUpperCase()}`;
	formSubmit.textContent = isEditing ? "Save changes" : "Post entry";
	form.reset();
	entryTitleLabel.textContent = isEducation ? "School name" : "Title";
	entryTitleLabel.htmlFor = "entry-title";
	document.querySelector("#entry-title").placeholder = isEducation ? "e.g. University of Example" : "e.g. Smart Home Monitor";
	entryDateLabel.textContent = isEducation ? "Graduation date" : "Completion date";
	entryDescriptionLabel.textContent = isEducation ? "Program or details" : "Description";
	entryImageLabel.textContent = isEducation ? "School image" : "Image";
	educationBadgesField.hidden = !isEducation;
	activeEducationBadges = isEducation && entry ? (entry.badges || ["Cum Laude"]).map(normalizeEducationBadge) : [];
	educationBadgeInput.value = "";
	renderEducationBadgeEditor();
	imageInput.required = !isEditing;
	imageNote.textContent = isEditing ? "Choose a new image only if you want to replace the current one." : "Images are saved in this browser for this portfolio.";
	if (entry) {
		document.querySelector("#entry-title").value = entry.title;
		dateInput.value = entry.date;
		document.querySelector("#entry-description").value = entry.description;
	}
	modal.hidden = false;
	document.body.classList.add("modal-open");
	document.querySelector("#entry-title").focus();
};

const deleteEntry = (contentType, entryIndex) => {
	const entries = getEntries(contentType);
	entries.splice(entryIndex, 1);
	localStorage.setItem(storageKeys[contentType], JSON.stringify(entries));
	renderEntries(contentType);
};

const closeModal = () => {
	modal.hidden = true;
	document.body.classList.remove("modal-open");
};

const closeConfirmModal = () => {
	confirmModal.hidden = true;
	pendingDelete = null;
	if (modal.hidden) document.body.classList.remove("modal-open");
};

const openDeleteConfirmation = (contentType, entryIndex) => {
	const entry = getEntries(contentType)[entryIndex];
	if (!entry) return;
	pendingDelete = { contentType, entryIndex };
	confirmTitle.textContent = `Delete ${contentType}?`;
	confirmMessage.textContent = `"${entry.title}" will be removed from your portfolio.`;
	confirmModal.hidden = false;
	document.body.classList.add("modal-open");
	confirmDeleteButton.focus();
};

if (!isVisitorMode) {
	document.querySelectorAll("[data-content-type]").forEach((button) => {
		button.addEventListener("click", () => openModal(button.dataset.contentType));
	});
}

document.querySelectorAll("[data-close-modal]").forEach((element) => {
	element.addEventListener("click", closeModal);
});

document.querySelectorAll("[data-close-confirm]").forEach((element) => {
	element.addEventListener("click", closeConfirmModal);
});

document.querySelectorAll("[data-close-photo-modal]").forEach((element) => {
	element.addEventListener("click", closePhotoModal);
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && photoModal && !photoModal.hidden) closePhotoModal();
});

if (!isVisitorMode) document.addEventListener("click", (event) => {
	const builtInDelete = event.target.closest("[data-built-in-delete]");
	if (builtInDelete) {
		const projectId = builtInDelete.dataset.builtInDelete;
		const project = builtInDelete.closest(".built-in-project");
		pendingDelete = {
			contentType: "built-in-project",
			entryIndex: projectId,
			entryTitle: project.querySelector("h3").textContent
		};
		confirmTitle.textContent = "Delete project?";
		confirmMessage.textContent = `"${pendingDelete.entryTitle}" will be removed from your portfolio.`;
		confirmModal.hidden = false;
		document.body.classList.add("modal-open");
		confirmDeleteButton.focus();
		return;
	}

	const action = event.target.closest("[data-entry-action]");
	if (!action) return;

	const contentType = action.dataset.contentType;
	const entryIndex = Number(action.dataset.entryIndex);
	if (action.dataset.entryAction === "edit") openModal(contentType, entryIndex);
	if (action.dataset.entryAction === "delete") openDeleteConfirmation(contentType, entryIndex);
});

if (!isVisitorMode) cancelDeleteButton.addEventListener("click", closeConfirmModal);

if (!isVisitorMode) confirmDeleteButton.addEventListener("click", () => {
	if (!pendingDelete) return;
	if (pendingDelete.contentType === "built-in-project") {
		const hiddenProjects = getHiddenBuiltInProjects();
		hiddenProjects.push(pendingDelete.entryIndex);
		localStorage.setItem(hiddenBuiltInProjectsKey, JSON.stringify(hiddenProjects));
		renderBuiltInProjects();
	} else {
		deleteEntry(pendingDelete.contentType, pendingDelete.entryIndex);
	}
	closeConfirmModal();
});

if (!isVisitorMode) calendarButton.addEventListener("click", () => {
	if (typeof dateInput.showPicker === "function") dateInput.showPicker();
	else dateInput.focus();
});

if (seeMoreProjectsButton) seeMoreProjectsButton.addEventListener("click", () => {
	visibleProjectCount += 3;
	renderEntries("project");
});

if (!isVisitorMode && addEducationBadgeButton) addEducationBadgeButton.addEventListener("click", () => {
	const badge = educationBadgeInput.value.trim();
	if (!badge || activeEducationBadges.some((item) => item.label.toLowerCase() === badge.toLowerCase())) return;
	activeEducationBadges.push({ label: badge, color: "#fbbf24" });
	educationBadgeInput.value = "";
	renderEducationBadgeEditor();
});

if (!isVisitorMode && educationBadgeInput) educationBadgeInput.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		addEducationBadgeButton.click();
	}
});

if (!isVisitorMode) document.addEventListener("keydown", (event) => {
	if (event.key !== "Escape") return;
	if (!confirmModal.hidden) closeConfirmModal();
	else if (!modal.hidden) closeModal();
});

if (!isVisitorMode) form.addEventListener("submit", (event) => {
	event.preventDefault();
	const formData = new FormData(form);
	const image = imageInput.files[0];
	const existingEntry = editingEntryIndex === null ? null : getEntries(activeContentType)[editingEntryIndex];
	if (!image && !existingEntry) return;

	const saveEntry = (imageData) => {
		const entry = {
			title: formData.get("title"),
			date: formData.get("date"),
			description: formData.get("description"),
			image: imageData
		};
		if (activeContentType === "education") entry.badges = [...activeEducationBadges];
		const entries = getEntries(activeContentType);
		if (editingEntryIndex === null) entries.unshift(entry);
		else entries[editingEntryIndex] = entry;
		localStorage.setItem(storageKeys[activeContentType], JSON.stringify(entries));
		renderEntries(activeContentType);
		closeModal();
	};

	if (!image) saveEntry(existingEntry.image);
	else {
		const reader = new FileReader();
		reader.addEventListener("load", () => saveEntry(reader.result));
		reader.readAsDataURL(image);
	}
});

if (!isVisitorMode && aboutPhotoInput) aboutPhotoInput.addEventListener("change", () => {
	const files = [...aboutPhotoInput.files];
	if (!files.length) return;
	Promise.all(files.map((file) => new Promise((resolve) => {
		const reader = new FileReader();
		reader.addEventListener("load", () => resolve(reader.result));
		reader.readAsDataURL(file);
	}))).then((photos) => {
		localStorage.setItem(aboutPhotosKey, JSON.stringify([...photos, ...getAboutPhotos()]));
		renderAboutPhotos();
		aboutPhotoInput.value = "";
	});
});

if (!isVisitorMode && editAboutPhotoButton) editAboutPhotoButton.addEventListener("click", () => {
	if (getAboutPhotos().length) replaceAboutPhotoInput.click();
});

if (!isVisitorMode && replaceAboutPhotoInput) replaceAboutPhotoInput.addEventListener("change", () => {
	const replacement = replaceAboutPhotoInput.files[0];
	if (!replacement) return;
	const reader = new FileReader();
	reader.addEventListener("load", () => {
		const photos = getAboutPhotos();
		photos[selectedAboutPhotoIndex] = reader.result;
		saveAboutPhotos(photos);
		replaceAboutPhotoInput.value = "";
	});
	reader.readAsDataURL(replacement);
});

if (!isVisitorMode && removeAboutPhotoButton) removeAboutPhotoButton.addEventListener("click", () => {
	const photos = getAboutPhotos();
	if (!photos.length) return;
	photos.splice(selectedAboutPhotoIndex, 1);
	selectedAboutPhotoIndex = 0;
	saveAboutPhotos(photos);
});

updateEPortfolioImage();
renderEntries("project");
renderEntries("certification");
renderEntries("education");
renderBuiltInProjects();
renderAboutPhotos();
setupCertificationCarousel();
setupScrollReveal();
setupActiveNavigation();

window.addEventListener("storage", (event) => {
	if ([storageKeys.project, storageKeys.certification, storageKeys.education, hiddenBuiltInProjectsKey].includes(event.key)) syncSharedContent();
	if (event.key === aboutPhotosKey) renderAboutPhotos();
});

window.addEventListener("focus", () => {
	syncSharedContent();
	renderAboutPhotos();
});
