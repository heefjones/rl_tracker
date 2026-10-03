# RL Tracker

A Windows desktop app for tracking multiple Epic Games accounts using ratings
from Rocket League Tracker. Internet access is required to refresh ratings.

## Install and use

Download `RL-Tracker-Setup-1.0.0.exe`, run it, and open **RL Tracker** from the
desktop or Start menu. Add your own Epic Games usernames. Use the main Refresh
button to update all accounts, drag rows to reorder them, click a mode header
to sort, and use the X on a row to remove an account.

Accounts are saved locally in `%APPDATA%\RL Tracker\accounts.json`.
Uninstalling leaves saved accounts intact.

This build targets Windows x64. It is not a macOS, Linux, or Windows ARM-native
installer.

## Build

With Node.js installed, run these commands from this folder:

```powershell
npm.cmd ci
npm.cmd run dist
```

The shareable installer is written to `dist\RL-Tracker-Setup-1.0.0.exe`.
`npm.cmd run dist:dir` builds an unpacked app for local testing.

## Share publicly

GitHub Releases is a convenient hosting option:

1. Create a GitHub repository for the project.
2. Create a release with a version tag such as `v1.0.0`.
3. Attach the setup EXE from `dist` as a release asset.
4. Share the release page URL.

You can also send the same installer directly or host it on another download
service. Do not send only the EXE from `win-unpacked`: that executable requires
the rest of its folder. Do not upload `node_modules`, personal account data,
browser sessions, or credentials. Hosting the installer does not require
uploading the source code.

The build is not configured with a code-signing certificate. Windows may show
an unknown-publisher or SmartScreen warning. For a broader public release,
obtain a Windows code-signing certificate and configure electron-builder
signing; signing helps establish publisher identity but does not guarantee
immediate SmartScreen reputation.

Before publishing, verify Tracker Network's applicable terms and data-access
requirements. This is an unofficial app, and tracker site/API changes or
verification challenges can interrupt lookups.

There is no automatic update system. Increment the package version, build a
new installer, and publish a new release for updates.
