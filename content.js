document.addEventListener("click", (event) => {
  const card = event.target.closest("ytd-rich-item-renderer");
  if (!card) return;

  const link = card.querySelector("a[href*='/watch']");
  if (!link) return;

  const url = new URL(link.href);
  const videoId = url.searchParams.get("v");

  event.preventDefault();
  event.stopPropagation();

  console.log("video id:", videoId);
}, true);