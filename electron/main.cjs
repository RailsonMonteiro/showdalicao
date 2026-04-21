const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
const QUESTIONS_STORAGE_FILE = 'questions.generated.ts';
const LOCAL_VERSION_CHECK_INTERVAL_MS = 60 * 1000;
const GITHUB_RELEASE_TAG = 'ShowdaLição';
const GITHUB_RELEASES_URL = `https://github.com/RailsonMonteiro/showdalicao/releases/tag/${encodeURIComponent(GITHUB_RELEASE_TAG)}`;

let mainWindow = null;
let localVersionCheckInterval = null;
let updaterInitialized = false;

const updaterState = {
  available: false,
  downloading: false,
  downloaded: false,
  downloadProgress: null,
  version: null,
  error: null
};

function normalizeVersionString(version) {
  return String(version ?? '').trim().replace(/^v/i, '');
}

function compareVersions(leftVersion, rightVersion) {
  const leftParts = normalizeVersionString(leftVersion).split('.').map((part) => Number(part) || 0);
  const rightParts = normalizeVersionString(rightVersion).split('.').map((part) => Number(part) || 0);
  const segmentCount = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < segmentCount; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }

  return 0;
}

function getUpdateDownloadDirectory() {
  return path.join(app.getPath('downloads'), 'Show da Lição');
}

function sendUpdaterState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('updater:state', updaterState);
}

function setUpdaterState(nextState) {
  Object.assign(updaterState, nextState);
  sendUpdaterState();
}

function getUpdaterErrorMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  return typeof error === 'string' ? error : 'Falha ao verificar atualização';
}

function isLatestYmlMissingError(message) {
  const normalizedMessage = String(message ?? '').toLowerCase();
  return normalizedMessage.includes('cannot find latest yml')
    || (normalizedMessage.includes('latest.yml') && normalizedMessage.includes('404'));
}

function extractVersionFromInstallerName(fileName) {
  const match = String(fileName ?? '').match(/(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)\.exe$/i);
  return match ? normalizeVersionString(match[1]) : null;
}

async function fetchTaggedRelease() {
  const apiUrl = `https://api.github.com/repos/RailsonMonteiro/showdalicao/releases/tags/${encodeURIComponent(GITHUB_RELEASE_TAG)}`;
  const response = await fetch(apiUrl, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Release ${GITHUB_RELEASE_TAG} não encontrada no GitHub (${response.status})`);
  }

  return response.json();
}

async function getInstallerDownloadUrl() {
  try {
    const release = await fetchTaggedRelease();
    const exeAsset = release.assets?.find((asset) => asset.name.toLowerCase().endsWith('.exe'));

    if (!exeAsset || !exeAsset.browser_download_url) {
      throw new Error(`Arquivo .exe não encontrado na release ${GITHUB_RELEASE_TAG}`);
    }

    return {
      version: extractVersionFromInstallerName(exeAsset.name) ?? normalizeVersionString(app.getVersion()),
      fileName: exeAsset.name,
      downloadUrl: exeAsset.browser_download_url
    };
  } catch (error) {
    throw new Error(`Falha ao buscar URL do instalador no GitHub: ${getUpdaterErrorMessage(error)}`);
  }
}

async function downloadFileToAppDirectory(url, fileName, onProgress) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar instalador (${response.status})`);
  }

  if (!response.body) {
    throw new Error('Falha ao baixar instalador: resposta sem corpo.');
  }

  const downloadDir = getUpdateDownloadDirectory();
  await fs.mkdir(downloadDir, { recursive: true });
  const filePath = path.join(downloadDir, fileName);

  const totalBytes = Number(response.headers.get('content-length') || 0);
  const fileHandle = await fs.open(filePath, 'w');
  const reader = response.body.getReader();
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value && value.length > 0) {
        await fileHandle.write(Buffer.from(value));
        receivedBytes += value.length;

        if (typeof onProgress === 'function') {
          const progress = totalBytes > 0 ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : null;
          onProgress({ receivedBytes, totalBytes, progress });
        }
      }
    }
  } catch (error) {
    try {
      await fileHandle.close();
    } catch {
      // Ignora falha ao fechar em caso de erro.
    }

    try {
      await fs.unlink(filePath);
    } catch {
      // Ignora limpeza se o arquivo ainda não existir.
    }

    throw error;
  }

  await fileHandle.close();
  return filePath;
}

function canUseAutoUpdater() {
  return process.platform === 'win32' && app.isPackaged;
}

async function refreshRemoteUpdateState() {
  if (!canUseAutoUpdater()) {
    return;
  }

  const release = await fetchTaggedRelease();
  const exeAsset = release.assets?.find((asset) => asset.name.toLowerCase().endsWith('.exe'));
  const remoteVersion = extractVersionFromInstallerName(exeAsset?.name);
  const currentVersion = normalizeVersionString(app.getVersion());

  if (!remoteVersion) {
    if (!updaterState.downloading && !updaterState.downloaded) {
      setUpdaterState({ available: false, version: null, error: null });
    }
    return;
  }

  const hasUpdate = compareVersions(remoteVersion, currentVersion) > 0;

  setUpdaterState({
    available: hasUpdate,
    version: hasUpdate ? remoteVersion : null,
    error: null
  });
}

function setupAutoUpdater(win) {
  mainWindow = win;
  sendUpdaterState();

  if (!canUseAutoUpdater() || updaterInitialized) return;

  updaterInitialized = true;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('download-progress', () => {
    if (!updaterState.downloading) {
      setUpdaterState({ downloading: true, error: null });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    setUpdaterState({
      available: true,
      downloading: false,
      downloaded: true,
      version: info?.version ?? updaterState.version,
      error: null
    });
  });

  autoUpdater.on('error', (error) => {
    setUpdaterState({
      downloading: false,
      error: getUpdaterErrorMessage(error)
    });
  });

  void refreshRemoteUpdateState().catch((error) => {
    setUpdaterState({ error: getUpdaterErrorMessage(error) });
  });

  localVersionCheckInterval = setInterval(() => {
    void refreshRemoteUpdateState().catch((error) => {
      setUpdaterState({ error: getUpdaterErrorMessage(error) });
    });
  }, LOCAL_VERSION_CHECK_INTERVAL_MS);
}

ipcMain.handle('updater:get-state', () => ({ ...updaterState }));

ipcMain.handle('updater:check', async () => {
  if (!canUseAutoUpdater()) {
    return { ok: false, error: 'Atualização automática disponível apenas no app desktop empacotado para Windows.' };
  }

  try {
    await refreshRemoteUpdateState();
    setUpdaterState({ error: null });
    return { ok: true };
  } catch (error) {
    const message = getUpdaterErrorMessage(error);
    setUpdaterState({ error: message });
    return { ok: false, error: message };
  }
});

ipcMain.handle('updater:download-install', async () => {
  if (!canUseAutoUpdater()) {
    return { ok: false, error: 'Atualização automática disponível apenas no app desktop empacotado para Windows.' };
  }

  if (!updaterState.available && !updaterState.downloaded) {
    await refreshRemoteUpdateState();
    if (!updaterState.available && !updaterState.downloaded) {
      return { ok: false, error: 'Nenhuma atualização disponível no momento.' };
    }
  }

  try {
    setUpdaterState({ error: null, downloading: true, downloaded: false, downloadProgress: 0 });

    const { version: remoteVersion, downloadUrl, fileName } = await getInstallerDownloadUrl();
    if (!remoteVersion) {
      throw new Error('Versão remota não disponível.');
    }

    const installerPath = await downloadFileToAppDirectory(downloadUrl, fileName, ({ progress }) => {
      setUpdaterState({ downloading: true, downloadProgress: progress });
    });

    setUpdaterState({ downloading: false, downloaded: true, downloadProgress: 100 });

    const openResult = await shell.openPath(installerPath);
    if (openResult) {
      throw new Error(`Falha ao abrir o instalador baixado: ${openResult}`);
    }

    app.quit();

    return { ok: true };
  } catch (error) {
    const message = getUpdaterErrorMessage(error);
    const messageBoxOptions = {
      type: 'error',
      title: 'Show da Lição',
      message: 'Falha ao atualizar o aplicativo',
      detail: message,
      buttons: ['OK'],
      defaultId: 0
    };

    if (mainWindow && !mainWindow.isDestroyed()) {
      await dialog.showMessageBox(mainWindow, messageBoxOptions);
    } else {
      await dialog.showMessageBox(messageBoxOptions);
    }

    setUpdaterState({ downloading: false, error: message });
    return { ok: false, error: message };
  }
})

function getQuestionsFilePath() {
  return path.join(app.getPath('userData'), QUESTIONS_STORAGE_FILE);
}

async function ensureQuestionsStorageDir() {
  const questionsPath = getQuestionsFilePath();
  await fs.mkdir(path.dirname(questionsPath), { recursive: true });
}

function asString(value, fallback = '') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  return fallback;
}

function buildQuestionsFileContent(questionsPayload) {
  const questions = Array.isArray(questionsPayload) ? questionsPayload : [];

  const rows = questions.map((item, index) => {
    const optionsInput = item && typeof item.options === 'object' && item.options !== null ? item.options : {};
    const optionEntries = OPTION_KEYS
      .filter((key) => typeof optionsInput[key] === 'string' && optionsInput[key].trim().length > 0)
      .map((key) => `      ${key}: ${JSON.stringify(asString(optionsInput[key]))}`);

    const optionsText = optionEntries.length > 0
      ? optionEntries.join(',\n')
      : `      A: ${JSON.stringify('Sem alternativa')}`;

    const validAnswer = OPTION_KEYS.includes(item?.answer)
      ? item.answer
      : (optionEntries[0]?.trim().charAt(0) || 'A');

    const sourceType = item?.source?.type === 'biblia' ? 'biblia' : 'licao';

    return [
      '  {',
      `    id: ${index + 1},`,
      `    topic: ${JSON.stringify(asString(item?.topic, `Pergunta ${index + 1}`))},`,
      `    question: ${JSON.stringify(asString(item?.question, `Pergunta ${index + 1}`))},`,
      '    options: {',
      optionsText,
      '    },',
      `    answer: ${JSON.stringify(validAnswer)},`,
      '    source: {',
      `      type: ${JSON.stringify(sourceType)},`,
      `      reference: ${JSON.stringify(asString(item?.source?.reference, 'Pergunta personalizada'))}`,
      '    },',
      `    optionCount: ${Math.max(2, Math.min(OPTION_KEYS.length, Number(item?.optionCount) || 4))},`,
      `    points: ${Math.max(1, Math.round(Number(item?.points) || 1000))}`,
      '  }'
    ].join('\n');
  });

  const rowsText = rows.join(',\n\n');

  return [
    "import { Question } from './types';",
    '',
    'export const questions: Question[] = [',
    rowsText,
    '];',
    ''
  ].join('\n');
}

ipcMain.handle('questions:clear', async () => {
  const questionsPath = getQuestionsFilePath();
  const emptyContent = [
    "import { Question } from './types';",
    '',
    'export const questions: Question[] = [];',
    ''
  ].join('\n');

  try {
    await ensureQuestionsStorageDir();
    await fs.writeFile(questionsPath, emptyContent, 'utf8');
    return { ok: true, path: questionsPath };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao limpar o arquivo de perguntas' };
  }
});

ipcMain.handle('questions:save', async (_event, payload) => {
  const questionsPath = getQuestionsFilePath();
  const content = buildQuestionsFileContent(payload);

  try {
    await ensureQuestionsStorageDir();
    await fs.writeFile(questionsPath, content, 'utf8');
    return {
      ok: true,
      count: Array.isArray(payload) ? payload.length : 0,
      path: questionsPath
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Falha ao salvar arquivo de perguntas' };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'img', 'ico.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
  });

  win.maximize();

  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  setupAutoUpdater(win);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (localVersionCheckInterval) {
    clearInterval(localVersionCheckInterval);
    localVersionCheckInterval = null;
  }
});
