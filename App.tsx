import React, { useEffect, useRef, useState } from 'react';
import { GameState, LifelineType, QuestionOptionKey, QuestionOptions, Team, Question, RankingEntry } from './types';
import { supabase } from './supabaseClient';
import expandIcon from './img/expandir.svg';
import rightOptionsIcon from './img/direita.svg';
import leftOptionsIcon from './img/esquerda.svg';
import updateIcon from './img/Atualizar.svg';
import showDaLicaoLogo from './img/Show da Lição.webp';
import goldMedal from './img/1 lugar.webp';
import silverMedal from './img/2 lugar.webp';
import bronzeMedal from './img/3 lugar.webp';
import trofeuIcon from './img/Troféu.webp';

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

type SetupIcon = {
  iconClass: string;
  label: string;
};

type SetupBackgroundIcon = SetupIcon & {
  top: string;
  left: string;
  size: string;
  opacity: string;
  rotate: string;
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

const SETUP_ICONS: SetupIcon[] = [
  { iconClass: 'fi fi-rr-book-alt', label: 'Livro' },
  { iconClass: 'fi fi-rr-glasses', label: 'Óculos' },
  { iconClass: 'fi fi-rr-library', label: 'Biblioteca' },
  { iconClass: 'fi fi-rr-pencil', label: 'Lápis' },
  { iconClass: 'fi fi-rr-pen-nib', label: 'Caneta' },
  { iconClass: 'fi fi-rr-reading', label: 'Leitura' }
];

const SETUP_BACKGROUND_ICONS: SetupBackgroundIcon[] = [
  { ...SETUP_ICONS[0], top: '6%', left: '7%', size: '5.5rem', opacity: '0.11', rotate: '-18deg' },
  { ...SETUP_ICONS[1], top: '10%', left: '80%', size: '4.75rem', opacity: '0.09', rotate: '14deg' },
  { ...SETUP_ICONS[2], top: '22%', left: '16%', size: '4.25rem', opacity: '0.12', rotate: '8deg' },
  { ...SETUP_ICONS[3], top: '24%', left: '70%', size: '5rem', opacity: '0.1', rotate: '-10deg' },
  { ...SETUP_ICONS[4], top: '2%', left: '42%', size: '4.4rem', opacity: '0.08', rotate: '18deg' },
  { ...SETUP_ICONS[5], top: '14%', left: '48%', size: '3.9rem', opacity: '0.07', rotate: '-6deg' },
  { ...SETUP_ICONS[1], top: '18%', left: '88%', size: '4.2rem', opacity: '0.09', rotate: '-16deg' },
  { ...SETUP_ICONS[0], top: '36%', left: '8%', size: '6rem', opacity: '0.08', rotate: '-8deg' },
  { ...SETUP_ICONS[4], top: '46%', left: '26%', size: '5.4rem', opacity: '0.08', rotate: '9deg' },
  { ...SETUP_ICONS[5], top: '38%', left: '52%', size: '4.8rem', opacity: '0.07', rotate: '-20deg' },
  { ...SETUP_ICONS[1], top: '54%', left: '84%', size: '5.25rem', opacity: '0.1', rotate: '20deg' },
  { ...SETUP_ICONS[2], top: '60%', left: '45%', size: '4.1rem', opacity: '0.08', rotate: '11deg' },
  { ...SETUP_ICONS[3], top: '64%', left: '12%', size: '4.8rem', opacity: '0.09', rotate: '-12deg' },
  { ...SETUP_ICONS[4], top: '74%', left: '18%', size: '4.9rem', opacity: '0.09', rotate: '-14deg' },
  { ...SETUP_ICONS[5], top: '76%', left: '72%', size: '5.75rem', opacity: '0.11', rotate: '12deg' },
  { ...SETUP_ICONS[0], top: '84%', left: '6%', size: '4.3rem', opacity: '0.07', rotate: '15deg' },
  { ...SETUP_ICONS[1], top: '86%', left: '38%', size: '4.9rem', opacity: '0.08', rotate: '-9deg' },
  { ...SETUP_ICONS[2], top: '84%', left: '84%', size: '4.4rem', opacity: '0.08', rotate: '6deg' },
  { ...SETUP_ICONS[5], top: '40%', left: '42%', size: '4.5rem', opacity: '0.08', rotate: '-12deg' },
  { ...SETUP_ICONS[3], top: '50%', left: '60%', size: '4.6rem', opacity: '0.08', rotate: '10deg' }
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
  loadQuestionsFile: () => Promise<{ ok: boolean; questions?: Question[]; error?: string }>;
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

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const [showRanking, setShowRanking] = useState(false);
  const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);
  const [qSearch, setQSearch] = useState('');
  const [showQModal, setShowQModal] = useState(false);
  type QDraft = { id?: number; topic: string; question: string; optA: string; optB: string; optC: string; optD: string; answer: QuestionOptionKey; sourceType: 'licao' | 'biblia'; sourceRef: string; points: number };
  const emptyDraft = (): QDraft => ({ topic:'', question:'', optA:'', optB:'', optC:'', optD:'', answer:'A', sourceType:'licao', sourceRef:'', points:10 });
  const [qDraft, setQDraft] = useState<QDraft>(emptyDraft());
  const [qDeleteId, setQDeleteId] = useState<number | null>(null);
  const [selectedQIds, setSelectedQIds] = useState<Set<number>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showDashboardMobileMenu, setShowDashboardMobileMenu] = useState(false);
  const [isSharedSoloGame] = useState(() => new URLSearchParams(window.location.search).get('play') === 'solo');
  const [sharedToken] = useState(() => new URLSearchParams(window.location.search).get('token'));
  const [sharedPlayerName, setSharedPlayerName] = useState('');
  const [sharedNameReady, setSharedNameReady] = useState(false);
  const [sharedLinkExpired, setSharedLinkExpired] = useState(false);
  const [sharedLinkUserId, setSharedLinkUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sharingLink, setSharingLink] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [loggedInUserName, setLoggedInUserName] = useState('');
  const [userPanelName, setUserPanelName] = useState('');
  const [userPanelEmail, setUserPanelEmail] = useState('');
  const [userPanelAvatarUrl, setUserPanelAvatarUrl] = useState('');
  const [userPanelNewPwd, setUserPanelNewPwd] = useState('');
  const [userPanelConfirmPwd, setUserPanelConfirmPwd] = useState('');
  const [showUserNewPwd, setShowUserNewPwd] = useState(false);
  const [showUserConfirmPwd, setShowUserConfirmPwd] = useState(false);
  const [userPanelMsg, setUserPanelMsg] = useState<{type:'success'|'error',text:string}|null>(null);
  const [userPanelSaving, setUserPanelSaving] = useState(false);
  const [userPanelAvatarUploading, setUserPanelAvatarUploading] = useState(false);
  const returnToDashboard = React.useRef(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loginConfirmPassword, setLoginConfirmPassword] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginMessage, setLoginMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showLoginConfirmPassword, setShowLoginConfirmPassword] = useState(false);
  const [showSoloNameModal, setShowSoloNameModal] = useState(false);
  const [draftSoloName, setDraftSoloName] = useState('');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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
  const [draftTeam1Name, setDraftTeam1Name] = useState('');
  const [draftTeam2Name, setDraftTeam2Name] = useState('');
  const [questionDrafts, setQuestionDrafts] = useState<QuestionDraft[]>([]);
  const [resolvedQuestion, setResolvedQuestion] = useState<Question | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<QuestionOptionKey | null>(null);
  const [isAdvancingQuestion, setIsAdvancingQuestion] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    mode: 'setup',
    currentQuestionIndex: 0,
    currentTeamIndex: 0,
    teams: [
      { name: "", score: 0, lifelinesUsed: [] },
      { name: "", score: 0, lifelinesUsed: [] }
    ],
    selectedOption: null,
    showExplanation: false,
    explanationType: null,
    lifelineResult: null,
    hiddenOptions: [],
    shuffledQuestions: [],
    isSoloMode: false
  });

  const fetchRankings = async () => {
    try {
      const { data, error } = await supabase
        .from('showdalicao')
        .select('name, score, created_at')
        .order('score', { ascending: false })
        .limit(15);
      
      if (error) throw error;
      if (data) {
        setRankings(data.map(item => ({
          name: item.name,
          score: item.score,
          date: new Date(item.created_at).toLocaleDateString('pt-BR')
        })));
      }
    } catch (err) {
      console.error('Error fetching rankings:', err);
    }
  };

  useEffect(() => {
    fetchRankings();

    const isShared = new URLSearchParams(window.location.search).get('play') === 'solo';
    const token = new URLSearchParams(window.location.search).get('token');

    if (isShared && token) {
      // Validate token and fetch questions for the link owner
      supabase
        .from('game_links')
        .select('user_id, created_at')
        .eq('id', token)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            setSharedLinkExpired(true);
            return;
          }
          const age = Date.now() - new Date(data.created_at).getTime();
          if (age > 24 * 60 * 60 * 1000) {
            setSharedLinkExpired(true);
            return;
          }
          setSharedLinkUserId(data.user_id);
          fetchDbQuestions(data.user_id);
        });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(!!session);
      if (session?.user) {
        const meta = session.user.user_metadata;
        setLoggedInUserName(meta?.full_name ?? meta?.name ?? session.user.email?.split('@')[0] ?? '');
        setCurrentUserId(session.user.id);
        fetchDbQuestions(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
      if (session?.user) {
        const meta = session.user.user_metadata;
        setLoggedInUserName(meta?.full_name ?? meta?.name ?? session.user.email?.split('@')[0] ?? '');
        setCurrentUserId(session.user.id);
        fetchDbQuestions(session.user.id);
      } else {
        setLoggedInUserName('');
        setCurrentUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoginMessage(null);
    if (!loginEmail || !loginPassword) {
      setLoginMessage({ type: 'error', text: 'Preencha e-mail e senha.' });
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      if (error) throw error;
      setIsAdmin(true);
      setShowLoginModal(false);
      setShowLoginScreen(false);
      setLoginEmail('');
      setLoginPassword('');
      setLoginMessage(null);
      setShowDashboard(true);
      fetchDbQuestions();
    } catch (err: any) {
      const msg: string = err.message ?? '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setLoginMessage({ type: 'error', text: 'E-mail ou senha incorretos.' });
      } else if (msg.includes('Email not confirmed')) {
        setLoginMessage({ type: 'error', text: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.' });
      } else if (msg.includes('Too many requests')) {
        setLoginMessage({ type: 'error', text: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
      } else {
        setLoginMessage({ type: 'error', text: 'Falha ao entrar: ' + msg });
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  useEffect(() => {
    if (!showUserPanel) return;
    setUserPanelMsg(null);
    setUserPanelNewPwd('');
    setUserPanelConfirmPwd('');
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserPanelEmail(user.email ?? '');
      setUserPanelName(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '');
      setUserPanelAvatarUrl(user.user_metadata?.avatar_url ?? '');
    });
  }, [showUserPanel]);

  const handleUserPanelAvatarUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setUserPanelMsg({ type: 'error', text: 'Foto deve ter no máximo 2 MB.' });
      return;
    }
    setUserPanelAvatarUploading(true);
    setUserPanelMsg(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUserPanelAvatarUploading(false); return; }
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) {
      setUserPanelMsg({ type: 'error', text: 'Erro ao enviar foto. Bucket "avatars" não encontrado.' });
      setUserPanelAvatarUploading(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = data.publicUrl;
    const { error: metaErr } = await supabase.auth.updateUser({ data: { avatar_url: url } });
    if (metaErr) { setUserPanelMsg({ type: 'error', text: metaErr.message }); }
    else { setUserPanelAvatarUrl(url + '?t=' + Date.now()); setUserPanelMsg({ type: 'success', text: 'Foto atualizada!' }); }
    setUserPanelAvatarUploading(false);
  };

  const handleUserPanelSave = async () => {
    setUserPanelSaving(true);
    setUserPanelMsg(null);
    if (userPanelNewPwd) {
      if (userPanelNewPwd.length < 6) {
        setUserPanelMsg({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
        setUserPanelSaving(false);
        return;
      }
      if (userPanelNewPwd !== userPanelConfirmPwd) {
        setUserPanelMsg({ type: 'error', text: 'As senhas não coincidem.' });
        setUserPanelSaving(false);
        return;
      }
    }
    const updates: Parameters<typeof supabase.auth.updateUser>[0] = {
      data: { full_name: userPanelName.trim() },
    };
    if (userPanelNewPwd) updates.password = userPanelNewPwd;
    const { error } = await supabase.auth.updateUser(updates);
    if (error) {
      setUserPanelMsg({ type: 'error', text: error.message });
    } else {
      setUserPanelMsg({ type: 'success', text: 'Perfil salvo com sucesso!' });
      setLoggedInUserName(userPanelName.trim() || loggedInUserName);
      setUserPanelNewPwd('');
      setUserPanelConfirmPwd('');
    }
    setUserPanelSaving(false);
  };

  const handleRegister = async () => {
    setLoginMessage(null);
    if (!loginName.trim()) {
      setLoginMessage({ type: 'error', text: 'Informe seu nome de usuário.' });
      return;
    }
    if (!loginEmail || !loginPassword) {
      setLoginMessage({ type: 'error', text: 'Preencha e-mail e senha.' });
      return;
    }
    if (loginPassword !== loginConfirmPassword) {
      setLoginMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    if (loginPassword.length < 6) {
      setLoginMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: loginEmail,
        password: loginPassword,
        options: { data: { name: loginName.trim() } },
      });
      if (error) throw error;
      // Supabase retorna identities vazio quando o e-mail já está cadastrado
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setLoginMessage({ type: 'error', text: 'Este e-mail já está cadastrado. Tente fazer login.' });
        return;
      }
      setLoginMessage({ type: 'success', text: 'Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.' });
      setLoginEmail('');
      setLoginPassword('');
      setLoginConfirmPassword('');
      setLoginName('');
    } catch (err: any) {
      const msg: string = err.message ?? '';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setLoginMessage({ type: 'error', text: 'Este e-mail já está cadastrado. Tente fazer login.' });
      } else if (msg.includes('invalid email') || msg.includes('Invalid email')) {
        setLoginMessage({ type: 'error', text: 'E-mail inválido.' });
      } else if (msg.includes('Password should be')) {
        setLoginMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      } else {
        setLoginMessage({ type: 'error', text: msg || 'Erro ao criar conta. Tente novamente.' });
      }
    }
  };

  const handleForgotPassword = async () => {
    setLoginMessage(null);
    if (!loginEmail) {
      setLoginMessage({ type: 'error', text: 'Informe seu e-mail.' });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setLoginMessage({ type: 'success', text: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.' });
    } catch (err: any) {
      setLoginMessage({ type: 'error', text: err.message ?? 'Erro ao enviar e-mail.' });
    }
  };

  const fetchDbQuestions = async (userId?: string | null) => {
    setDbLoading(true);
    let query = supabase.from('questions').select('*').order('id', { ascending: true });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (!error && data) {
      setDbQuestions(data.map((q: any) => ({
        id: q.id,
        topic: q.topic ?? '',
        question: q.question ?? '',
        options: { A: q.option_a, B: q.option_b, ...(q.option_c ? { C: q.option_c } : {}), ...(q.option_d ? { D: q.option_d } : {}) },
        answer: q.answer as QuestionOptionKey,
        source: { type: q.source_type ?? 'licao', reference: q.source_reference ?? '' },
        points: q.points ?? 1,
      })));
    }
    setDbLoading(false);
  };

  const handleSaveQuestion = async () => {
    if (!qDraft.topic.trim() || !qDraft.question.trim() || !qDraft.optA.trim() || !qDraft.optB.trim()) {
      alert('Preencha ao menos: tópico, pergunta, opção A e opção B.');
      return;
    }
    setDbSaving(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const uid = authUser?.id ?? null;
    const payload = {
      topic: qDraft.topic.trim(),
      question: qDraft.question.trim(),
      option_a: qDraft.optA.trim(),
      option_b: qDraft.optB.trim(),
      option_c: qDraft.optC.trim() || null,
      option_d: qDraft.optD.trim() || null,
      answer: qDraft.answer,
      source_type: qDraft.sourceType,
      source_reference: qDraft.sourceRef.trim(),
      points: qDraft.points,
      user_id: uid,
    };
    if (qDraft.id) {
      await supabase.from('questions').update(payload).eq('id', qDraft.id);
    } else {
      await supabase.from('questions').insert(payload);
    }
    setDbSaving(false);
    setShowQModal(false);
    fetchDbQuestions(uid);
  };

  const handleDeleteQuestion = async (id: number) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const uid = authUser?.id ?? null;
    await supabase.from('questions').delete().eq('id', id);
    setQDeleteId(null);
    fetchDbQuestions(uid);
  };

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
    if (!isSharedSoloGame || !sharedNameReady || dbQuestions.length === 0) return;
    const name = sharedPlayerName.trim() || 'Jogador';
    setGameState(prev => ({
      ...prev,
      mode: 'playing',
      currentQuestionIndex: 0,
      currentTeamIndex: 0,
      teams: [
        { name, score: 0, lifelinesUsed: [] },
        { name: 'CPU', score: 0, lifelinesUsed: [] },
      ],
      selectedOption: null,
      showExplanation: false,
      explanationType: null,
      lifelineResult: null,
      hiddenOptions: [],
      shuffledQuestions: shuffleArray(dbQuestions),
      isSoloMode: true,
    }));
  }, [isSharedSoloGame, sharedNameReady, dbQuestions, sharedPlayerName]);

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

    // Carrega perguntas salvas se disponível (Electron)
    if (electronApi?.loadQuestionsFile) {
      void electronApi.loadQuestionsFile().then((result) => {
        if (result.ok && result.questions && result.questions.length > 0) {
          setActiveQuestions(result.questions);
        }
      });
    }

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
        '    }',
        '  }'
      ].join('\n');
    });

    return [
      "import { Question } from './types';",
      '',
      'export const questions: Question[] = [',
      rows.join(',\n'),
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
      type: 'image_url',
      image_url: {
        url: `data:${mimeType};base64,${base64}`
      }
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
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              ...imageInputs
            ]
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      const rawText = String(result?.choices?.[0]?.message?.content ?? '').trim();

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

  const saveRankingEntries = async (teams: Team[], forceAll = false) => {
    const now = new Date().toISOString();
    const entries = teams
      .filter(team => team.name !== 'CPU' && (forceAll ? team.name.trim() : team.score > 0))
      .map(team => ({
        name: team.name,
        score: team.score,
        created_at: now
      }));

    if (entries.length === 0) return;

    const { error } = await supabase.from('showdalicao').insert(entries);
    if (error) {
      console.error('Erro ao salvar ranking:', error.message);
      if (error.message?.includes('row-level security') || error.code === '42501') {
        alert('Não foi possível salvar a pontuação no ranking.\n\nO administrador precisa habilitar inserções públicas na tabela "showdalicao" no Supabase.');
      }
    } else {
      fetchRankings();
    }
  };

  const handleStartGame = (isSolo: boolean = false) => {
    stopOpeningAudio();
    setResolvedQuestion(null);
    setSelectedQuestionId(null);
    setSelectedOption(null);
    setIsAdvancingQuestion(false);

    const t1Name = isSolo ? (draftSoloName.trim() || 'Jogador') : draftTeam1Name.trim();
    const t2Name = isSolo ? 'CPU' : draftTeam2Name.trim();

    setGameState(prev => ({ 
      ...prev, 
      mode: 'playing', 
      currentQuestionIndex: 0,
      currentTeamIndex: 0,
      teams: [
        { name: t1Name, score: 0, lifelinesUsed: [] },
        { name: t2Name, score: 0, lifelinesUsed: [] }
      ],
      selectedOption: null,
      showExplanation: false,
      explanationType: null,
      lifelineResult: null,
      hiddenOptions: [],
      shuffledQuestions: shuffleArray(dbQuestions),
      isSoloMode: isSolo
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
        currentTeamIndex: prev.isSoloMode ? 0 : (prev.currentTeamIndex === 0 ? 1 : 0),
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
        currentTeamIndex: prev.isSoloMode ? 0 : (prev.currentTeamIndex === 0 ? 1 : 0),
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
      shuffledQuestions: [],
      isSoloMode: false
    });
    if (returnToDashboard.current) {
      returnToDashboard.current = false;
      setShowDashboard(true);
    }
  };

  const updateTeamName = (index: number, name: string) => {
    setGameState(prev => {
      const newTeams = [...prev.teams] as [Team, Team];
      newTeams[index].name = name;
      return { ...prev, teams: newTeams };
    });
  };

  const openTeamNamesModal = () => {
    setDraftTeam1Name(gameState.teams[0].name);
    setDraftTeam2Name(gameState.teams[1].name);
    setShowTeamNamesModal(true);
  };

  const saveTeamNames = () => {
    const team1 = draftTeam1Name.trim();
    const team2 = draftTeam2Name.trim();
    updateTeamName(0, team1);
    updateTeamName(1, team2);
    setShowTeamNamesModal(false);
    handleStartGame();
  };



  const setupScaledStyle: React.CSSProperties = {
    transform: isMobile ? 'none' : `scale(${setupZoomLevel / 100})`,
    transformOrigin: 'center center'
  };

  const setupFixedScaledStyle: React.CSSProperties = {
    transform: isMobile ? 'none' : 'scale(0.9)',
    transformOrigin: 'center center'
  };

  const setupZoomFloatingControl = (
    <div
      className="fixed right-4 bottom-4 z-[80] flex flex-col items-end"
      onMouseEnter={() => setShowSetupZoomPanel(true)}
      onMouseLeave={() => {
        setShowSetupZoomPanel(false);
      }}
    >
      <div
        className={`mb-3 bg-white/65 backdrop-blur-md rounded-lg shadow-lg px-3 py-2 flex items-center gap-2.5 min-w-[200px] transition-all duration-200 ease-out ${showSetupZoomPanel ? 'opacity-100 translate-y-0 scale-100' : 'pointer-events-none opacity-0 translate-y-2 scale-95 h-0 overflow-hidden mb-0'}`}
        style={{ backgroundColor: hexToRgba(activeTheme.accent, 0.12) }}
      >
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide font-black" style={{ color: activeTheme.primary }}>Zoom</span>
            <span className="text-[10px] font-black" style={{ color: activeTheme.primary }}>{setupZoomLevel}%</span>
          </div>
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
        </div>
      </div>
      <button
        onClick={() => setShowSetupZoomPanel(true)}
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
      className="fixed bottom-4 right-4 z-[70] flex flex-col items-end"
      onMouseEnter={() => setShowQuestionOptionsPanel(true)}
      onMouseLeave={() => {
        setShowQuestionOptionsPanel(false);
        setShowGameZoomPanel(false);
        setShowQuestionVolumePanel(false);
      }}
    >
      <div
        className={`mb-3 w-[220px] rounded-lg bg-white/65 backdrop-blur-md px-3 py-2 shadow-xl transition-all duration-250 ease-out ${showGameZoomPanel ? 'opacity-100 translate-y-0 scale-100' : 'pointer-events-none opacity-0 translate-y-2 scale-95 h-0 overflow-hidden'}`}
        style={{ backgroundColor: hexToRgba(activeTheme.accent, 0.12) }}
      >
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide font-black" style={{ color: activeTheme.primary }}>Zoom</span>
            <span className="text-[10px] font-black" style={{ color: activeTheme.primary }}>{gameZoomLevel}%</span>
          </div>
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
        </div>
      </div>

      <div
        className={`mb-3 w-[250px] rounded-lg bg-white/65 backdrop-blur-md px-3 py-2 shadow-xl transition-all duration-250 ease-out ${showQuestionVolumePanel ? 'opacity-100 translate-y-0 scale-100' : 'pointer-events-none opacity-0 translate-y-2 scale-95 h-0 overflow-hidden'}`}
        style={{ backgroundColor: hexToRgba(activeTheme.accent, 0.12) }}
      >
        <div className="mb-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide font-black" style={{ color: activeTheme.primary }}>Efeito</span>
            <span className="text-[10px] font-black" style={{ color: activeTheme.primary }}>{effectsVolume}%</span>
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
            <span className="text-[10px] uppercase tracking-wide font-black" style={{ color: activeTheme.primary }}>Time</span>
            <span className="text-[10px] font-black" style={{ color: activeTheme.primary }}>{teamClockVolume}%</span>
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
              setShowGameZoomPanel(true);
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
              setShowQuestionVolumePanel(true);
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
            setShowQuestionOptionsPanel(true);
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
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center sm:p-4 bg-black/65 backdrop-blur-sm">
      <div className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl bg-white p-5 md:p-6 shadow-2xl text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
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
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[60] px-2 py-0.5 text-white/70 text-[9px] md:text-[10px] font-normal text-center pointer-events-none whitespace-nowrap"
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

  const loginModal = showLoginModal && (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl border-t-4 sm:border-4 p-5 sm:p-6 md:p-7 text-left" style={{ borderColor: activeTheme.accent, color: activeTheme.primary, fontFamily: 'Arial Local, Arial, sans-serif' }}>
        <p className="text-sm uppercase font-black mb-4">Login Administrador</p>
        <div className="space-y-4 mb-6">
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-gray-800 outline-none"
            placeholder="E-mail"
          />
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-gray-800 outline-none"
            placeholder="Senha"
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setShowLoginModal(false)}
            className="rounded-xl px-5 py-3 bg-gray-100 text-gray-700 font-black uppercase text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleLogin}
            className="rounded-xl px-5 py-3 text-white font-black uppercase text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110"
            style={{ backgroundColor: activeTheme.primary }}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );

  if (showSettings && gameState.mode !== 'playing') {
    const NAV_ITEMS = [
      { id: 'interface', label: 'Interface', icon: 'fi-rr-computer' },
      { id: 'fontes',    label: 'Fontes',    icon: 'fi-rr-text'     },
    ] as const;

    return (
      <div className="fixed inset-0 z-[120] flex flex-col" style={{ fontFamily: 'Arial Local, Arial, sans-serif', background: '#f1f5f9' }}>

        {/* ── Header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-8 py-4 shadow-sm" style={{ background: `linear-gradient(135deg, ${activeTheme.gradientStart} 0%, ${activeTheme.primary} 100%)` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <i className="fi fi-rr-settings text-white text-base leading-none" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/50 leading-none mb-0.5">Painel</p>
              <h2 className="text-base font-semibold text-white leading-none">Configurações</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {settingsSection === 'fontes' && (
              <button
                onClick={handleApplyFontChanges}
                disabled={!hasPendingFontChanges}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${hasPendingFontChanges ? 'text-green-300 hover:text-green-200' : 'text-white/70 hover:text-white'}`}
              >
                <i className="fi fi-rr-check leading-none" aria-hidden="true" />
                Aplicar
              </button>
            )}
            <button
              onClick={() => setShowSettings(false)}
              className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-red-300 transition-colors active:scale-90"
              aria-label="Fechar configurações"
            >
              <i className="fi fi-rr-cross text-sm leading-none" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0">

          {/* Sidebar — horizontal tabs on mobile, vertical on sm+ */}
          <aside className="flex-shrink-0 bg-white border-b sm:border-b-0 sm:border-r border-gray-200 flex flex-row sm:flex-col sm:w-52 sm:py-4 sm:px-3 overflow-x-auto">
            <p className="hidden sm:block text-[10px] uppercase tracking-widest text-gray-400 px-3 mb-3">Menu</p>
            <nav className="flex flex-row sm:flex-col gap-1 flex-1 px-2 sm:px-0 py-2 sm:py-0">
              {NAV_ITEMS.map(item => {
                const isActive = settingsSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSettingsSection(item.id as 'interface' | 'fontes')}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all min-h-[44px]"
                    style={isActive
                      ? { background: hexToRgba(activeTheme.primary, 0.1), color: activeTheme.primary }
                      : { color: '#6b7280' }}
                  >
                    <i className={`fi ${item.icon} text-base leading-none`} aria-hidden="true" />
                    <span className="sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <section className="flex-1 overflow-y-auto settings-scroll p-4 sm:p-6">

            {/* ── INTERFACE ── */}
            {settingsSection === 'interface' && (
              <div className="max-w-2xl space-y-6">

                {/* Som */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(activeTheme.primary, 0.1) }}>
                      <i className="fi fi-rr-volume text-base leading-none" style={{ color: activeTheme.primary }} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Som e Áudio</p>
                      <p className="text-xs text-gray-400">Configure os níveis de volume</p>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50 px-5">
                    {[
                      { label: 'Música', icon: 'fi-rr-music-note', value: musicVolume, set: setMusicVolume },
                      { label: 'Efeitos', icon: 'fi-rr-waveform', value: effectsVolume, set: setEffectsVolume },
                      { label: 'Relógio', icon: 'fi-rr-clock', value: teamClockVolume, set: setTeamClockVolume },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-4 py-4">
                        <i className={`fi ${item.icon} text-gray-400 text-base leading-none w-5 shrink-0`} aria-hidden="true" />
                        <span className="text-sm text-gray-600 w-20 shrink-0">{item.label}</span>
                        <input
                          type="range" min={0} max={100} step={1} value={item.value}
                          onChange={e => item.set(clamp(Number(e.target.value), 0, 100))}
                          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200"
                        />
                        <span className="text-sm font-medium w-10 text-right" style={{ color: activeTheme.primary }}>{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Temas */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(activeTheme.primary, 0.1) }}>
                      <i className="fi fi-rr-palette text-base leading-none" style={{ color: activeTheme.primary }} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Tema e Cores</p>
                      <p className="text-xs text-gray-400">Aparência do aplicativo</p>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COLOR_THEMES.map(theme => {
                      const isSelected = theme.id === themeId;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setThemeId(theme.id)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                          style={{ borderColor: isSelected ? theme.primary : '#e5e7eb', background: isSelected ? hexToRgba(theme.primary, 0.06) : 'white' }}
                        >
                          <div className="flex gap-1 shrink-0">
                            {[theme.gradientStart, theme.primary, theme.accent].map((c, i) => (
                              <span key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <span className="text-sm font-medium" style={{ color: isSelected ? theme.primary : '#374151' }}>{theme.name}</span>
                          {isSelected && <i className="fi fi-rr-check ml-auto text-xs leading-none" style={{ color: theme.primary }} />}
                        </button>
                      );
                    })}
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all sm:col-span-2"
                      style={{ borderColor: themeId === 'custom' ? activeTheme.primary : '#e5e7eb', background: themeId === 'custom' ? hexToRgba(activeTheme.primary, 0.06) : 'white' }}
                    >
                      <input
                        type="color" value={customColor}
                        onChange={e => { setCustomColor(normalizeHex(e.target.value)); setThemeId('custom'); }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                        aria-label="Cor personalizada"
                      />
                      <span className="text-sm font-medium text-gray-700">Personalizada</span>
                      <button onClick={() => setThemeId('custom')} className="ml-auto text-xs px-3 py-1.5 rounded-lg text-white transition-all" style={{ backgroundColor: customColor }}>
                        Usar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PERGUNTAS ── */}
            {settingsSection === 'perguntas' && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(activeTheme.primary, 0.1) }}>
                      <i className="fi fi-rr-apps text-base leading-none" style={{ color: activeTheme.primary }} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Modo de geração</p>
                      <p className="text-xs text-gray-400">Escolha como gerar perguntas</p>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {[{ id: 'manual', label: 'Manual', icon: 'fi-rr-pencil' }, { id: 'ia', label: 'Inteligência Artificial', icon: 'fi-rr-brain' }].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setQuestionGenerationMode(opt.id as 'manual' | 'ia')}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all"
                        style={{ borderColor: questionGenerationMode === opt.id ? activeTheme.primary : '#e5e7eb', background: questionGenerationMode === opt.id ? hexToRgba(activeTheme.primary, 0.06) : 'white', color: questionGenerationMode === opt.id ? activeTheme.primary : '#374151' }}
                      >
                        <i className={`fi ${opt.icon} text-base leading-none`} aria-hidden="true" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {questionGenerationMode === 'manual' ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(activeTheme.primary, 0.1) }}>
                        <i className="fi fi-rr-list text-base leading-none" style={{ color: activeTheme.primary }} aria-hidden="true" />
                      </div>
                      <p className="text-sm font-medium text-gray-800">Configurações do jogo</p>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Qtd. de perguntas', icon: 'fi-rr-interrogation', value: questionCount, min: MIN_QUESTION_COUNT, max: 30, step: 1, set: (v: number) => setQuestionCount(clamp(v, 1, 30)) },
                        { label: 'Qtd. de opções', icon: 'fi-rr-list', value: optionsPerQuestion, min: 2, max: 6, step: 1, set: (v: number) => setOptionsPerQuestion(clamp(v, 2, 6)) },
                        { label: 'Pontos por pergunta', icon: 'fi-rr-star', value: pointsPerQuestion, min: 1, max: 1000, step: 100, set: (v: number) => setPointsPerQuestion(Math.max(1, Math.round(v))) },
                      ].map(field => (
                        <div key={field.label} className={field.label === 'Pontos por pergunta' ? 'sm:col-span-2' : ''}>
                          <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                            <i className={`fi ${field.icon} leading-none`} aria-hidden="true" />
                            {field.label}
                          </label>
                          <input
                            type="number" min={field.min} max={field.max} step={field.step} value={field.value}
                            onFocus={selectNumericInputValue} onClick={selectNumericInputValue}
                            onChange={e => field.set(Number(e.target.value) || field.min)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-300 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="px-5 pb-5">
                      <button
                        onClick={openQuestionBuilder}
                        disabled={!questionBuilderIsReady}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${activeTheme.gradientEnd}, ${activeTheme.primary})` }}
                      >
                        <i className="fi fi-rr-magic-wand leading-none" aria-hidden="true" />
                        Gerar perguntas
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(activeTheme.primary, 0.1) }}>
                        <i className="fi fi-rr-brain text-base leading-none" style={{ color: activeTheme.primary }} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Geração por IA</p>
                        <p className="text-xs text-gray-400">Importe imagens e gere perguntas automaticamente</p>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={openQuestionFilePicker}
                        disabled={aiGenerationBusy}
                        className="flex items-center justify-center gap-2 flex-1 px-5 py-3 rounded-xl text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${activeTheme.gradientEnd}, ${activeTheme.primary})` }}
                      >
                        <i className="fi fi-rr-picture leading-none" aria-hidden="true" />
                        {aiGenerationBusy ? 'Processando...' : 'Selecionar imagens'}
                      </button>
                      <button
                        onClick={() => void handleGenerateAiFromSelectedImages()}
                        disabled={aiGenerationBusy || selectedImageFiles.length === 0}
                        className="flex items-center justify-center gap-2 flex-1 px-5 py-3 rounded-xl text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${activeTheme.gradientEnd}, ${activeTheme.primary})` }}
                      >
                        <i className="fi fi-rr-brain leading-none" aria-hidden="true" />
                        Gerar com IA
                      </button>
                    </div>
                    {selectedImageFiles.length > 0 && (
                      <p className="px-5 pb-4 text-xs text-gray-500">{selectedImageFiles.length} imagem(ns) selecionada(s).</p>
                    )}
                    {aiGenerationError && (
                      <p className="px-5 pb-4 text-xs text-red-500">{aiGenerationError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── FONTES ── */}
            {settingsSection === 'fontes' && (
              <div className="max-w-2xl space-y-6">
                {[
                  { label: 'Pergunta', icon: 'fi-rr-interrogation', fontId: draftQuestionFontId, setFont: setDraftQuestionFontId, size: draftQuestionFontSize, setSize: setDraftQuestionFontSize },
                  { label: 'Respostas', icon: 'fi-rr-list', fontId: draftAnswerFontId, setFont: setDraftAnswerFontId, size: draftAnswerFontSize, setSize: setDraftAnswerFontSize },
                ].map(section => (
                  <div key={section.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(activeTheme.primary, 0.1) }}>
                        <i className={`fi ${section.icon} text-base leading-none`} style={{ color: activeTheme.primary }} aria-hidden="true" />
                      </div>
                      <p className="text-sm font-medium text-gray-800">{section.label}</p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                          <i className="fi fi-rr-text leading-none" aria-hidden="true" /> Fonte
                        </label>
                        <select
                          value={section.fontId}
                          onChange={e => section.setFont(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-300 transition-colors"
                        >
                          {FONT_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                          <i className="fi fi-rr-expand leading-none" aria-hidden="true" /> Tamanho
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range" min={MIN_FONT_SIZE_PT} max={MAX_FONT_SIZE_PT} step={0.5} value={section.size}
                            onChange={e => section.setSize(clamp(Number(e.target.value), MIN_FONT_SIZE_PT, MAX_FONT_SIZE_PT))}
                            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200"
                          />
                          <span className="text-sm font-medium w-14 text-right" style={{ color: activeTheme.primary }}>{section.size.toFixed(1)} pt</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Prévia */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(activeTheme.primary, 0.1) }}>
                      <i className="fi fi-rr-eye text-base leading-none" style={{ color: activeTheme.primary }} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Prévia</p>
                      <p className="text-xs text-gray-400">Visualização em tempo real</p>
                    </div>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-b-2xl">
                    <p className="text-gray-800 leading-snug mb-4" style={{ fontFamily: previewQuestionFontFamily, fontSize: `${draftQuestionFontSize}pt` }}>
                      Qual a principal mensagem da lição estudada hoje?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['Confiar em Deus nas decisões diárias', 'Nunca ajudar quem precisa', 'Ignorar os ensinamentos', 'Focar apenas em recompensas'].map((ans, idx) => (
                        <div key={idx} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                          <span className="text-gray-700" style={{ fontFamily: previewAnswerFontFamily, fontSize: `${draftAnswerFontSize}pt` }}>
                            {String.fromCharCode(65 + idx)}) {ans}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </section>
        </div>
        {showQuestionBuilder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-6 bg-black/60 backdrop-blur-sm">
            <div className="w-full h-full md:max-w-6xl md:h-[92vh] bg-white md:rounded-[2rem] shadow-2xl md:border-4 flex flex-col overflow-hidden" style={{ borderColor: activeTheme.accent, color: activeTheme.primary, fontFamily: 'Arial Local, Arial, sans-serif', fontSize: 'clamp(12pt, 1.5vw, 15pt)' }}>
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
        {loginModal}
      </div>
    );
  }

  const rankingOverlay = showRanking && (() => {
          const top3 = rankings.slice(0, 3);
          const rest = rankings.slice(3);
          const maxScore = rankings[0]?.score ?? 1;

          const PODIUM = [
            { pos: 2, medal: silverMedal, avatarBorder: '#94a3b8', nameColor: '#cbd5e1', scoreColor: '#94a3b8', platformGrad: 'linear-gradient(180deg,#94a3b8 0%,#64748b 100%)', platformH: '90px', delay: '0.15s', goldGlow: false },
            { pos: 1, medal: goldMedal,   avatarBorder: '#fbbf24', nameColor: '#fde68a', scoreColor: '#fbbf24', platformGrad: 'linear-gradient(180deg,#fbbf24 0%,#d97706 100%)', platformH: '130px', delay: '0s',    goldGlow: true  },
            { pos: 3, medal: bronzeMedal, avatarBorder: '#fb923c', nameColor: '#fed7aa', scoreColor: '#fb923c', platformGrad: 'linear-gradient(180deg,#f97316 0%,#c2410c 100%)', platformH: '62px',  delay: '0.28s', goldGlow: false },
          ];
          const podiumEntries = [top3[1], top3[0], top3[2]];

          return (
          <div
            className="fixed inset-0 z-[95] flex flex-col"
            style={{ fontFamily: 'Arial Local, Arial, sans-serif', background: `linear-gradient(160deg, ${activeTheme.gradientEnd} 0%, ${activeTheme.primary} 50%, ${mixHex(activeTheme.primary,'#001a2e',0.3)} 100%)` }}
          >
            <div
              className="relative flex-shrink-0 flex items-center justify-between px-5 sm:px-8 py-4"
              style={{ background: `linear-gradient(135deg, ${activeTheme.gradientStart} 0%, ${activeTheme.primary} 100%)`, zIndex: 2 }}
            >
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{ position:'absolute', top:'-40%', left:'-10%', width:'45%', height:'200%', background:'rgba(255,255,255,0.07)', transform:'skewX(-18deg)' }} />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <img src={trofeuIcon} alt="Troféu" className="w-10 h-10 object-contain drop-shadow-lg" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-white/50 leading-none mb-0.5">Placar Global</p>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase text-white leading-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>Ranking</h2>
                </div>
              </div>
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => setShowRanking(false)}
                  className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-red-400 active:scale-90 transition-colors duration-150"
                  aria-label="Fechar ranking"
                >
                  <i className="fi fi-rr-cross text-sm leading-none" aria-hidden="true" />
                </button>
              </div>
            </div>

            {rankings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <i className="fi fi-rr-trophy text-5xl text-white/15" aria-hidden="true" />
                </div>
                <p className="font-black uppercase text-lg text-white/25 mb-2">Nenhum recorde ainda</p>
                <p className="text-sm text-white/15 font-semibold">Jogue no modo Solo para aparecer aqui</p>
              </div>
            ) : (
              <>
                <div
                  className="flex-shrink-0 relative overflow-hidden flex flex-col items-center justify-end pb-0"
                  style={{ minHeight: 'clamp(200px, 38vh, 380px)', background: 'rgba(0,0,0,0.15)' }}
                >
                  {[
                    { top:'12%', left:'8%',  s:3, o:0.5 },
                    { top:'22%', left:'20%', s:2, o:0.3 },
                    { top:'8%',  left:'38%', s:4, o:0.4 },
                    { top:'18%', left:'55%', s:2, o:0.35 },
                    { top:'10%', left:'70%', s:3, o:0.45 },
                    { top:'25%', left:'82%', s:2, o:0.3 },
                    { top:'5%',  left:'92%', s:3, o:0.4 },
                    { top:'30%', left:'46%', s:2, o:0.25 },
                  ].map((star, si) => (
                    <div key={si} className="absolute rounded-full pointer-events-none" style={{ top: star.top, left: star.left, width: star.s, height: star.s, background: '#fff', opacity: star.o, boxShadow: `0 0 ${star.s * 2}px ${star.s}px rgba(255,255,255,0.2)` }} />
                  ))}
                  <p className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.4em] text-white/30 whitespace-nowrap">— Pódio —</p>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{ width: '55%', height: '60%', background: 'radial-gradient(ellipse at 50% 100%, rgba(251,191,36,0.18) 0%, transparent 70%)' }} />
                  <div className="relative z-10 w-full max-w-xl mx-auto flex items-end justify-center gap-2 sm:gap-4 px-4">
                    {PODIUM.map((cfg, podIdx) => {
                      const entry = podiumEntries[podIdx];
                      const isGold = cfg.pos === 1;
                      if (!entry) {
                        return (
                          <div key={podIdx} className="flex-1 flex flex-col items-center">
                            <div className="w-full rounded-t-2xl opacity-20" style={{ height: cfg.platformH, background: cfg.platformGrad }} />
                          </div>
                        );
                      }
                      return (
                        <div key={`podium-${podIdx}`} className={`podium-card flex-1 flex flex-col items-center ${isGold ? 'gold-glow' : ''}`} style={{ animationDelay: cfg.delay }}>
                          <img src={cfg.medal} alt={`${cfg.pos}º lugar`} className={`object-contain drop-shadow-xl mb-2 ${isGold ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-12 h-12 sm:w-16 sm:h-16'}`} />
                          <p className={`font-black uppercase text-center leading-tight truncate w-full px-1 mb-0.5 ${isGold ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`} style={{ color: cfg.nameColor }}>{entry.name}</p>
                          <p className={`font-black tabular-nums leading-none mb-1 ${isGold ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`} style={{ color: cfg.scoreColor }}>{entry.score.toLocaleString('pt-BR')}</p>
                          <p className="text-[8px] font-black uppercase mb-2" style={{ color: cfg.scoreColor, opacity: 0.55 }}>pts</p>
                          <div className="w-full rounded-t-2xl flex items-center justify-center" style={{ height: cfg.platformH, background: cfg.platformGrad, boxShadow: isGold ? '0 -6px 28px rgba(251,191,36,0.4)' : 'none' }}>
                            <span className={`font-black text-white ${isGold ? 'text-2xl' : 'text-lg'}`} style={{ opacity: 0.85, textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>{cfg.pos}º</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto settings-scroll" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  {rest.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-10 text-center px-6">
                      <p className="text-sm text-white/20 font-semibold uppercase tracking-wider">Apenas 3 jogadores no ranking</p>
                    </div>
                  ) : (
                    <div className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/25 whitespace-nowrap">Classificação Geral</p>
                        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                      </div>
                      <div className="space-y-2">
                        {rest.map((entry, i) => {
                          const realPos = i + 4;
                          const pct = Math.max(4, Math.round((entry.score / maxScore) * 100));
                          return (
                            <div key={`rest-${i}`} className="rank-entry flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:bg-white/6" style={{ animationDelay: `${0.04 * i}s`, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.09)' }}>{realPos}</div>
                              <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm" style={{ background: hexToRgba(activeTheme.primary, 0.22), color: activeTheme.accent, border: `1.5px solid ${hexToRgba(activeTheme.primary, 0.35)}` }}>{entry.name.charAt(0).toUpperCase()}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                                  <p className="font-black uppercase text-sm text-white/80 truncate leading-none">{entry.name}</p>
                                  <p className="font-black text-sm tabular-nums leading-none shrink-0" style={{ color: activeTheme.accent }}>{entry.score.toLocaleString('pt-BR')} <span className="text-[9px] font-bold opacity-50">pts</span></p>
                                </div>
                                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                  <div className="score-bar h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${hexToRgba(activeTheme.primary, 0.8)}, ${activeTheme.primary})`, animationDelay: `${0.04 * i + 0.25}s` }} />
                                </div>
                                <p className="text-[9px] font-bold uppercase text-white/20 mt-1 leading-none">{entry.date}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {isAdmin && (
              <div className="flex-shrink-0 flex items-center justify-end px-5 sm:px-8 py-3" style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  onClick={async () => {
                    if (window.confirm('Tem certeza que deseja apagar TODO o ranking?')) {
                      try {
                        const { error } = await supabase.from('showdalicao').delete().neq('id', 0);
                        if (error) throw error;
                        fetchRankings();
                      } catch (err) {
                        console.error('Error clearing rankings:', err);
                      }
                    }
                  }}
                  className="flex items-center gap-2 py-2.5 px-5 rounded-xl font-black uppercase text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 active:scale-95"
                  style={{ border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  <i className="fi fi-rr-broom" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          );
        })();

  if (showDashboard && isAdmin) {
    const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-base sm:text-sm font-normal text-gray-800 outline-none focus:border-blue-400 transition-colors";
    const labelCls = "block text-xs font-normal uppercase tracking-wider text-gray-500 mb-1";
    const filtered = dbQuestions.filter(q =>
      q.topic.toLowerCase().includes(qSearch.toLowerCase()) ||
      q.question.toLowerCase().includes(qSearch.toLowerCase())
    );

    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-50" style={{ fontFamily: 'Arial Local, Arial, sans-serif' }}>

        {/* ── Header ── */}
        <div className="flex-shrink-0 relative" style={{ background: `linear-gradient(135deg, ${activeTheme.gradientStart} 0%, ${activeTheme.primary} 100%)` }}>
          <div className="flex items-center justify-between gap-2 px-3 sm:px-8 py-2.5 shadow-sm">
            {/* Logo + título */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <img src={showDaLicaoLogo} alt="Show da Lição" className="h-10 sm:h-10 w-auto object-contain drop-shadow" />
              <div className="hidden sm:block h-6 w-px bg-white/30" />
              <div className="hidden sm:block">
                <p className="text-[10px] font-normal uppercase tracking-[0.3em] text-white/60 leading-none">Painel do Professor</p>
                <p className="text-sm font-normal text-white leading-none mt-0.5">Gerenciar Perguntas</p>
                {loggedInUserName && (
                  <p className="text-[10px] text-white/50 leading-none mt-1">
                    Bem-vindo, <span className="text-white/80">{loggedInUserName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Botões direita */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">

              {/* Desktop: Início antes de Jogar */}
              <button
                onClick={() => setShowDashboard(false)}
                className="hidden sm:flex items-center px-2.5 py-2 rounded-lg text-xs text-white/50 hover:text-white/90 transition-colors active:scale-95"
              >
                Início
              </button>

              {/* Sempre visíveis: Jogar, Jogo, Ranking */}
              <button
                onClick={() => { returnToDashboard.current = true; setShowDashboard(false); openTeamNamesModal(); }}
                className="flex items-center gap-2 sm:gap-1.5 px-4 sm:px-2.5 py-2.5 sm:py-2 min-h-[52px] sm:min-h-[36px] rounded-2xl sm:rounded-lg text-base sm:text-xs font-medium sm:font-normal text-white/80 sm:text-white/50 hover:text-white/90 hover:bg-white/10 sm:hover:bg-transparent transition-colors active:scale-95"
              >
                <i className="fi fi-rr-gamepad text-xl sm:text-sm leading-none" aria-hidden="true" />
                Jogar
              </button>
              <button
                disabled={sharingLink}
                onClick={async () => {
                  if (sharingLink) return;
                  setSharingLink(true);
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { alert('Faça login para gerar o link.'); return; }
                    const { data, error } = await supabase
                      .from('game_links')
                      .insert({ user_id: user.id })
                      .select('id')
                      .single();
                    if (error || !data) { alert('Erro ao gerar link. Verifique se a tabela game_links foi criada no Supabase.'); return; }
                    const gameUrl = `${window.location.origin}${window.location.pathname}?play=solo&token=${data.id}`;
                    setShareUrl(gameUrl);
                    setShowShareModal(true);
                  } finally {
                    setSharingLink(false);
                  }
                }}
                className="flex items-center gap-2 sm:gap-1.5 px-4 sm:px-2.5 py-2.5 sm:py-2 min-h-[52px] sm:min-h-[36px] rounded-2xl sm:rounded-lg text-base sm:text-xs font-medium sm:font-normal text-white/80 sm:text-white/50 hover:text-white/90 hover:bg-white/10 sm:hover:bg-transparent transition-colors active:scale-95 disabled:opacity-40"
                title="Compartilhar link do jogo"
              >
                <i className={`fi ${sharingLink ? 'fi-rr-spinner animate-spin' : 'fi-rr-share'} text-xl sm:text-sm leading-none`} aria-hidden="true" />
                <span className="sm:hidden">Jogo</span>
                <span className="hidden sm:inline">Jogo</span>
              </button>
              <button
                onClick={() => setShowRanking(true)}
                className="hidden sm:flex items-center px-2.5 py-2 rounded-lg text-xs text-white/50 hover:text-white/90 transition-colors active:scale-95"
              >
                Ranking
              </button>

              {/* Desktop: ícones e Sair */}
              <div className="hidden sm:flex items-center gap-1">
                <div className="w-px h-4 bg-white/15 mx-1" />
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 transition-colors active:scale-95"
                  title="Configurações"
                >
                  <i className="fi fi-rr-settings text-sm leading-none" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setShowUserPanel(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 transition-colors active:scale-95"
                  title="Meu perfil"
                >
                  <i className="fi fi-rr-user text-sm leading-none" aria-hidden="true" />
                </button>
                <div className="w-px h-4 bg-white/15 mx-1" />
                <button
                  onClick={async () => { await handleLogout(); setShowDashboard(false); }}
                  className="px-2.5 py-2 rounded-lg text-xs text-white/40 hover:text-red-400 transition-colors active:scale-95"
                >
                  Sair
                </button>
              </div>

              {/* Mobile: hambúrguer */}
              <button
                onClick={() => setShowDashboardMobileMenu(v => !v)}
                className="sm:hidden w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg text-white/60 hover:text-white/90 hover:bg-white/10 transition-all active:scale-95 ml-1"
                aria-label="Menu"
              >
                <span className={`block w-[18px] h-[2px] bg-current rounded-full transition-all duration-200 ${showDashboardMobileMenu ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block w-[18px] h-[2px] bg-current rounded-full transition-all duration-200 ${showDashboardMobileMenu ? 'opacity-0' : ''}`} />
                <span className={`block w-[18px] h-[2px] bg-current rounded-full transition-all duration-200 ${showDashboardMobileMenu ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Dropdown mobile */}
          {showDashboardMobileMenu && (
            <div className="sm:hidden absolute top-full left-0 right-0 z-[100] shadow-xl border-t border-white/10 py-2" style={{ background: `linear-gradient(180deg, ${activeTheme.primary} 0%, ${mixHex(activeTheme.primary,'#001122',0.25)} 100%)` }}>
              <button
                onClick={() => { setShowDashboard(false); setShowDashboardMobileMenu(false); }}
                className="flex items-center gap-4 w-full px-6 py-4 text-base text-white/70 hover:text-white hover:bg-white/10 transition-colors active:bg-white/15"
              >
                <i className="fi fi-rr-home text-xl leading-none w-6" aria-hidden="true" />
                Início
              </button>
              <button
                onClick={() => { setShowRanking(true); setShowDashboardMobileMenu(false); }}
                className="flex items-center gap-4 w-full px-6 py-4 text-base text-white/70 hover:text-white hover:bg-white/10 transition-colors active:bg-white/15"
              >
                <i className="fi fi-rr-trophy text-xl leading-none w-6" aria-hidden="true" />
                Ranking
              </button>
              <div className="h-px mx-6 my-1 bg-white/10" />
              <button
                onClick={() => { setShowSettings(true); setShowDashboardMobileMenu(false); }}
                className="flex items-center gap-4 w-full px-6 py-4 text-base text-white/70 hover:text-white hover:bg-white/10 transition-colors active:bg-white/15"
              >
                <i className="fi fi-rr-settings text-xl leading-none w-6" aria-hidden="true" />
                Configurações
              </button>
              <button
                onClick={() => { setShowUserPanel(true); setShowDashboardMobileMenu(false); }}
                className="flex items-center gap-4 w-full px-6 py-4 text-base text-white/70 hover:text-white hover:bg-white/10 transition-colors active:bg-white/15"
              >
                <i className="fi fi-rr-user text-xl leading-none w-6" aria-hidden="true" />
                Meu Perfil
              </button>
              <div className="h-px mx-6 my-1 bg-white/10" />
              <button
                onClick={async () => { await handleLogout(); setShowDashboard(false); setShowDashboardMobileMenu(false); }}
                className="flex items-center gap-4 w-full px-6 py-4 text-base text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors active:bg-white/15"
              >
                <i className="fi fi-rr-sign-out-alt text-xl leading-none w-6" aria-hidden="true" />
                Sair
              </button>
            </div>
          )}
        </div>

        {/* ── Barra de ações ── */}
        <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-8 py-3 sm:py-4 border-b border-gray-200 bg-white">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <i className="fi fi-rr-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true" />
            <input
              type="text"
              value={qSearch}
              onChange={e => setQSearch(e.target.value)}
              placeholder="Buscar por tópico ou pergunta..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-base sm:text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs font-normal text-gray-400">{filtered.length} pergunta{filtered.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => { setQDraft(emptyDraft()); setShowQModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-normal uppercase text-xs text-white transition-all active:scale-95 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${activeTheme.gradientEnd} 0%, ${activeTheme.primary} 100%)` }}
            >
              <i className="fi fi-rr-plus text-sm leading-none" aria-hidden="true" />
              Perguntas
            </button>
          </div>
        </div>

        {/* ── Barra de seleção em massa ── */}
        {!dbLoading && filtered.length > 0 && (
          <div className="flex items-center gap-3 px-4 sm:px-8 py-2.5 sm:py-2 border-b border-gray-100 bg-gray-50/60">
            <label className="flex items-center gap-3 sm:gap-2 cursor-pointer select-none min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                className="w-5 h-5 sm:w-4 sm:h-4 rounded accent-red-500 cursor-pointer"
                checked={selectedQIds.size === filtered.length}
                ref={el => { if (el) el.indeterminate = selectedQIds.size > 0 && selectedQIds.size < filtered.length; }}
                onChange={e => {
                  if (e.target.checked) setSelectedQIds(new Set(filtered.map(q => q.id)));
                  else setSelectedQIds(new Set());
                }}
              />
              <span className="text-sm sm:text-xs text-gray-500 font-normal">
                {selectedQIds.size > 0 ? `${selectedQIds.size} selecionada${selectedQIds.size !== 1 ? 's' : ''}` : 'Selecionar todas'}
              </span>
            </label>
            {selectedQIds.size > 0 && (
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="ml-auto flex items-center gap-2 px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-sm sm:text-xs font-normal active:scale-95 min-h-[44px] sm:min-h-0"
              >
                <i className="fi fi-rr-trash text-base sm:text-sm leading-none" aria-hidden="true" />
                Excluir {selectedQIds.size}
              </button>
            )}
          </div>
        )}

        {/* ── Lista ── */}
        <div className="flex-1 overflow-y-auto settings-scroll px-4 sm:px-8 py-5">
          {dbLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <i className="fi fi-rr-spinner text-3xl animate-spin mr-3" aria-hidden="true" />
              <span className="font-normal">Carregando perguntas...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <i className="fi fi-rr-document text-2xl text-gray-300" aria-hidden="true" />
              </div>
              <p className="font-normal text-gray-400 uppercase text-sm">Nenhuma pergunta encontrada</p>
              <p className="text-xs text-gray-300 mt-1">{qSearch ? 'Tente outro termo de busca' : 'Clique em "Nova Pergunta" para adicionar'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {filtered.map((q, idx) => {
                const isSelected = selectedQIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-5 ${isSelected ? 'border-red-300 bg-red-50/30' : 'border-gray-100'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          className="mt-1 w-5 h-5 sm:w-4 sm:h-4 shrink-0 rounded accent-red-500 cursor-pointer"
                          checked={isSelected}
                          onChange={e => {
                            setSelectedQIds(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(q.id);
                              else next.delete(q.id);
                              return next;
                            });
                          }}
                        />
                        {/* Número */}
                        <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-normal text-white" style={{ background: `linear-gradient(135deg, ${activeTheme.gradientEnd}, ${activeTheme.primary})` }}>
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: activeTheme.primary }}>{q.topic}</span>
                            <span className="text-[10px] font-normal text-gray-400 uppercase">{q.source.reference}</span>
                            {q.points && q.points > 1 && <span className="text-[10px] font-normal text-amber-500">{q.points}pts</span>}
                          </div>
                          <p className="text-sm font-normal text-gray-800 leading-snug mb-2">{q.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {(['A','B','C','D'] as QuestionOptionKey[]).filter(k => q.options[k]).map(k => (
                              <div key={k} className={`flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 ${q.answer === k ? 'bg-green-50 text-green-700' : 'text-gray-500'}`}>
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-normal shrink-0 ${q.answer === k ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{k}</span>
                                {q.options[k]}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Ações */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setQDraft({
                              id: q.id, topic: q.topic, question: q.question,
                              optA: q.options.A ?? '', optB: q.options.B ?? '', optC: q.options.C ?? '', optD: q.options.D ?? '',
                              answer: q.answer, sourceType: q.source.type, sourceRef: q.source.reference, points: q.points ?? 1,
                            });
                            setShowQModal(true);
                          }}
                          className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors duration-150"
                          title="Editar"
                        >
                          <i className="fi fi-rr-edit text-base sm:text-sm" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setQDeleteId(q.id)}
                          className="w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors duration-150"
                          title="Excluir"
                        >
                          <i className="fi fi-rr-trash text-base sm:text-sm" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Modal Adicionar/Editar ── */}
        {showQModal && (
          <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
            <div className="w-full sm:max-w-2xl bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[92vh]">
              {/* Cabeçalho modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-normal text-lg" style={{ color: activeTheme.primary }}>
                  {qDraft.id ? 'Editar Pergunta' : 'Nova Pergunta'}
                </h3>
                <button onClick={() => setShowQModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors">
                  <i className="fi fi-rr-cross text-sm" aria-hidden="true" />
                </button>
              </div>
              {/* Corpo modal */}
              <div className="flex-1 overflow-y-auto settings-scroll px-6 py-5 space-y-4">
                <div>
                  <label className={labelCls}>Tópico</label>
                  <input className={inputCls} value={qDraft.topic} onChange={e => setQDraft(d => ({ ...d, topic: e.target.value }))} placeholder="Ex: Humildade e Oração" />
                </div>
                <div>
                  <label className={labelCls}>Pergunta</label>
                  <textarea className={`${inputCls} resize-none`} rows={3} value={qDraft.question} onChange={e => setQDraft(d => ({ ...d, question: e.target.value }))} placeholder="Digite o enunciado da pergunta..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['A','B','C','D'] as const).map(k => (
                    <div key={k}>
                      <label className={labelCls}>
                        Opção {k}
                        {k === qDraft.answer && <span className="ml-2 text-green-500">✓ Correta</span>}
                        {(k === 'C' || k === 'D') && <span className="ml-1 text-gray-300">(opcional)</span>}
                      </label>
                      <input
                        className={`${inputCls} ${k === qDraft.answer ? 'border-green-400 bg-green-50' : ''}`}
                        value={k === 'A' ? qDraft.optA : k === 'B' ? qDraft.optB : k === 'C' ? qDraft.optC : qDraft.optD}
                        onChange={e => setQDraft(d => ({ ...d, [`opt${k}`]: e.target.value }))}
                        placeholder={`Texto da opção ${k}...`}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className={labelCls}>Resposta Correta</label>
                  <div className="flex gap-2">
                    {(['A','B','C','D'] as QuestionOptionKey[]).map(k => (
                      <button
                        key={k}
                        onClick={() => setQDraft(d => ({ ...d, answer: k }))}
                        className="flex-1 py-2 rounded-xl font-normal text-sm transition-all"
                        style={qDraft.answer === k
                          ? { background: `linear-gradient(135deg, ${activeTheme.gradientEnd}, ${activeTheme.primary})`, color: '#fff', boxShadow: `0 4px 12px ${hexToRgba(activeTheme.primary, 0.4)}` }
                          : { background: '#f1f5f9', color: '#64748b' }}
                      >{k}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tipo de Fonte</label>
                    <select className={inputCls} value={qDraft.sourceType} onChange={e => setQDraft(d => ({ ...d, sourceType: e.target.value as 'licao' | 'biblia' }))}>
                      <option value="licao">Lição</option>
                      <option value="biblia">Bíblia</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Referência</label>
                    <input className={inputCls} value={qDraft.sourceRef} onChange={e => setQDraft(d => ({ ...d, sourceRef: e.target.value }))} placeholder="Ex: Lição 1, Lucas 18:9" />
                  </div>
                </div>
                <div className="w-28">
                  <label className={labelCls}>Pontos</label>
                  <input
                    type="number" min={10} max={1000} step={10}
                    className={inputCls}
                    value={qDraft.points}
                    onChange={e => {
                      const raw = Number(e.target.value);
                      setQDraft(d => ({ ...d, points: Math.round(raw / 10) * 10 || 10 }));
                    }}
                  />
                </div>
              </div>
              {/* Rodapé modal */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setShowQModal(false)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-normal text-sm hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleSaveQuestion}
                  disabled={dbSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-normal text-sm shadow-lg transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${activeTheme.gradientEnd} 0%, ${activeTheme.primary} 100%)` }}
                >
                  <i className={`fi ${dbSaving ? 'fi-rr-spinner animate-spin' : 'fi-rr-disk'} leading-none`} aria-hidden="true" />
                  {dbSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirmar exclusão ── */}
        {qDeleteId !== null && (
          <div className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 sm:p-7 max-w-sm w-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <i className="fi fi-rr-trash text-2xl text-red-400" aria-hidden="true" />
              </div>
              <h3 className="font-normal text-lg text-gray-800 mb-2">Excluir Pergunta?</h3>
              <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setQDeleteId(null)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-normal text-sm">Cancelar</button>
                <button onClick={() => handleDeleteQuestion(qDeleteId!)} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-normal text-sm shadow-lg">Excluir</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirmar exclusão em massa ── */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 sm:p-7 max-w-sm w-full text-center">
              <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <i className="fi fi-rr-trash text-3xl sm:text-2xl text-red-400" aria-hidden="true" />
              </div>
              <h3 className="font-normal text-xl sm:text-lg text-gray-800 mb-2">Excluir {selectedQIds.size} pergunta{selectedQIds.size !== 1 ? 's' : ''}?</h3>
              <p className="text-base sm:text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowBulkDeleteConfirm(false)} className="flex-1 py-4 sm:py-3 rounded-2xl bg-gray-100 text-gray-600 font-normal text-base sm:text-sm">Cancelar</button>
                <button
                  onClick={async () => {
                    const ids = Array.from(selectedQIds);
                    const { data: { user: authUser } } = await supabase.auth.getUser();
                    const uid = authUser?.id ?? null;
                    await supabase.from('questions').delete().in('id', ids);
                    setSelectedQIds(new Set());
                    setShowBulkDeleteConfirm(false);
                    fetchDbQuestions(uid);
                  }}
                  className="flex-1 py-4 sm:py-3 rounded-2xl bg-red-500 text-white font-normal text-base sm:text-sm shadow-lg"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal compartilhar jogo ── */}
        {showShareModal && (
          <div className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">

              <div className="px-6 pt-6 pb-7">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <i className="fi fi-rr-share text-blue-500 text-xl sm:text-base leading-none" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg sm:text-base text-gray-800 leading-tight">Compartilhar Jogo</h3>
                      <p className="text-sm sm:text-xs text-gray-400 mt-0.5">Compartilhe com seus alunos</p>
                    </div>
                  </div>
                  <button onClick={() => setShowShareModal(false)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors active:scale-90 rounded-xl">
                    <i className="fi fi-rr-cross text-base leading-none" aria-hidden="true" />
                  </button>
                </div>

                {/* Link */}
                <div className="bg-gray-50 rounded-2xl px-4 py-3.5 mb-5 border border-gray-200">
                  <p className="text-[11px] text-gray-400 uppercase font-semibold mb-1 tracking-wide">Link do jogo</p>
                  <span className="text-xs text-gray-600 break-all leading-relaxed font-mono">{shareUrl}</span>
                </div>

                {/* Botões */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl).then(() => {
                        alert('Link copiado!');
                      }).catch(() => {
                        const el = document.createElement('textarea');
                        el.value = shareUrl;
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand('copy');
                        document.body.removeChild(el);
                        alert('Link copiado!');
                      });
                    }}
                    className="w-full flex items-center justify-center gap-2.5 py-4 sm:py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-base sm:text-sm hover:bg-gray-200 transition-colors active:scale-95"
                  >
                    <i className="fi fi-rr-copy-alt text-lg sm:text-base leading-none" aria-hidden="true" />
                    Copiar link
                  </button>
                  <button
                    onClick={() => {
                      const waText = encodeURIComponent(`🎯 Jogue o Show da Lição!\n\nResponda perguntas bíblicas e veja sua pontuação no ranking.\n\n👉 ${shareUrl}`);
                      window.open(`https://wa.me/?text=${waText}`, '_blank');
                    }}
                    className="w-full flex items-center justify-center gap-2.5 py-4 sm:py-3 rounded-2xl text-white font-semibold text-base sm:text-sm active:scale-95 shadow-lg"
                    style={{ background: '#25D366' }}
                  >
                    <i className="fi fi-brands-whatsapp text-xl sm:text-base leading-none" aria-hidden="true" />
                    Compartilhar no WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {rankingOverlay}

        {/* ── Painel de conta do usuário ── */}
        {showUserPanel && (() => {
          const initials = userPanelName
            ? userPanelName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
            : userPanelEmail.slice(0, 2).toUpperCase();
          return (
            <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
              <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden" style={{ fontFamily: 'Arial Local, Arial, sans-serif' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${activeTheme.gradientStart} 0%, ${activeTheme.primary} 100%)` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                      <i className="fi fi-rr-user text-white text-sm leading-none" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.3em] text-white/50 leading-none mb-0.5">Conta</p>
                      <h2 className="text-sm font-medium text-white leading-none">Meu Perfil</h2>
                    </div>
                  </div>
                  <button onClick={() => setShowUserPanel(false)} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-red-300 transition-colors active:scale-90" aria-label="Fechar">
                    <i className="fi fi-rr-cross text-sm leading-none" aria-hidden="true" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto settings-scroll p-5 space-y-5">

                  {/* Feedback */}
                  {userPanelMsg && (
                    <div className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm ${userPanelMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                      <i className={`fi ${userPanelMsg.type === 'success' ? 'fi-rr-check-circle' : 'fi-rr-exclamation'} leading-none shrink-0`} aria-hidden="true" />
                      {userPanelMsg.text}
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 flex items-center justify-center text-white text-2xl font-medium" style={{ borderColor: hexToRgba(activeTheme.primary, 0.3), background: `linear-gradient(135deg, ${activeTheme.gradientStart}, ${activeTheme.primary})` }}>
                        {userPanelAvatarUrl
                          ? <img src={userPanelAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      {userPanelAvatarUploading && (
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                          <i className="fi fi-rr-spinner text-white text-xl animate-spin leading-none" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <label className="cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors hover:bg-gray-50" style={{ color: activeTheme.primary, borderColor: hexToRgba(activeTheme.primary, 0.3) }}>
                      <i className="fi fi-rr-camera leading-none" aria-hidden="true" />
                      {userPanelAvatarUploading ? 'Enviando...' : 'Alterar foto'}
                      <input
                        type="file" accept="image/*" className="hidden"
                        disabled={userPanelAvatarUploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleUserPanelAvatarUpload(f); e.target.value = ''; }}
                      />
                    </label>
                  </div>

                  {/* Informações */}
                  <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <i className="fi fi-rr-id-card text-sm leading-none" style={{ color: activeTheme.primary }} aria-hidden="true" />
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Informações</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Nome de exibição</label>
                        <input
                          type="text" value={userPanelName} onChange={e => setUserPanelName(e.target.value)}
                          placeholder="Seu nome"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base sm:text-sm text-gray-800 outline-none focus:border-blue-300 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">E-mail</label>
                        <input
                          type="email" value={userPanelEmail} readOnly
                          className="w-full rounded-xl border border-gray-100 bg-gray-100 px-3 py-2.5 text-base sm:text-sm text-gray-500 outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Segurança */}
                  <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <i className="fi fi-rr-lock text-sm leading-none" style={{ color: activeTheme.primary }} aria-hidden="true" />
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Segurança</p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Nova senha <span className="text-gray-300">(deixe vazio para não alterar)</span></label>
                        <div className="relative">
                          <input
                            type={showUserNewPwd ? 'text' : 'password'} value={userPanelNewPwd}
                            onChange={e => setUserPanelNewPwd(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 pr-10 py-2.5 text-base sm:text-sm text-gray-800 outline-none focus:border-blue-300 transition-colors"
                            autoComplete="new-password"
                          />
                          <button type="button" onClick={() => setShowUserNewPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                            <i className={`fi ${showUserNewPwd ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} text-sm leading-none`} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {userPanelNewPwd && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Confirmar nova senha</label>
                          <div className="relative">
                            <input
                              type={showUserConfirmPwd ? 'text' : 'password'} value={userPanelConfirmPwd}
                              onChange={e => setUserPanelConfirmPwd(e.target.value)}
                              placeholder="••••••••"
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 pr-10 py-2.5 text-base sm:text-sm text-gray-800 outline-none focus:border-blue-300 transition-colors"
                              autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowUserConfirmPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                              <i className={`fi ${showUserConfirmPwd ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} text-sm leading-none`} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-white">
                  <button
                    onClick={handleUserPanelSave}
                    disabled={userPanelSaving}
                    className="w-full py-3 rounded-2xl text-white text-sm font-medium transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${activeTheme.gradientEnd} 0%, ${activeTheme.primary} 100%)` }}
                  >
                    {userPanelSaving
                      ? <><i className="fi fi-rr-spinner animate-spin mr-2 leading-none" aria-hidden="true" />Salvando...</>
                      : <><i className="fi fi-rr-check mr-2 leading-none" aria-hidden="true" />Salvar alterações</>}
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    );
  }

  if (isSharedSoloGame && !sharedNameReady && gameState.mode !== 'playing' && gameState.mode !== 'gameover') {
    // Token inválido ou sem token
    const noToken = !sharedToken;
    // Determina o estado de carregamento: aguardando validação do token
    const validating = !noToken && !sharedLinkExpired && sharedLinkUserId === null;
    const canStart = !noToken && !sharedLinkExpired && dbQuestions.length > 0;

    const handleSharedStart = () => {
      if (!canStart) return;
      setSharedNameReady(true);
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: `linear-gradient(135deg, ${activeTheme.gradientEnd} 0%, ${activeTheme.primary} 100%)` }}>
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <img src={showDaLicaoLogo} alt="Show da Lição" className="h-20 drop-shadow-lg" />
          <div className="text-center">
            <h1 className="text-white text-2xl font-normal tracking-wide">Show da Lição</h1>
            <p className="text-white/60 text-sm mt-1">Quiz Bíblico</p>
          </div>

          <div className="w-full bg-white/10 backdrop-blur-sm rounded-3xl p-6 flex flex-col gap-5 shadow-xl">
            {sharedLinkExpired || noToken ? (
              /* Link expirado ou inválido */
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <i className="fi fi-rr-time-past text-white/60 text-2xl leading-none" aria-hidden="true" />
                </div>
                <p className="text-white font-normal text-base">
                  {noToken ? 'Link inválido' : 'Este link expirou'}
                </p>
                <p className="text-white/50 text-sm leading-relaxed">
                  {noToken
                    ? 'Solicite um novo link ao professor.'
                    : 'Este link não é mais válido. Solicite um novo link ao professor.'}
                </p>
              </div>
            ) : validating || dbQuestions.length === 0 ? (
              /* Carregando / validando */
              <div className="flex flex-col items-center gap-3 py-2">
                <i className="fi fi-rr-spinner animate-spin text-white/60 text-2xl leading-none" aria-hidden="true" />
                <p className="text-white/70 text-sm">Carregando o jogo...</p>
              </div>
            ) : (
              /* Pronto: pede o nome */
              <>
                <div className="text-center">
                  <p className="text-white font-normal text-base">Qual é o seu nome?</p>
                  <p className="text-white/50 text-xs mt-1">{dbQuestions.length} perguntas disponíveis</p>
                </div>
                <input
                  type="text"
                  autoFocus
                  maxLength={30}
                  value={sharedPlayerName}
                  onChange={e => setSharedPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSharedStart()}
                  placeholder="Digite seu nome..."
                  className="w-full px-4 py-3 rounded-2xl bg-white/20 text-white placeholder-white/40 text-base font-normal outline-none focus:bg-white/30 transition-colors"
                />
                <button
                  onClick={handleSharedStart}
                  className="w-full py-3.5 rounded-2xl text-white font-normal text-base transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}
                >
                  <i className="fi fi-rr-gamepad leading-none" aria-hidden="true" />
                  Jogar
                </button>
              </>
            )}
          </div>
          {!sharedLinkExpired && !noToken && (
            <p className="text-white/30 text-xs text-center">Sua pontuação será salva no ranking</p>
          )}
        </div>
      </div>
    );
  }

  if (showLoginScreen && !isAdmin) {
    const closeLoginScreen = () => {
      setShowLoginScreen(false);
      setLoginMode('login');
      setLoginEmail('');
      setLoginPassword('');
      setLoginConfirmPassword('');
      setLoginName('');
      setLoginMessage(null);
      setShowLoginPassword(false);
      setShowLoginConfirmPassword(false);
    };

    const switchMode = (mode: 'login' | 'register' | 'forgot') => {
      setLoginMode(mode);
      setLoginMessage(null);
      setLoginPassword('');
      setLoginConfirmPassword('');
      setLoginName('');
      setShowLoginPassword(false);
      setShowLoginConfirmPassword(false);
    };

    const titles = { login: 'Acesso do Professor', register: 'Criar Conta', forgot: 'Recuperar Senha' };
    const subtitles = {
      login: 'Entre com suas credenciais para continuar',
      register: 'Preencha os dados para criar sua conta',
      forgot: 'Informe seu e-mail para receber o link de recuperação',
    };

    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${mixHex(activeTheme.gradientStart,'#001122',0.35)} 0%, ${activeTheme.primary} 45%, ${mixHex(activeTheme.gradientEnd,'#001a2e',0.3)} 100%)` }}
      >
        {/* Vinheta */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.45) 100%)' }} />
        {/* Spotlight */}
        <div className="pointer-events-none absolute" style={{ top: '0%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '65%', background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.12) 0%, transparent 65%)' }} />
        {/* Grade */}
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />


        {/* Card */}
        <div className="relative z-10 w-full max-w-sm fade-in-up" style={{ fontFamily: 'Arial Local, Arial, sans-serif' }}>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={showDaLicaoLogo} alt="Show da Lição" className="w-52 h-auto object-contain" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }} />
          </div>

          {/* Formulário */}
          <div className="rounded-3xl p-7 shadow-2xl" style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.2)' }}>

            {/* Título */}
            <h2 className="text-xl font-medium text-white text-center mb-0.5">{titles[loginMode]}</h2>
            <p className="text-white/50 text-xs text-center mb-6">{subtitles[loginMode]}</p>

            {/* Mensagem de feedback */}
            {loginMessage && (
              <div
                className="flex items-start gap-2.5 rounded-2xl px-4 py-3 mb-5 text-sm"
                style={{
                  background: loginMessage.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${loginMessage.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: loginMessage.type === 'success' ? '#86efac' : '#fca5a5',
                }}
              >
                <i className={`fi ${loginMessage.type === 'success' ? 'fi-rr-check' : 'fi-rr-exclamation'} text-sm mt-0.5 shrink-0`} aria-hidden="true" />
                <span>{loginMessage.text}</span>
              </div>
            )}

            {/* Campos */}
            <div className="space-y-3 mb-5">

              {/* Nome de usuário — só register */}
              {loginMode === 'register' && (
                <div className="relative">
                  <i className="fi fi-rr-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true" />
                  <input
                    type="text"
                    value={loginName}
                    onChange={e => setLoginName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    placeholder="Seu nome"
                    className="w-full rounded-2xl pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 text-base sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.6)' }}
                    autoComplete="name"
                    maxLength={40}
                  />
                </div>
              )}

              {/* E-mail */}
              <div className="relative">
                <i className="fi fi-rr-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loginMode === 'login' && handleLogin()}
                  placeholder="seu@email.com"
                  className="w-full rounded-2xl pl-11 pr-4 py-3 text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 text-base sm:text-sm"
                  style={{ background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.6)' }}
                  autoComplete="email"
                />
              </div>

              {/* Senha */}
              {loginMode !== 'forgot' && (
                <div className="relative">
                  <i className="fi fi-rr-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loginMode === 'login' && handleLogin()}
                    placeholder="••••••••"
                    className="w-full rounded-2xl pl-11 pr-11 py-3 text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 text-base sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.6)' }}
                    autoComplete={loginMode === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150"
                    tabIndex={-1}
                    aria-label={showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <i className={`fi ${showLoginPassword ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} text-sm`} aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Confirmar senha — só register */}
              {loginMode === 'register' && (
                <div className="relative">
                  <i className="fi fi-rr-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true" />
                  <input
                    type={showLoginConfirmPassword ? 'text' : 'password'}
                    value={loginConfirmPassword}
                    onChange={e => setLoginConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    placeholder="Confirmar senha"
                    className="w-full rounded-2xl pl-11 pr-11 py-3 text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 text-base sm:text-sm"
                    style={{ background: 'rgba(255,255,255,0.92)', border: '1.5px solid rgba(255,255,255,0.6)' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginConfirmPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150"
                    tabIndex={-1}
                    aria-label={showLoginConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <i className={`fi ${showLoginConfirmPassword ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} text-sm`} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {/* Link "Esqueceu a senha" — só no login */}
            {loginMode === 'login' && (
              <div className="flex justify-end mb-5">
                <button
                  onClick={() => switchMode('forgot')}
                  className="text-xs text-white/60 hover:text-white transition-colors duration-150 underline underline-offset-2"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {/* Botão principal */}
            <button
              onClick={loginMode === 'login' ? handleLogin : loginMode === 'register' ? handleRegister : handleForgotPassword}
              className="w-full py-3.5 font-medium text-base rounded-2xl transition-all duration-200 active:scale-95 mb-4"
              style={{ background: '#ffffff', color: activeTheme.primary, boxShadow: '0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.9)' }}
            >
              {loginMode === 'login' && <><i className="fi fi-rr-sign-in-alt mr-2" aria-hidden="true" />Entrar</>}
              {loginMode === 'register' && <><i className="fi fi-rr-user-add mr-2" aria-hidden="true" />Criar Conta</>}
              {loginMode === 'forgot' && <><i className="fi fi-rr-paper-plane mr-2" aria-hidden="true" />Enviar Link</>}
            </button>

            {/* Links de alternância */}
            <div className="flex flex-col items-center gap-2 text-xs">
              {loginMode === 'login' && (
                <div className="flex items-center gap-4">
                  <button onClick={() => switchMode('register')} className="text-white/55 hover:text-white transition-colors duration-150">
                    Criar conta
                  </button>
                  <span className="text-white/25">·</span>
                  <button onClick={closeLoginScreen} className="text-white/55 hover:text-white transition-colors duration-150">
                    Voltar
                  </button>
                </div>
              )}
              {loginMode === 'register' && (
                <button onClick={() => switchMode('login')} className="text-white/55 hover:text-white transition-colors duration-150">
                  Já tenho conta
                </button>
              )}
              {loginMode === 'forgot' && (
                <button onClick={() => switchMode('login')} className="text-white/55 hover:text-white transition-colors duration-150">
                  Já tenho conta
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.mode === 'setup') {
    return (
      <div
        className="relative flex items-center justify-center min-h-[100dvh] text-white text-center overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${mixHex(activeTheme.gradientStart,'#001122',0.35)} 0%, ${activeTheme.primary} 45%, ${mixHex(activeTheme.gradientEnd,'#001a2e',0.3)} 100%)` }}
      >
        {/* Vinheta nas bordas */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(0,0,0,0.45) 100%)', zIndex: 1 }} />

        {/* Spotlight atrás do logo */}
        <div className="pointer-events-none absolute" style={{ top: '0%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '65%', background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.13) 0%, transparent 65%)', zIndex: 1 }} />

        {/* Grade sutil */}
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '72px 72px', zIndex: 1 }} />

        {/* Linha brilhante horizontal */}
        <div className="pointer-events-none absolute left-0 right-0" style={{ top: '58%', height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.12) 70%, transparent 100%)', zIndex: 2 }} />

        {/* Conteúdo */}
        <div className="relative w-full max-w-4xl flex flex-col items-center px-4 py-8" style={{ zIndex: 3, ...setupFixedScaledStyle }}>

          <img
            src={showDaLicaoLogo}
            alt="Show da Lição"
            className="logo-float w-full max-w-[320px] sm:max-w-[560px] md:max-w-[780px] h-auto object-contain mb-8 md:mb-14"
            style={{ filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.45)) drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
          />

          <div className="w-full max-w-xs flex flex-col items-center gap-4">
            {/* Botão principal — branco com cor do tema */}
            <button
              onClick={() => {
                if (isAdmin) {
                  setShowDashboard(true);
                  fetchDbQuestions();
                } else {
                  setShowLoginScreen(true);
                }
              }}
              className="btn-quiz-primary w-full py-4 md:py-5 text-2xl md:text-3xl rounded-2xl transition-all duration-200 active:scale-95"
              style={{
                background: '#ffffff',
                color: activeTheme.primary,
                boxShadow: `0 10px 40px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.9)`,
                fontWeight: 900,
              }}
            >
              Criar Jogo
            </button>

            {/* Divisor */}
            <div className="flex items-center gap-3 w-full">
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">ou</span>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Botão ranking */}
            <button
              onClick={() => setShowRanking(true)}
              className="group inline-flex items-center gap-2.5 text-white/75 hover:text-white font-black py-2.5 px-6 rounded-2xl transition-all duration-200 ease-out active:scale-95 w-full justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
              title="Ranking"
            >
              <img src={trofeuIcon} alt="Troféu" className="w-6 h-6 object-contain drop-shadow transition-transform duration-200 group-hover:scale-115" />
              <span className="text-sm uppercase tracking-[0.25em]">Ranking</span>
            </button>
          </div>

        </div>

        {showModeSelection && (
          <div className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-0 p-8 text-center fade-in-up" style={{ color: activeTheme.primary, fontFamily: 'Arial Local, Arial, sans-serif', boxShadow: `0 32px 64px rgba(0,0,0,0.28), 0 0 0 1px ${hexToRgba(activeTheme.accent, 0.4)}` }}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${activeTheme.gradientStart}, ${activeTheme.gradientEnd})` }}>
                <i className="fi fi-rr-gamepad text-white text-2xl" aria-hidden="true" />
              </div>
              <p className="text-xs uppercase tracking-[0.25em] font-black text-gray-400 mb-1">Modo de Jogo</p>
              <h3 className="text-xl font-black mb-7" style={{ color: activeTheme.primary }}>Como deseja jogar?</h3>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowModeSelection(false);
                    openTeamNamesModal();
                  }}
                  className="btn-quiz-primary w-full py-4 text-white font-black uppercase text-base shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${activeTheme.gradientEnd} 0%, ${activeTheme.primary} 100%)`,
                    boxShadow: `0 6px 20px ${hexToRgba(activeTheme.primary, 0.4)}`
                  }}
                >
                  <i className="fi fi-rr-users mr-2" aria-hidden="true" />
                  Equipes
                </button>
                <button
                  onClick={() => {
                    setShowModeSelection(false);
                    setShowSoloNameModal(true);
                  }}
                  className="w-full rounded-2xl py-4 border-2 font-black uppercase text-base transition-all duration-200 hover:shadow-md active:scale-95"
                  style={{ borderColor: hexToRgba(activeTheme.primary, 0.3), color: activeTheme.primary, backgroundColor: hexToRgba(activeTheme.accent, 0.12) }}
                >
                  <i className="fi fi-rr-user mr-2" aria-hidden="true" />
                  Solo
                </button>
                <button
                  onClick={() => setShowModeSelection(false)}
                  className="mt-1 text-xs uppercase font-black text-gray-400 hover:text-gray-600 py-2 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showSoloNameModal && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 p-6 md:p-7 text-left" style={{ borderColor: activeTheme.accent, color: activeTheme.primary, fontFamily: 'Arial Local, Arial, sans-serif' }}>
              <p className="text-sm uppercase font-black mb-4">Nome do Jogador</p>
              <input
                type="text"
                value={draftSoloName}
                onChange={(e) => setDraftSoloName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-800 outline-none mb-6"
                placeholder="Digite seu nome..."
                autoFocus
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowSoloNameModal(false)}
                  className="rounded-xl px-5 py-3 bg-gray-100 text-gray-700 font-black uppercase text-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={() => {
                    if (draftSoloName.trim()) {
                      setShowSoloNameModal(false);
                      handleStartGame(true);
                    }
                  }}
                  disabled={!draftSoloName.trim()}
                  className="rounded-xl px-5 py-3 text-white font-black uppercase text-sm shadow-lg transition-all duration-200 ease-out hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                  style={{ backgroundColor: activeTheme.primary }}
                >
                  Iniciar
                </button>
              </div>
            </div>
          </div>
        )}

        {loginModal}

        {showTeamNamesModal && (
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl" style={{ borderTop: `4px solid ${activeTheme.accent}` }}>

              <div className="px-6 pt-6 pb-7">
                <p className="text-base sm:text-sm uppercase font-black mb-5 sm:mb-4" style={{ color: activeTheme.primary }}>Alterar Nome de Equipes</p>

                <div className="space-y-5 sm:space-y-4 mb-7 sm:mb-6">
                  <div>
                    <label className="block text-xs uppercase font-black text-gray-500 mb-2">Equipe 1</label>
                    <input
                      type="text"
                      value={draftTeam1Name}
                      onChange={(e) => setDraftTeam1Name(e.target.value)}
                      className="w-full rounded-2xl sm:rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:py-3 text-base font-semibold text-gray-800 outline-none focus:border-blue-300 transition-colors"
                      placeholder="Nome da Equipe 1..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-black text-gray-500 mb-2">Equipe 2</label>
                    <input
                      type="text"
                      value={draftTeam2Name}
                      onChange={(e) => setDraftTeam2Name(e.target.value)}
                      className="w-full rounded-2xl sm:rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 sm:py-3 text-base font-semibold text-gray-800 outline-none focus:border-blue-300 transition-colors"
                      placeholder="Nome da Equipe 2..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowTeamNamesModal(false);
                      if (returnToDashboard.current) {
                        returnToDashboard.current = false;
                        setShowDashboard(true);
                      }
                    }}
                    className="flex-1 sm:flex-none rounded-2xl sm:rounded-xl px-5 py-4 sm:py-3 bg-gray-100 text-gray-700 font-black uppercase text-base sm:text-sm active:scale-95 transition-all"
                  >
                    Fechar
                  </button>
                  <button
                    onClick={saveTeamNames}
                    disabled={!draftTeam1Name.trim() || !draftTeam2Name.trim()}
                    className="flex-1 rounded-2xl sm:rounded-xl px-5 py-4 sm:py-3 text-white font-black uppercase text-base sm:text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                    style={{ backgroundColor: activeTheme.primary }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {rankingOverlay}

        {updateButton}
        {updateDialog}
        {appFooter}
        {loginModal}
      </div>
    );
  }

  if (gameState.mode === 'gameover') {
    const winner = gameState.teams[0].score > gameState.teams[1].score ? gameState.teams[0] : gameState.teams[1];
    const isDraw = gameState.teams[0].score === gameState.teams[1].score;

    const handleFinalize = async () => {
      if (gameState.isSoloMode) {
        await saveRankingEntries(gameState.teams, isSharedSoloGame);
      }
      window.location.reload();
    };

    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 md:p-6 overflow-y-auto settings-scroll">
        <div className="w-full max-w-2xl" style={setupScaledStyle}>
          <div className="bg-white rounded-[2rem] shadow-2xl text-center w-full overflow-hidden">
            {/* Header colorido */}
            <div
              className="px-5 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8"
              style={{ background: `linear-gradient(135deg, ${activeTheme.gradientStart} 0%, ${activeTheme.primary} 100%)` }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="fi fi-rr-trophy text-white text-2xl sm:text-3xl" aria-hidden="true" />
              </div>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-black uppercase text-white mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>Fim de Jogo</h2>
              <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">
                {gameState.isSoloMode ? `Parabéns, ${gameState.teams[0].name}!` : (isDraw ? 'Empate Técnico!' : `Vencedor: ${winner.name}`)}
              </p>
            </div>

            {/* Placar */}
            <div className="p-4 sm:p-6 md:p-8">
              <div className={`grid ${gameState.isSoloMode ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-1 sm:grid-cols-2'} gap-3 sm:gap-4 mb-6 sm:mb-8`}>
                {gameState.teams.slice(0, gameState.isSoloMode ? 1 : 2).map((team, idx) => {
                  const isWinner = !isDraw && team === winner;
                  return (
                    <div
                      key={team.name}
                      className="rounded-2xl p-5 border-2 transition-all"
                      style={isWinner || gameState.isSoloMode ? {
                        background: hexToRgba(activeTheme.accent, 0.18),
                        borderColor: activeTheme.primary
                      } : {
                        background: '#f8fafc',
                        borderColor: '#e2e8f0'
                      }}
                    >
                      {isWinner && !gameState.isSoloMode && (
                        <div className="text-xs font-black uppercase tracking-wider mb-2 flex items-center justify-center gap-1" style={{ color: activeTheme.primary }}>
                          <i className="fi fi-rr-crown" aria-hidden="true" />
                          Vencedor
                        </div>
                      )}
                      <p className="text-xs sm:text-sm font-black uppercase text-gray-500 mb-2 truncate">{team.name}</p>
                      <p className="text-3xl sm:text-4xl font-black" style={{ color: isWinner || gameState.isSoloMode ? activeTheme.primary : '#94a3b8' }}>
                        {team.score}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">pontos</p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleFinalize}
                className="btn-quiz-primary w-full py-4 text-white font-black text-base md:text-lg uppercase tracking-wider shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${activeTheme.gradientEnd} 0%, ${activeTheme.primary} 100%)`,
                  boxShadow: `0 6px 0 ${hexToRgba(activeTheme.primary, 0.6)}, 0 12px 28px ${hexToRgba(activeTheme.primary, 0.35)}`
                }}
              >
                <i className="fi fi-rr-refresh mr-2" aria-hidden="true" />
                Jogar Novamente
              </button>
            </div>
          </div>
        </div>
        {setupZoomFloatingControl}
        {updateDialog}
        {appFooter}
        {loginModal}
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
              <p className="text-xs font-bold uppercase opacity-80 mb-1">
                {gameState.isSoloMode ? gameState.teams[0].name : "Equipe Atual"}
              </p>
              <p className="text-lg sm:text-2xl md:text-3xl font-black leading-none italic truncate">
                {gameState.isSoloMode ? `${gameState.teams[0].score} pts` : currentTeam.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {gameState.isSoloMode && (
                <button
                  onClick={handleTenSecondsTimer}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-200"
                  title="Tempo 10s"
                >
                  <i className="fi fi-ts-time-forward-ten text-xl" aria-hidden="true" />
                </button>
              )}
              <div className="text-right min-w-[88px]">
                <p className="text-xs font-bold uppercase opacity-80 mb-1">Questão</p>
                <p className="text-base sm:text-xl md:text-2xl font-black leading-none">0/0</p>
              </div>
            </div>
          </div>

          {!gameState.isSoloMode && (
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
          )}

          <div className="question-card mt-3 sm:mt-0 bg-white rounded-[2rem] shadow-2xl p-6 md:p-10 mb-6 sm:mb-8 flex-grow border-b-[10px] relative overflow-hidden flex flex-col justify-center" style={{ borderColor: activeTheme.accent, ['--card-accent' as any]: activeTheme.accent }}>
            <div className="text-center max-w-xl mx-auto py-8">
              <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ background: hexToRgba(activeTheme.accent, 0.18) }}>
                <i className="fi fi-rr-document text-4xl" style={{ color: activeTheme.primary }} aria-hidden="true" />
              </div>
              <h3 className="text-xl md:text-3xl font-black text-gray-800 leading-tight mb-3">Nenhuma pergunta disponível</h3>
              <p className="text-sm md:text-base font-semibold text-gray-500 leading-relaxed mb-6">Volte à tela inicial e gere as perguntas antes de jogar.</p>
              <div className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black text-gray-700 bg-gray-50 border-gray-200">
                <i className="fi fi-rr-menu-burger text-sm" aria-hidden="true" />
                Configurações → Perguntas → Gerar Perguntas
              </div>
            </div>
          </div>
        </div>

        {questionOptionsPanel}
        {updateDialog}
        {appFooter}
        {loginModal}
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
        style={{ transform: isMobile ? 'none' : `scale(${gameZoomLevel / 100})`, transformOrigin: 'center top' }}
      >
      {/* Header Info */}
      <div className="sticky top-[6px] z-40 flex flex-nowrap justify-between items-center gap-2 mb-3 bg-black/25 p-2 sm:p-3 md:p-4 rounded-2xl md:rounded-3xl backdrop-blur-md text-white border border-white/20 shadow-2xl">
        <button
          onClick={resetToSetup}
          className="inline-flex items-center justify-center gap-1.5 text-white font-black px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs uppercase transition-all duration-200 ease-out active:scale-90 border border-white/25 hover:bg-white/15"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <i className="fi fi-rr-home text-xs" aria-hidden="true" />
          <span className="hidden sm:inline">Início</span>
        </button>

        <div className="text-center flex-1 min-w-0 px-2">
          <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">
            {gameState.isSoloMode ? 'Pontuação' : 'Vez da Equipe'}
          </p>
          <p className="text-base sm:text-xl md:text-2xl font-black leading-none truncate" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {gameState.isSoloMode ? `${gameState.teams[0].score} pts` : currentTeam.name}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {gameState.isSoloMode && (
            <button
              onClick={handleTenSecondsTimer}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all duration-200 active:scale-90"
              title="Iniciar cronômetro de 10s"
            >
              <i className="fi fi-ts-time-forward-ten text-sm md:text-base" aria-hidden="true" />
            </button>
          )}
          <div className="bg-white/15 border border-white/20 rounded-xl px-3 py-1.5 text-center min-w-[60px]">
            <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider opacity-60 leading-none mb-0.5">Questão</p>
            <p className="text-sm sm:text-lg font-black leading-none">{gameState.currentQuestionIndex + 1}/{gameState.shuffledQuestions.length}</p>
          </div>
        </div>
      </div>

      {/* Scoreboard */}
      {!gameState.isSoloMode && (
        <div className="sticky top-[58px] sm:top-[82px] md:top-[92px] z-30 relative mb-4 sm:mb-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2 md:gap-3">
            {(() => {
              const team1 = gameState.teams[0];
              const team2 = gameState.teams[1];
              const isTeam1Active = 0 === gameState.currentTeamIndex;
              const isTeam2Active = 1 === gameState.currentTeamIndex;

              return (
                <>
                  <div
                    className={`min-w-0 h-[52px] sm:h-[68px] md:h-[80px] px-2 sm:px-4 rounded-2xl text-center border-2 transition-all duration-300 ease-out flex flex-col items-center justify-center ${isTeam1Active ? 'scale-[1.03]' : 'bg-black/20 text-white border-white/10'}`}
                    style={isTeam1Active ? {
                      background: `linear-gradient(135deg, ${activeTheme.gradientEnd}, ${activeTheme.primary})`,
                      borderColor: 'rgba(255,255,255,0.45)',
                      color: '#fff',
                      boxShadow: `0 0 0 3px ${hexToRgba(activeTheme.primary, 0.4)}, 0 12px 28px ${hexToRgba(activeTheme.primary, 0.4)}`
                    } : undefined}
                  >
                    <p className="text-[9px] sm:text-xs md:text-sm font-black uppercase truncate leading-none mb-0.5 md:mb-1 opacity-85 w-full">{team1.name}</p>
                    <p className="text-sm sm:text-lg md:text-xl font-black leading-none">{team1.score}</p>
                    <p className="text-[7px] sm:text-[9px] font-bold uppercase opacity-50 leading-none mt-0.5">pts</p>
                  </div>

                  <button
                    onClick={handleTenSecondsTimer}
                    className="h-[52px] sm:h-[68px] md:h-[80px] min-w-[52px] sm:min-w-[68px] md:min-w-[80px] px-2 sm:px-3 rounded-2xl bg-black/25 hover:bg-black/35 backdrop-blur-sm border border-white/15 flex flex-col items-center justify-center gap-1 transition-all duration-200 ease-out active:scale-90"
                    aria-label="Iniciar contador de 10 segundos"
                    title="Cronômetro 10s"
                  >
                    <i className="fi fi-ts-time-forward-ten text-white text-[22px] md:text-[30px] leading-none" aria-hidden="true" />
                    <span className="text-[7px] font-black text-white/50 uppercase tracking-wider hidden sm:block">10s</span>
                  </button>

                  <div
                    className={`min-w-0 h-[52px] sm:h-[68px] md:h-[80px] px-2 sm:px-4 rounded-2xl text-center border-2 transition-all duration-300 ease-out flex flex-col items-center justify-center ${isTeam2Active ? 'scale-[1.03]' : 'bg-black/20 text-white border-white/10'}`}
                    style={isTeam2Active ? {
                      background: `linear-gradient(135deg, ${activeTheme.gradientEnd}, ${activeTheme.primary})`,
                      borderColor: 'rgba(255,255,255,0.45)',
                      color: '#fff',
                      boxShadow: `0 0 0 3px ${hexToRgba(activeTheme.primary, 0.4)}, 0 12px 28px ${hexToRgba(activeTheme.primary, 0.4)}`
                    } : undefined}
                  >
                    <p className="text-[9px] sm:text-xs md:text-sm font-black uppercase truncate leading-none mb-0.5 md:mb-1 opacity-85 w-full">{team2.name}</p>
                    <p className="text-sm sm:text-lg md:text-xl font-black leading-none">{team2.score}</p>
                    <p className="text-[7px] sm:text-[9px] font-bold uppercase opacity-50 leading-none mt-0.5">pts</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

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
                      onClick={() => setSettingsSection(item.id as 'interface' | 'fontes')}
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
          <div className="question-card mt-3 sm:mt-0 bg-white rounded-[2rem] shadow-2xl p-5 sm:p-6 md:p-10 xl:p-12 mb-5 sm:mb-6 flex-grow border-b-[10px] relative overflow-hidden flex flex-col justify-center" style={{ borderColor: activeTheme.accent, ['--card-accent' as any]: activeTheme.accent }}>
            {/* Número da questão decorativo */}
            <div className="absolute top-4 right-6 font-black text-[5rem] md:text-[9rem] leading-none pointer-events-none select-none" style={{ color: hexToRgba(activeTheme.accent, 0.09) }}>
              {gameState.currentQuestionIndex + 1}
            </div>
            {/* Barra de progresso da questão */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 rounded-t-[2rem] overflow-hidden">
              <div
                className="h-full transition-all duration-500 ease-out rounded-full"
                style={{
                  width: `${((gameState.currentQuestionIndex + 1) / gameState.shuffledQuestions.length) * 100}%`,
                  background: `linear-gradient(90deg, ${activeTheme.gradientStart}, ${activeTheme.primary})`
                }}
              />
            </div>
            <div className="relative z-10 w-full pt-2">
              <h3
                className="font-black text-gray-800 leading-[1.25] mb-7 sm:mb-8 md:mb-10 text-center"
                style={{ fontFamily: questionFontFamily, fontSize: responsiveQuestionFontSize }}
              >
                {currentQuestion.question}
              </h3>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 ${currentOptionKeys.length > 4 ? 'lg:grid-cols-3' : ''}`}>
                {currentOptionKeys.map((key) => {
                  const isHidden = gameState.hiddenOptions.includes(key);
                  const isSelected = !isAdvancingQuestion && !gameState.showExplanation && selectedOption === key && selectedQuestionId === currentQuestion.id;

                  let btnClass = "answer-btn relative w-full text-left rounded-2xl border-[3px] font-bold flex items-center ";
                  let btnStyle: React.CSSProperties;

                  if (isHidden) {
                    btnClass += "opacity-0 pointer-events-none";
                    btnStyle = { ...answerButtonStyle };
                  } else if (isSelected) {
                    btnClass += "selected";
                    btnStyle = {
                      ...answerButtonStyle,
                      backgroundColor: hexToRgba(activeTheme.primary, 0.06),
                      borderColor: activeTheme.primary,
                      color: '#0f172a',
                    };
                  } else {
                    btnClass += "bg-white text-gray-700";
                    btnStyle = { ...answerButtonStyle, borderColor: '#e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };
                  }

                  return (
                    <button
                      key={key}
                      disabled={isHidden || gameState.showExplanation}
                      onClick={() => handleOptionClick(key)}
                      className={btnClass}
                      style={btnStyle}
                    >
                      <span
                        className="rounded-full flex items-center justify-center shrink-0 font-black transition-all duration-150"
                        style={{
                          backgroundColor: isSelected ? activeTheme.primary : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#64748b',
                          width: responsiveBadgeSize,
                          height: responsiveBadgeSize,
                          fontSize: responsiveBadgeFontSize,
                          boxShadow: isSelected ? `0 4px 12px ${hexToRgba(activeTheme.primary, 0.35)}` : 'none',
                          flexShrink: 0
                        }}
                      >
                        {key}
                      </span>
                      <span
                        className="min-w-0 leading-tight break-words"
                        style={{ fontFamily: answerFontFamily, fontSize: responsiveAnswerFontSize, lineHeight: 1.15 }}
                      >
                        {currentQuestion.options[key]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-5 mb-6 w-full">
            <button
              disabled={!selectedOption}
              onClick={handleConfirm}
              className="inline-flex flex-1 min-w-[140px] items-center justify-center text-white font-black py-3.5 md:py-4 px-6 md:px-10 rounded-2xl text-sm md:text-lg transition-all duration-200 ease-out shadow-xl active:scale-95 uppercase tracking-wide gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: selectedOption
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : '#d1d5db',
                boxShadow: selectedOption
                  ? '0 6px 0 #15803d, 0 8px 20px rgba(34,197,94,0.35)'
                  : '0 4px 0 #9ca3af',
              }}
            >
              <i className="fi fi-rr-check" aria-hidden="true" />
              Confirmar
            </button>
            <button
              onClick={handleSkip}
              className="inline-flex flex-1 min-w-[120px] items-center justify-center font-black py-3.5 md:py-4 px-5 md:px-8 rounded-2xl text-sm md:text-lg transition-all duration-200 ease-out shadow-lg active:scale-95 uppercase tracking-wide gap-2"
              style={{
                background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                color: '#ffffff',
                boxShadow: '0 5px 0 #334155, 0 6px 16px rgba(71,85,105,0.3)',
              }}
            >
              <i className="fi fi-rr-forward" aria-hidden="true" />
              Passar
            </button>
          </div>
        </>
      )}

      {showTenSecondsClock && (
        <div className="fixed inset-0 z-[45] flex items-center justify-center pointer-events-none">
          <div
            className={`timer-countdown ${tenSecondsRemaining <= 3 ? 'urgent' : ''} rounded-3xl px-10 py-7 md:px-14 md:py-9 text-white text-center`}
            style={{
              background: tenSecondsRemaining <= 3
                ? 'linear-gradient(135deg, rgba(185,28,28,0.92), rgba(220,38,38,0.92))'
                : 'linear-gradient(135deg, rgba(15,23,42,0.88), rgba(30,41,59,0.88))',
              boxShadow: tenSecondsRemaining <= 3
                ? '0 0 0 4px rgba(239,68,68,0.4), 0 20px 60px rgba(220,38,38,0.5)'
                : '0 0 0 2px rgba(255,255,255,0.15), 0 20px 60px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-60 mb-2 font-bold">Cronômetro</p>
            <p className="text-6xl md:text-8xl font-black leading-none tabular-nums">{Math.max(0, tenSecondsRemaining)}</p>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.25em] opacity-50 mt-2 font-bold">segundos</p>
          </div>
        </div>
      )}

      {/* Help Overlays */}
      {gameState.lifelineResult && !gameState.showExplanation && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 z-50">
          <div className="fade-in-up bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden" style={{ boxShadow: `0 32px 64px rgba(0,0,0,0.3), 0 0 0 2px ${hexToRgba(activeTheme.accent, 0.4)}` }}>
            {/* Header */}
            <div className="px-8 pt-7 pb-6 border-b border-gray-100 text-center" style={{ background: `linear-gradient(135deg, ${hexToRgba(activeTheme.gradientStart, 0.12)}, ${hexToRgba(activeTheme.accent, 0.18)})` }}>
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${activeTheme.gradientStart}, ${activeTheme.primary})` }}>
                {gameState.lifelineResult.type === 'plateia'
                  ? <i className="fi fi-rr-users text-white text-xl" aria-hidden="true" />
                  : <i className="fi fi-rr-graduation-cap text-white text-xl" aria-hidden="true" />
                }
              </div>
              <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight" style={{ color: activeTheme.primary }}>
                {gameState.lifelineResult.type === 'plateia' ? 'Opinião da Plateia' : 'Universitários'}
              </h4>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              {gameState.lifelineResult.type === 'plateia' && (
                <div className="space-y-4">
                  {Object.entries(gameState.lifelineResult.data).map(([key, val]: [any, any]) => (
                    <div key={key} className="flex items-center gap-4">
                      <span className="font-black text-lg w-7 text-center shrink-0" style={{ color: activeTheme.primary }}>{key}</span>
                      <div className="flex-grow bg-gray-100 h-6 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                          style={{ width: `${val}%`, background: `linear-gradient(90deg, ${activeTheme.gradientStart}, ${activeTheme.primary})`, minWidth: val > 0 ? '2rem' : '0' }}
                        />
                      </div>
                      <span className="font-black w-12 text-right text-sm shrink-0" style={{ color: activeTheme.primary }}>{val}%</span>
                    </div>
                  ))}
                </div>
              )}
              {gameState.lifelineResult.type === 'universitarios' && (
                <div className="space-y-4">
                  <div className="rounded-2xl p-5 border" style={{ backgroundColor: hexToRgba(activeTheme.accent, 0.12), borderColor: hexToRgba(activeTheme.accent, 0.35) }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: activeTheme.primary }}>Confiança:</span>
                      <span className="font-black text-sm px-3 py-1 rounded-full text-white" style={{ background: activeTheme.primary }}>
                        {gameState.lifelineResult.data.confidence}
                      </span>
                    </div>
                    <p className="text-gray-700 italic text-base md:text-lg leading-relaxed font-semibold">
                      "{gameState.lifelineResult.data.reason}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 md:px-8 pb-6 md:pb-8 flex gap-3">
              <button
                onClick={resetToSetup}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-3.5 rounded-2xl text-sm uppercase transition-all duration-200 active:scale-95"
              >
                <i className="fi fi-rr-home mr-1.5" aria-hidden="true" />
                Início
              </button>
              <button
                onClick={() => setGameState(prev => ({ ...prev, lifelineResult: null }))}
                className="flex-[2] text-white font-black py-3.5 rounded-2xl text-sm uppercase transition-all duration-200 ease-out active:scale-95 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${activeTheme.gradientEnd}, ${activeTheme.primary})`,
                  boxShadow: `0 4px 14px ${hexToRgba(activeTheme.primary, 0.4)}`
                }}
              >
                <i className="fi fi-rr-arrow-left mr-1.5" aria-hidden="true" />
                Voltar ao Jogo
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
      {/* Feedback Overlay */}
      {gameState.showExplanation && (
        <div
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-5 md:p-8 z-[120]"
          style={{
            background: gameState.explanationType === 'correct'
              ? 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)'
              : 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)'
          }}
        >
          {/* Efeito de brilho radial de fundo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: gameState.explanationType === 'correct'
                ? 'radial-gradient(ellipse at 50% 30%, rgba(34,197,94,0.22) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.22) 0%, transparent 70%)'
            }}
          />

          <div className="result-overlay-enter relative z-[130] max-w-lg w-full">
            {/* Ícone central */}
            <div className="flex justify-center mb-6">
              <div
                className="result-icon w-24 h-24 md:w-28 md:h-28"
                style={{
                  background: gameState.explanationType === 'correct'
                    ? 'linear-gradient(135deg, #4ade80, #16a34a)'
                    : 'linear-gradient(135deg, #f87171, #dc2626)',
                  boxShadow: gameState.explanationType === 'correct'
                    ? '0 0 0 8px rgba(74,222,128,0.2), 0 20px 40px rgba(22,163,74,0.45)'
                    : '0 0 0 8px rgba(248,113,113,0.2), 0 20px 40px rgba(220,38,38,0.45)'
                }}
              >
                <i
                  className={`text-white text-4xl md:text-5xl ${gameState.explanationType === 'correct' ? 'fi fi-rr-check' : 'fi fi-rr-cross'}`}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Título */}
            <h4 className={`text-2xl md:text-4xl font-black text-center mb-2 uppercase tracking-tight ${gameState.explanationType === 'correct' ? 'text-green-300' : 'text-red-300'}`}>
              {gameState.explanationType === 'correct' ? 'Correto!' : 'Errado!'}
            </h4>
            <p className="text-white/70 text-center text-sm md:text-base font-semibold mb-6">
              {gameState.explanationType === 'correct'
                ? `Muito bem, ${currentTeam.name}! +${explanationQuestion?.points ?? pointsPerQuestion} pontos`
                : 'Não foi dessa vez. Veja a resposta correta:'}
            </p>

            {/* Card da resposta */}
            <div className="rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 md:p-6 mb-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] mb-3 opacity-60 text-white">Resposta Correta</p>
              {explanationQuestion ? (
                <div className="flex items-start gap-4">
                  <span
                    className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base md:text-lg font-black"
                    style={{
                      background: gameState.explanationType === 'correct'
                        ? 'linear-gradient(135deg, #4ade80, #16a34a)'
                        : 'linear-gradient(135deg, #f87171, #dc2626)',
                      color: '#fff'
                    }}
                  >
                    {explanationQuestion.answer}
                  </span>
                  <p className="text-lg md:text-xl font-black text-white leading-tight">
                    {explanationQuestion.options[explanationQuestion.answer]}
                  </p>
                </div>
              ) : null}

              {explanationQuestion?.source?.reference && (
                <div className="mt-4 pt-4 border-t border-white/15 flex items-center gap-2">
                  <i className="fi fi-rr-book-alt text-white/50" aria-hidden="true" />
                  <p className="text-xs md:text-sm font-semibold text-white/60">
                    {explanationQuestion.source.reference}
                  </p>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleNextAction}
                className="inline-flex flex-1 min-w-[140px] items-center justify-center gap-2 text-white font-black py-4 px-6 rounded-2xl text-sm md:text-base active:scale-95 transition-all duration-200 ease-out uppercase tracking-wider shadow-xl"
                style={{
                  background: gameState.explanationType === 'correct'
                    ? 'linear-gradient(135deg, #22c55e, #15803d)'
                    : 'linear-gradient(135deg, #ef4444, #b91c1c)',
                  boxShadow: gameState.explanationType === 'correct'
                    ? '0 5px 0 #14532d, 0 8px 20px rgba(34,197,94,0.4)'
                    : '0 5px 0 #7f1d1d, 0 8px 20px rgba(239,68,68,0.4)'
                }}
              >
                Próxima
                <i className="fi fi-rr-arrow-right" aria-hidden="true" />
              </button>
              <button
                onClick={resetToSetup}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white/80 font-bold py-4 px-5 rounded-2xl text-sm uppercase transition-all duration-200 ease-out active:scale-95 border border-white/20"
              >
                <i className="fi fi-rr-home" aria-hidden="true" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {showCorrectConfetti && (
        <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden" aria-hidden="true">
          {Array.from({ length: 150 }).map((_, i) => {
            const size = 8 + Math.random() * 12;
            const angle = Math.random() * Math.PI * 2;
            const velocity = 200 + Math.random() * 600;
            const x = Math.cos(angle) * velocity;
            const y = Math.sin(angle) * velocity;
            const xEnd = x * 1.2;
            const yEnd = y + 500;
            const rotation = Math.random() * 360;
            const duration = 3000 + Math.random() * 3000;
            const delay = Math.random() * 200;
            const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ffc0cb', '#800080'];
            const shapes = ['square', 'circle', 'triangle', 'star', 'diamond', 'ribbon'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];

            return (
              <div
                key={`confetti-${i}`}
                className={`confetti-piece confetti-piece--bursting shape-${shape}`}
                style={{
                  '--size': `${size}px`,
                  '--color': color,
                  '--x': `${x}px`,
                  '--y': `${y}px`,
                  '--x-end': `${xEnd}px`,
                  '--y-end': `${yEnd}px`,
                  '--rot': `${rotation}deg`,
                  '--duration': `${duration}ms`,
                  animationDelay: `${delay}ms`
                } as any}
              />
            );
          })}
        </div>
      )}

      {showSettings && showQuestionBuilder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full h-full md:max-w-6xl md:h-[92vh] bg-white md:rounded-[2rem] shadow-2xl md:border-4 flex flex-col overflow-hidden" style={{ borderColor: activeTheme.accent, color: activeTheme.primary, fontFamily: 'Arial Local, Arial, sans-serif', fontSize: 'clamp(12pt, 1.5vw, 15pt)' }}>
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

