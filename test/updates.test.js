const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { startUpdates } = require('../updates');

function fixture(response = 1, failure = null) {
  const app = new EventEmitter();
  const autoUpdater = new EventEmitter();
  const calls = { checks: 0, installs: [], prompts: [], errors: [] };
  autoUpdater.checkForUpdates = async () => {
    calls.checks++;
    if (failure) {
      autoUpdater.emit('error', failure);
      throw failure;
    }
  };
  autoUpdater.quitAndInstall = (...args) => calls.installs.push(args);
  const dialog = {
    showMessageBox: async (options) => {
      calls.prompts.push(options);
      return { response };
    },
    showErrorBox: (...args) => calls.errors.push(args),
  };
  startUpdates({ app, autoUpdater, dialog });
  return { app, autoUpdater, calls };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

test('checks automatically and downloads stable releases without installing on exit', () => {
  const { app, autoUpdater, calls } = fixture();
  assert.equal(calls.checks, 1);
  assert.equal(autoUpdater.autoDownload, true);
  assert.equal(autoUpdater.autoInstallOnAppQuit, false);
  assert.equal(autoUpdater.allowPrerelease, false);
  app.emit('before-quit');
  assert.deepEqual(calls.installs, []);
});

test('Later does not restart or install', async () => {
  const { app, autoUpdater, calls } = fixture(1);
  autoUpdater.emit('update-downloaded', { version: '1.0.3' });
  await tick();
  assert.match(calls.prompts[0].message, /v1\.0\.3/);
  assert.equal(calls.prompts[0].cancelId, 1);
  assert.deepEqual(calls.installs, []);
  app.emit('before-quit');
});

test('explicit approval restarts to install', async () => {
  const { app, autoUpdater, calls } = fixture(0);
  autoUpdater.emit('update-downloaded', { version: '1.0.3' });
  await tick();
  assert.equal(app.isQuitting, true);
  assert.deepEqual(calls.installs, [[false, true]]);
  app.emit('before-quit');
});

test('update failure is surfaced once despite event and promise rejection', async () => {
  const { app, calls } = fixture(1, new Error('Network unavailable'));
  await tick();
  assert.equal(calls.errors.length, 1);
  assert.match(calls.errors[0][1], /Network unavailable/);
  assert.deepEqual(calls.installs, []);
  app.emit('before-quit');
});
