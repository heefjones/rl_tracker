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