// Animate title on load
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("faqTitle").classList.add("animated");
  }, 200);
});

// FAQ card toggle
const cards = document.querySelectorAll(".faq-card");
cards.forEach((card) => {
  card.addEventListener("click", () => {
    const wasActive = card.classList.contains("active");

    // Close all cards
    cards.forEach((c) => c.classList.remove("active"));

    // Open clicked card if it wasn't active
    if (!wasActive) {
      card.classList.add("active");
    }
  });
});

// Category filter
const categoryPills = document.querySelectorAll(".category-pill");
const faqCards = document.querySelectorAll(".faq-card");

categoryPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    const category = pill.dataset.category;

    // Update active pill
    categoryPills.forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");

    // Filter cards with animation
    faqCards.forEach((card, index) => {
      const cardCategory = card.dataset.category;

      if (category === "all" || cardCategory === category) {
        setTimeout(() => {
          card.style.display = "block";
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
          }, 10);
        }, index * 50);
      } else {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        setTimeout(() => {
          card.style.display = "none";
        }, 300);
      }
    });
  });
});

// Initialize card styles for animation
faqCards.forEach((card) => {
  card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
});

// Scroll indicator
const scrollDots = document.querySelectorAll(".scroll-dot");
let currentSection = 0;

window.addEventListener("scroll", () => {
  const scrollPercent =
    (window.scrollY /
      (document.documentElement.scrollHeight - window.innerHeight)) *
    100;

  if (scrollPercent < 33) {
    currentSection = 0;
  } else if (scrollPercent < 66) {
    currentSection = 1;
  } else {
    currentSection = 2;
  }

  scrollDots.forEach((dot, index) => {
    if (index === currentSection) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
});

// Smooth scroll on dot click
scrollDots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    const scrollPosition =
      (index / (scrollDots.length - 1)) *
      (document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({
      top: scrollPosition,
      behavior: "smooth",
    });
  });
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cards.forEach((c) => c.classList.remove("active"));
  }
});
