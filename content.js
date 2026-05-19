const DIALOG_ID = "yt-article-dialog";
const OVERLAY_ID = "yt-article-overlay";

function closeDialog() {
  document.getElementById(DIALOG_ID)?.remove();
}

function closeOverlay() {
  document.getElementById(OVERLAY_ID)?.remove();
}

function showArticleOverlay({ title, videoId }) {
  closeOverlay();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.innerHTML = `
    <div class="yt-article-overlay__card">
      <p class="yt-article-overlay__eyebrow">Article mode</p>
      <h1 class="yt-article-overlay__title">${title}</h1>
      <p class="yt-article-overlay__meta">Video ID: ${videoId}</p>
      <button class="yt-article-button yt-article-button--secondary" type="button">
        Back to YouTube
      </button>
    </div>
  `;

  overlay.querySelector("button")?.addEventListener("click", closeOverlay);
  document.body.appendChild(overlay);
}

function showDialog({ title, videoId }) {
  closeDialog();

  const dialog = document.createElement("div");
  dialog.id = DIALOG_ID;
  dialog.innerHTML = `
    <div class="yt-article-dialog__backdrop"></div>
    <div class="yt-article-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="yt-article-dialog-title">
      <p class="yt-article-dialog__eyebrow">Open this video differently?</p>
      <h2 id="yt-article-dialog-title" class="yt-article-dialog__title">${title}</h2>
      <p class="yt-article-dialog__copy">Would you like to read an article for this video, or go back?</p>
      <div class="yt-article-dialog__actions">
        <button class="yt-article-button yt-article-button--primary" type="button" data-action="read">
          Read article
        </button>
        <button class="yt-article-button yt-article-button--secondary" type="button" data-action="back">
          Go back
        </button>
      </div>
    </div>
  `;

  dialog.addEventListener("click", (event) => {
    const action = event.target.dataset?.action;

    if (action === "back" || event.target.classList.contains("yt-article-dialog__backdrop")) {
      closeDialog();
      return;
    }

    if (action === "read") {
      closeDialog();
      showArticleOverlay({ title, videoId });
    }
  });

  document.body.appendChild(dialog);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDialog();
    closeOverlay();
  }
});

document.addEventListener("click", (event) => {
  const card = event.target.closest("ytd-rich-item-renderer");
  if (!card) return;

  const link = card.querySelector("a[href*='/watch']");
  if (!link) return;

  const url = new URL(link.href);
  const videoId = url.searchParams.get("v");
  if (!videoId) return;

  const title =
    card.querySelector("#video-title")?.textContent?.trim() ||
    card.querySelector('a[title]')?.getAttribute("title") ||
    "This video";

  event.preventDefault();
  event.stopPropagation();

  showDialog({ title, videoId });
}, true);
