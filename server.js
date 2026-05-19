const http = require("http")

const PORT = process.env.PORT || 3000
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = "gemini-3-flash-preview"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  })

  response.end(JSON.stringify(body))
}

function buildPrompt({ title, channel }) {
  return [
    "Watch this YouTube video carefully and turn it into a readable article.",
    "Use both the visuals and the spoken content when forming the article.",
    "Write like a human explainer, not like notes or captions pasted together.",
    "Cover the main claims, examples, demonstrations, and conclusions someone would learn by watching.",
    "Do not mention that you are an AI.",
    "",
    `Video title: ${title}`,
    `Channel: ${channel || "Unknown"}`,
    "",
    "Return valid JSON with this exact shape:",
    '{',
    '  "summary": "string",',
    '  "sections": [{ "heading": "string", "body": "string" }],',
    '  "takeaways": ["string"]',
    '}'
  ].join("\n")
}

function extractGeminiError(responseText, statusCode) {
  if (!responseText.trim()) {
    return `Gemini request failed with ${statusCode}.`
  }

  try {
    const payload = JSON.parse(responseText)
    const message = payload.error?.message || `Gemini request failed with ${statusCode}.`

    if (payload.error?.status === "INVALID_ARGUMENT") {
      return `${message} Gemini may be rejecting this YouTube URL format or this video may not be eligible for direct URL video input.`
    }

    return message
  } catch {
    return responseText
  }
}

async function generateArticle({ title, channel, watchUrl }) {
  if (!GEMINI_API_KEY) {
    throw new Error("Server is missing GEMINI_API_KEY.")
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              file_data: {
                file_uri: watchUrl,
                mime_type: "video/*"
              }
            },
            { text: buildPrompt({ title, channel }) }
          ]
        }
      ]
    })
  })

  const responseText = await response.text()

  if (!response.ok) {
    throw new Error(extractGeminiError(responseText, response.status))
  }

  if (!responseText.trim()) {
    throw new Error("Gemini returned an empty response.")
  }

  let data

  try {
    data = JSON.parse(responseText)
  } catch {
    throw new Error("Gemini returned a non-JSON response.")
  }

  const raw =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || ""

  if (!raw) {
    throw new Error("Gemini returned no article text.")
  }

  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "")

  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error("Gemini returned article text that was not valid JSON.")
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = ""

    request.on("data", (chunk) => {
      body += chunk
    })

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })

    request.on("error", reject)
  })
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method !== "POST" || request.url !== "/api/article") {
    sendJson(response, 404, { error: "Not found" })
    return
  }

  try {
    const { title, channel, watchUrl } = await readRequestBody(request)

    if (!title || !watchUrl) {
      sendJson(response, 400, { error: "Missing title or watchUrl" })
      return
    }

    const article = await generateArticle({ title, channel, watchUrl })
    sendJson(response, 200, { article })
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Unknown server error" })
  }
})

server.listen(PORT, () => {
  console.log(`Article server listening on http://localhost:${PORT}`)
})
