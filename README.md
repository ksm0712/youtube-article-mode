# YouTube Article Mode

A Chrome extension that converts YouTube videos into readable articles.
Built to reduce YouTube addiction while keeping access to educational content.

## Status
Work in progress. Currently: clickable YouTube cards can open an AI-generated reading view.

## How to install
1. Clone this repo
2. Start the local article server with an environment variable:
   `GEMINI_API_KEY=your_key_here node server.js`
3. Open chrome://extensions
4. Enable developer mode
5. Click "Load unpacked" and select this folder
6. Reload the extension after code changes so the background worker updates too

## Current behavior
1. Click a YouTube video card
2. Choose `Read article`
3. The extension sends the public YouTube URL to the local article server
4. Gemini watches the video and the server returns an article to the extension

## Notes
- This path uses Gemini video understanding instead of transcripts or captions
- The YouTube URL must be public; private and unlisted videos are not supported by Gemini's YouTube URL input
- The backend uses `gemini-3-flash-preview` because that is the official model documented for direct YouTube URL video input
- End users are not asked for an API key; the secret lives on the backend server instead
