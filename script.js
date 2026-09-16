const sections = [...document.querySelectorAll(".section")];
const navTargets = [...document.querySelectorAll("[data-target]")];
const tetrisPieces = [...document.querySelectorAll(".tetris-piece")];
document.documentElement.classList.add("has-js");

let activeIndex = 0;
let locked = false;
let touchStartY = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setActive(index, previousIndex = activeIndex) {
  activeIndex = clamp(index, 0, sections.length - 1);
  sections.forEach((section, sectionIndex) => {
    section.classList.toggle("is-exiting", sectionIndex === previousIndex && sectionIndex !== activeIndex);
    section.classList.toggle("is-visible", sectionIndex === activeIndex);
  });

  window.setTimeout(() => {
    sections.forEach((section) => section.classList.remove("is-exiting"));
  }, 620);
}

function goTo(index) {
  const nextIndex = clamp(index, 0, sections.length - 1);
  if (locked || nextIndex === activeIndex) return;

  locked = true;
  const previousIndex = activeIndex;
  setActive(nextIndex, previousIndex);
  sections[nextIndex].scrollIntoView({ behavior: "smooth", block: "start" });

  window.setTimeout(() => {
    locked = false;
  }, 760);
}

function step(direction) {
  goTo(activeIndex + direction);
}

function canScrollInsideLastSection(direction) {
  if (activeIndex !== sections.length - 1) return false;
  const lastSectionBounds = sections[activeIndex].getBoundingClientRect();
  return direction > 0
    ? lastSectionBounds.bottom > window.innerHeight + 2
    : lastSectionBounds.top < -2;
}

window.addEventListener(
  "wheel",
  (event) => {
    if (Math.abs(event.deltaY) < 18) return;
    const direction = event.deltaY > 0 ? 1 : -1;
    if (canScrollInsideLastSection(direction)) return;
    event.preventDefault();
    step(direction);
  },
  { passive: false },
);

window.addEventListener("keydown", (event) => {
  if (["ArrowDown", "PageDown", " "].includes(event.key)) {
    if (canScrollInsideLastSection(1)) return;
    event.preventDefault();
    step(1);
  }

  if (["ArrowUp", "PageUp"].includes(event.key)) {
    if (canScrollInsideLastSection(-1)) return;
    event.preventDefault();
    step(-1);
  }
});

window.addEventListener(
  "touchstart",
  (event) => {
    touchStartY = event.touches[0]?.clientY || 0;
  },
  { passive: true },
);

window.addEventListener(
  "touchmove",
  (event) => {
    const currentY = event.touches[0]?.clientY || 0;
    const delta = touchStartY - currentY;
    if (Math.abs(delta) < 42) return;
    const direction = delta > 0 ? 1 : -1;
    if (canScrollInsideLastSection(direction)) return;
    event.preventDefault();
    step(direction);
    touchStartY = currentY;
  },
  { passive: false },
);

navTargets.forEach((target) => {
  target.addEventListener("click", (event) => {
    const index = Number(target.dataset.target);
    if (Number.isNaN(index)) return;
    event.preventDefault();
    goTo(index);
  });
});

tetrisPieces.forEach((piece) => {
  const trigger = piece.querySelector(".tetris-trigger");
  if (!trigger) return;

  trigger.addEventListener("click", () => {
    tetrisPieces.forEach((item) => {
      const itemTrigger = item.querySelector(".tetris-trigger");
      const isCurrent = item === piece;
      item.classList.toggle("is-open", isCurrent);
      itemTrigger?.setAttribute("aria-expanded", String(isCurrent));
    });

    piece.animate(
      [
        { transform: "translateY(-18px) scale(0.985)" },
        { transform: "translateY(10px) scale(1)" },
        { transform: "translateY(8px) scale(1)" },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    );
  });
});

const initialHash = window.location.hash.split("?")[0];
const initialIndex = sections.findIndex((section) => `#${section.id}` === initialHash);
setActive(initialIndex > -1 ? initialIndex : 0);

window.addEventListener(
  "scroll",
  () => {
    if (locked) return;
    const nearestIndex = sections.reduce((nearest, section, index) => {
      const currentDistance = Math.abs(section.getBoundingClientRect().top);
      const nearestDistance = Math.abs(sections[nearest].getBoundingClientRect().top);
      return currentDistance < nearestDistance ? index : nearest;
    }, activeIndex);

    if (nearestIndex !== activeIndex) {
      setActive(nearestIndex);
    }
  },
  { passive: true },
);
