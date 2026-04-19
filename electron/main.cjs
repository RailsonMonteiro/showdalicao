const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('path');

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
const QUESTIONS_STORAGE_FILE = 'questions.generated.ts';

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
    icon: path.join(__dirname, '..', 'img', 'ico.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
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
