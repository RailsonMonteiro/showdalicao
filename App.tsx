import React, { useEffect, useRef, useState } from 'react';
import { questions } from './questions';
import { GameState, LifelineType, QuestionOptionKey, QuestionOptions, Team, Question } from './types';
import expandIcon from './img/expandir.svg';
import rightOptionsIcon from './img/direita.svg';
import leftOptionsIcon from './img/esquerda.svg';
import updateIcon from './img/Atualizar.svg';
import showDaLicaoLogo from './img/Showdalicao.png';

import openingAudioTrack from './Abertura.mp3';
import tenSecondsAudioTrack from './10s.mp3';
import applauseAudioTrack from './Palmas.mp3';
import wrongAudioTrack from './Errou.mp3';

const MIN_ZOOM = 50;
const MAX_ZOOM = 120;
const DEFAULT_ZOOM = 90;
const DEFAULT_THEME_ID = 'ocean';
const DEFAULT_CUSTOM_COLOR = '#ff006e';

type ColorThemeId = 'ocean' | 'sunset' | 'forest' | 'night' | 'custom';

type ColorTheme = {
  id: ColorThemeId;
  name: string;
  gradientStart: string;
  gradientEnd: string;
  primary: string;
  accent: string;
};

type FontOption = {
  id: string;
  label: string;
  family: string;
};

const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'ocean',
    name: 'Oceano Azul',
    gradientStart: '#8ecae6',
    gradientEnd: '#219ebc',
    primary: '#219ebc',
    accent: '#8ecae6'
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    gradientStart: '#ffb703',
    gradientEnd: '#fb8500',
    primary: '#fb8500',
    accent: '#ffb703'
  },
  {
    id: 'forest',
    name: 'Floresta Viva',
    gradientStart: '#95d5b2',
    gradientEnd: '#2d6a4f',
    primary: '#2d6a4f',
    accent: '#95d5b2'
  },
  {
    id: 'night',
    name: 'Noite Neon',
    gradientStart: '#3a0ca3',
    gradientEnd: '#4361ee',
    primary: '#4361ee',
    accent: '#4cc9f0'
  }
];

const FONT_OPTIONS: FontOption[] = [
  { id: 'advent-sans-logo', label: 'Advent Sans Logo', family: 'Advent Pro, sans-serif' },
  { id: 'arial-local', label: 'Arial', family: 'Roboto, Arial, sans-serif' },
  { id: 'roboto-semicondensed-regular', label: 'Roboto SemiCondensed Regular', family: 'Roboto Condensed, sans-serif' },
  { id: 'roboto-condensed-medium', label: 'Roboto Condensed Medium', family: 'Roboto Condensed, sans-serif' },
  { id: 'roboto-condensed-bold', label: 'Roboto Condensed Bold', family: 'Roboto Condensed, sans-serif' },
  { id: 'roboto-condensed-black', label: 'Roboto Condensed Black', family: 'Roboto Condensed, sans-serif' },
  { id: 'roboto-extralight', label: 'Roboto ExtraLight', family: 'Roboto, sans-serif' }
];

const DEFAULT_QUESTION_FONT_ID = 'roboto-condensed-bold';
const DEFAULT_ANSWER_FONT_ID = 'roboto-condensed-bold';
const MIN_FONT_SIZE_PT = 12;
const MAX_FONT_SIZE_PT = 100;
const DEFAULT_QUESTION_FONT_SIZE = 31;
const DEFAULT_ANSWER_FONT_SIZE = 16;
const DEFAULT_QUESTION_POINTS = 1000;
const DEFAULT_QUESTION_COUNT = 10;
const DEFAULT_OPTION_COUNT = 4;
const MIN_QUESTION_COUNT = 10;
const DEFAULT_MUSIC_VOLUME = 30;
const DEFAULT_EFFECTS_VOLUME = 90;
const DEFAULT_TEAM_CLOCK_VOLUME = 60;
const QUESTION_OPTION_KEYS: QuestionOptionKey[] = ['A', 'B', 'C', 'D', 'E', 'F'];
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

type QuestionGenerationMode = 'manual' | 'ia';

type AIQuestionItem = {
  topic?: string;
  question?: string;
  options?: string[] | Record<string, unknown>;
  answer?: string;
  answerIndex?: number;
  source?: {
    type?: 'licao' | 'biblia';
    reference?: string;
    day?: string;
    biblicalText?: string;
    paragraph?: string;
  };
  day?: string;
  biblicalText?: string;
  paragraph?: string;
  sourceType?: 'licao' | 'biblia';
  reference?: string;
};

type AIQuestionResponse = {
  questions?: AIQuestionItem[];
  items?: AIQuestionItem[];
  data?: AIQuestionItem[];
};

const LEGACY_DEFAULT_ANSWER_FONT_ID = 'roboto-condensed-bold';
const LEGACY_DEFAULT_QUESTION_FONT_SIZE = 31;

type QuestionDraft = {
  topic: string;
  question: string;
  options: string[];
  answerIndex: number;
  sourceType: 'licao' | 'biblia';
  reference: string;
};

type QuestionsFileResult = {
  ok: boolean;
  error?: string;
  path?: string;
  count?: number;
};

type UpdaterState = {
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  downloadProgress: number | null;
  version: string | null;
  error: string | null;
};

type UpdaterActionResult = {
  ok: boolean;
  error?: string;
};

type ElectronQuestionsApi = {
  clearQuestionsFile: () => Promise<QuestionsFileResult>;
  saveQuestionsFile: (questionsPayload: Question[]) => Promise<QuestionsFileResult>;
  getUpdaterState: () => Promise<UpdaterState>;
  checkForUpdates: () => Promise<UpdaterActionResult>;
  downloadAndInstallUpdate: () => Promise<UpdaterActionResult>;
  onUpdaterStateChange: (callback: (state: UpdaterState) => void) => () => void;
};

const normalizeHex = (hex: string): string => {
  const value = hex.trim();
  if (/^#([0-9a-fA-F]{6})$/.test(value)) return value.toLowerCase();
  if (/^#([0-9a-fA-F]{3})$/.test(value)) {
    const v = value.slice(1);
    return `#${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}`.toLowerCase();
  }
  return DEFAULT_CUSTOM_COLOR;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const mixHex = (colorA: string, colorB: string, ratio: number): string => {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const t = clamp(ratio, 0, 1);
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
};

const hexToRgba = (hex: string, alpha: number): string => {
  const c = hexToRgb(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${clamp(alpha, 0, 1)})`;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const App: React.FC = () => {
  const openingAudioRef = useRef<HTMLAudioElement | null>(null);
  const tenSecondsAudioRef = useRef<HTMLAudioElement | null>(null);
  const applauseAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);
  const tenSecondsIntervalRef = useRef<number | null>(null);
  const questionFileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const electronApi = (typeof window !== 'undefined'
    ? (window as Window & { electronAPI?: ElectronQuestionsApi }).electronAPI
    : undefined);

  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showUpdateProgressDialog, setShowUpdateProgressDialog] = useState(false);
  const [dismissedUpdateVersion, setDismissedUpdateVersion] = useState<string | null>(null);
  const [updaterState, setUpdaterState] = useState<UpdaterState>({
    available: false,
    downloading: false,
    downloaded: false,
    downloadProgress: null,
    version: null,
    error: null
  });
  const [showSetupZoomPanel, setShowSetupZoomPanel] = useState(false);
  const [showGameZoomPanel, setShowGameZoomPanel] = useState(false);
  const [showQuestionVolumePanel, setShowQuestionVolumePanel] = useState(false);
  const [showQuestionOptionsPanel, setShowQuestionOptionsPanel] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'interface' | 'perguntas' | 'fontes'>('interface');
  const [questionGenerationMode, setQuestionGenerationMode] = useState<QuestionGenerationMode>('manual');
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);
  const [aiGenerationBusy, setAiGenerationBusy] = useState(false);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [showImageSourceDialog, setShowImageSourceDialog] = useState(false);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [themeId, setThemeId] = useState<ColorThemeId>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME_ID;
    const saved = window.localStorage.getItem('appColorTheme') as ColorThemeId | null;
    if (!saved) return DEFAULT_THEME_ID;
    const exists = COLOR_THEMES.some(theme => theme.id === saved);
    return exists ? saved : DEFAULT_THEME_ID;
  });
  const [customColor, setCustomColor] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_CUSTOM_COLOR;
    return normalizeHex(window.localStorage.getItem('appCustomColor') ?? DEFAULT_CUSTOM_COLOR);
  });

  const [setupZoomLevel, setSetupZoomLevel] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_ZOOM;
    const saved = window.localStorage.getItem('appSetupZoomLevel') ?? window.localStorage.getItem('appZoomLevel');
    if (!saved) return DEFAULT_ZOOM;
    const parsed = Number(saved);
    return Number.isFinite(parsed) ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parsed)) : DEFAULT_ZOOM;
  });

  const [gameZoomLevel, setGameZoomLevel] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_ZOOM;
    const saved = window.localStorage.getItem('appGameZoomLevel');
    if (!saved) return DEFAULT_ZOOM;
    const parsed = Number(saved);
    return Number.isFinite(parsed) ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parsed)) : DEFAULT_ZOOM;
  });

  const [questionFontId, setQuestionFontId] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_QUESTION_FONT_ID;
    const saved = window.localStorage.getItem('questionFontId');
    return saved && FONT_OPTIONS.some(font => font.id === saved) ? saved : DEFAULT_QUESTION_FONT_ID;
  });

  const [answerFontId, setAnswerFontId] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_ANSWER_FONT_ID;
    const saved = window.localStorage.getItem('answerFontId');
    return saved && FONT_OPTIONS.some(font => font.id === saved) ? saved : DEFAULT_ANSWER_FONT_ID;
  });

  const [questionFontSize, setQuestionFontSize] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_QUESTION_FONT_SIZE;
    const saved = Number(window.localStorage.getItem('questionFontSize'));
    return Number.isFinite(saved) ? clamp(saved, MIN_FONT_SIZE_PT, MAX_FONT_SIZE_PT) : DEFAULT_QUESTION_FONT_SIZE;
  });

  const [answerFontSize, setAnswerFontSize] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_ANSWER_FONT_SIZE;
    const saved = Number(window.localStorage.getItem('answerFontSize'));
    return Number.isFinite(saved) ? clamp(saved, MIN_FONT_SIZE_PT, MAX_FONT_SIZE_PT) : DEFAULT_ANSWER_FONT_SIZE;
  });

  const [draftQuestionFontId, setDraftQuestionFontId] = useState<string>(questionFontId);
  const [draftAnswerFontId, setDraftAnswerFontId] = useState<string>(answerFontId);
  const [draftQuestionFontSize, setDraftQuestionFontSize] = useState<number>(questionFontSize);
  const [draftAnswerFontSize, setDraftAnswerFontSize] = useState<number>(answerFontSize);
  const [questionCount, setQuestionCount] = useState<number>(DEFAULT_QUESTION_COUNT);
  const [optionsPerQuestion, setOptionsPerQuestion] = useState<number>(DEFAULT_OPTION_COUNT);
  const [pointsPerQuestion, setPointsPerQuestion] = useState<number>(DEFAULT_QUESTION_POINTS);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [showTenSecondsClock, setShowTenSecondsClock] = useState(false);
  const [tenSecondsRemaining, setTenSecondsRemaining] = useState(10);
  const [showTeamNamesModal, setShowTeamNamesModal] = useState(false);
  const [musicVolume, setMusicVolume] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_MUSIC_VOLUME;
    const savedRaw = window.localStorage.getItem('musicVolume');
    if (savedRaw === null) return DEFAULT_MUSIC_VOLUME;
    const saved = Number(savedRaw);
    return Number.isFinite(saved) ? clamp(saved, 0, 100) : DEFAULT_MUSIC_VOLUME;
  });
  const [effectsVolume, setEffectsVolume] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_EFFECTS_VOLUME;
    const savedRaw = window.localStorage.getItem('effectsVolume');
    if (savedRaw === null) return DEFAULT_EFFECTS_VOLUME;
    const saved = Number(savedRaw);
    return Number.isFinite(saved) ? clamp(saved, 0, 100) : DEFAULT_EFFECTS_VOLUME;
  });
  const [teamClockVolume, setTeamClockVolume] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_TEAM_CLOCK_VOLUME;
    const savedRaw = window.localStorage.getItem('teamClockVolume');
    if (savedRaw === null) return DEFAULT_TEAM_CLOCK_VOLUME;
    const saved = Number(savedRaw);
    return Number.isFinite(saved) ? clamp(saved, 0, 100) : DEFAULT_TEAM_CLOCK_VOLUME;
  });
  const [draftTeam1Name, setDraftTeam1Name] = useState('Equipe 1');
  const [draftTeam2Name, setDraftTeam2Name] = useState('Equipe 2');
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(questions);
  const [resolvedQuestion, setResolvedQuestion] = useState<Question | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<QuestionOptionKey | null>(null);
  const [isAdvancingQuestion, setIsAdvancingQuestion] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    mode: 'setup',
    currentQuestionIndex: 0,
    currentTeamIndex: 0,
    teams: [
      { name: "Equipe 1", score: 0, lifelinesUsed: [] },
      { name: "Equipe 2", score: 0, lifelinesUsed: [] }
    ],
    selectedOption: null,
    showExplanation: false,
    explanationType: null,
    lifelineResult: null,
    hiddenOptions: [],
    shuffledQuestions: []
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const migrationKey = 'appVolumeDefaultsMigratedV1';
    if (window.localStorage.getItem(migrationKey) === '1') return;

    const musicRaw = window.localStorage.getItem('musicVolume');
    const effectsRaw = window.localStorage.getItem('effectsVolume');
    const teamRaw = window.localStorage.getItem('teamClockVolume');

    if (musicRaw === '0' && effectsRaw === '0' && teamRaw === '0') {
      setMusicVolume(DEFAULT_MUSIC_VOLUME);
      setEffectsVolume(DEFAULT_EFFECTS_VOLUME);
      setTeamClockVolume(DEFAULT_TEAM_CLOCK_VOLUME);
      window.localStorage.setItem('musicVolume', String(DEFAULT_MUSIC_VOLUME));
      window.localStorage.setItem('effectsVolume', String(DEFAULT_EFFECTS_VOLUME));
      window.localStorage.setItem('teamClockVolume', String(DEFAULT_TEAM_CLOCK_VOLUME));
    }

    window.localStorage.setItem(migrationKey, '1');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const migrationKey = 'appFontDefaultsMigratedV2';
    if (window.localStorage.getItem(migrationKey) === '1') return;

    const savedAnswerFontId = window.localStorage.getItem('answerFontId');
    const savedQuestionFontSize = window.localStorage.getItem('questionFontSize');

    const looksLikeLegacyDefaults =
      (savedAnswerFontId === null || savedAnswerFontId === LEGACY_DEFAULT_ANSWER_FONT_ID) &&
      (savedQuestionFontSize === null || savedQuestionFontSize === String(LEGACY_DEFAULT_QUESTION_FONT_SIZE));

    if (looksLikeLegacyDefaults) {
      setAnswerFontId(DEFAULT_ANSWER_FONT_ID);
      setQuestionFontSize(DEFAULT_QUESTION_FONT_SIZE);
      window.localStorage.setItem('answerFontId', DEFAULT_ANSWER_FONT_ID);
      window.localStorage.setItem('questionFontSize', String(DEFAULT_QUESTION_FONT_SIZE));
    }

    window.localStorage.setItem(migrationKey, '1');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('appSetupZoomLevel', String(setupZoomLevel));
  }, [setupZoomLevel]);

  useEffect(() => {
    window.localStorage.setItem('appGameZoomLevel', String(gameZoomLevel));
  }, [gameZoomLevel]);

  useEffect(() => {
    window.localStorage.setItem('appColorTheme', themeId);
  }, [themeId]);

  useEffect(() => {
    window.localStorage.setItem('appCustomColor', customColor);
  }, [customColor]);

  useEffect(() => {
    window.localStorage.setItem('questionFontId', questionFontId);
  }, [questionFontId]);

  useEffect(() => {
    window.localStorage.setItem('answerFontId', answerFontId);
  }, [answerFontId]);

  useEffect(() => {
    window.localStorage.setItem('questionFontSize', String(questionFontSize));
  }, [questionFontSize]);

  useEffect(() => {
    window.localStorage.setItem('answerFontSize', String(answerFontSize));
  }, [answerFontSize]);

  useEffect(() => {
    window.localStorage.setItem('musicVolume', String(musicVolume));
  }, [musicVolume]);

  useEffect(() => {
    window.localStorage.setItem('effectsVolume', String(effectsVolume));
  }, [effectsVolume]);

  useEffect(() => {
    window.localStorage.setItem('teamClockVolume', String(teamClockVolume));
  }, [teamClockVolume]);

  useEffect(() => {
    if (showSettings) {
      setDraftQuestionFontId(questionFontId);
      setDraftAnswerFontId(answerFontId);
      setDraftQuestionFontSize(questionFontSize);
      setDraftAnswerFontSize(answerFontSize);
    }
  }, [showSettings, questionFontId, answerFontId, questionFontSize, answerFontSize]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(openingAudioTrack);
    audio.loop = true;
    audio.volume = musicVolume / 100;
    openingAudioRef.current = audio;

    void audio.play().catch(() => {
      // Ignora bloqueios de autoplay em contextos sem interação.
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
      openingAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (gameState.mode !== 'setup') return;

    const removeInteractionListeners = () => {
      window.removeEventListener('pointerdown', tryPlayOnInteraction);
      window.removeEventListener('touchstart', tryPlayOnInteraction);
      window.removeEventListener('keydown', tryPlayOnInteraction);
      window.removeEventListener('mousemove', tryPlayOnInteraction);
      window.removeEventListener('click', tryPlayOnInteraction);
    };

    const tryPlayOnInteraction = () => {
      const audio = openingAudioRef.current;
      if (!audio) return;

      if (!audio.paused) {
        removeInteractionListeners();
        return;
      }

      void audio.play()
        .then(() => {
          removeInteractionListeners();
        })
        .catch(() => {
          // Ignora bloqueios de autoplay em contextos sem interação.
        });
    };

    window.addEventListener('pointerdown', tryPlayOnInteraction, { passive: true });
    window.addEventListener('touchstart', tryPlayOnInteraction, { passive: true });
    window.addEventListener('keydown', tryPlayOnInteraction);
    window.addEventListener('mousemove', tryPlayOnInteraction, { passive: true });
    window.addEventListener('click', tryPlayOnInteraction, { passive: true });

    return () => {
      removeInteractionListeners();
    };
  }, [gameState.mode]);

  useEffect(() => {
    const audio = openingAudioRef.current;
    if (!audio) return;

    if (gameState.mode === 'setup') {
      void audio.play().catch(() => {
        // Ignora bloqueios de autoplay em contextos sem interação.
      });
      return;
    }

    audio.pause();
    audio.currentTime = 0;
  }, [gameState.mode]);

  useEffect(() => {
    if (!openingAudioRef.current) return;
    openingAudioRef.current.volume = musicVolume / 100;
  }, [musicVolume]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onFullscreenChange = () => {
      setIsFullscreenMode(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    onFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (gameState.mode === 'setup' && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {
        // Ignora falhas ao sair do modo tela cheia.
      });
    }
  }, [gameState.mode]);

  useEffect(() => {
    if (gameState.mode === 'setup' || gameState.mode === 'gameover') {
      setShowQuestionOptionsPanel(false);
      setShowGameZoomPanel(false);
      setShowQuestionVolumePanel(false);
    }
  }, [gameState.mode]);

  useEffect(() => {
    if (!electronApi?.getUpdaterState || !electronApi?.onUpdaterStateChange) return;

    let mounted = true;
    const syncUpdaterState = async () => {
      try {
        const state = await electronApi.getUpdaterState();
        if (mounted) {
          setUpdaterState(state);
        }
      } catch {
        // Ignora falhas transitórias de comunicação com o processo principal.
      }
    };

    void syncUpdaterState();
    void electronApi.checkForUpdates?.();

    const unsubscribe = electronApi.onUpdaterStateChange((state) => {
      setUpdaterState(state);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [electronApi]);

  useEffect(() => {
    if (!updaterState.available || !updaterState.version) return;
    if (dismissedUpdateVersion === updaterState.version || showUpdateDialog) return;

    // A atualização não abre sozinha no início para evitar travar a tela inicial.
    // O usuário inicia o fluxo pelo botão de atualização.
  }, [dismissedUpdateVersion, showUpdateDialog, updaterState.available, updaterState.version]);

  useEffect(() => {
    return () => {
      if (tenSecondsIntervalRef.current !== null) {
        window.clearInterval(tenSecondsIntervalRef.current);
        tenSecondsIntervalRef.current = null;
      }
      if (tenSecondsAudioRef.current) {
        tenSecondsAudioRef.current.pause();
        tenSecondsAudioRef.current.currentTime = 0;
        tenSecondsAudioRef.current = null;
      }
      if (applauseAudioRef.current) {
        applauseAudioRef.current.pause();
        applauseAudioRef.current.currentTime = 0;
        applauseAudioRef.current = null;
      }
      if (wrongAudioRef.current) {
        wrongAudioRef.current.pause();
        wrongAudioRef.current.currentTime = 0;
        wrongAudioRef.current = null;
      }
    };
  }, []);

  const predefinedTheme = COLOR_THEMES.find(theme => theme.id === themeId) ?? COLOR_THEMES[0];
  const activeTheme = themeId === 'custom'
    ? {
        id: 'custom' as const,
        name: 'Personalizada',
        gradientStart: mixHex(customColor, '#ffffff', 0.55),
        gradientEnd: customColor,
        primary: customColor,
        accent: mixHex(customColor, '#ffffff', 0.35)
      }
    : predefinedTheme;

  const themeSoft = hexToRgba(activeTheme.accent, 0.2);
  const themeSoftStrong = hexToRgba(activeTheme.accent, 0.35);
  const themePrimarySoft = hexToRgba(activeTheme.primary, 0.12);
  const themePrimaryRing = hexToRgba(activeTheme.primary, 0.35);

  const questionFontFamily = FONT_OPTIONS.find(font => font.id === questionFontId)?.family ?? 'Montserrat';
  const answerFontFamily = FONT_OPTIONS.find(font => font.id === answerFontId)?.family ?? 'Montserrat';
  const previewQuestionFontFamily = FONT_OPTIONS.find(font => font.id === draftQuestionFontId)?.family ?? 'Montserrat';
  const previewAnswerFontFamily = FONT_OPTIONS.find(font => font.id === draftAnswerFontId)?.family ?? 'Montserrat';
  const answerBoxPaddingX = Math.max(20, Math.round(answerFontSize * 0.85));
  const answerBoxPaddingY = Math.max(14, Math.round(answerFontSize * 0.55));
  const answerBoxMinHeight = Math.max(76, Math.round(answerFontSize * 2.35));
  const answerBoxGap = Math.max(12, Math.round(answerFontSize * 0.45));
  const answerBadgeSize = Math.max(44, Math.round(answerFontSize * 1.35));
  const badgeTextPt = Math.max(18, Math.round(answerFontSize * 0.82));
  const responsiveQuestionFontSize = `clamp(1.2rem, ${Math.max(2.2, questionFontSize * 0.11).toFixed(2)}vw, ${questionFontSize}pt)`;
  const responsiveAnswerFontSize = `clamp(0.95rem, ${Math.max(1.7, answerFontSize * 0.1).toFixed(2)}vw, ${answerFontSize}pt)`;
  const responsiveBadgeSize = `clamp(38px, ${Math.max(6.2, answerBadgeSize * 0.16).toFixed(2)}vw, ${answerBadgeSize}px)`;
  const responsiveBadgeFontSize = `clamp(0.95rem, ${Math.max(1.6, badgeTextPt * 0.08).toFixed(2)}vw, ${badgeTextPt}pt)`;
  const answerButtonStyle: React.CSSProperties = {
    padding: `clamp(12px, 2vw, ${answerBoxPaddingY}px) clamp(14px, 2.6vw, ${answerBoxPaddingX}px)`,
    minHeight: `clamp(68px, 11vw, ${answerBoxMinHeight}px)`,
    gap: `clamp(10px, 1.8vw, ${answerBoxGap}px)`
  };
  const optionCount = clamp(Math.round(optionsPerQuestion), 2, QUESTION_OPTION_KEYS.length);
  const questionBuilderIsReady = questionCount >= MIN_QUESTION_COUNT && optionCount >= 2;

  const hasPendingFontChanges =
    draftQuestionFontId !== questionFontId ||
    draftAnswerFontId !== answerFontId ||
    draftQuestionFontSize !== questionFontSize ||
    draftAnswerFontSize !== answerFontSize;

  const handleApplyFontChanges = () => {
    setQuestionFontId(draftQuestionFontId);
    setAnswerFontId(draftAnswerFontId);
    setQuestionFontSize(draftQuestionFontSize);
    setAnswerFontSize(draftAnswerFontSize);
  };

  const selectNumericInputValue = (event: React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>) => {
    event.currentTarget.select();
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  };

  const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const buildQuestionsTsContent = (questionsPayload: Question[]) => {
    const rows = questionsPayload.map((item, index) => {
      const optionEntries = QUESTION_OPTION_KEYS
        .filter((key) => typeof item.options[key] === 'string' && String(item.options[key]).trim().length > 0)
        .map((key) => `      ${key}: ${JSON.stringify(String(item.options[key]).trim())}`);

      const optionsText = optionEntries.length > 0
        ? optionEntries.join(',\n')
        : `      A: ${JSON.stringify('Sem alternativa')}`;

      return [
        '  {',
        `    id: ${index + 1},`,
        `    topic: ${JSON.stringify(item.topic)},`,
        `    question: ${JSON.stringify(item.question)},`,
        '    options: {',
        optionsText,
        '    },',
        `    answer: ${JSON.stringify(item.answer)},`,
        '    source: {',
        `      type: ${JSON.stringify(item.source.type)},`,
        `      reference: ${JSON.stringify(item.source.reference)}`,
        '    },',
        `    optionCount: ${Math.max(2, Math.min(QUESTION_OPTION_KEYS.length, Number(item.optionCount) || 4))},`,
        `    points: ${Math.max(1, Math.round(Number(item.points) || 1000))}`,
        '  }'
      ].join('\n');
    });

    return [
      "import { Question } from './types';",
      '',
      'export const questions: Question[] = [',
      rows.join(',\n\n'),
      '];',
      ''
    ].join('\n');
  };

  const wrapCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const next = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth) {
        currentLine = next;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const buildAnswerImageBlob = async (question: Question, index: number): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 860;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Não foi possível gerar imagem da resposta.');
    }

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = activeTheme.primary;
    ctx.fillRect(0, 0, canvas.width, 110);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(`Questão ${index + 1}`, 40, 68);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 38px Arial';
    const questionLines = wrapCanvasText(ctx, question.question, canvas.width - 80);
    let y = 170;
    questionLines.slice(0, 5).forEach((line) => {
      ctx.fillText(line, 40, y);
      y += 52;
    });

    const correctText = `${question.answer}) ${question.options[question.answer] ?? ''}`;
    y += 30;
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 34px Arial';
    const answerLines = wrapCanvasText(ctx, `Resposta correta: ${correctText}`, canvas.width - 80);
    answerLines.forEach((line) => {
      ctx.fillText(line, 40, y);
      y += 48;
    });

    y += 12;
    ctx.fillStyle = '#334155';
    ctx.font = '600 26px Arial';
    ctx.fillText(`Fonte: ${question.source.reference}`, 40, y);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao criar arquivo PNG da resposta.'));
      }, 'image/png');
    });
  };

  const exportGeneratedArtifacts = async (questionsPayload: Question[]) => {
    const tsContent = buildQuestionsTsContent(questionsPayload);
    downloadBlob('questions.ts', new Blob([tsContent], { type: 'text/plain;charset=utf-8' }));

    for (let index = 0; index < questionsPayload.length; index += 1) {
      const blob = await buildAnswerImageBlob(questionsPayload[index], index);
      downloadBlob(`resposta-${index + 1}.png`, blob);
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
  };

  const buildQuestionsFromDrafts = (drafts: QuestionDraft[], optionTotal: number): Question[] => {
    const letters = QUESTION_OPTION_KEYS.slice(0, optionTotal);

    return drafts.map((draft, index) => {
      const answerIndex = Math.max(0, Math.min(optionTotal - 1, draft.answerIndex));
      const options = letters.reduce((accumulator, key, optionIndex) => {
        const raw = draft.options[optionIndex]?.trim();

        if (raw) {
          accumulator[key] = raw;
        } else if (optionIndex === answerIndex) {
          accumulator[key] = `Resposta correta sobre ${draft.topic.trim() || `Tema ${index + 1}`}.`;
        } else {
          accumulator[key] = `Resposta falsa ${key} sobre ${draft.topic.trim() || `Tema ${index + 1}`}.`;
        }

        return accumulator;
      }, {} as QuestionOptions);

      const answer = letters[answerIndex] ?? letters[0];

      return {
        id: index + 1,
        topic: draft.topic.trim() || `Pergunta ${index + 1}`,
        question: draft.question.trim() || `Pergunta ${index + 1}`,
        options,
        answer,
        source: {
          type: draft.sourceType,
          reference: draft.reference.trim() || 'Pergunta personalizada'
        },
        optionCount: letters.length,
        points: pointsPerQuestion
      };
    });
  };

  const openQuestionImageSourceDialog = () => {
    setAiGenerationError(null);
    setShowImageSourceDialog(true);
  };

  const openQuestionGalleryPicker = () => {
    setShowImageSourceDialog(false);
    questionFileInputRef.current?.click();
  };

  const openQuestionCameraCapture = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      window.alert('A câmera não está disponível neste dispositivo.');
      return;
    }

    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      cameraStreamRef.current = stream;
      setShowImageSourceDialog(false);
      setShowCameraDialog(true);
    } catch {
      setAiGenerationError('Permissão da câmera negada. Libere o acesso para continuar.');
      window.alert('Permissão da câmera negada. Libere o acesso no navegador/sistema.');
    }
  };

  const closeQuestionCameraCapture = () => {
    setShowCameraDialog(false);
    stopCameraStream();
  };

  const captureCameraImage = async () => {
    const video = cameraVideoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      window.alert('Não foi possível capturar a imagem da câmera.');
      return;
    }

    const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setSelectedImageFiles((prev) => [...prev, file]);
    setAiGenerationError(null);
    closeQuestionCameraCapture();
  };

  useEffect(() => {
    if (!showCameraDialog || !cameraVideoRef.current || !cameraStreamRef.current) return;

    const video = cameraVideoRef.current;
    video.srcObject = cameraStreamRef.current;
    void video.play().catch(() => {
      // Ignora bloqueio de autoplay para preview de câmera.
    });
  }, [showCameraDialog]);

  useEffect(() => {
    if (!showCameraDialog) {
      stopCameraStream();
    }
  }, [showCameraDialog]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const readFileAsBase64 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);

    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }

    return btoa(binary);
  };

  const fileToOpenAiInputImage = async (file: File) => {
    const mimeType = file.type || 'image/png';
    const base64 = await readFileAsBase64(file);
    return {
      type: 'input_image',
      image_url: `data:${mimeType};base64,${base64}`
    };
  };

  const normalizeAiQuestions = (payload: unknown, quantity: number, optionTotal: number): QuestionDraft[] => {
    const items = Array.isArray(payload)
      ? payload
      : (payload as AIQuestionResponse)?.questions ?? (payload as AIQuestionResponse)?.items ?? (payload as AIQuestionResponse)?.data ?? [];

    return Array.from({ length: quantity }, (_, index) => {
      const item = (items as AIQuestionItem[])[index] ?? {};
      const optionKeys = QUESTION_OPTION_KEYS.slice(0, optionTotal);

      const cleanDay = (value: string) => value.replace(/^dia:\s*/i, '').trim();
      const cleanBiblicalText = (value: string) => value.replace(/^texto\s+b[ií]blico:\s*/i, '').trim();
      const cleanParagraph = (value: string) => value.replace(/^par[aá]grafo:\s*/i, '').trim();
      const rawReference = String(item.source?.reference ?? item.reference ?? '').trim();
      const rawReferenceParts = rawReference.split('|').map((part) => part.trim()).filter(Boolean);

      const day = cleanDay(String(item.source?.day ?? item.day ?? rawReferenceParts[0] ?? '').trim());
      const biblicalText = cleanBiblicalText(String(item.source?.biblicalText ?? item.biblicalText ?? rawReferenceParts[1] ?? '').trim());
      const paragraphRaw = cleanParagraph(String(item.source?.paragraph ?? item.paragraph ?? rawReferenceParts[2] ?? '').trim());
      const paragraph = paragraphRaw && /^par[aá]grafo\s+/i.test(paragraphRaw) ? paragraphRaw : (paragraphRaw ? `Parágrafo ${paragraphRaw}` : '');

      const referenceParts = [day || 'Lição (dia não identificado)'];
      if (biblicalText) referenceParts.push(biblicalText);
      if (paragraph) referenceParts.push(paragraph);
      const normalizedReference = referenceParts.join(' | ');

      const options = optionKeys.map((key, optionIndex) => {
        if (Array.isArray(item.options)) {
          return String(item.options[optionIndex] ?? '').trim();
        }

        if (item.options && typeof item.options === 'object') {
          const value = item.options[key] ?? item.options[String(optionIndex)] ?? item.options[String.fromCharCode(65 + optionIndex)];
          return String(value ?? '').trim();
        }

        return '';
      });

      const answerKey = String(item.answer ?? '').trim().toUpperCase();
      const answerIndexFromKey = optionKeys.indexOf(answerKey as QuestionOptionKey);
      const answerIndex = answerIndexFromKey >= 0
        ? answerIndexFromKey
        : Math.max(0, Math.min(optionKeys.length - 1, Number.isFinite(item.answerIndex as number) ? Math.floor(Number(item.answerIndex)) : 0));

      return {
        topic: String(item.topic ?? `Tema ${index + 1}`).trim() || `Tema ${index + 1}`,
        question: String(item.question ?? `Pergunta ${index + 1}`).trim() || `Pergunta ${index + 1}`,
        options,
        answerIndex,
        sourceType: item.source?.type === 'biblia' ? 'biblia' : 'licao',
        reference: normalizedReference
      };
    });
  };

  const buildAiPrompt = () => {
    const coreInstructions = [
      'Você é um gerador de perguntas do jogo Show da Lição.',
      `Gere exatamente ${questionCount} perguntas em português do Brasil.`,
      `Cada pergunta deve ter exatamente ${optionCount} alternativas.`,
      'Retorne APENAS JSON válido, sem markdown, sem explicações e sem texto fora do JSON.',
      'Não quebre strings JSON no meio do texto e escape aspas internas com \\".',
      'Formato obrigatório:',
      '{ "questions": [ { "topic": "...", "question": "...", "options": ["..."], "answer": "A", "source": { "type": "licao", "reference": "Lição de Segunda | Lucas 18:9-14 | Parágrafo 2" } } ] }',
      'As alternativas devem ser coerentes, sem duplicidade e com somente uma resposta correta por pergunta.',
      'O campo answer deve conter somente uma letra entre A e F correspondente à alternativa correta.',
      'Para cada questão, preencha SEMPRE a referência no formato: "Dia da lição | Texto bíblico | Parágrafo".',
      'Se não existir texto bíblico ou parágrafo na imagem, mantenha apenas o dia da lição na referência.',
      'Use o conteúdo das imagens anexadas como fonte principal para criar as perguntas e respostas.'
    ];

    return coreInstructions.join('\n');
  };

  const parseAiJsonResponse = (rawText: string) => {
    const baseText = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const candidates: string[] = [baseText];

    const firstObjectStart = baseText.indexOf('{');
    const lastObjectEnd = baseText.lastIndexOf('}');
    if (firstObjectStart >= 0 && lastObjectEnd > firstObjectStart) {
      candidates.push(baseText.slice(firstObjectStart, lastObjectEnd + 1).trim());
    }

    const firstArrayStart = baseText.indexOf('[');
    const lastArrayEnd = baseText.lastIndexOf(']');
    if (firstArrayStart >= 0 && lastArrayEnd > firstArrayStart) {
      candidates.push(baseText.slice(firstArrayStart, lastArrayEnd + 1).trim());
    }

    const uniqueCandidates = Array.from(new Set(candidates)).filter(Boolean);
    for (const candidate of uniqueCandidates) {
      try {
        return JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    throw new Error('A IA retornou conteúdo em formato inválido. Tente novamente com as mesmas imagens.');
  };

  const generateQuestionsFromAi = async (files: File[]) => {
    if (files.length === 0) {
      window.alert('Selecione ou capture pelo menos uma imagem.');
      return;
    }

    const apiKey = String(
      import.meta.env.VITE_OPENAI_API_KEY
      ?? import.meta.env.VITE_GPT_API_KEY
      ?? import.meta.env.VITE_API_KEY
      ?? ''
    ).trim();
    if (!apiKey) {
      window.alert('A chave VITE_OPENAI_API_KEY não está configurada no ambiente (.env.local).');
      return;
    }

    const normalizedCount = Math.max(MIN_QUESTION_COUNT, Math.min(30, Math.round(questionCount)));
    const normalizedOptionCount = clamp(Math.round(optionsPerQuestion), 2, QUESTION_OPTION_KEYS.length);
    const promptText = buildAiPrompt();

    setAiGenerationBusy(true);
    setAiGenerationError(null);

    try {
      const imageInputs: Array<Record<string, unknown>> = [];
      for (const file of files) {
        imageInputs.push(await fileToOpenAiInputImage(file));
      }

      const requestBody = {
        model: 'gpt-4.1-mini',
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: promptText },
              ...imageInputs
            ]
          }
        ],
        text: {
          format: { type: 'json_object' }
        },
        temperature: 0.3,
        max_output_tokens: 4096
      };

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError: any = null;
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          parsedError = null;
        }

        const apiMessage = String(parsedError?.error?.message ?? '').trim();

        if (response.status === 429) {
          throw new Error('Cota da OpenAI excedida (429). Aguarde alguns instantes e tente novamente, ou verifique seu plano/limites.');
        }

        if (response.status === 401) {
          throw new Error('Chave da OpenAI inválida ou sem permissão (401). Confira VITE_OPENAI_API_KEY no .env.local.');
        }

        if (response.status === 403) {
          throw new Error('A chave da OpenAI não tem permissão para este recurso/modelo (403). Verifique projeto e permissões.');
        }

        throw new Error(`Falha ao gerar conteúdo com IA (${response.status}). ${apiMessage || 'Erro retornado pela API OpenAI.'}`);
      }

      const result = await response.json();
      const rawText = String(result?.output_text ?? '').trim();

      if (!rawText) {
        throw new Error('A IA não retornou conteúdo utilizável.');
      }

      const parsed = parseAiJsonResponse(rawText);
      const drafts = normalizeAiQuestions(parsed, normalizedCount, normalizedOptionCount);
      const generatedQuestions = buildQuestionsFromDrafts(drafts, normalizedOptionCount);

      if (electronApi?.saveQuestionsFile) {
        const saveResult = await electronApi.saveQuestionsFile(generatedQuestions);
        if (!saveResult.ok) {
          throw new Error(`Não foi possível salvar o arquivo de perguntas. ${saveResult.error ?? ''}`.trim());
        }
      }

      await exportGeneratedArtifacts(generatedQuestions);

      setQuestionCount(normalizedCount);
      setOptionsPerQuestion(normalizedOptionCount);
      setQuestionDrafts(drafts);
      setActiveQuestions(generatedQuestions);
      setSelectedImageFiles([]);
      setQuestionGenerationMode('manual');
      setShowQuestionBuilder(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao gerar perguntas com IA';
      setAiGenerationError(message);
      window.alert(message);
    } finally {
      setAiGenerationBusy(false);
    }
  };

  const openQuestionFilePicker = () => {
    openQuestionImageSourceDialog();
  };

  const handleQuestionFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) return;
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      window.alert('Selecione imagens válidas para gerar as perguntas.');
      return;
    }

    setSelectedImageFiles((prev) => {
      const merged = [...prev, ...imageFiles];
      const unique = new Map<string, File>();
      merged.forEach((file) => {
        unique.set(`${file.name}-${file.size}-${file.lastModified}`, file);
      });
      return Array.from(unique.values());
    });
    setAiGenerationError(null);
  };

  const handleGenerateAiFromSelectedImages = async () => {
    if (selectedImageFiles.length === 0) {
      setAiGenerationError('Selecione pelo menos uma imagem antes de gerar as perguntas.');
      return;
    }

    await generateQuestionsFromAi(selectedImageFiles);
  };

  const buildDraftQuestions = (quantity: number, optionTotal: number): QuestionDraft[] => {
    return Array.from({ length: quantity }, (_, index) => {
      const existing = questionDrafts[index];
      const existingOptions = existing?.options ?? [];
      return {
        topic: existing?.topic ?? `Tema ${index + 1}`,
        question: existing?.question ?? '',
        options: Array.from({ length: optionTotal }, (_, optionIndex) => existingOptions[optionIndex] ?? ''),
        answerIndex: Math.min(existing?.answerIndex ?? 0, optionTotal - 1),
        sourceType: existing?.sourceType ?? 'licao',
        reference: existing?.reference ?? ''
      };
    });
  };

  const openQuestionBuilder = async () => {
    const normalizedCount = Math.max(1, Math.min(30, Math.round(questionCount)));
    const normalizedOptionCount = clamp(Math.round(optionsPerQuestion), 2, QUESTION_OPTION_KEYS.length);

    if (electronApi?.clearQuestionsFile) {
      const clearResult = await electronApi.clearQuestionsFile();
      if (!clearResult.ok) {
        window.alert(`Não foi possível limpar o arquivo de perguntas. ${clearResult.error ?? ''}`.trim());
        return;
      }
    }

    setActiveQuestions([]);
    setQuestionCount(normalizedCount);
    setOptionsPerQuestion(normalizedOptionCount);
    setQuestionDrafts(buildDraftQuestions(normalizedCount, normalizedOptionCount));
    setShowQuestionBuilder(true);
  };

  const generateQuestions = async () => {
    const generatedQuestions = buildQuestionsFromDrafts(questionDrafts, optionCount);

    if (electronApi?.saveQuestionsFile) {
      const saveResult = await electronApi.saveQuestionsFile(generatedQuestions);
      if (!saveResult.ok) {
        window.alert(`Não foi possível salvar o arquivo de perguntas. ${saveResult.error ?? ''}`.trim());
        return;
      }
    } else {
      window.alert('Modo navegador: não foi possível salvar em arquivo, apenas em memória.');
    }

    setActiveQuestions(generatedQuestions);
    setShowQuestionBuilder(false);
  };

  useEffect(() => {
    document.body.style.background = `linear-gradient(135deg, ${activeTheme.gradientStart} 0%, ${activeTheme.gradientEnd} 100%)`;
  }, [activeTheme]);

  const currentQuestion: Question | undefined = gameState.shuffledQuestions[gameState.currentQuestionIndex];
  const explanationQuestion = resolvedQuestion ?? currentQuestion;
  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const currentOptionKeys = currentQuestion ? (Object.keys(currentQuestion.options) as QuestionOptionKey[]) : [];
  const showCorrectConfetti = gameState.showExplanation && gameState.explanationType === 'correct';
  const showCorrectConfettiBurst = showCorrectConfetti;
  const showWrongResult = gameState.showExplanation && gameState.explanationType === 'wrong';
  const confettiColors = ['#ff1744', '#ff6d00', '#ffea00', '#00e676', '#00e5ff', '#2979ff', '#d500f9', '#ff4081'];
  const fireworkColors = ['#fef08a', '#fdba74', '#fca5a5', '#93c5fd', '#86efac', '#c4b5fd'];

  const stopOpeningAudio = () => {
    const audio = openingAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  const clearTenSecondsInterval = () => {
    if (tenSecondsIntervalRef.current !== null) {
      window.clearInterval(tenSecondsIntervalRef.current);
      tenSecondsIntervalRef.current = null;
    }
  };

  const stopTenSecondsTimer = () => {
    clearTenSecondsInterval();
    if (tenSecondsAudioRef.current) {
      tenSecondsAudioRef.current.pause();
      tenSecondsAudioRef.current.currentTime = 0;
      tenSecondsAudioRef.current = null;
    }
    setShowTenSecondsClock(false);
    setTenSecondsRemaining(10);
  };

  const handleTenSecondsTimer = () => {
    stopTenSecondsTimer();

    const timerAudio = new Audio(tenSecondsAudioTrack);
    timerAudio.volume = teamClockVolume / 100;
    timerAudio.onended = () => {
      stopTenSecondsTimer();
    };

    tenSecondsAudioRef.current = timerAudio;
    setTenSecondsRemaining(10);
    setShowTenSecondsClock(true);

    tenSecondsIntervalRef.current = window.setInterval(() => {
      setTenSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearTenSecondsInterval();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    void timerAudio.play().catch(() => {
      stopTenSecondsTimer();
    });
  };

  useEffect(() => {
    if (!showCorrectConfetti) {
      if (applauseAudioRef.current) {
        applauseAudioRef.current.pause();
        applauseAudioRef.current.currentTime = 0;
        applauseAudioRef.current = null;
      }
      return;
    }

    const applauseAudio = new Audio(applauseAudioTrack);
    applauseAudio.volume = clamp(effectsVolume / 100, 0, 1);
    applauseAudio.loop = true;
    applauseAudio.currentTime = 0;
    applauseAudioRef.current = applauseAudio;

    void applauseAudio.play().catch(() => {
      // Ignora bloqueios de autoplay em contextos sem interação.
    });

    return () => {
      applauseAudio.pause();
      applauseAudio.currentTime = 0;
      if (applauseAudioRef.current === applauseAudio) {
        applauseAudioRef.current = null;
      }
    };
  }, [showCorrectConfetti, effectsVolume]);

  useEffect(() => {
    if (!showWrongResult) {
      if (wrongAudioRef.current) {
        wrongAudioRef.current.pause();
        wrongAudioRef.current.currentTime = 0;
        wrongAudioRef.current = null;
      }
      return;
    }

    const wrongAudio = new Audio(wrongAudioTrack);
    wrongAudio.volume = clamp(effectsVolume / 100, 0, 1);
    wrongAudio.currentTime = 0;
    wrongAudioRef.current = wrongAudio;

    void wrongAudio.play().catch(() => {
      // Ignora bloqueios de autoplay em contextos sem interação.
    });

    return () => {
      wrongAudio.pause();
      wrongAudio.currentTime = 0;
      if (wrongAudioRef.current === wrongAudio) {
        wrongAudioRef.current = null;
      }
    };
  }, [showWrongResult, effectsVolume]);

  const handleStartGame = () => {
    stopOpeningAudio();
    setResolvedQuestion(null);
    setSelectedQuestionId(null);
    setSelectedOption(null);
    setIsAdvancingQuestion(false);
    setGameState(prev => ({ 
      ...prev, 
      mode: 'playing', 
      currentQuestionIndex: 0,
      currentTeamIndex: 0,
      selectedOption: null,
      showExplanation: false,
      explanationType: null,
      lifelineResult: null,
      hiddenOptions: [],
      shuffledQuestions: shuffleArray(activeQuestions) 
    }));
  };

  const handleOptionClick = (option: QuestionOptionKey) => {
    if (!currentQuestion || gameState.showExplanation) return;
    setSelectedQuestionId(currentQuestion.id);
    setSelectedOption(option);
  };

  const handleConfirm = () => {
    if (!selectedOption || !currentQuestion) return;

    setResolvedQuestion(currentQuestion);
    setSelectedQuestionId(null);
    setSelectedOption(null);
    
    const isCorrect = selectedOption === currentQuestion.answer;
    
    setGameState(prev => {
      const newTeams = [...prev.teams] as [Team, Team];
      if (isCorrect) {
        newTeams[prev.currentTeamIndex].score += currentQuestion.points ?? pointsPerQuestion;
      }

      return {
        ...prev,
        teams: newTeams,
        selectedOption: null,
        showExplanation: true,
        explanationType: isCorrect ? 'correct' : 'wrong'
      };
    });
  };

  const handleSkip = () => {
    setResolvedQuestion(null);
    setSelectedQuestionId(null);
    setSelectedOption(null);
    setIsAdvancingQuestion(false);
    if (gameState.currentQuestionIndex === gameState.shuffledQuestions.length - 1) {
      setGameState(prev => ({ ...prev, mode: 'gameover', showExplanation: false }));
    } else {
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        currentTeamIndex: prev.currentTeamIndex === 0 ? 1 : 0,
        selectedOption: null,
        showExplanation: false,
        explanationType: null,
        lifelineResult: null,
        hiddenOptions: []
      }));
    }
  };

  const handleNextAction = () => {
    if (gameState.currentQuestionIndex === gameState.shuffledQuestions.length - 1) {
      setResolvedQuestion(null);
      setSelectedQuestionId(null);
      setSelectedOption(null);
      setIsAdvancingQuestion(false);
      setGameState(prev => ({ ...prev, mode: 'gameover', showExplanation: false }));
    } else {
      setIsAdvancingQuestion(true);
      setSelectedQuestionId(null);
      setSelectedOption(null);
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        currentTeamIndex: prev.currentTeamIndex === 0 ? 1 : 0,
        selectedOption: null,
        lifelineResult: null,
        hiddenOptions: []
      }));

      // Primeiro avança para a próxima questão; no frame seguinte fecha o modal de resultado.
      window.requestAnimationFrame(() => {
        setResolvedQuestion(null);
        setSelectedQuestionId(null);
        setSelectedOption(null);
        setGameState(prev => ({
          ...prev,
          showExplanation: false,
          explanationType: null
        }));
        setIsAdvancingQuestion(false);
      });
    }
  };

  const useLifeline = (type: LifelineType) => {
    if (!currentQuestion || currentTeam.lifelinesUsed.includes(type) || gameState.showExplanation) return;

    const newTeams = [...gameState.teams] as [Team, Team];
    newTeams[gameState.currentTeamIndex].lifelinesUsed.push(type);
    const optionKeys = currentOptionKeys;

    let update: Partial<GameState> = { teams: newTeams };

    switch (type) {
      case LifelineType.FIFTY_FIFTY:
        const wrongOptions = optionKeys.filter(o => o !== currentQuestion.answer);
        const toHide = wrongOptions.sort(() => Math.random() - 0.5).slice(0, Math.max(1, Math.ceil(wrongOptions.length / 2)));
        update.hiddenOptions = toHide;
        break;
      
      case LifelineType.SKIP:
        handleNextAction();
        return;

      case LifelineType.AUDIENCE:
        const audienceResults: Record<string, number> = {};
        optionKeys.forEach((key) => {
          audienceResults[key] = 0;
        });
        let remaining = 100;
        const correctBoost = Math.floor(Math.random() * 30) + 40;
        audienceResults[currentQuestion.answer] = correctBoost;
        remaining -= correctBoost;
        optionKeys.filter(k => k !== currentQuestion.answer).forEach((k, idx, arr) => {
          if (idx === arr.length - 1) { audienceResults[k] = remaining; } 
          else { const val = Math.floor(Math.random() * remaining); audienceResults[k] = val; remaining -= val; }
        });
        update.lifelineResult = { type: 'plateia', data: audienceResults };
        break;

      case LifelineType.UNIVERSITY:
        update.lifelineResult = {
          type: 'universitarios',
          data: {
            confidence: ['Alto', 'Muito Alto'][Math.floor(Math.random() * 2)],
            reason: `Com base na lição, acreditamos ser a alternativa ${currentQuestion.answer}.`
          }
        };
        break;
    }

    setGameState(prev => ({ ...prev, ...update }));
  };

  const resetToSetup = () => {
    stopTenSecondsTimer();
    setResolvedQuestion(null);
    setSelectedQuestionId(null);
    setSelectedOption(null);
    setIsAdvancingQuestion(false);
    setGameState({
      mode: 'setup',
      currentQuestionIndex: 0,
      currentTeamIndex: 0,
      teams: [
        { name: "Equipe 1", score: 0, lifelinesUsed: [] },
        { name: "Equipe 2", score: 0, lifelinesUsed: [] }
      ],
      selectedOption: null,
      showExplanation: false,
      explanationType: null,
      lifelineResult: null,
      hiddenOptions: [],
      shuffledQuestions: []
    });
  };

  const updateTeamName = (index: number, name: string) => {
    setGameState(prev => {
      const newTeams = [...prev.teams] as [Team, Team];
      newTeams[index].name = name;
      return { ...prev, teams: newTeams };
    });
  };

  const openTeamNamesModal = () => {
    setDraftTeam1Name(gameState.teams[0].name || 'Equipe 1');
    setDraftTeam2Name(gameState.teams[1].name || 'Equipe 2');
    setShowTeamNamesModal(true);
  };

  const saveTeamNames = () => {
    const team1 = draftTeam1Name.trim() || 'Equipe 1';
    const team2 = draftTeam2Name.trim() || 'Equipe 2';
    updateTeamName(0, team1);
    updateTeamName(1, team2);
    setShowTeamNamesModal(false);
  };

  const setupScaledStyle: React.CSSProperties = {
    transform: `scale(${setupZoomLevel / 100})`,
    transformOrigin: 'center center'
  };

  const setupFixedScaledStyle: React.CSSProperties = {
    transform: 'scale(0.9)',
    transformOrigin: 'center center'
  };

  const setupZoomFloatingControl = (
    <div
      className="fixed right-4 bottom-4 z-[80] flex items-center"
      onMouseEnter={() => setShowSetupZoomPanel(true)}
      onMouseLeave={() => setShowSetupZoomPanel(false)}
    >
      <div
        className={`mr-3 bg-white/65 backdrop-blur-md rounded-lg shadow-sm px-3 py-2 flex items-center gap-2.5 min-w-[200px] transition-all duration-200 ease-out ${showSetupZoomPanel ? 'opacity-100 translate-x-0 scale-100' : 'pointer-events-none opacity-0 translate-x-2 scale-95'}`}
        style={{ backgroundColor: hexToRgba(activeTheme.accent, 0.12) }}
      >
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={1}
          value={setupZoomLevel}
          onChange={(e) => setSetupZoomLevel(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
          aria-label="Barra de zoom inicial"
        />
        <span className="text-xs font-black min-w-12 text-right" style={{ color: activeTheme.primary }}>{setupZoomLevel}%</span>
      </div>
      <button
        onClick={() => setShowSetupZoomPanel(prev => !prev)}
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-transparent hover:bg-transparent backdrop-blur-sm shadow-none border-0 flex items-center justify-center opacity-40 hover:opacity-100 transition-all duration-200 ease-out active:scale-95"
        style={{ color: activeTheme.primary }}
        aria-label="Abrir controle de zoom inicial"
        title="Zoom Inicial"
      >
        <i className="fi fi-rr-zoom-in icon-font-black text-[16px] md:text-[18px] leading-none" aria-hidden="true" />
      </button>
    </div>
  );

  const settingsButton = (
    <button
      onClick={() => setShowSettings(true)}
      className="fixed top-4 right-4 z-[70] w-10 h-10 md:w-11 md:h-11 rounded-xl bg-transparent hover:bg-transparent backdrop-blur-sm shadow-none border-0 flex items-center justify-center opacity-40 hover:opacity-100 transition-all duration-200 ease-out active:scale-95"
      aria-label="Abrir configurações"
      title="Configurações"
      style={{ color: activeTheme.primary }}
    >
      <i className="fi fi-rr-menu-burger icon-font-black text-[16px] md:text-[18px] leading-none" aria-hidden="true" />
    </button>
  );

  const handleToggleFullscreen = async () => {
    if (typeof document === 'undefined') return;

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignora erro de permissão/ambiente sem suporte.
    }
  };

  const questionOptionsPanel = (
    <div
      className="fixed bottom-4 right-4 z-[70]"
      onMouseLeave={() => {
        setShowQuestionOptionsPanel(false);
        setShowGameZoomPanel(false);
        setShowQuestionVolumePanel(false);
      }}
    >
      <div
        className={`absolute bottom-full right-0 mb-2 w-[220px] rounded-lg bg-white/65 px-3 py-2 shadow-lg transition-all duration-250 ease-out ${showGameZoomPanel ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'}`}
        style={{ backgroundColor: hexToRgba(activeTheme.accent, 0.12) }}
      >
        <div className="flex items-center gap-2.5">
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={1}
            value={gameZoomLevel}
            onChange={(e) => setGameZoomLevel(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
            aria-label="Barra de zoom da tela de perguntas"
          />
          <span className="text-xs min-w-12 text-right" style={{ color: '#000', textShadow: 'none', WebkitTextStroke: 0, fontFamily: 'Arial, sans-serif', fontWeight: 400, fontStyle: 'normal' }}>{gameZoomLevel}%</span>
        </div>
      </div>

      <div
        className={`absolute bottom-full right-0 mb-2 w-[250px] rounded-lg bg-white/65 px-3 py-2 shadow-lg transition-all duration-250 ease-out ${showQuestionVolumePanel ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'}`}
        style={{ backgroundColor: hexToRgba(activeTheme.accent, 0.12) }}
      >
        <div className="mb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide" style={{ color: '#000', textShadow: 'none', WebkitTextStroke: 0, fontFamily: 'Arial, sans-serif', fontWeight: 400, fontStyle: 'normal' }}>Efeito</span>
            <span className="text-[10px]" style={{ color: '#000', textShadow: 'none', WebkitTextStroke: 0, fontFamily: 'Arial, sans-serif', fontWeight: 400, fontStyle: 'normal' }}>{effectsVolume}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={effectsVolume}
            onChange={(e) => setEffectsVolume(clamp(Number(e.target.value), 0, 100))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
            aria-label="Volume de efeito"
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide" style={{ color: '#000', textShadow: 'none', WebkitTextStroke: 0, fontFamily: 'Arial, sans-serif', fontWeight: 400, fontStyle: 'normal' }}>Time</span>
            <span className="text-[10px]" style={{ color: '#000', textShadow: 'none', WebkitTextStroke: 0, fontFamily: 'Arial, sans-serif', fontWeight: 400, fontStyle: 'normal' }}>{teamClockVolume}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={teamClockVolume}
            onChange={(e) => setTeamClockVolume(clamp(Number(e.target.value), 0, 100))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
            aria-label="Volume do time"
          />
        </div>
      </div>

      <div className="flex items-end gap-2">
      <div
        className={`flex h-10 md:h-11 items-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-1.5 py-0 shadow-lg backdrop-blur-sm transition-all duration-300 ease-out ${showQuestionOptionsPanel ? 'opacity-100 translate-x-0' : 'pointer-events-none opacity-0 translate-x-4'}`}
      >
        <button
          onClick={() => {
            void handleToggleFullscreen();
          }}
          className="w-10 h-10 md:w-11 md:h-11 bg-transparent hover:bg-transparent rounded-lg border-0 shadow-none flex items-center justify-center transition-all duration-200 ease-out active:scale-95"
          aria-label={isFullscreenMode ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
          title={isFullscreenMode ? 'Sair da tela cheia' : 'Tela cheia'}
          style={{ color: activeTheme.primary }}
        >
          {isFullscreenMode ? (
            <i className="fi fi-rs-compress icon-font-black text-[16px] md:text-[18px] leading-none" aria-hidden="true" />
          ) : (
            <img src={expandIcon} alt="" className="icon-black w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
          )}
        </button>

        <button
          onClick={() => {
            setShowQuestionVolumePanel(false);
            setShowGameZoomPanel(prev => !prev);
          }}
          className="w-10 h-10 md:w-11 md:h-11 bg-transparent hover:bg-transparent rounded-lg border-0 shadow-none flex items-center justify-center transition-all duration-200 ease-out active:scale-95"
          aria-label="Abrir controle de zoom da tela de perguntas"
          title="Zoom Perguntas"
          style={{ color: activeTheme.primary }}
        >
          <i className="fi fi-rr-zoom-in icon-font-black text-[16px] md:text-[18px] leading-none" aria-hidden="true" />
        </button>

        <button
          onClick={() => {
            setShowGameZoomPanel(false);
            setShowQuestionVolumePanel(prev => !prev);
          }}
          className="w-10 h-10 md:w-11 md:h-11 bg-transparent hover:bg-transparent rounded-lg border-0 shadow-none flex items-center justify-center transition-all duration-200 ease-out active:scale-95"
          aria-label="Abrir controle de volume"
          title="Volumes"
          style={{ color: activeTheme.primary }}
        >
          <i className="fi fi-rr-volume icon-font-black text-[16px] md:text-[18px] leading-none" aria-hidden="true" />
        </button>

      </div>

      <button
        onClick={() => {
          setShowQuestionOptionsPanel(prev => {
            const next = !prev;
            if (!next) {
              setShowGameZoomPanel(false);
              setShowQuestionVolumePanel(false);
            }
            return next;
          });
        }}
        className="group w-10 h-10 md:w-11 md:h-11 bg-transparent hover:bg-transparent rounded-lg border-0 shadow-none flex items-center justify-center transition-all duration-200 ease-out active:scale-95"
        aria-label={showQuestionOptionsPanel ? 'Recolher opções' : 'Abrir opções'}
        title={showQuestionOptionsPanel ? 'Recolher opções' : 'Abrir opções'}
        style={{ color: activeTheme.primary }}
      >
        <img
          src={showQuestionOptionsPanel ? rightOptionsIcon : leftOptionsIcon}
          alt=""
          className="icon-black w-4 h-4 md:w-5 md:h-5 opacity-30 transition-opacity duration-200 ease-out group-hover:opacity-100"
          aria-hidden="true"
        />
      </button>
      </div>
    </div>
  );

  const showUpdateButton = Boolean(electronApi?.getUpdaterState) &&
    (updaterState.available || updaterState.downloading || updaterState.downloaded);

  const handleUpdateApp = async () => {
    if (!electronApi?.downloadAndInstallUpdate || isUpdating) return;

    setIsUpdating(true);
    setShowUpdateProgressDialog(true);
    try {
      const result = await electronApi.downloadAndInstallUpdate();
    } finally {
      setIsUpdating(false);
      setShowUpdateProgressDialog(false);
    }
  };

  const updateButtonTitle = updaterState.downloading
    ? (typeof updaterState.downloadProgress === 'number' ? `Baixando atualização... ${updaterState.downloadProgress}%` : 'Baixando atualização...')
    : updaterState.downloaded
      ? 'Instalar atualização agora'
      : updaterState.version
        ? `Atualizar para ${updaterState.version}`
        : 'Atualizar aplicativo';

  const updateButton = showUpdateButton ? (
    <button
      onClick={() => {
        setShowUpdateDialog(true);
      }}
      disabled={isUpdating || updaterState.downloading}
      className="fixed top-4 right-16 md:right-[4.4rem] z-[70] w-10 h-10 md:w-11 md:h-11 rounded-xl bg-transparent hover:bg-transparent backdrop-blur-sm shadow-none border-0 flex items-center justify-center transition-all duration-200 ease-out active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label={updateButtonTitle}
      title={updateButtonTitle}
      style={{ color: activeTheme.primary }}
    >
      <img src={updateIcon} alt="" className="icon-black w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
    </button>
  ) : null;

  const updateDialog = showUpdateDialog && showUpdateButton ? (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 md:p-6 shadow-2xl text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
        <h3 className="text-lg md:text-xl font-bold text-black mb-3">Nova versão disponível</h3>
        <p className="text-sm md:text-base text-black mb-1">Existe uma atualização para o aplicativo desktop.</p>
        {updaterState.downloading ? (
          <div className="mb-6 mt-4 text-left">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
              <span>Baixando atualização</span>
              <span>{typeof updaterState.downloadProgress === 'number' ? `${updaterState.downloadProgress}%` : '...'}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-200 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(0, updaterState.downloadProgress ?? 0))}%`,
                  backgroundColor: activeTheme.primary
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm md:text-base text-black mb-6">Deseja baixar e atualizar agora?</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setDismissedUpdateVersion(null);
              setShowUpdateDialog(false);
              setShowUpdateProgressDialog(true);
              void handleUpdateApp();
            }}
            disabled={updaterState.downloading || isUpdating}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all duration-200 ease-out"
          >
            {updaterState.downloading ? 'Baixando...' : 'Sim'}
          </button>
          <button
            onClick={() => {
              setDismissedUpdateVersion(updaterState.version ?? null);
              setShowUpdateDialog(false);
            }}
            disabled={updaterState.downloading || isUpdating}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-gray-200 text-black font-bold hover:bg-gray-300 transition-all duration-200 ease-out"
          >
            Não
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const updateProgressDialog = (showUpdateProgressDialog || isUpdating || updaterState.downloading) && showUpdateButton ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 md:p-6 shadow-2xl text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
        <h3 className="text-lg md:text-xl font-bold text-black mb-2">Atualizando aplicativo</h3>
        <p className="text-sm md:text-base text-black mb-5">Aguarde. O app ficará travado até o instalador abrir.</p>
        <div className="mb-4 text-left">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            <span>{updaterState.downloading ? 'Baixando atualização' : 'Iniciando instalador'}</span>
            <span>{typeof updaterState.downloadProgress === 'number' ? `${updaterState.downloadProgress}%` : '...'}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden shadow-inner relative">
            <div
              className={`h-full rounded-full transition-all duration-200 ease-out ${updaterState.downloading ? 'update-progress-bar--indeterminate' : ''}`}
              style={{
                width: typeof updaterState.downloadProgress === 'number'
                  ? `${Math.min(100, Math.max(0, updaterState.downloadProgress))}%`
                  : updaterState.downloading || isUpdating
                    ? '100%'
                    : '0%',
                backgroundColor: activeTheme.primary
              }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 font-medium">
          {updaterState.downloading ? 'Preparando o download...' : 'Abrindo o instalador baixado...'}
        </p>
      </div>
    </div>
  ) : null;

  const appVersion = process.env.APP_VERSION || '1.0.0';

  const appFooter = (
    <div
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[60] px-2 py-0.5 text-black text-[9px] md:text-[10px] font-normal text-center pointer-events-none whitespace-nowrap"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      © 2026 | Desenvolvedor - By IASD Rio do SUL - SC | versão {appVersion}
    </div>
  );

  const questionImageInput = (
    <input
      ref={questionFileInputRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={handleQuestionFilesSelected}
    />
  );

  const imageSourceDialog = showImageSourceDialog ? (
    <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border-4 p-6" style={{ borderColor: activeTheme.accent }}>
        <p className="text-sm uppercase font-black mb-3" style={{ color: activeTheme.primary }}>Adicionar imagens</p>
        <p className="text-xs font-semibold text-gray-600 mb-5">
          Escolha a origem das imagens. A câmera solicitará permissão de acesso.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => void openQuestionCameraCapture()}
            className="rounded-2xl px-4 py-3 text-white hover:text-green-300 font-black uppercase text-xs shadow-lg transition-all duration-200 ease-out hover:brightness-110"
            style={{ backgroundColor: activeTheme.primary }}
          >
            Câmera
          </button>
          <button
            onClick={openQuestionGalleryPicker}
            className="rounded-2xl px-4 py-3 text-white hover:text-green-300 font-black uppercase text-xs shadow-lg transition-all duration-200 ease-out hover:brightness-110"
            style={{ backgroundColor: activeTheme.primary }}
          >
            Galeria
          </button>
        </div>
        <button
          onClick={() => setShowImageSourceDialog(false)}
          className="mt-4 w-full rounded-xl px-4 py-2.5 bg-gray-100 text-gray-700 font-black uppercase text-xs"
        >
          Cancelar
        </button>
      </div>
    </div>
  ) : null;

  const cameraCaptureDialog = showCameraDialog ? (
    <div className="fixed inset-0 z-[145] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border-4 p-4 md:p-5" style={{ borderColor: activeTheme.accent }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm uppercase font-black" style={{ color: activeTheme.primary }}>Capturar imagem</p>
          <button
            onClick={closeQuestionCameraCapture}
            className="rounded-xl px-3 py-1.5 bg-gray-100 text-gray-700 font-black uppercase text-xs"
          >
            Fechar
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden bg-black mb-4">
          <video ref={cameraVideoRef} autoPlay playsInline muted className="w-full h-auto max-h-[60vh] object-cover" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => void captureCameraImage()}
            className="rounded-2xl px-4 py-3 text-white hover:text-green-300 font-black uppercase text-xs shadow-lg transition-all duration-200 ease-out hover:brightness-110"
            style={{ backgroundColor: activeTheme.primary }}
          >
            Tirar foto
          </button>
          <button
            onClick={closeQuestionCameraCapture}
            className="rounded-2xl px-4 py-3 bg-gray-100 text-gray-700 font-black uppercase text-xs"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (showSettings && gameState.mode !== 'playing') {
    const settingsZoomStyle: React.CSSProperties = {
      zoom: `${setupZoomLevel}%`
    };

    return (
      <div className="min-h-[100dvh] h-[100dvh] flex items-center justify-center p-3 md:p-8 overflow-y-auto settings-scroll">
        <div className="w-[98vw] h-[96dvh] md:w-[95vw] md:h-[95dvh] max-w-none flex items-center justify-center" style={settingsZoomStyle}>
          <div className="w-full h-full bg-white rounded-[2rem] p-5 md:p-8 shadow-2xl border-4 flex flex-col" style={{ borderColor: activeTheme.accent, color: activeTheme.primary, fontFamily: 'Arial Local, Arial, sans-serif', fontSize: '15pt' }}>
            <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-black uppercase leading-none flex items-center gap-2 md:gap-2">
                <i className="fi fi-rr-menu-burger icon-font-black text-[20px] md:text-[24px] leading-none" aria-hidden="true" />
                <span className="hidden md:inline translate-y-[1px]">Configurações</span>
              </h2>
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={handleApplyFontChanges}
                  disabled={!hasPendingFontChanges}
                  className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-white hover:text-green-300 font-black uppercase text-[10px] md:text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Aplicar
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-white hover:text-green-300 font-black py-2 md:py-2.5 px-4 md:px-5 rounded-xl text-[10px] md:text-sm uppercase shadow-lg transition-all duration-200 ease-out hover:brightness-110"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Voltar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] gap-5 md:gap-6 flex-1 min-h-0">
              <aside className="bg-gray-50 rounded-2xl p-4 md:p-5">
                <p className="text-xs uppercase font-black text-gray-500 mb-4 tracking-widest">Menu</p>
                <div className="space-y-2">
                  {[
                    { id: 'interface', label: 'Interface' },
                    { id: 'perguntas', label: 'Perguntas' },
                    { id: 'fontes', label: 'Fontes' }
                  ].map((item) => {
                    const isActive = settingsSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSettingsSection(item.id as 'interface' | 'perguntas' | 'fontes')}
                        className={`w-full text-left px-4 py-2.5 md:py-3 rounded-xl font-black uppercase text-xs md:text-sm transition-all border ${isActive ? 'shadow-md' : 'hover:bg-white'}`}
                        style={isActive
                          ? {
                              color: activeTheme.primary,
                              backgroundColor: hexToRgba(activeTheme.accent, 0.45),
                              borderColor: hexToRgba(activeTheme.primary, 0.18)
                            }
                          : {
                              color: '#4b5563',
                              backgroundColor: 'rgba(255,255,255,0.72)',
                              borderColor: 'rgba(255,255,255,0.85)'
                            }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="bg-gray-50 rounded-2xl p-4 md:p-6 overflow-y-auto settings-scroll h-full min-h-0">
                {settingsSection === 'interface' ? (
                  <div className="text-left">
                    <p className="text-sm uppercase font-black mb-3">Som e áudio</p>
                    <p className="text-gray-700 font-semibold mb-5">Configure os níveis de volume do app.</p>

                    <div className="space-y-4 mb-7">
                      <div className="rounded-xl bg-white/85 p-4 shadow-sm border border-white/70">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="font-black uppercase text-sm">Volume de Música</p>
                          <span className="text-sm font-black" style={{ color: activeTheme.primary }}>{musicVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(clamp(Number(e.target.value), 0, 100))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                        />
                      </div>

                      <div className="rounded-xl bg-white/85 p-4 shadow-sm border border-white/70">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="font-black uppercase text-sm">Volume de efeito</p>
                          <span className="text-sm font-black" style={{ color: activeTheme.primary }}>{effectsVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={effectsVolume}
                          onChange={(e) => setEffectsVolume(clamp(Number(e.target.value), 0, 100))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                        />
                        <p className="text-xs font-semibold text-gray-500 mt-2">Será usado para os efeitos sonoros futuramente.</p>
                      </div>

                      <div className="rounded-xl bg-white/85 p-4 shadow-sm border border-white/70">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="font-black uppercase text-sm">Volume do time</p>
                          <span className="text-sm font-black" style={{ color: activeTheme.primary }}>{teamClockVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={teamClockVolume}
                          onChange={(e) => setTeamClockVolume(clamp(Number(e.target.value), 0, 100))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                        />
                        <p className="text-xs font-semibold text-gray-500 mt-2">Será usado para o relógio das equipes futuramente.</p>
                      </div>
                    </div>

                    <p className="text-sm uppercase font-black mb-3">Temas e Cores</p>
                    <p className="text-gray-700 font-semibold mb-5">Escolha uma combinação de cores para aplicar no aplicativo.</p>
                    <div className="space-y-4">
                      {COLOR_THEMES.map((theme) => {
                        const isSelected = theme.id === themeId;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => setThemeId(theme.id)}
                            className={`w-full rounded-xl border px-4 py-4 text-left transition-all duration-200 ease-out ${isSelected ? 'shadow-md scale-[1.01]' : 'hover:bg-white/70'}`}
                            style={{ borderColor: isSelected ? theme.primary : 'transparent', backgroundColor: isSelected ? 'rgba(255,255,255,0.9)' : 'transparent' }}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-black uppercase text-sm" style={{ color: theme.primary }}>{theme.name}</p>
                                <p className="text-xs font-semibold text-gray-500 mt-1">{isSelected ? 'Selecionada' : 'Clique para selecionar'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {[theme.gradientStart, theme.gradientEnd, theme.primary, theme.accent].map((color, idx) => (
                                  <span
                                    key={`${theme.id}-${idx}`}
                                    className="w-5 h-5 rounded-full shadow"
                                    style={{ backgroundColor: color }}
                                    aria-hidden="true"
                                  />
                                ))}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      <div
                        className={`w-full rounded-xl border px-4 py-4 text-left transition-all duration-200 ease-out ${themeId === 'custom' ? 'shadow-md scale-[1.01]' : 'hover:bg-white/70'}`}
                        style={{ borderColor: themeId === 'custom' ? activeTheme.primary : 'transparent', backgroundColor: themeId === 'custom' ? 'rgba(255,255,255,0.9)' : 'transparent' }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-black uppercase text-sm" style={{ color: activeTheme.primary }}>Personalizada</p>
                            <p className="text-xs font-semibold text-gray-500 mt-1">Escolha a cor que quiser</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {[mixHex(customColor, '#ffffff', 0.55), customColor, mixHex(customColor, '#ffffff', 0.35), mixHex(customColor, '#000000', 0.25)].map((color, idx) => (
                              <span
                                key={`custom-${idx}`}
                                className="w-5 h-5 rounded-full shadow"
                                style={{ backgroundColor: color }}
                                aria-hidden="true"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => {
                              setCustomColor(normalizeHex(e.target.value));
                              setThemeId('custom');
                            }}
                            className="w-12 h-9 rounded-lg cursor-pointer border-0 bg-transparent"
                            aria-label="Selecionar cor personalizada"
                          />
                          <button
                            onClick={() => setThemeId('custom')}
                            className="px-4 py-2 rounded-lg text-white font-bold text-xs md:text-sm"
                            style={{ backgroundColor: customColor }}
                          >
                            Usar Cor Personalizada
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : settingsSection === 'perguntas' ? (
                  <div className="text-left flex h-full flex-col">
                    <div>
                      <p className="text-sm uppercase font-black mb-3">Perguntas</p>
                      <p className="text-gray-700 font-semibold mb-4">Escolha como deseja gerar suas perguntas.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                      <button
                        onClick={() => setQuestionGenerationMode('manual')}
                        className={`rounded-xl px-4 py-2.5 font-black uppercase text-xs md:text-sm transition-all border ${questionGenerationMode === 'manual' ? 'shadow-md' : 'hover:bg-white'}`}
                        style={questionGenerationMode === 'manual'
                          ? {
                              color: activeTheme.primary,
                              backgroundColor: hexToRgba(activeTheme.accent, 0.45),
                              borderColor: hexToRgba(activeTheme.primary, 0.18)
                            }
                          : {
                              color: '#4b5563',
                              backgroundColor: 'rgba(255,255,255,0.72)',
                              borderColor: 'rgba(255,255,255,0.85)'
                            }}
                      >
                        Manual
                      </button>
                      <button
                        onClick={() => setQuestionGenerationMode('ia')}
                        className={`rounded-xl px-4 py-2.5 font-black uppercase text-xs md:text-sm transition-all border ${questionGenerationMode === 'ia' ? 'shadow-md' : 'hover:bg-white'}`}
                        style={questionGenerationMode === 'ia'
                          ? {
                              color: activeTheme.primary,
                              backgroundColor: hexToRgba(activeTheme.accent, 0.45),
                              borderColor: hexToRgba(activeTheme.primary, 0.18)
                            }
                          : {
                              color: '#4b5563',
                              backgroundColor: 'rgba(255,255,255,0.72)',
                              borderColor: 'rgba(255,255,255,0.85)'
                            }}
                      >
                        IA
                      </button>
                    </div>

                    {questionGenerationMode === 'manual' ? (
                      <>
                        <div className="grid gap-4 flex-1 content-start md:grid-cols-2">
                          <div className="rounded-xl bg-white/80 p-4 shadow-sm border border-white/70">
                            <p className="font-black uppercase text-sm mb-2">Quantidade de perguntas</p>
                            <input
                              type="number"
                              min={MIN_QUESTION_COUNT}
                              max={30}
                              value={questionCount}
                              onFocus={selectNumericInputValue}
                              onClick={selectNumericInputValue}
                              onChange={(e) => setQuestionCount(clamp(Number(e.target.value) || 1, 1, 30))}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-bold text-gray-700 outline-none"
                            />
                            {questionCount < MIN_QUESTION_COUNT && (
                              <p className="mt-2 text-xs font-black text-red-600">A quantidade minima de perguntas e {MIN_QUESTION_COUNT}.</p>
                            )}
                          </div>

                          <div className="rounded-xl bg-white/80 p-4 shadow-sm border border-white/70">
                            <p className="font-black uppercase text-sm mb-2">Quantidade de opções</p>
                            <input
                              type="number"
                              min={2}
                              max={6}
                              value={optionsPerQuestion}
                              onFocus={selectNumericInputValue}
                              onClick={selectNumericInputValue}
                              onChange={(e) => setOptionsPerQuestion(clamp(Number(e.target.value) || 2, 2, 6))}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-bold text-gray-700 outline-none"
                            />
                          </div>

                          <div className="rounded-xl bg-white/80 p-4 shadow-sm border border-white/70 md:col-span-2">
                            <p className="font-black uppercase text-sm mb-2">Pontuação por pergunta</p>
                            <input
                              type="number"
                              min={1}
                              step={100}
                              value={pointsPerQuestion}
                              onFocus={selectNumericInputValue}
                              onClick={selectNumericInputValue}
                              onChange={(e) => setPointsPerQuestion(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-bold text-gray-700 outline-none"
                            />
                          </div>
                        </div>

                        <button
                          onClick={openQuestionBuilder}
                          disabled={!questionBuilderIsReady}
                          className="mt-6 inline-flex self-center rounded-2xl px-4 md:px-5 py-3 md:py-4 text-white hover:text-green-300 font-black uppercase text-xs md:text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: activeTheme.primary }}
                        >
                          Gerar perguntas
                        </button>
                      </>
                    ) : (
                      <div className="rounded-xl bg-white/85 p-5 shadow-sm border border-white/70 space-y-4">
                        <p className="font-black uppercase text-sm mb-1" style={{ color: activeTheme.primary }}>IA</p>
                        <p className="text-xs font-semibold text-gray-500">
                          Use o botão abaixo para tirar fotos ou importar várias imagens da galeria.
                          A IA vai ler as imagens e montar as perguntas automaticamente.
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                          <button
                            onClick={openQuestionFilePicker}
                            disabled={aiGenerationBusy}
                            className="inline-flex w-full sm:w-[220px] items-center justify-center rounded-2xl px-5 py-3 text-white hover:text-green-300 font-black uppercase text-xs md:text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: activeTheme.primary }}
                          >
                            {aiGenerationBusy ? 'Processando imagens...' : (
                              <>
                                <span className="md:hidden">Imagens</span>
                                <span className="hidden md:inline">Imagens</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => void handleGenerateAiFromSelectedImages()}
                            disabled={aiGenerationBusy || selectedImageFiles.length === 0}
                            className="inline-flex w-full sm:w-[220px] items-center justify-center rounded-2xl px-5 py-3 text-white hover:text-green-300 font-black uppercase text-xs md:text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: activeTheme.primary }}
                          >
                            Gerar com IA
                          </button>
                        </div>
                        {selectedImageFiles.length > 0 && (
                          <p className="mt-3 text-xs font-black text-gray-700 text-center">{selectedImageFiles.length} imagem(ns) selecionada(s).</p>
                        )}
                        {aiGenerationError && (
                          <p className="text-xs font-black text-red-600">{aiGenerationError}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-left">
                    <p className="text-sm uppercase font-black mb-3">Fontes</p>
                    <p className="text-gray-700 font-semibold mb-5">Defina fonte e tamanho para Pergunta e Respostas.</p>

                    <div className="space-y-5">
                      <div className="rounded-xl bg-white/85 p-4 shadow-sm">
                        <p className="font-black uppercase text-sm mb-3">Pergunta</p>
                        <div className="grid grid-cols-1 md:grid-cols-[140px_minmax(0,1fr)] gap-3 items-center mb-4">
                          <label className="text-sm font-black uppercase text-gray-600">Fonte:</label>
                          <select
                            value={draftQuestionFontId}
                            onChange={(e) => setDraftQuestionFontId(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-700 outline-none"
                          >
                            {FONT_OPTIONS.map((font) => (
                              <option key={font.id} value={font.id}>{font.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-[140px_minmax(0,1fr)] gap-3 items-center">
                          <label className="text-sm font-black uppercase text-gray-600">Tamanho:</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={MIN_FONT_SIZE_PT}
                              max={MAX_FONT_SIZE_PT}
                              step={0.5}
                              value={draftQuestionFontSize}
                              onChange={(e) => setDraftQuestionFontSize(clamp(Number(e.target.value), MIN_FONT_SIZE_PT, MAX_FONT_SIZE_PT))}
                              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                            />
                            <span className="min-w-16 text-right text-sm font-black" style={{ color: activeTheme.primary }}>{draftQuestionFontSize.toFixed(1)} pt</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/85 p-4 shadow-sm">
                        <p className="font-black uppercase text-sm mb-3">Respostas</p>
                        <div className="grid grid-cols-1 md:grid-cols-[140px_minmax(0,1fr)] gap-3 items-center mb-4">
                          <label className="text-sm font-black uppercase text-gray-600">Fonte:</label>
                          <select
                            value={draftAnswerFontId}
                            onChange={(e) => setDraftAnswerFontId(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-700 outline-none"
                          >
                            {FONT_OPTIONS.map((font) => (
                              <option key={font.id} value={font.id}>{font.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-[140px_minmax(0,1fr)] gap-3 items-center">
                          <label className="text-sm font-black uppercase text-gray-600">Tamanho:</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={MIN_FONT_SIZE_PT}
                              max={MAX_FONT_SIZE_PT}
                              step={0.5}
                              value={draftAnswerFontSize}
                              onChange={(e) => setDraftAnswerFontSize(clamp(Number(e.target.value), MIN_FONT_SIZE_PT, MAX_FONT_SIZE_PT))}
                              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                            />
                            <span className="min-w-16 text-right text-sm font-black" style={{ color: activeTheme.primary }}>{draftAnswerFontSize.toFixed(1)} pt</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white p-4 md:p-5 shadow-sm border border-gray-100">
                        <p className="font-black uppercase text-sm mb-2" style={{ color: activeTheme.primary }}>Prévia na Tela de Perguntas</p>
                        <p className="text-xs text-gray-500 font-semibold mb-4">Ajuste as barras para ver o resultado em tempo real.</p>

                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 md:p-5">
                          <h4
                            className="text-2xl md:text-3xl leading-tight text-gray-800 mb-5"
                            style={{ fontFamily: previewQuestionFontFamily, fontSize: `${draftQuestionFontSize}pt` }}
                          >
                            Qual a principal mensagem da lição estudada hoje?
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              'Confiar em Deus nas decisões diárias',
                              'Nunca ajudar quem precisa',
                              'Ignorar os ensinamentos',
                              'Focar apenas em recompensas'
                            ].map((previewAnswer, idx) => (
                              <div key={`preview-answer-${idx}`} className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                                <span className="text-gray-700" style={{ fontFamily: previewAnswerFontFamily, fontSize: `${draftAnswerFontSize}pt` }}>
                                  {String.fromCharCode(65 + idx)}) {previewAnswer}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
        {showQuestionBuilder && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-6xl h-[92vh] bg-white rounded-[2rem] shadow-2xl border-4 flex flex-col overflow-hidden" style={{ borderColor: activeTheme.accent, color: activeTheme.primary, fontFamily: 'Arial Local, Arial, sans-serif', fontSize: '15pt' }}>
              <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8 md:py-5 border-b border-gray-100 bg-gray-50">
                <div>
                  <p className="text-xs uppercase font-black tracking-[0.3em] text-gray-500">Gerar perguntas</p>
                  <h3 className="text-xl md:text-3xl font-black uppercase leading-none mt-2">Montar questionário</h3>
                </div>
                <button
                  onClick={() => setShowQuestionBuilder(false)}
                  className="rounded-xl px-4 py-2.5 text-white hover:text-green-300 font-black uppercase text-xs md:text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Fechar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 settings-scroll bg-gray-50">
                <div className="grid gap-4">
                  {questionDrafts.map((draft, index) => (
                    <div key={`question-draft-${index}`} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 md:p-5">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <p className="font-black uppercase text-sm" style={{ color: activeTheme.primary }}>Pergunta {index + 1}</p>
                        <div className="text-xs font-black uppercase text-gray-500">{optionCount} opções</div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black uppercase text-gray-500 mb-2">Pergunta</label>
                          <textarea
                            value={draft.question}
                            onChange={(e) => {
                              const value = e.target.value;
                              setQuestionDrafts((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, question: value } : item));
                            }}
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none resize-none"
                            placeholder="Escreva aqui a pergunta"
                          />
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {QUESTION_OPTION_KEYS.slice(0, optionCount).map((key, optionIndex) => (
                            <div key={`${index}-${key}`}>
                              <label className="block text-xs font-black uppercase text-gray-500 mb-2">Opção {key}</label>
                              <input
                                value={draft.options[optionIndex] ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setQuestionDrafts((prev) => prev.map((item, itemIndex) => {
                                    if (itemIndex !== index) return item;
                                    const nextOptions = [...item.options];
                                    nextOptions[optionIndex] = value;
                                    return { ...item, options: nextOptions };
                                  }));
                                }}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none"
                                placeholder={`Alternativa ${key}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] items-center">
                          <label className="text-xs font-black uppercase text-gray-500">Resposta correta</label>
                          <select
                            value={QUESTION_OPTION_KEYS[Math.min(draft.answerIndex, optionCount - 1)]}
                            onChange={(e) => {
                              const selectedIndex = QUESTION_OPTION_KEYS.slice(0, optionCount).indexOf(e.target.value as QuestionOptionKey);
                              setQuestionDrafts((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, answerIndex: Math.max(0, selectedIndex) } : item));
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none"
                          >
                            {QUESTION_OPTION_KEYS.slice(0, optionCount).map((key) => (
                              <option key={`${index}-${key}-answer`} value={key}>{key}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] items-center">
                          <label className="text-xs font-black uppercase text-gray-500">Referência</label>
                          <input
                            value={draft.reference}
                            onChange={(e) => {
                              const value = e.target.value;
                              setQuestionDrafts((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, reference: value } : item));
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none"
                            placeholder="Ex: Lição de Sábado"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 bg-white px-4 py-4 md:px-8 md:py-5 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowQuestionBuilder(false)}
                  className="rounded-xl px-5 py-3 bg-gray-100 text-gray-600 font-black uppercase text-xs md:text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={generateQuestions}
                  className="rounded-xl px-5 py-3 text-white hover:text-green-300 font-black uppercase text-xs md:text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
        {questionImageInput}
        {imageSourceDialog}
        {cameraCaptureDialog}
        {setupZoomFloatingControl}
        {updateDialog}
        {appFooter}
      </div>
    );
  }

  if (gameState.mode === 'setup') {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] text-white p-4 md:p-6 text-center overflow-y-auto settings-scroll">
        <div className="w-full max-w-4xl flex flex-col items-center" style={setupFixedScaledStyle}>
          <img
            src={showDaLicaoLogo}
            alt="Show da Lição"
            className="w-full max-w-[820px] h-auto object-contain mb-8 md:mb-10 drop-shadow-2xl"
          />

          <div className="w-full max-w-md space-y-4 flex flex-col items-center">
            <button
              onClick={handleStartGame}
              className="inline-flex items-center justify-center text-white hover:text-green-300 font-black py-4 px-10 rounded-2xl text-2xl uppercase transition-all duration-200 ease-out shadow-none border-0 bg-transparent hover:bg-transparent active:scale-95"
            >
              Iniciar Jogo
            </button>
            <button
              onClick={openTeamNamesModal}
              className="inline-flex items-center justify-center text-white hover:text-green-300 font-black py-4 px-8 rounded-2xl text-xl uppercase transition-all duration-200 ease-out shadow-none border-0 bg-transparent hover:bg-transparent active:scale-95"
            >
              Alterar Equipes
            </button>
          </div>
        </div>

        {showTeamNamesModal && (
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 p-6 md:p-7 text-left" style={{ borderColor: activeTheme.accent, color: activeTheme.primary, fontFamily: 'Arial Local, Arial, sans-serif', fontSize: '15pt' }}>
              <p className="text-sm uppercase font-black mb-4">Alterar Nome de Equipes</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs uppercase font-black text-gray-600 mb-2">Equipe 1</label>
                  <input
                    type="text"
                    value={draftTeam1Name}
                    onChange={(e) => setDraftTeam1Name(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-black text-gray-600 mb-2">Equipe 2</label>
                  <input
                    type="text"
                    value={draftTeam2Name}
                    onChange={(e) => setDraftTeam2Name(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowTeamNamesModal(false)}
                  className="rounded-xl px-5 py-3 bg-gray-100 text-gray-700 font-black uppercase text-sm"
                >
                  Fechar
                </button>
                <button
                  onClick={saveTeamNames}
                  className="rounded-xl px-5 py-3 text-white font-black uppercase text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Alterar
                </button>
              </div>
            </div>
          </div>
        )}

        {updateButton}
        {settingsButton}
        {updateDialog}
        {appFooter}
      </div>
    );
  }

  if (gameState.mode === 'gameover') {
    const winner = gameState.teams[0].score > gameState.teams[1].score ? gameState.teams[0] : gameState.teams[1];
    const isDraw = gameState.teams[0].score === gameState.teams[1].score;

    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 md:p-6 overflow-y-auto settings-scroll">
        <div className="w-full max-w-3xl flex items-center justify-center" style={setupScaledStyle}>
          <div className="bg-white p-8 md:p-16 rounded-3xl shadow-2xl text-center w-full border-8" style={{ color: activeTheme.primary, borderColor: activeTheme.primary }}>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black mb-8 md:mb-10 uppercase">Fim de Jogo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className={`p-6 rounded-3xl border-4 ${winner === gameState.teams[0] && !isDraw ? '' : 'bg-gray-50 border-gray-100'}`} style={winner === gameState.teams[0] && !isDraw ? { backgroundColor: themeSoft, borderColor: activeTheme.primary } : undefined}>
              <p className="text-sm font-black uppercase mb-2">{gameState.teams[0].name}</p>
              <p className="text-4xl font-black">{gameState.teams[0].score}</p>
            </div>
            <div className={`p-6 rounded-3xl border-4 ${winner === gameState.teams[1] && !isDraw ? '' : 'bg-gray-50 border-gray-100'}`} style={winner === gameState.teams[1] && !isDraw ? { backgroundColor: themeSoft, borderColor: activeTheme.primary } : undefined}>
              <p className="text-sm font-black uppercase mb-2">{gameState.teams[1].name}</p>
              <p className="text-4xl font-black">{gameState.teams[1].score}</p>
            </div>
          </div>
          <p className="text-2xl sm:text-4xl md:text-5xl font-black mb-8 md:mb-12 uppercase italic" style={{ color: activeTheme.primary }}>
            {isDraw ? "Empate Técnico!" : `Vitória da ${winner.name}!`}
          </p>
          <button onClick={resetToSetup} className="inline-flex items-center justify-center text-white font-black py-4 md:py-5 px-10 rounded-2xl text-lg md:text-2xl transition-all duration-200 ease-out hover:brightness-110 shadow-md mb-4 md:mb-6" style={{ backgroundColor: activeTheme.primary }}>NOVA PARTIDA</button>
          <button onClick={resetToSetup} className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 md:py-4 px-10 rounded-2xl text-base md:text-xl transition-all duration-200 ease-out">VOLTAR AO MENU</button>
          </div>
        </div>
        {setupZoomFloatingControl}
        {updateDialog}
        {appFooter}
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div
        className={isFullscreenMode
          ? 'min-h-screen w-full overflow-hidden pt-[20px]'
          : 'min-h-[100dvh] w-full px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-6 overflow-y-auto settings-scroll'}
        style={{
          background: `linear-gradient(135deg, ${activeTheme.gradientStart} 0%, ${activeTheme.gradientEnd} 100%)`
        }}
      >
        <div
          className={isFullscreenMode ? 'w-full max-w-none flex flex-col items-stretch' : 'w-full max-w-7xl mx-auto flex flex-col items-stretch'}
          style={{ transform: `scale(${gameZoomLevel / 100})`, transformOrigin: 'center top' }}
        >
          <div className="sticky top-[6px] z-40 flex flex-wrap justify-between items-center gap-3 mb-3 bg-white/20 p-3 sm:p-4 md:p-5 rounded-3xl backdrop-blur-md text-white border border-white/30 shadow-2xl">
            <button onClick={resetToSetup} className="inline-flex items-center justify-center text-white hover:text-green-300 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black uppercase transition-all duration-200 ease-out shadow-lg hover:brightness-110 active:scale-90" style={{ backgroundColor: activeTheme.primary }}>Inicio</button>
            <div className="text-center flex-1 min-w-[140px]">
              <p className="text-xs font-bold uppercase opacity-80 mb-1">Equipe Atual</p>
              <p className="text-lg sm:text-2xl md:text-3xl font-black leading-none italic truncate">{currentTeam.name}</p>
            </div>
            <div className="text-right min-w-[88px]">
              <p className="text-xs font-bold uppercase opacity-80 mb-1">Questão</p>
              <p className="text-base sm:text-xl md:text-2xl font-black leading-none">0/0</p>
            </div>
          </div>

          <div className="sticky top-[76px] sm:top-[92px] md:top-[106px] z-30 relative mb-4 sm:mb-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 md:gap-4">
              <div className="min-w-0 h-[58px] sm:h-[72px] md:h-[88px] px-2 sm:px-3 rounded-2xl text-center border-2 transition-all duration-200 ease-out flex flex-col items-center justify-center bg-white/20 text-white border-white/10">
                <p className="text-xs sm:text-sm md:text-base font-black uppercase opacity-85 truncate leading-none mb-1">{gameState.teams[0].name}</p>
                <p className="text-sm sm:text-base md:text-lg font-black leading-none">{gameState.teams[0].score} pts</p>
              </div>

              <div className="h-[58px] sm:h-[72px] md:h-[88px] min-w-[58px] sm:min-w-[72px] md:min-w-[88px] px-2 sm:px-3 rounded-2xl bg-white/20 backdrop-blur-sm border-0 flex items-center justify-center">
                <i className="fi fi-ts-time-forward-ten icon-font-black text-[34px] md:text-[38px] leading-none opacity-70" aria-hidden="true" />
              </div>

              <div className="min-w-0 h-[58px] sm:h-[72px] md:h-[88px] px-2 sm:px-3 rounded-2xl text-center border-2 transition-all duration-200 ease-out flex flex-col items-center justify-center bg-white/20 text-white border-white/10">
                <p className="text-xs sm:text-sm md:text-base font-black uppercase opacity-85 truncate leading-none mb-1">{gameState.teams[1].name}</p>
                <p className="text-sm sm:text-base md:text-lg font-black leading-none">{gameState.teams[1].score} pts</p>
              </div>
            </div>
          </div>

          <div className="mt-3 sm:mt-0 bg-white rounded-[2rem] shadow-2xl p-6 md:p-10 mb-6 sm:mb-8 flex-grow border-b-[12px] relative overflow-hidden flex flex-col justify-center" style={{ borderColor: activeTheme.accent }}>
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-2xl md:text-4xl font-black text-gray-800 leading-tight mb-5">Nenhuma pergunta disponível</h3>
              <p className="text-base md:text-xl font-semibold text-gray-700 leading-relaxed mb-4">Volte na tela inicial e siga os seguintes passos:</p>
              <p className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm md:text-lg font-black text-gray-800">
                Configuração
                <i className="fi fi-rr-menu-burger icon-font-black text-[16px] md:text-[18px] leading-none" aria-hidden="true" />
                -&gt; Perguntas -&gt; Gerar Perguntas.
              </p>
            </div>
          </div>
        </div>

        {questionOptionsPanel}
        {updateDialog}
        {appFooter}
      </div>
    );
  }

  return (
    <div
      className={isFullscreenMode
        ? 'min-h-screen w-full overflow-hidden pt-[20px]'
        : 'min-h-[100dvh] w-full px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-6 overflow-y-auto settings-scroll'}
      style={{
        background: `linear-gradient(135deg, ${activeTheme.gradientStart} 0%, ${activeTheme.gradientEnd} 100%)`
      }}
    >
      <div
        className={isFullscreenMode ? 'w-full max-w-none flex flex-col items-stretch' : 'w-full max-w-7xl mx-auto flex flex-col items-stretch'}
        style={{ transform: `scale(${gameZoomLevel / 100})`, transformOrigin: 'center top' }}
      >
      {/* Header Info */}
      <div className="sticky top-[6px] z-40 flex flex-wrap justify-between items-center gap-3 mb-3 bg-white/20 p-3 sm:p-4 md:p-5 rounded-3xl backdrop-blur-md text-white border border-white/30 shadow-2xl">
        <button onClick={resetToSetup} className="inline-flex items-center justify-center text-white hover:text-green-300 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black uppercase transition-all duration-200 ease-out shadow-lg hover:brightness-110 active:scale-90" style={{ backgroundColor: activeTheme.primary }}>Inicio</button>
        <div className="text-center flex-1 min-w-[140px]">
          <p className="text-xs font-bold uppercase opacity-80 mb-1">Equipe Atual</p>
          <p className="text-lg sm:text-2xl md:text-3xl font-black leading-none italic truncate">{currentTeam.name}</p>
        </div>
        <div className="text-right min-w-[88px]">
          <p className="text-xs font-bold uppercase opacity-80 mb-1">Questão</p>
          <p className="text-base sm:text-xl md:text-2xl font-black leading-none">{gameState.currentQuestionIndex + 1}/{gameState.shuffledQuestions.length}</p>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="sticky top-[76px] sm:top-[92px] md:top-[106px] z-30 relative mb-4 sm:mb-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 md:gap-4">
          {(() => {
            const team1 = gameState.teams[0];
            const team2 = gameState.teams[1];

            return (
              <>
                <div
                  className={`min-w-0 h-[58px] sm:h-[72px] md:h-[88px] px-2 sm:px-3 rounded-2xl text-center border-2 transition-all duration-200 ease-out flex flex-col items-center justify-center ${0 === gameState.currentTeamIndex ? 'text-white border-white scale-[1.02] shadow-xl' : 'bg-white/20 text-white border-white/10'}`}
                  style={0 === gameState.currentTeamIndex ? { backgroundColor: activeTheme.primary, boxShadow: `0 0 0 3px ${themePrimaryRing}, 0 14px 22px -12px ${hexToRgba(activeTheme.primary, 0.5)}` } : undefined}
                >
                  <p className="text-xs sm:text-sm md:text-base font-black uppercase opacity-85 truncate leading-none mb-1">{team1.name}</p>
                  <p className="text-sm sm:text-base md:text-lg font-black leading-none">{team1.score} pts</p>
                </div>

                <button
                  onClick={handleTenSecondsTimer}
                  className="h-[58px] sm:h-[72px] md:h-[88px] min-w-[58px] sm:min-w-[72px] md:min-w-[88px] px-2 sm:px-3 rounded-2xl bg-white/20 hover:bg-white/25 backdrop-blur-sm shadow-none border-0 flex items-center justify-center transition-all duration-200 ease-out active:scale-95"
                  aria-label="Iniciar contador de 10 segundos"
                  title="Tempo 10s"
                >
                  <i className="fi fi-ts-time-forward-ten icon-font-black text-[34px] md:text-[38px] leading-none" aria-hidden="true" />
                </button>

                <div
                  className={`min-w-0 h-[58px] sm:h-[72px] md:h-[88px] px-2 sm:px-3 rounded-2xl text-center border-2 transition-all duration-200 ease-out flex flex-col items-center justify-center ${1 === gameState.currentTeamIndex ? 'text-white border-white scale-[1.02] shadow-xl' : 'bg-white/20 text-white border-white/10'}`}
                  style={1 === gameState.currentTeamIndex ? { backgroundColor: activeTheme.primary, boxShadow: `0 0 0 3px ${themePrimaryRing}, 0 14px 22px -12px ${hexToRgba(activeTheme.primary, 0.5)}` } : undefined}
                >
                  <p className="text-xs sm:text-sm md:text-base font-black uppercase opacity-85 truncate leading-none mb-1">{team2.name}</p>
                  <p className="text-sm sm:text-base md:text-lg font-black leading-none">{team2.score} pts</p>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {showSettings ? (
        <div className="mt-3 sm:mt-0 bg-white rounded-[2rem] shadow-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 flex-grow border-b-[12px] relative overflow-hidden flex flex-col" style={{ borderColor: activeTheme.accent }}>
          <div className="flex items-center justify-between gap-3 mb-5">
            <h3 className="text-base sm:text-lg md:text-xl font-black uppercase" style={{ color: activeTheme.primary }}>
              Configurações
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyFontChanges}
                disabled={!hasPendingFontChanges}
                className="px-3 py-2 rounded-xl text-white font-black uppercase text-[10px] md:text-xs shadow-lg transition-all duration-200 ease-out hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: activeTheme.primary }}
              >
                Aplicar
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-3 py-2 rounded-xl text-white font-black uppercase text-[10px] md:text-xs shadow-lg transition-all duration-200 ease-out hover:brightness-110"
                style={{ backgroundColor: activeTheme.primary }}
              >
                Voltar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 md:gap-5 flex-1 min-h-0">
            <aside className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs uppercase font-black text-gray-500 mb-3 tracking-widest">Menu</p>
              <div className="space-y-2">
                {[
                  { id: 'interface', label: 'Interface' },
                  { id: 'perguntas', label: 'Perguntas' },
                  { id: 'fontes', label: 'Fontes' }
                ].map((item) => {
                  const isActive = settingsSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSettingsSection(item.id as 'interface' | 'perguntas' | 'fontes')}
                      className={`w-full text-left px-4 py-2.5 rounded-xl font-black uppercase text-xs transition-all border ${isActive ? 'shadow-md' : 'hover:bg-white'}`}
                      style={isActive
                        ? {
                            color: activeTheme.primary,
                            backgroundColor: hexToRgba(activeTheme.accent, 0.45),
                            borderColor: hexToRgba(activeTheme.primary, 0.18)
                          }
                        : {
                            color: '#4b5563',
                            backgroundColor: 'rgba(255,255,255,0.72)',
                            borderColor: 'rgba(255,255,255,0.85)'
                          }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="bg-gray-50 rounded-2xl p-4 md:p-5 overflow-y-auto settings-scroll h-full min-h-0">
              {settingsSection === 'interface' ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/85 p-4 shadow-sm border border-white/70">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-black uppercase text-xs md:text-sm">Volume de Música</p>
                      <span className="text-xs md:text-sm font-black" style={{ color: activeTheme.primary }}>{musicVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(clamp(Number(e.target.value), 0, 100))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                    />
                  </div>

                  <div className="rounded-xl bg-white/85 p-4 shadow-sm border border-white/70">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-black uppercase text-xs md:text-sm">Volume de efeito</p>
                      <span className="text-xs md:text-sm font-black" style={{ color: activeTheme.primary }}>{effectsVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={effectsVolume}
                      onChange={(e) => setEffectsVolume(clamp(Number(e.target.value), 0, 100))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                    />
                  </div>

                  <div className="rounded-xl bg-white/85 p-4 shadow-sm border border-white/70">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-black uppercase text-xs md:text-sm">Volume do time</p>
                      <span className="text-xs md:text-sm font-black" style={{ color: activeTheme.primary }}>{teamClockVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={teamClockVolume}
                      onChange={(e) => setTeamClockVolume(clamp(Number(e.target.value), 0, 100))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                    />
                  </div>
                </div>
              ) : settingsSection === 'perguntas' ? (
                <div className="text-left flex h-full flex-col">
                  <p className="text-gray-700 font-semibold mb-4">Escolha como deseja gerar suas perguntas.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                    <button
                      onClick={() => setQuestionGenerationMode('manual')}
                      className={`rounded-xl px-4 py-2.5 font-black uppercase text-xs transition-all border ${questionGenerationMode === 'manual' ? 'shadow-md' : 'hover:bg-white'}`}
                      style={questionGenerationMode === 'manual'
                        ? {
                            color: activeTheme.primary,
                            backgroundColor: hexToRgba(activeTheme.accent, 0.45),
                            borderColor: hexToRgba(activeTheme.primary, 0.18)
                          }
                        : {
                            color: '#4b5563',
                            backgroundColor: 'rgba(255,255,255,0.72)',
                            borderColor: 'rgba(255,255,255,0.85)'
                          }}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() => setQuestionGenerationMode('ia')}
                      className={`rounded-xl px-4 py-2.5 font-black uppercase text-xs transition-all border ${questionGenerationMode === 'ia' ? 'shadow-md' : 'hover:bg-white'}`}
                      style={questionGenerationMode === 'ia'
                        ? {
                            color: activeTheme.primary,
                            backgroundColor: hexToRgba(activeTheme.accent, 0.45),
                            borderColor: hexToRgba(activeTheme.primary, 0.18)
                          }
                        : {
                            color: '#4b5563',
                            backgroundColor: 'rgba(255,255,255,0.72)',
                            borderColor: 'rgba(255,255,255,0.85)'
                          }}
                    >
                      IA
                    </button>
                  </div>

                  {questionGenerationMode === 'manual' ? (
                    <>
                      <div className="grid gap-4 flex-1 content-start md:grid-cols-2">
                        <div className="rounded-xl bg-white/80 p-4 shadow-sm border border-white/70">
                          <p className="font-black uppercase text-sm mb-2">Quantidade de perguntas</p>
                          <input
                            type="number"
                            min={MIN_QUESTION_COUNT}
                            max={30}
                            value={questionCount}
                            onFocus={selectNumericInputValue}
                            onClick={selectNumericInputValue}
                            onChange={(e) => setQuestionCount(clamp(Number(e.target.value) || 1, 1, 30))}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-bold text-gray-700 outline-none"
                          />
                          {questionCount < MIN_QUESTION_COUNT && (
                            <p className="mt-2 text-xs font-black text-red-600">A quantidade minima de perguntas e {MIN_QUESTION_COUNT}.</p>
                          )}
                        </div>

                        <div className="rounded-xl bg-white/80 p-4 shadow-sm border border-white/70">
                          <p className="font-black uppercase text-sm mb-2">Quantidade de opções</p>
                          <input
                            type="number"
                            min={2}
                            max={6}
                            value={optionsPerQuestion}
                            onFocus={selectNumericInputValue}
                            onClick={selectNumericInputValue}
                            onChange={(e) => setOptionsPerQuestion(clamp(Number(e.target.value) || 2, 2, 6))}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-bold text-gray-700 outline-none"
                          />
                        </div>

                        <div className="rounded-xl bg-white/80 p-4 shadow-sm border border-white/70 md:col-span-2">
                          <p className="font-black uppercase text-sm mb-2">Pontuação por pergunta</p>
                          <input
                            type="number"
                            min={1}
                            step={100}
                            value={pointsPerQuestion}
                            onFocus={selectNumericInputValue}
                            onClick={selectNumericInputValue}
                            onChange={(e) => setPointsPerQuestion(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-bold text-gray-700 outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={openQuestionBuilder}
                        disabled={!questionBuilderIsReady}
                        className="mt-6 inline-flex self-center rounded-2xl px-4 md:px-5 py-3 text-white font-black uppercase text-xs shadow-lg transition-all duration-200 ease-out hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: activeTheme.primary }}
                      >
                        Gerar perguntas
                      </button>
                    </>
                  ) : (
                    <div className="rounded-xl bg-white/85 p-5 shadow-sm border border-white/70 space-y-4">
                      <p className="font-black uppercase text-sm mb-1" style={{ color: activeTheme.primary }}>IA</p>
                      <p className="text-xs font-semibold text-gray-500">
                        Use o botão abaixo para tirar fotos ou importar várias imagens da galeria.
                        A IA vai ler as imagens e montar as perguntas automaticamente.
                      </p>
                      <div className="flex flex-col items-center">
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
                          <button
                            onClick={openQuestionFilePicker}
                            disabled={aiGenerationBusy}
                            className="inline-flex w-full sm:w-[220px] items-center justify-center rounded-2xl px-5 py-3 text-white hover:text-green-300 font-black uppercase text-xs md:text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: activeTheme.primary }}
                          >
                            {aiGenerationBusy ? 'Processando imagens...' : 'Imagens'}
                          </button>

                          <button
                            onClick={() => void handleGenerateAiFromSelectedImages()}
                            disabled={aiGenerationBusy || selectedImageFiles.length === 0}
                            className="inline-flex w-full sm:w-[220px] items-center justify-center rounded-2xl px-5 py-3 text-white hover:text-green-300 font-black uppercase text-xs md:text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: activeTheme.primary }}
                          >
                            Gerar com IA
                          </button>
                        </div>

                        {selectedImageFiles.length > 0 && (
                          <p className="mt-3 text-xs font-black text-gray-700 text-center">{selectedImageFiles.length} imagem(ns) selecionada(s).</p>
                        )}
                      </div>
                      {aiGenerationError && (
                        <p className="text-xs font-black text-red-600">{aiGenerationError}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-xl bg-white/85 p-4 shadow-sm">
                    <p className="font-black uppercase text-sm mb-3">Pergunta</p>
                    <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)] gap-3 items-center mb-4">
                      <label className="text-sm font-black uppercase text-gray-600">Fonte:</label>
                      <select
                        value={draftQuestionFontId}
                        onChange={(e) => setDraftQuestionFontId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-700 outline-none"
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font.id} value={font.id}>{font.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)] gap-3 items-center">
                      <label className="text-sm font-black uppercase text-gray-600">Tamanho:</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={MIN_FONT_SIZE_PT}
                          max={MAX_FONT_SIZE_PT}
                          step={0.5}
                          value={draftQuestionFontSize}
                          onChange={(e) => setDraftQuestionFontSize(clamp(Number(e.target.value), MIN_FONT_SIZE_PT, MAX_FONT_SIZE_PT))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                        />
                        <span className="min-w-16 text-right text-sm font-black" style={{ color: activeTheme.primary }}>{draftQuestionFontSize.toFixed(1)} pt</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/85 p-4 shadow-sm">
                    <p className="font-black uppercase text-sm mb-3">Respostas</p>
                    <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)] gap-3 items-center mb-4">
                      <label className="text-sm font-black uppercase text-gray-600">Fonte:</label>
                      <select
                        value={draftAnswerFontId}
                        onChange={(e) => setDraftAnswerFontId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-semibold text-gray-700 outline-none"
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font.id} value={font.id}>{font.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)] gap-3 items-center">
                      <label className="text-sm font-black uppercase text-gray-600">Tamanho:</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={MIN_FONT_SIZE_PT}
                          max={MAX_FONT_SIZE_PT}
                          step={0.5}
                          value={draftAnswerFontSize}
                          onChange={(e) => setDraftAnswerFontSize(clamp(Number(e.target.value), MIN_FONT_SIZE_PT, MAX_FONT_SIZE_PT))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                        />
                        <span className="min-w-16 text-right text-sm font-black" style={{ color: activeTheme.primary }}>{draftAnswerFontSize.toFixed(1)} pt</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : (
        <>
          {/* Main Question Area */}
          <div className="mt-3 sm:mt-0 bg-white rounded-[2rem] shadow-2xl p-4 sm:p-6 md:p-10 xl:p-14 mb-6 sm:mb-8 flex-grow border-b-[12px] relative overflow-hidden flex flex-col justify-center" style={{ borderColor: activeTheme.accent }}>
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-[12rem]">L</div>
            <div className="relative z-10 w-full">
              <h3
                className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-800 leading-[1.2] mb-6 sm:mb-8 md:mb-10 text-center md:text-left"
                style={{ fontFamily: questionFontFamily, fontSize: responsiveQuestionFontSize }}
              >
                {currentQuestion.question}
              </h3>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-7 ${currentOptionKeys.length > 4 ? 'lg:grid-cols-3' : ''}`}>
                {currentOptionKeys.map((key) => {
                  const isHidden = gameState.hiddenOptions.includes(key);
                  const isSelected = !isAdvancingQuestion && !gameState.showExplanation && selectedOption === key && selectedQuestionId === currentQuestion.id;
                  const isCorrect = key === currentQuestion.answer;

                  let btnClass = "relative w-full text-left rounded-[1.5rem] border-4 font-bold transition-all duration-200 ease-out flex items-center ";
                  let btnStyle: React.CSSProperties | undefined;
                  if (isHidden) btnClass += "opacity-0 pointer-events-none";
                  else if (isSelected) {
                    btnStyle = { ...answerButtonStyle, backgroundColor: '#ffffff', borderColor: '#16a34a', color: '#0f172a', boxShadow: 'none' };
                  }
                  else {
                    btnClass += "bg-white text-gray-700 shadow-md";
                    btnStyle = { ...answerButtonStyle, borderColor: '#cbd5e1' };
                  }

                  if (!btnStyle) {
                    btnStyle = { ...answerButtonStyle };
                  }

                  return (
                    <button key={key} disabled={isHidden || gameState.showExplanation} onClick={() => handleOptionClick(key)} className={btnClass} style={btnStyle}>
                      <span className={`rounded-full flex items-center justify-center shrink-0 font-black ${isSelected ? 'text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`} style={{ backgroundColor: isSelected ? activeTheme.primary : undefined, width: responsiveBadgeSize, height: responsiveBadgeSize, fontSize: responsiveBadgeFontSize }}>
                        {key}
                      </span>
                      <span className="min-w-0 leading-tight break-words" style={{ fontFamily: answerFontFamily, fontSize: responsiveAnswerFontSize, lineHeight: 1.12 }}>{currentQuestion.options[key]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-8 w-full">
            <button
              disabled={!selectedOption}
              onClick={handleConfirm}
              className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-black py-3 md:py-4 px-8 md:px-10 rounded-3xl text-base md:text-lg transition-all duration-200 ease-out shadow-xl border-b-8 border-green-600 disabled:border-gray-400 active:scale-95 uppercase tracking-wide"
            >
              Confirmar
            </button>
            <button
              onClick={handleSkip}
              className="inline-flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white font-black py-3 md:py-4 px-8 md:px-10 rounded-3xl text-base md:text-lg transition-all duration-200 ease-out shadow-xl border-b-8 border-gray-600 active:scale-95 uppercase tracking-wide"
            >
              Passar
            </button>
          </div>
        </>
      )}

      {showTenSecondsClock && (
        <div className="fixed inset-0 z-[45] flex items-center justify-center pointer-events-none">
          <div className="rounded-3xl px-8 py-6 md:px-12 md:py-8 bg-black/70 text-white border border-white/30 shadow-2xl backdrop-blur-md text-center">
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] opacity-80 mb-2">Tempo</p>
            <p className="text-5xl md:text-7xl font-black leading-none">{Math.max(0, tenSecondsRemaining)}</p>
          </div>
        </div>
      )}

      {/* Help Overlays */}
      {gameState.lifelineResult && !gameState.showExplanation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 z-50">
          <div className="bg-white rounded-[2.5rem] p-10 md:p-14 max-w-2xl w-full shadow-2xl text-center border-t-[12px]" style={{ borderColor: activeTheme.primary }}>
            {gameState.lifelineResult.type === 'plateia' && (
              <div>
                <h4 className="text-3xl font-black mb-10 uppercase tracking-tight" style={{ color: activeTheme.primary }}>Opinião da Plateia</h4>
                <div className="space-y-6">
                  {Object.entries(gameState.lifelineResult.data).map(([key, val]: [any, any]) => (
                    <div key={key} className="flex items-center gap-6">
                      <span className="font-bold text-2xl w-8">{key}</span>
                      <div className="flex-grow bg-gray-100 h-8 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full transition-all duration-200 ease-out duration-1000" style={{ width: `${val}%`, backgroundColor: activeTheme.primary }}></div>
                      </div>
                      <span className="font-bold w-20 text-right text-2xl" style={{ color: activeTheme.primary }}>{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {gameState.lifelineResult.type === 'universitarios' && (
              <div>
                <h4 className="text-3xl font-black mb-8 uppercase" style={{ color: activeTheme.primary }}>Universitários</h4>
                <div className="p-8 rounded-3xl mb-10 text-left border-2" style={{ backgroundColor: themePrimarySoft, borderColor: activeTheme.accent }}>
                  <p className="text-xl font-bold mb-4" style={{ color: activeTheme.primary }}>Confiança: <span className="underline" style={{ textDecorationColor: activeTheme.accent }}>{gameState.lifelineResult.data.confidence}</span></p>
                  <p className="text-gray-700 italic text-2xl leading-relaxed">"{gameState.lifelineResult.data.reason}"</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-6 mt-12">
              <button onClick={resetToSetup} className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold py-5 rounded-2xl text-xl uppercase transition-all duration-200 ease-out duration-200 ease-out">Inicio</button>
              <button onClick={() => setGameState(prev => ({ ...prev, lifelineResult: null }))} className="text-white font-black py-5 rounded-2xl shadow-xl text-xl uppercase transition-all duration-200 ease-out active:scale-95" style={{ backgroundColor: activeTheme.primary }}>Voltar</button>
                      </div>
          </div>
        </div>
      )}

      </div>
      {/* Feedback Overlay */}
      {gameState.showExplanation && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 md:p-6 z-[120]"
          style={{
            background: `linear-gradient(135deg, ${activeTheme.gradientStart} 0%, ${activeTheme.gradientEnd} 100%)`
          }}
        >
          <div className={`relative z-[130] rounded-[1.75rem] p-4 md:p-6 max-w-xl w-full shadow-2xl border-t-[10px] transform transition-all duration-200 ease-out animate-in fade-in zoom-in duration-300 ${gameState.explanationType === 'correct' ? 'bg-green-50 border-green-500 shadow-green-200' : 'bg-red-50 border-red-500 shadow-red-200'}`}>
            <h4 className={`text-xl md:text-2xl font-black text-center mb-3 uppercase tracking-tight ${gameState.explanationType === 'correct' ? 'text-green-700' : 'text-red-700'}`}>
              Resultado
            </h4>
            <div className={`p-4 md:p-5 rounded-[1.25rem] mb-4 border-2 shadow-inner bg-white ${gameState.explanationType === 'correct' ? 'border-green-200' : 'border-red-200'}`}>
              <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-3 text-center ${gameState.explanationType === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                {gameState.explanationType === 'correct' ? 'A resposta está certa' : 'A resposta está errada'}
              </p>
              <p className="text-gray-800 text-sm md:text-base mb-4 font-semibold leading-relaxed">
                {gameState.explanationType === 'correct' ? 'Muito bem! ' + currentTeam.name + ' marcou ponto.' : 'Resposta incorreta. Confira a referência da questão:'}
              </p>
              <div className={`mb-4 rounded-2xl border-2 p-3 md:p-4 ${gameState.explanationType === 'correct' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-2 ${gameState.explanationType === 'correct' ? 'text-green-600' : 'text-red-600'}`}>Questão correta</p>
                {explanationQuestion ? (
                  <p className="text-base md:text-lg font-black text-gray-800 leading-tight mb-1">
                    {explanationQuestion.answer}) {explanationQuestion.options[explanationQuestion.answer]}
                  </p>
                ) : null}

              </div>
              <p className={`font-black text-[11px] md:text-sm uppercase border-t-2 pt-3 leading-relaxed ${gameState.explanationType === 'correct' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}`}>
                Fonte: {explanationQuestion?.source.reference ?? 'Referência indisponível'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap">
              <button onClick={handleNextAction} className="inline-flex items-center justify-center text-white font-black py-3 px-5 rounded-3xl text-sm md:text-base shadow-2xl active:scale-95 transition-all duration-200 ease-out uppercase tracking-widest bg-green-500 hover:bg-green-600">Proxima</button>
              <button onClick={resetToSetup} className="inline-flex items-center justify-center bg-gray-50 hover:bg-gray-200 text-gray-500 font-bold py-3 px-5 rounded-3xl text-sm md:text-base uppercase transition-all duration-200 ease-out duration-200 ease-out">Sair</button>
            </div>
          </div>
        </div>
      )}

      {showCorrectConfetti && (
        <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => {
            const size = 4 + (i % 3) * 2;
            const dx = 74 + (i % 12) * 22;
            const dy = -(220 + (i % 9) * 36);
            const rotation = 100 + i * 22;
            const duration = 980 + (i % 5) * 150;

            return (
              <span
                key={`firework-left-${i}`}
                style={{
                  bottom: '-16px',
                  left: '-16px',
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: fireworkColors[i % fireworkColors.length],
                  ['--fw-duration' as any]: `${duration}ms`,
                  ['--fw-delay' as any]: `${i * 36}ms`,
                  ['--fw-x' as any]: `${dx}px`,
                  ['--fw-y' as any]: `${dy}px`,
                  ['--fw-rot' as any]: `${rotation}deg`
                }}
                className={`firework-piece ${showCorrectConfettiBurst ? 'firework-piece--bursting' : ''}`}
              />
            );
          })}
          {Array.from({ length: 24 }).map((_, i) => {
            const size = 4 + (i % 3) * 2;
            const dx = -(74 + (i % 12) * 22);
            const dy = -(220 + (i % 9) * 36);
            const rotation = -(100 + i * 22);
            const duration = 980 + (i % 5) * 150;

            return (
              <span
                key={`firework-right-${i}`}
                style={{
                  bottom: '-16px',
                  right: '-16px',
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: fireworkColors[(i + 3) % fireworkColors.length],
                  ['--fw-duration' as any]: `${duration}ms`,
                  ['--fw-delay' as any]: `${i * 36}ms`,
                  ['--fw-x' as any]: `${dx}px`,
                  ['--fw-y' as any]: `${dy}px`,
                  ['--fw-rot' as any]: `${rotation}deg`
                }}
                className={`firework-piece ${showCorrectConfettiBurst ? 'firework-piece--bursting' : ''}`}
              />
            );
          })}
          {Array.from({ length: 78 }).map((_, i) => {
            const size = 7 + (i % 5) * 2;
            const dx = 72 + (i % 18) * 20;
            const dy = -(560 + (i % 22) * 28);
            const rotation = 120 + i * 18;
            const duration = 1750 + (i % 9) * 160;

            return (
              <span
                key={`confetti-left-${i}`}
                style={{
                  bottom: '-12px',
                  left: '-12px',
                  width: `${size}px`,
                  height: `${size * 0.55}px`,
                  backgroundColor: confettiColors[i % confettiColors.length],
                  ['--confetti-duration' as any]: `${duration}ms`,
                  ['--confetti-delay' as any]: `${i * 24}ms`,
                  ['--confetti-x' as any]: `${dx}px`,
                  ['--confetti-y' as any]: `${dy}px`,
                  ['--confetti-rot' as any]: `${rotation}deg`
                }}
                className={`confetti-piece confetti-piece-left ${showCorrectConfettiBurst ? 'confetti-piece--bursting' : ''}`}
              />
            );
          })}
          {Array.from({ length: 78 }).map((_, i) => {
            const size = 7 + (i % 5) * 2;
            const dx = -(72 + (i % 18) * 20);
            const dy = -(560 + (i % 22) * 28);
            const rotation = -(120 + i * 18);
            const duration = 1750 + (i % 9) * 160;

            return (
              <span
                key={`confetti-right-${i}`}
                style={{
                  bottom: '-12px',
                  right: '-12px',
                  width: `${size}px`,
                  height: `${size * 0.55}px`,
                  backgroundColor: confettiColors[(i + 2) % confettiColors.length],
                  ['--confetti-duration' as any]: `${duration}ms`,
                  ['--confetti-delay' as any]: `${i * 24}ms`,
                  ['--confetti-x' as any]: `${dx}px`,
                  ['--confetti-y' as any]: `${dy}px`,
                  ['--confetti-rot' as any]: `${rotation}deg`
                }}
                className={`confetti-piece confetti-piece-right ${showCorrectConfettiBurst ? 'confetti-piece--bursting' : ''}`}
              />
            );
          })}
        </div>
      )}

      {showSettings && showQuestionBuilder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-6xl h-[92vh] bg-white rounded-[2rem] shadow-2xl border-4 flex flex-col overflow-hidden" style={{ borderColor: activeTheme.accent, color: activeTheme.primary, fontFamily: 'Arial Local, Arial, sans-serif', fontSize: '15pt' }}>
            <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8 md:py-5 border-b border-gray-100 bg-gray-50">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.3em] text-gray-500">Gerar perguntas</p>
                <h3 className="text-xl md:text-3xl font-black uppercase leading-none mt-2">Montar questionário</h3>
              </div>
              <button
                onClick={() => setShowQuestionBuilder(false)}
                className="rounded-xl px-4 py-2.5 text-white hover:text-green-300 font-black uppercase text-xs md:text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110"
                style={{ backgroundColor: activeTheme.primary }}
              >
                Fechar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 settings-scroll bg-gray-50">
              <div className="grid gap-4">
                {questionDrafts.map((draft, index) => (
                  <div key={`question-draft-${index}`} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 md:p-5">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <p className="font-black uppercase text-sm" style={{ color: activeTheme.primary }}>Pergunta {index + 1}</p>
                      <div className="text-xs font-black uppercase text-gray-500">{optionCount} opções</div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black uppercase text-gray-500 mb-2">Pergunta</label>
                        <textarea
                          value={draft.question}
                          onChange={(e) => {
                            const value = e.target.value;
                            setQuestionDrafts((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, question: value } : item));
                          }}
                          rows={3}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none resize-none"
                          placeholder="Escreva aqui a pergunta"
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {QUESTION_OPTION_KEYS.slice(0, optionCount).map((key, optionIndex) => (
                          <div key={`${index}-${key}`}>
                            <label className="block text-xs font-black uppercase text-gray-500 mb-2">Opção {key}</label>
                            <input
                              value={draft.options[optionIndex] ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setQuestionDrafts((prev) => prev.map((item, itemIndex) => {
                                  if (itemIndex !== index) return item;
                                  const nextOptions = [...item.options];
                                  nextOptions[optionIndex] = value;
                                  return { ...item, options: nextOptions };
                                }));
                              }}
                              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none"
                              placeholder={`Alternativa ${key}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] items-center">
                        <label className="text-xs font-black uppercase text-gray-500">Resposta correta</label>
                        <select
                          value={QUESTION_OPTION_KEYS[Math.min(draft.answerIndex, optionCount - 1)]}
                          onChange={(e) => {
                            const selectedIndex = QUESTION_OPTION_KEYS.slice(0, optionCount).indexOf(e.target.value as QuestionOptionKey);
                            setQuestionDrafts((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, answerIndex: Math.max(0, selectedIndex) } : item));
                          }}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none"
                        >
                          {QUESTION_OPTION_KEYS.slice(0, optionCount).map((key) => (
                            <option key={`${index}-${key}-answer`} value={key}>{key}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] items-center">
                        <label className="text-xs font-black uppercase text-gray-500">Referência</label>
                        <input
                          value={draft.reference}
                          onChange={(e) => {
                            const value = e.target.value;
                            setQuestionDrafts((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, reference: value } : item));
                          }}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none"
                          placeholder="Ex: Lição de Sábado"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 bg-white px-4 py-4 md:px-8 md:py-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowQuestionBuilder(false)}
                className="rounded-xl px-5 py-3 bg-gray-100 text-gray-600 font-black uppercase text-xs md:text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={generateQuestions}
                className="rounded-xl px-5 py-3 text-white hover:text-green-300 font-black uppercase text-xs md:text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110"
                style={{ backgroundColor: activeTheme.primary }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {questionImageInput}
      {imageSourceDialog}
      {cameraCaptureDialog}

      {questionOptionsPanel}
      {updateDialog}
      {updateProgressDialog}
      {appFooter}
    </div>
  );
};

export default App;

