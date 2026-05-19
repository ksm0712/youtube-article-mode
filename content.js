const DIALOG_ID = "yt-article-dialog"
const OVERLAY_ID = "yt-article-overlay"
const VIDEO_CARD_SELECTOR = "ytd-rich-item-renderer, ytd-video-renderer"
const SHORTS_SHELF_SELECTOR = "ytd-reel-shelf-renderer, ytd-rich-shelf-renderer"
const SHORTS_SECTION_SELECTOR = [
  "ytd-rich-section-renderer",
  "ytd-item-section-renderer",
  "ytd-shelf-renderer"
].join(", ")

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }

    return entities[character]
  })
}

function closeDialog() {
  document.getElementById(DIALOG_ID)?.remove()
}

function closeOverlay() {
  document.getElementById(OVERLAY_ID)?.remove()
}

function removeShortsShelfBlocks(root = document) {
  root.querySelectorAll(SHORTS_SHELF_SELECTOR).forEach((shelf) => {
    const container = shelf.closest(SHORTS_SECTION_SELECTOR)

    if (container) {
      container.remove()
      return
    }

    shelf.remove()
  })
}

function removeShortsVideoCards(root = document) {
  root.querySelectorAll('ytd-video-renderer a[href*="/shorts/"]').forEach((link) => {
    link.closest("ytd-video-renderer")?.remove()
  })
}

function startShortsCleanup() {
  removeShortsShelfBlocks()
  removeShortsVideoCards()

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return

        if (node.matches?.(SHORTS_SHELF_SELECTOR)) {
          const container = node.closest(SHORTS_SECTION_SELECTOR)
          ;(container || node).remove()
          return
        }

        if (node.matches?.("ytd-video-renderer") && node.querySelector('a[href*="/shorts/"]')) {
          node.remove()
          return
        }

        removeShortsShelfBlocks(node)
        removeShortsVideoCards(node)
      })
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

function getVideoCard(target) {
  return target.closest(VIDEO_CARD_SELECTOR)
}

function getCanonicalWatchUrl(url) {
  const videoId = url.searchParams.get("v")
  if (!videoId) return null

  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
}

function isShortsUrl(url) {
  return url.pathname.includes("/shorts/")
}

function requestArticleFromBackground(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "REQUEST_ARTICLE",
        payload
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }

        resolve(response)
      }
    )
  })
}

function renderGeneratedArticle({ title, channel, article }) {
  const sections = Array.isArray(article.sections) ? article.sections : []
  const takeaways = Array.isArray(article.takeaways) ? article.takeaways : []

  return `
    <div class="yt-article-overlay__shell">
      <div class="yt-article-overlay__topbar">
        <p class="yt-article-overlay__eyebrow">Article mode</p>
        <button class="yt-article-button yt-article-button--secondary" type="button" data-action="close-overlay">
          Back
        </button>
      </div>
      <article class="yt-article-overlay__card yt-article-overlay__article">
        <header class="yt-article-section">
          <h1 class="yt-article-overlay__title">${escapeHtml(title)}</h1>
          <p class="yt-article-overlay__meta">${escapeHtml(channel || "YouTube video")}</p>
        </header>
        <section class="yt-article-section">
          <h2>Summary</h2>
          <p>${escapeHtml(article.summary || "No summary was generated.")}</p>
        </section>
        ${sections
          .map(
            (section) => `
              <section class="yt-article-section">
                <h2>${escapeHtml(section.heading || "Section")}</h2>
                ${String(section.body || "")
                  .split(/\n{2,}/)
                  .map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`)
                  .join("")}
              </section>
            `
          )
          .join("")}
        ${
          takeaways.length
            ? `
              <section class="yt-article-section">
                <h2>Key takeaways</h2>
                <ul class="yt-article-list">
                  ${takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </section>
            `
            : ""
        }
      </article>
    </div>
  `
}

function renderStatusOverlay(title, message) {
  return `
    <div class="yt-article-overlay__shell">
      <div class="yt-article-overlay__topbar">
        <p class="yt-article-overlay__eyebrow">Article mode</p>
        <button class="yt-article-button yt-article-button--secondary" type="button" data-action="close-overlay">
          Back
        </button>
      </div>
      <div class="yt-article-overlay__card yt-article-overlay__state">
        <h1 class="yt-article-overlay__title">${escapeHtml(title)}</h1>
        <p class="yt-article-overlay__meta">${escapeHtml(message)}</p>
      </div>
    </div>
  `
}

async function generateArticleFromVideo({ title, channel, watchUrl }) {
  const response = await requestArticleFromBackground({
    title,
    channel,
    watchUrl
  })

  if (!response?.ok) {
    throw new Error(response?.error || "The article generator backend failed.")
  }

  if (!response.payload?.article) {
    throw new Error("The article generator backend returned no article.")
  }

  return response.payload.article
}

function showArticleOverlay({ title, watchUrl, channel }) {
  closeOverlay()

  const overlay = document.createElement("div")
  overlay.id = OVERLAY_ID
  overlay.innerHTML = renderStatusOverlay(
    title,
    "Sending the video to Gemini and generating an article now. This can take a little while."
  )

  overlay.addEventListener("click", (event) => {
    if (event.target.dataset?.action === "close-overlay") {
      closeOverlay()
    }
  })

  document.body.appendChild(overlay)

  generateArticleFromVideo({ title, watchUrl, channel })
    .then((article) => {
      const activeOverlay = document.getElementById(OVERLAY_ID)
      if (!activeOverlay) return

      activeOverlay.innerHTML = renderGeneratedArticle({ title, channel, article })
    })
    .catch((error) => {
      const activeOverlay = document.getElementById(OVERLAY_ID)
      if (!activeOverlay) return

      activeOverlay.innerHTML = renderStatusOverlay(title, error.message)
    })
}

function showDialog({ title, watchUrl, channel }) {
  closeDialog()

  const dialog = document.createElement("div")
  dialog.id = DIALOG_ID
  dialog.innerHTML = `
    <div class="yt-article-dialog__backdrop"></div>
    <div class="yt-article-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="yt-article-dialog-title">
      <p class="yt-article-dialog__eyebrow">Open this video differently?</p>
      <h2 id="yt-article-dialog-title" class="yt-article-dialog__title">${escapeHtml(title)}</h2>
      <p class="yt-article-dialog__copy">Would you like to read an AI-generated article for this video, or go back?</p>
      <div class="yt-article-dialog__actions">
        <button class="yt-article-button yt-article-button--primary" type="button" data-action="read">
          Read article
        </button>
        <button class="yt-article-button yt-article-button--secondary" type="button" data-action="back">
          Go back
        </button>
      </div>
    </div>
  `

  dialog.addEventListener("click", (event) => {
    const action = event.target.dataset?.action

    if (action === "back" || event.target.classList.contains("yt-article-dialog__backdrop")) {
      closeDialog()
      return
    }

    if (action === "read") {
      closeDialog()
      showArticleOverlay({ title, watchUrl, channel })
    }
  })

  document.body.appendChild(dialog)
}

function showShortsDialog() {
  closeDialog()

  const dialog = document.createElement("div")
  dialog.id = DIALOG_ID
  dialog.innerHTML = `
    <div class="yt-article-dialog__backdrop"></div>
    <div class="yt-article-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="yt-article-dialog-title">
      <p class="yt-article-dialog__eyebrow">Read mode unavailable</p>
      <h2 id="yt-article-dialog-title" class="yt-article-dialog__title">Shorts do not have read mode</h2>
      <p class="yt-article-dialog__copy">Short-form content is not supported yet. Go back and pick a full video instead.</p>
      <div class="yt-article-dialog__actions">
        <button class="yt-article-button yt-article-button--secondary" type="button" data-action="back">
          Go back
        </button>
      </div>
    </div>
  `

  dialog.addEventListener("click", (event) => {
    const action = event.target.dataset?.action

    if (action === "back" || event.target.classList.contains("yt-article-dialog__backdrop")) {
      closeDialog()
    }
  })

  document.body.appendChild(dialog)
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDialog()
    closeOverlay()
  }
})

if (document.body) {
  startShortsCleanup()
} else {
  window.addEventListener("DOMContentLoaded", startShortsCleanup, { once: true })
}

document.addEventListener("click", (event) => {
  const shortsAnchor = event.target.closest('a[href*="/shorts/"]')
  if (shortsAnchor) {
    event.preventDefault()
    event.stopPropagation()
    showShortsDialog()
    return
  }

  const card = getVideoCard(event.target)
  if (!card) return

  const link = card.querySelector("a[href*='/watch']")
  const shortsLink = card.querySelector("a[href*='/shorts/']")
  const primaryLink = link || shortsLink
  if (!primaryLink) return

  const url = new URL(primaryLink.href)
  if (isShortsUrl(url)) {
    event.preventDefault()
    event.stopPropagation()
    showShortsDialog()
    return
  }

  const watchUrl = getCanonicalWatchUrl(url)
  if (!watchUrl) return

  const title =
    card.querySelector("#video-title")?.textContent?.trim() ||
    card.querySelector('a[title]')?.getAttribute("title") ||
    "This video"

  const channel =
    card.querySelector("ytd-channel-name")?.textContent?.trim() ||
    card.querySelector("#channel-name")?.textContent?.trim() ||
    ""

  event.preventDefault()
  event.stopPropagation()

  showDialog({
    title,
    watchUrl,
    channel
  })
}, true)
