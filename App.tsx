
import React, { useEffect, useRef, useState } from 'react';
import { questions } from './questions';
import { GameState, LifelineType, QuestionOptionKey, QuestionOptions, Team, Question } from './types';
import settingsIcon from './img/settings.svg';
import updateIcon from './img/Atualizar.svg';
import moreZoomIcon from './img/mais-zoom.svg';
import tempoIcon from './img/tempo.svg';
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
  { id: 'advent-sans-logo', label: 'Advent Sans Logo', family: 'Advent Sans Logo' },
  { id: 'arial-local', label: 'Arial', family: 'Arial Local' },
  { id: 'roboto-semicondensed-regular', label: 'Roboto SemiCondensed Regular', family: 'Roboto SemiCondensed Regular' },
  { id: 'roboto-condensed-medium', label: 'Roboto Condensed Medium', family: 'Roboto Condensed Medium' },
  { id: 'roboto-condensed-bold', label: 'Roboto Condensed Bold', family: 'Roboto Condensed Bold' },
  { id: 'roboto-condensed-black', label: 'Roboto Condensed Black', family: 'Roboto Condensed Black' },
  { id: 'roboto-extralight', label: 'Roboto ExtraLight', family: 'Roboto ExtraLight' }
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
const DEFAULT_MUSIC_VOLUME = 30;
const DEFAULT_EFFECTS_VOLUME = 90;
const DEFAULT_TEAM_CLOCK_VOLUME = 60;
const QUESTION_OPTION_KEYS: QuestionOptionKey[] = ['A', 'B', 'C', 'D', 'E', 'F'];
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

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

  const electronApi = (typeof window !== 'undefined'
    ? (window as Window & { electronAPI?: ElectronQuestionsApi }).electronAPI
    : undefined);

  const [showSettings, setShowSettings] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [dismissedUpdateVersion, setDismissedUpdateVersion] = useState<string | null>(null);
  const [updaterState, setUpdaterState] = useState<UpdaterState>({
    available: false,
    downloading: false,
    downloaded: false,
    version: null,
    error: null
  });
  const [showSetupZoomPanel, setShowSetupZoomPanel] = useState(false);
  const [showGameZoomPanel, setShowGameZoomPanel] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'interface' | 'perguntas' | 'fontes'>('interface');
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

    setShowUpdateDialog(true);
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
  const questionBuilderIsReady = questionCount > 0 && optionCount >= 2;

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
    const letters = QUESTION_OPTION_KEYS.slice(0, optionCount);
    const generatedQuestions: Question[] = questionDrafts.map((draft, index) => {
      const options = letters.reduce((accumulator, key, optionIndex) => {
        accumulator[key] = draft.options[optionIndex]?.trim() || `Opção ${key}`;
        return accumulator;
      }, {} as QuestionOptions);

      const answer = letters[Math.min(draft.answerIndex, letters.length - 1)] ?? letters[0];

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
  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const currentOptionKeys = currentQuestion ? (Object.keys(currentQuestion.options) as QuestionOptionKey[]) : [];
  const showCorrectConfetti = gameState.showExplanation && gameState.explanationType === 'correct';
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
    setGameState(prev => ({ ...prev, selectedOption: option }));
  };

  const handleConfirm = () => {
    if (!gameState.selectedOption) return;
    
    const isCorrect = gameState.selectedOption === currentQuestion.answer;
    
    setGameState(prev => {
      const newTeams = [...prev.teams] as [Team, Team];
      if (isCorrect) {
        newTeams[prev.currentTeamIndex].score += currentQuestion.points ?? pointsPerQuestion;
      }

      return {
        ...prev,
        teams: newTeams,
        showExplanation: true,
        explanationType: isCorrect ? 'correct' : 'wrong'
      };
    });
  };

  const handleSkip = () => {
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
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/20 hover:bg-white/40 backdrop-blur-sm shadow-lg border border-white/30 flex items-center justify-center transition-all duration-200 ease-out active:scale-95"
        style={{ color: activeTheme.primary }}
        aria-label="Abrir controle de zoom inicial"
        title="Zoom Inicial"
      >
        <img src={moreZoomIcon} alt="" className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
      </button>
    </div>
  );

  const gameZoomFloatingControl = (
    <div
      className="fixed right-4 bottom-4 z-[80] flex items-center"
      onMouseEnter={() => setShowGameZoomPanel(true)}
      onMouseLeave={() => setShowGameZoomPanel(false)}
    >
      <div
        className={`mr-3 bg-white/65 backdrop-blur-md rounded-lg shadow-sm px-3 py-2 flex items-center gap-2.5 min-w-[200px] transition-all duration-200 ease-out ${showGameZoomPanel ? 'opacity-100 translate-x-0 scale-100' : 'pointer-events-none opacity-0 translate-x-2 scale-95'}`}
        style={{ backgroundColor: hexToRgba(activeTheme.accent, 0.12) }}
      >
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
        <span className="text-xs font-black min-w-12 text-right" style={{ color: activeTheme.primary }}>{gameZoomLevel}%</span>
      </div>
      <button
        onClick={() => setShowGameZoomPanel(prev => !prev)}
        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/20 hover:bg-white/40 backdrop-blur-sm shadow-lg border border-white/30 flex items-center justify-center transition-all duration-200 ease-out active:scale-95"
        style={{ color: activeTheme.primary }}
        aria-label="Abrir controle de zoom da tela de perguntas"
        title="Zoom Perguntas"
      >
        <img src={moreZoomIcon} alt="" className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
      </button>
    </div>
  );

  const settingsButton = (
    <button
      onClick={() => setShowSettings(true)}
      className="fixed top-4 right-4 z-[70] w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/20 hover:bg-white/40 backdrop-blur-sm shadow-lg border border-white/30 flex items-center justify-center transition-all duration-200 ease-out active:scale-95"
      aria-label="Abrir configurações"
      title="Configurações"
      style={{ color: activeTheme.primary }}
    >
      <img src={settingsIcon} alt="" className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
    </button>
  );

  const showUpdateButton = Boolean(electronApi?.getUpdaterState) &&
    (updaterState.available || updaterState.downloading || updaterState.downloaded);

  const handleUpdateApp = async () => {
    if (!electronApi?.downloadAndInstallUpdate || isUpdating) return;

    setIsUpdating(true);
    try {
      const result = await electronApi.downloadAndInstallUpdate();
      if (!result.ok) {
        window.alert(result.error ?? 'Não foi possível iniciar a atualização do aplicativo.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const updateButtonTitle = updaterState.downloading
    ? 'Baixando atualização...'
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
      className="fixed top-4 right-16 md:right-[4.4rem] z-[70] w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/20 hover:bg-white/40 backdrop-blur-sm shadow-lg border border-white/30 flex items-center justify-center transition-all duration-200 ease-out active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      aria-label={updateButtonTitle}
      title={updateButtonTitle}
      style={{ color: activeTheme.primary }}
    >
      <img src={updateIcon} alt="" className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
    </button>
  ) : null;

  const updateDialog = showUpdateDialog && showUpdateButton ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 md:p-6 shadow-2xl text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
        <h3 className="text-lg md:text-xl font-bold text-black mb-3">Nova versão disponível</h3>
        <p className="text-sm md:text-base text-black mb-1">Existe uma atualização para o aplicativo desktop.</p>
        <p className="text-sm md:text-base text-black mb-6">Deseja baixar e atualizar agora?</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setDismissedUpdateVersion(null);
              setShowUpdateDialog(false);
              void handleUpdateApp();
            }}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all duration-200 ease-out"
          >
            Sim
          </button>
          <button
            onClick={() => {
              setDismissedUpdateVersion(updaterState.version ?? null);
              setShowUpdateDialog(false);
            }}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 bg-gray-200 text-black font-bold hover:bg-gray-300 transition-all duration-200 ease-out"
          >
            Não
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const appFooter = (
    <div
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[60] px-2 py-0.5 text-black text-[9px] md:text-[10px] font-normal text-center pointer-events-none whitespace-nowrap"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      © 2026 | Desenvolvedor - Railson Monteiro | Todos os direitos reservados | versão 1.0
    </div>
  );

  if (showSettings) {
    const settingsZoomStyle: React.CSSProperties = {
      zoom: `${setupZoomLevel}%`
    };

    return (
      <div className="min-h-[100dvh] h-[100dvh] flex items-center justify-center p-3 md:p-8 overflow-y-auto settings-scroll">
        <div className="w-[98vw] h-[96dvh] md:w-[95vw] md:h-[95dvh] max-w-none flex items-center justify-center" style={settingsZoomStyle}>
          <div className="w-full h-full bg-white rounded-[2rem] p-5 md:p-8 shadow-2xl border-4 flex flex-col" style={{ borderColor: activeTheme.accent, color: activeTheme.primary, fontFamily: 'Arial Local, Arial, sans-serif', fontSize: '15pt' }}>
            <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-black uppercase leading-none flex items-center gap-2 md:gap-2">
                <img src={settingsIcon} alt="" className="w-6 h-6 md:w-7 md:h-7" aria-hidden="true" />
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
                      <p className="text-gray-700 font-semibold mb-5">Defina quantas perguntas serão criadas, quantas alternativas cada uma terá e quantos pontos valerá cada acerto.</p>
                    </div>

                    <div className="grid gap-4 flex-1 content-start">
                      <div className="rounded-xl bg-white/80 p-4 shadow-sm border border-white/70">
                        <p className="font-black uppercase text-sm mb-2">Quantidade de perguntas</p>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={questionCount}
                          onChange={(e) => setQuestionCount(clamp(Number(e.target.value) || 1, 1, 30))}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-bold text-gray-700 outline-none"
                        />
                      </div>

                      <div className="rounded-xl bg-white/80 p-4 shadow-sm border border-white/70">
                        <p className="font-black uppercase text-sm mb-2">Quantidade de opções</p>
                        <input
                          type="number"
                          min={2}
                          max={6}
                          value={optionsPerQuestion}
                          onChange={(e) => setOptionsPerQuestion(clamp(Number(e.target.value) || 2, 2, 6))}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-bold text-gray-700 outline-none"
                        />
                      </div>

                      <div className="rounded-xl bg-white/80 p-4 shadow-sm border border-white/70">
                        <p className="font-black uppercase text-sm mb-2">Pontuação por pergunta</p>
                        <input
                          type="number"
                          min={1}
                          step={100}
                          value={pointsPerQuestion}
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
        {setupZoomFloatingControl}
        {updateDialog}
        {appFooter}
      </div>
    );
  }

  if (gameState.mode === 'setup') {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] text-white p-4 md:p-6 text-center overflow-y-auto settings-scroll">
        <div className="w-full max-w-4xl flex flex-col items-center" style={setupScaledStyle}>
          <img
            src={showDaLicaoLogo}
            alt="Show da Lição"
            className="w-full max-w-[820px] h-auto object-contain mb-8 md:mb-10 drop-shadow-2xl"
          />

          <div className="w-full max-w-md space-y-4 flex flex-col items-center">
            <button
              onClick={handleStartGame}
              className="inline-flex items-center justify-center text-white hover:text-green-300 font-black py-4 px-10 rounded-2xl text-2xl uppercase transition-all duration-200 ease-out shadow-lg hover:brightness-110 active:scale-95"
              style={{ backgroundColor: activeTheme.primary }}
            >
              Iniciar Jogo
            </button>
            <button
              onClick={openTeamNamesModal}
              className="inline-flex items-center justify-center text-white hover:text-green-300 font-black py-4 px-10 rounded-2xl text-xl uppercase transition-all duration-200 ease-out shadow-lg hover:brightness-110 active:scale-95"
              style={{ backgroundColor: activeTheme.primary }}
            >
              Alterar Nome de Equipes
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
        {setupZoomFloatingControl}
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

  if (!currentQuestion) return null;

  return (
    <div
      className="min-h-[100dvh] w-full px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-6 overflow-y-auto settings-scroll"
      style={{
        background: `linear-gradient(135deg, ${activeTheme.gradientStart} 0%, ${activeTheme.gradientEnd} 100%)`
      }}
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col items-stretch" style={{ transform: `scale(${gameZoomLevel / 100})`, transformOrigin: 'center top' }}>
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
                  <img src={tempoIcon} alt="" className="w-9 h-9 md:w-10 md:h-10" aria-hidden="true" />
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
              const isSelected = gameState.selectedOption === key;
              const isCorrect = key === currentQuestion.answer;
              const showResult = gameState.showExplanation;

              let btnClass = "relative w-full text-left rounded-[1.5rem] border-4 font-bold transition-all duration-200 ease-out flex items-center ";
              let btnStyle: React.CSSProperties | undefined;
              if (isHidden) btnClass += "opacity-0 pointer-events-none";
              else if (isSelected && !showResult) {
                btnStyle = { ...answerButtonStyle, backgroundColor: '#ffffff', borderColor: '#16a34a', color: '#0f172a', boxShadow: 'none' };
              }
              else if (showResult && isCorrect) btnClass += "bg-green-100 border-green-500 text-green-700 shadow-2xl border-b-8 border-green-300 scale-[1.03]";
              else if (showResult && isSelected && !isCorrect) btnClass += "bg-red-100 border-red-500 text-red-700 border-b-8 border-red-300";
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
          disabled={!gameState.selectedOption}
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
                <p className="text-base md:text-lg font-black text-gray-800 leading-tight mb-1">
                  {currentQuestion.answer}) {currentQuestion.options[currentQuestion.answer]}
                </p>
              </div>
              <p className={`font-black text-[11px] md:text-sm uppercase border-t-2 pt-3 leading-relaxed ${gameState.explanationType === 'correct' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}`}>
                Fonte: {currentQuestion.source.reference}
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
                className="firework-piece"
                style={{
                  bottom: '-16px',
                  left: '-16px',
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: fireworkColors[i % fireworkColors.length],
                  animationDelay: `${i * 36}ms`,
                  animationDuration: `${duration}ms`,
                  animationIterationCount: 'infinite',
                  ['--fw-x' as any]: `${dx}px`,
                  ['--fw-y' as any]: `${dy}px`,
                  ['--fw-rot' as any]: `${rotation}deg`
                }}
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
                className="firework-piece"
                style={{
                  bottom: '-16px',
                  right: '-16px',
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: fireworkColors[(i + 3) % fireworkColors.length],
                  animationDelay: `${i * 36}ms`,
                  animationDuration: `${duration}ms`,
                  animationIterationCount: 'infinite',
                  ['--fw-x' as any]: `${dx}px`,
                  ['--fw-y' as any]: `${dy}px`,
                  ['--fw-rot' as any]: `${rotation}deg`
                }}
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
                className="confetti-piece confetti-piece-left"
                style={{
                  bottom: '-12px',
                  left: '-12px',
                  width: `${size}px`,
                  height: `${size * 0.55}px`,
                  backgroundColor: confettiColors[i % confettiColors.length],
                  animationDelay: `${i * 24}ms`,
                  animationDuration: `${duration}ms`,
                  animationIterationCount: 'infinite',
                  ['--confetti-x' as any]: `${dx}px`,
                  ['--confetti-y' as any]: `${dy}px`,
                  ['--confetti-rot' as any]: `${rotation}deg`
                }}
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
                className="confetti-piece confetti-piece-right"
                style={{
                  bottom: '-12px',
                  right: '-12px',
                  width: `${size}px`,
                  height: `${size * 0.55}px`,
                  backgroundColor: confettiColors[(i + 2) % confettiColors.length],
                  animationDelay: `${i * 24}ms`,
                  animationDuration: `${duration}ms`,
                  animationIterationCount: 'infinite',
                  ['--confetti-x' as any]: `${dx}px`,
                  ['--confetti-y' as any]: `${dy}px`,
                  ['--confetti-rot' as any]: `${rotation}deg`
                }}
              />
            );
          })}
        </div>
      )}

      {gameZoomFloatingControl}
      {updateDialog}
      {appFooter}
    </div>
  );
};

export default App;

