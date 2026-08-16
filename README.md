◈ LUNAR.MP3 ◈


======== PLEASE READ ========

Hi,this is a retro-futuristic desktop player for Windows built around your Spotify account (still in development, so expect the occasional bug).

Welcome to LUNAR.MP3. It's a visual player and synced-lyrics viewer for whatever's playing on your Spotify - retro CRT look, live audio-reactive visuals, a bunch of themes, the works.

⚠️ IMPORTANT REQUIREMENT: To control playback and stay in sync, you need a **Spotify Premium** account. Spotify's own platform doesn't allow free accounts to be controlled by external players - that's a Spotify rule, not something I can work around.

LUNAR.MP3 doesn't download or pirate anything - it connects directly to your official Spotify app and mirrors what's already playing there. So you'll need Spotify open and playing in the background while you use it.

Since this is an independent project, you'll link it to your own account with a free developer key. Takes about 2 minutes, and it's a one-time setup.

## Installation Guide

### STEP 1 - Download the app
Grab it here: [Download LUNAR.MP3]
https://github.com/himanshusiingh3009-eng/lunar-mp3/releases/latest/download/LUNAR.MP3-Setup.exe

⚠️ Note: since this is an indie, unsigned app (no paid code-signing certificate), Windows SmartScreen will likely show a blue warning the first time you open it. That's normal. Click "More info" → "Run anyway". Your computer is safe - this just means Microsoft doesn't recognize the publisher yet, not that anything's wrong.

Run the installer, then open LUNAR.MP3. You'll land on a setup screen asking for a Client ID - leave it open for now.

### STEP 2 - Create your access key on Spotify
Go to [developer.spotify.com](https://developer.spotify.com/) and log in with your Spotify Premium account.

Head to the **[Dashboard](https://developer.spotify.com/dashboard)** and click **"Create app"**. Fill it out like this:

- **App name:** LUNAR.MP3 (or anything you like)
- **App description:** Personal music player
- **Redirect URI:** copy and paste exactly this: `http://127.0.0.1:5174/callback`
- Check the **"Web API"** box, accept the terms, and click **Save**

### STEP 3 - Connect the player
Back on your app's dashboard page, you'll see a **Client ID** - a long string of letters and numbers. Copy it.

Paste that into LUNAR.MP3's setup screen. That's the only thing it needs - LUNAR.MP3 uses a modern auth method (PKCE) that doesn't require a Client Secret at all, so there's no second code to copy or protect.

Pick a theme, hit **SAVE & CONTINUE**, then **CONNECT TO SPOTIFY**. Your browser will open asking you to approve access - click **Agree**.

Done!! Open Spotify, start playing something, and LUNAR.MP3 will pick it up automatically.
