const ARTICLE_API_URL = "http://localhost:3000/api/article"

async function requestArticle(payload) {
  try {
    const response = await fetch(ARTICLE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()

    if (!response.ok) {
      try {
        const errorPayload = JSON.parse(responseText)
        return { ok: false, error: errorPayload.error || "The article server failed." }
      } catch {
        return { ok: false, error: responseText || "The article server failed." }
      }
    }

    if (!responseText.trim()) {
      return { ok: false, error: "The article server returned an empty response." }
    }

    try {
      const payload = JSON.parse(responseText)
      return { ok: true, payload }
    } catch {
      return { ok: false, error: "The article server returned invalid JSON." }
    }
  } catch (error) {
    return {
      ok: false,
      error:
        "Could not reach the article server on localhost:3000. Make sure `node server.js` is running."
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "REQUEST_ARTICLE") {
    return false
  }

  requestArticle(message.payload).then(sendResponse)
  return true
})
