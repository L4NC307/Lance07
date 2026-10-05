const tabs = document.querySelectorAll(".tab");
const panels = { it: document.getElementById("it-panel"), creative: document.getElementById("creative-panel") };

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    Object.values(panels).forEach(p => p.classList.add("hidden"));
    panels[tab.dataset.tab].classList.remove("hidden");
  });
});

document.querySelector(".menu")?.addEventListener("click", () => {
  const nav = document.querySelector(".nav nav");
  nav.classList.toggle("mobile-open");
});
