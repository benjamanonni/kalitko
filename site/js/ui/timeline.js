export function setupTimeline() {
  const timeline = document.querySelector("#timeline");
  if (!timeline) return;
  const chapters = [...timeline.querySelectorAll(".chapter")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("IntersectionObserver" in window && !reducedMotion) {
    document.documentElement.classList.add("js");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6%", threshold: 0.08 });
    chapters.forEach((chapter) => observer.observe(chapter));
  }

  let scheduled = false;
  function updateProgress() {
    const box = timeline.getBoundingClientRect();
    const distance = Math.max(1, box.height - 150);
    const passed = Math.min(distance, Math.max(0, window.innerHeight * 0.55 - box.top - 60));
    timeline.style.setProperty("--progress", (passed / distance).toFixed(4));
    let closest = null;
    let nearest = Infinity;
    chapters.forEach((chapter) => {
      const distanceToFocus = Math.abs(chapter.getBoundingClientRect().top - window.innerHeight * 0.42);
      if (distanceToFocus < nearest) {
        nearest = distanceToFocus;
        closest = chapter;
      }
    });
    chapters.forEach((chapter) => chapter.classList.toggle("is-current", chapter === closest));
    scheduled = false;
  }
  function schedule() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateProgress);
    }
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  updateProgress();
}

