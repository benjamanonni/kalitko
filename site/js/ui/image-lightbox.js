export function setupImageLightbox() {
  const dialog = document.querySelector("#image-lightbox");
  const image = dialog.querySelector("[data-lightbox-image]");
  const closeButton = dialog.querySelector("[data-close-lightbox]");
  let trigger = null;

  function close() {
    dialog.close();
  }

  function open(imageData, sourceButton, { compact = false } = {}) {
    trigger = sourceButton || document.activeElement;
    dialog.classList.toggle("image-lightbox--compact", compact);
    image.src = imageData.src;
    image.alt = imageData.alt;
    image.width = imageData.width;
    image.height = imageData.height;
    dialog.showModal();
    closeButton.focus();
  }

  closeButton.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    if (trigger instanceof HTMLElement) trigger.focus();
  });

  return { open };
}
