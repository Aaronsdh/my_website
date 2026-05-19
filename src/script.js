const p = document.querySelectorAll(".project-card[data-link]");

p.forEach((card) => {
  card.addEventListener("click", () => {
    const projectUrl = card.dataset.link;

    if (projectUrl) {
      window.location.href = projectUrl;
    }
  });
});
