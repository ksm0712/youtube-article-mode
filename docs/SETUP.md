# Setup And Troubleshooting

## Requirements

- Chromium-based browser
- Node.js
- Gemini API key

## Run locally

1. Open the project folder:

```bash
cd /Users/karansinghmadia/Desktop/yt-article
```

2. Start the backend:

```bash
GEMINI_API_KEY=your_key_here node server.js
```

3. Open `chrome://extensions`
4. Enable Developer Mode
5. Click `Load unpacked`
6. Select `/Users/karansinghmadia/Desktop/yt-article`
7. Reload the extension after any frontend code change

## What should happen

- Clicking a normal supported video should open the read-mode dialog
- Clicking `Read article` should request an article from the backend
- Shorts should not enter article mode

## If article generation fails

Check these first:

1. Is the backend still running?
2. Is the Gemini API key valid?
3. Is the selected video public and supported?
4. Did the extension get reloaded after code changes?

## If the extension UI changes are not visible

1. Reload the extension in `chrome://extensions`
2. Refresh the YouTube tab
3. Try again on a fresh video card

## If the popup does not appear

1. Confirm the clicked item is a normal supported video card
2. Reload the extension
3. Refresh YouTube
4. Test again on the homepage and on search results

## Notes

- The backend is intentionally local right now
- The extension UI does not ask end users for an API key
- Shorts currently use an unsupported-state flow rather than article generation
