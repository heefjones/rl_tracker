# RL Tracker

A Windows desktop app for tracking multiple Epic Games accounts using ratings
from Rocket League Tracker. Internet access is required to refresh ratings.

## Install and use

Download `RL-Tracker-Setup-1.0.2.exe` and run it. The setup wizard lets you choose
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

The shareable installer is written to `dist\RL-Tracker-Setup-1.0.2.exe`.
`npm.cmd run dist:dir` builds an unpacked app for local testing.

## Share publicly

GitHub Releases is a convenient hosting option:

1. Create a GitHub repository for the project.
2. Create a published, non-prerelease release with a matching tag such as `v1.0.2`.
3. Attach the setup EXE, its `.exe.blockmap`, and `latest.yml` from `dist`.
4. Share the release page URL.

## Automatic updates

Starting with version 1.0.2, installed Windows builds check the public
`heefjones/rl_tracker` GitHub Releases on startup and hourly. New stable versions
download in the background. The app asks before restarting to install;
choosing Later does not install on exit. It will offer the downloaded update
again after the next launch. Update failures are reported without preventing
normal account tracking. Development runs do not check for updates.

The version next to MMR Tracker comes from Electron's `app.getVersion()`, so
it identifies the running build, not the latest published release.

Users on 1.0.0 or 1.0.1 must manually install 1.0.2 once to gain automatic updates.
For every release, increment the package version and rebuild. Upload the EXE,
matching blockmap, and generated `latest.yml` together, without renaming or
editing them. The metadata contains the version, size, and checksum used to
verify downloads. Users only need the EXE for manual installation.

Build commands do not publish anything. After a new release is built and
verified, older local setup EXEs and matching blockmaps can be deleted;
published GitHub assets remain untouched.