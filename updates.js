const CHECK_INTERVAL_MS = 60 * 60 * 1000;

function startUpdates({ app, autoUpdater, dialog }) {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowPrerelease = false;
  let checking = false;
  let downloaded = false;
  let reportedError = false;

  function reportError(error) {
    console.error('Application update failed:', error);
    if (reportedError) return;
    reportedError = true;
    dialog.showErrorBox(
      'Unable to update RL Tracker',
      'The update check or download failed. You can keep using this version. ' +
      'Check your internet connection or download the latest installer from ' +
      'https://github.com/heefjones/rl_tracker/releases.\n\n' + error.message
    );
  }

  autoUpdater.on('error', reportError);
  autoUpdater.on('update-downloaded', async (info) => {
    downloaded = true;
    try {
      const { response } = await dialog.showMessageBox({
        type: 'info',
        title: 'RL Tracker update ready',
        message: `RL Tracker v${info.version} is ready to install.`,
        detail: 'Restart now to install the update. Your saved accounts will be kept. ' +
          'If you choose Later, this version will stay installed until you approve an update.',
        buttons: ['Restart and install', 'Later'],
        defaultId: 1,
        cancelId: 1,
        noLink: true,
      });
      if (response === 0) {
        app.isQuitting = true;
        autoUpdater.quitAndInstall(false, true);
      }
    } catch (error) {
      reportError(error);
    }
  });

  async function check() {
    if (checking || downloaded) return;
    checking = true;
    reportedError = false;
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      reportError(error);
    } finally {
      checking = false;
    }
  }

  const timer = setInterval(check, CHECK_INTERVAL_MS);
  timer.unref();
  app.once('before-quit', () => clearInterval(timer));
  check();
}

module.exports = { startUpdates };
