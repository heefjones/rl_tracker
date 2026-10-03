# RL Tracker

A Windows desktop app for tracking multiple Epic Games accounts using ratings
from Rocket League Tracker. Internet access is required to refresh ratings.

## Install and use

Download `RL-Tracker-Setup-1.0.1.exe` and run it. The setup wizard lets you choose
an installation folder. For a non-administrator installation, choose a folder
your Windows user can write to. On the final page, leave **Run RL Tracker**
checked to open it, or launch it later from the desktop or Start menu.
Add your own Epic Games usernames. Use the main Refresh
button to update all accounts, drag rows to reorder them, click a mode header
to sort, and use the X on a row to remove an account.

Accounts are saved locally in `%APPDATA%\RL Tracker\accounts.json`.
Uninstalling leaves saved accounts intact.
The chosen installation folder stores the application, not your saved accounts.
Installing again updates the existing app and shortcuts; it does not create a
second desktop icon or reset your accounts.

This build targets Windows x64. It is not a macOS, Linux, or Windows ARM-native
installer.

## Build

With Node.js installed, run these commands from this folder:

```powershell
npm.cmd ci
npm.cmd run dist
```

The shareable installer is written to `dist\RL-Tracker-Setup-1.0.1.exe`.
`npm.cmd run dist:dir` builds an unpacked app for local testing.

## Share publicly

GitHub Releases is a convenient hosting option:

1. Create a GitHub repository for the project.
2. Create a release with a version tag such as `v1.0.1`.
3. Attach the setup EXE from `dist` as a release asset.
4. Share the release page URL.