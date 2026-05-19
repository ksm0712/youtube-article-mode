# Features Reference

This document lists the current product behavior in a more explicit, feature-by-feature format.

## Supported video behavior

### Homepage videos

- Standard homepage video cards are intercepted
- Clicking a supported card opens a custom read-mode dialog
- The normal YouTube open-video flow is paused until the user chooses an action

### Search-result videos

- Standard search result videos use the same interaction as homepage videos
- Search results are meant to feel consistent with the homepage experience

### Read article action

- Sends the selected video URL through the extension flow
- Reaches the local backend
- Requests structured article output from Gemini
- Renders the result inside YouTube as a reading overlay

### Go back action

- Closes the popup
- Returns the user to the current browsing state without entering article mode

## Unsupported video behavior

### Shorts

- Shorts are not treated as read-mode-supported content
- Shorts interactions trigger an unsupported-state popup
- The UI explains that short-form content does not currently have read mode

## Interface changes

### Reading-focused styling

- Shared popup system across supported and unsupported states
- Reader-style article overlay instead of a generic modal
- Visual direction designed to feel more editorial and educational than “AI tool”

### Distraction reduction

- Thumbnail-heavy presentation is reduced where possible
- Playlist and mix-style clutter is filtered where possible
- Search flow is meant to preserve the same intentional reading-first behavior

## Backend behavior

### Extension side

- Content script manages page-level interaction
- Background script forwards article requests

### Server side

- Local Node server receives the selected YouTube URL
- Gemini is used to generate article content
- Structured article data is returned to the extension

## Product goal

The extension is not trying to become a better video player.

It is trying to create a better learning surface on top of YouTube by:

- slowing down impulsive clicking
- making text consumption easier
- making educational use feel more intentional
- giving users a way to extract value without automatically falling into video loops
