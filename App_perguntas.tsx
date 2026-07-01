import React, { useState, useEffect } from 'react';
import { Question, QuestionOptionKey } from './types';

export interface GameTeam {
  label: string;
  name: string;
  score: number;
  grad: string;
  glow: string;
}

export interface AppPerguntasProps {
  question?: Question;
  teams?: GameTeam[];
  currentTeamIdx?: number;
  onConfirm?: (answer: QuestionOptionKey) => void;
  onFinish?: () => void;
  onTimerStart?: () => void;
}

// ─── Theme (matches default "ocean" theme from App.tsx) ────────────────────────
const THEME = {
  gradientStart: '#579fc1',
  gradientEnd:   '#2c9bb6',
  primary:       '#219ebc',
  accent:        '#368cb3',
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const IcoDice = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="3.5" />
    <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

const IcoLightbulb = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6M10 22h4" />
  </svg>
);

const IcoCrosshair = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="5.5" />
    <line x1="12" y1="18.5" x2="12" y2="22" />
    <line x1="2" y1="12" x2="5.5" y2="12" />
    <line x1="18.5" y1="12" x2="22" y2="12" />
  </svg>
);

const IcoSkip = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,4 15,12 5,20" />
    <rect x="18" y="4" width="2.5" height="16" rx="1.2" />
  </svg>
);

const IcoCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_QUESTION = {
  topic: 'Bíblia Sagrada',
  question: 'Qual é o versículo mais curto da Bíblia?',
  options: {
    A: 'Não chores (Lucas 7:13)',
    B: 'Jesus chorou (João 11:35)',
    C: 'Alegrai-vos (Filipenses 4:4)',
    D: 'Orai sem cessar (1 Tess. 5:17)',
  } as Partial<Record<QuestionOptionKey, string>>,
  answer: 'B' as QuestionOptionKey,
};

const DEMO_TEAMS = [
  { label: 'EQUIPE A', name: 'JOÃO',  score: 1200, grad: 'linear-gradient(135deg, #f97316, #ea580c)', glow: 'rgba(249,115,22,0.45)' },
  { label: 'EQUIPE B', name: 'MARIA', score: 950,  grad: 'linear-gradient(135deg, #a855f7, #7c3aed)', glow: 'rgba(168,85,247,0.45)' },
];


// ─── Sidebar power-up button ───────────────────────────────────────────────────

function SidebarBtn({
  icon, label, used, color, onClick,
}: {
  icon: React.ReactNode; label: string; used: boolean; color: string; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={used}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        padding: '14px 8px 12px',
        background: used
          ? 'rgba(255,255,255,0.08)'
          : hov
          ? `${color}55`
          : `${color}33`,
        border: `2px solid ${used ? 'rgba(255,255,255,0.1)' : hov ? color : `${color}bb`}`,
        borderRadius: 12,
        color: used ? 'rgba(255,255,255,0.3)' : '#fff',
        cursor: used ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        opacity: used ? 0.45 : 1,
        transition: 'all 0.18s',
        backdropFilter: 'blur(8px)',
        boxShadow: used ? 'none' : hov
          ? `0 6px 20px ${color}55`
          : `0 2px 10px ${color}33`,
        transform: hov && !used ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{
        width: 50, height: 50, borderRadius: '50%',
        background: used ? 'rgba(255,255,255,0.06)' : color,
        border: `2px solid ${used ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.35)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: used ? 'none' : `0 4px 14px ${color}88`,
        transition: 'all 0.18s',
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: 10.5, fontWeight: 800,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        textAlign: 'center', lineHeight: 1.25,
      }}>
        {label}
      </span>
    </button>
  );
}

// ─── Answer option button ──────────────────────────────────────────────────────

function AnswerBtn({
  letter, text, selected, onClick,
}: {
  letter: QuestionOptionKey; text: string; selected: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 22px',
        background: selected
          ? '#fff'
          : hov ? 'rgba(255,255,255,0.88)'
          : 'rgba(255,255,255,0.78)',
        border: `2.5px solid ${selected ? '#16a34a' : hov ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.9)'}`,
        borderRadius: 999,
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.18s',
        boxShadow: selected
          ? '0 0 0 3px rgba(22,163,74,0.35), 0 6px 24px rgba(0,0,0,0.2)'
          : hov
          ? '0 6px 20px rgba(0,0,0,0.18)'
          : '0 2px 10px rgba(0,0,0,0.12)',
        transform: hov && !selected ? 'translateY(-2px) scale(1.01)' : selected ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Letter badge */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: selected ? '#16a34a' : THEME.gradientEnd,
        border: `2px solid ${selected ? '#16a34a' : 'rgba(255,255,255,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 900,
        color: '#fff',
        transition: 'all 0.18s',
        boxShadow: selected ? '0 2px 10px rgba(22,163,74,0.55)' : '0 2px 6px rgba(0,0,0,0.15)',
      }}>
        {letter}
      </div>
      {/* Answer text */}
      <span style={{
        fontSize: 14, fontWeight: 700,
        color: selected ? '#15803d' : '#0e5a70',
        flex: 1,
      }}>
        {text}
      </span>
    </button>
  );
}

// ─── Liquid Timer ─────────────────────────────────────────────────────────────

function LiquidTimer({ timeLeft, maxTime, isRunning, onStart }: {
  timeLeft: number; maxTime: number; isRunning: boolean;
  onStart: () => void;
}) {
  const pct = (timeLeft / maxTime) * 100;

  const liqColor  = timeLeft > 6 ? '#22c55e' : timeLeft > 3 ? '#f59e0b' : '#ef4444';
  const liqLight  = timeLeft > 6 ? '#4ade80' : timeLeft > 3 ? '#fbbf24' : '#f87171';
  const glowColor = timeLeft > 6 ? 'rgba(34,197,94,0.55)' : timeLeft > 3 ? 'rgba(245,158,11,0.55)' : 'rgba(239,68,68,0.55)';
  const borderCol = !isRunning ? 'rgba(255,255,255,0.7)' : liqColor;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <style>{`
        @keyframes liq-wave {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes liq-pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.04); }
        }
      `}</style>

      {/* Circle container */}
      <div
        onClick={!isRunning ? onStart : undefined}
        title={!isRunning ? 'Clique para iniciar (10s)' : ''}
        style={{
          width: 96, height: 96,
          borderRadius: '50%',
          border: `4px solid ${borderCol}`,
          position: 'relative',
          overflow: 'hidden',
          cursor: !isRunning ? 'pointer' : 'default',
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(8px)',
          boxShadow: isRunning
            ? `0 0 28px ${glowColor}, 0 4px 16px rgba(0,0,0,0.15)`
            : '0 4px 16px rgba(0,0,0,0.12)',
          transition: 'border-color 0.5s, box-shadow 0.5s',
          animation: isRunning && timeLeft <= 3 ? 'liq-pulse 0.6s ease-in-out infinite' : 'none',
        }}
      >
        {/* Liquid fill */}
        {isRunning && (
          <div style={{
            position: 'absolute',
            bottom: 0, left: '-10%',
            width: '120%',
            height: `${pct}%`,
            background: `linear-gradient(180deg, ${liqLight} 0%, ${liqColor} 100%)`,
            transition: 'height 1s linear, background 0.5s',
          }}>
            {/* Wave */}
            <svg
              viewBox="0 0 400 24"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                top: -12, left: 0,
                width: '200%', height: 24,
                animation: 'liq-wave 1.6s linear infinite',
              }}
            >
              <path
                d="M0,12 C50,0 100,24 150,12 C200,0 250,24 300,12 C350,0 400,24 400,12 L400,24 L0,24 Z"
                fill={liqLight}
                opacity="0.85"
              />
            </svg>
          </div>
        )}

        {/* Center content */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!isRunning ? (
            /* Play icon */
            <svg width="30" height="30" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          ) : (
            <span style={{
              fontSize: 30, fontWeight: 900,
              color: pct < 40 ? '#fff' : 'rgba(255,255,255,0.95)',
              textShadow: pct > 50 ? '0 1px 6px rgba(0,0,0,0.25)' : `0 0 10px ${liqColor}`,
              transition: 'color 0.4s',
              lineHeight: 1,
            }}>
              {timeLeft}
            </span>
          )}
        </div>
      </div>

      {/* Label */}
      <span style={{
        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        Timer
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AppPerguntas({
  question: questionProp,
  teams: teamsProp,
  currentTeamIdx = 0,
  onConfirm,
  onFinish,
  onTimerStart,
}: AppPerguntasProps = {}) {
  const question = questionProp ?? DEMO_QUESTION;
  const teams    = teamsProp    ?? DEMO_TEAMS;

  const [selected, setSelected] = useState<QuestionOptionKey | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [powerUpsUsed, setPowerUpsUsed] = useState<Set<string>>(new Set());
  const [confirmHov, setConfirmHov] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  const MAX_TIME = 10;
  const optionKeys = Object.keys(question.options) as QuestionOptionKey[];

  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timerRunning, timeLeft]);

  useEffect(() => {
    if (!timerRunning || timeLeft > 0) return;
    const t = setTimeout(() => { setTimerRunning(false); setTimeLeft(MAX_TIME); }, 1500);
    return () => clearTimeout(t);
  }, [timerRunning, timeLeft]);

  const startTimer = () => {
    if (timerRunning) return;
    setTimeLeft(MAX_TIME);
    setTimerRunning(true);
    onTimerStart?.();
  };


  const isPwrUsed = (k: string) => powerUpsUsed.has(`${currentTeamIdx}-${k}`);
  const usePwr = (k: string) =>
    setPowerUpsUsed(s => { const n = new Set(s); n.add(`${currentTeamIdx}-${k}`); return n; });

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: `linear-gradient(135deg, ${THEME.gradientStart} 0%, ${THEME.gradientEnd} 100%)`,
      display: 'flex', overflow: 'hidden',
      fontFamily: "'Montserrat', sans-serif",
      position: 'relative',
    }}>


      {/* ── Sidebar ── */}
      <aside style={{
        width: 185, flexShrink: 0,
        background: 'rgba(0,0,0,0.12)',
        borderRight: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
        padding: '22px 13px', gap: 10,
        zIndex: 1,
      }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: 13, fontWeight: 900, color: '#fff',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            textAlign: 'center', paddingBottom: 10,
            borderBottom: '2px solid rgba(255,255,255,0.4)',
          }}>
            AJUDAS
          </div>
        </div>
        <SidebarBtn icon={<IcoDice />}      label="Roleta da Sorte" color="#f97316" used={isPwrUsed('luck')}   onClick={() => usePwr('luck')} />
        <SidebarBtn icon={<IcoLightbulb />} label="Dicas"           color="#eab308" used={isPwrUsed('hint')}   onClick={() => usePwr('hint')} />
        <SidebarBtn icon={<IcoCrosshair />} label="Chutar"          color="#06b6d4" used={isPwrUsed('arisca')} onClick={() => usePwr('arisca')} />
        <SidebarBtn icon={<IcoSkip />}      label="Pular (1/3)"     color="#a855f7" used={isPwrUsed('skip')}   onClick={() => usePwr('skip')} />
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px 48px 24px', gap: 32,
        position: 'relative', zIndex: 1,
      }}>

        {/* Team scores + Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {teams.slice(0, 1).map((t, i) => {
            return (
              <div key={i} style={{
                background: t.grad,
                borderRadius: 18,
                padding: '18px 40px',
                textAlign: 'center',
                minWidth: 185,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 4px 16px ${t.glow}`,
                transition: 'box-shadow 0.3s',
                border: 'none',
              }}>
                {/* Shine overlay */}
                {/* Active indicator */}
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4,
                }}>
                  {t.label}
                </div>
                <div style={{
                  fontSize: 26, fontWeight: 900, color: '#fff',
                  lineHeight: 1.1, letterSpacing: '-0.01em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}>
                  {t.name}
                </div>
                <div style={{
                  fontSize: 17, fontWeight: 800,
                  color: 'rgba(255,255,255,0.88)',
                  marginTop: 4,
                  letterSpacing: '0.04em',
                }}>
                  {t.score.toLocaleString('pt-BR')} pts
                </div>
              </div>
            );
          })}

          {/* Liquid Timer – between the two score cards */}
          <LiquidTimer
            timeLeft={timeLeft}
            maxTime={MAX_TIME}
            isRunning={timerRunning}
            onStart={startTimer}
          />

          {teams.slice(1).map((t, i) => {
            return (
              <div key={i + 1} style={{
                background: t.grad,
                borderRadius: 18,
                padding: '18px 40px',
                textAlign: 'center',
                minWidth: 185,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 4px 16px ${t.glow}`,
                transition: 'box-shadow 0.3s',
                border: 'none',
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                  letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4,
                }}>
                  {t.label}
                </div>
                <div style={{
                  fontSize: 26, fontWeight: 900, color: '#fff',
                  lineHeight: 1.1, letterSpacing: '-0.01em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}>
                  {t.name}
                </div>
                <div style={{
                  fontSize: 17, fontWeight: 800,
                  color: 'rgba(255,255,255,0.88)',
                  marginTop: 4,
                  letterSpacing: '0.04em',
                }}>
                  {t.score.toLocaleString('pt-BR')} pts
                </div>
              </div>
            );
          })}
        </div>


        {/* Question card – hexagonal shape */}
        <div style={{
          width: '100%', maxWidth: 820,
          filter: 'drop-shadow(0 10px 32px rgba(0,0,0,0.22))',
        }}>
          {/* Outer border layer – teal accent */}
          <div style={{
            background: `linear-gradient(135deg, ${THEME.gradientEnd}, ${THEME.primary})`,
            clipPath: 'polygon(22px 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 22px 100%, 0% 50%)',
            padding: '3px',
          }}>
            {/* Inner card – white solid for readability */}
            <div style={{
              background: '#fff',
              clipPath: 'polygon(22px 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 22px 100%, 0% 50%)',
              padding: '36px 88px',
              textAlign: 'center',
            }}>
              {/* Question text */}
              <div style={{
                fontSize: 20, fontWeight: 800,
                color: '#0c3547', lineHeight: 1.45,
              }}>
                {question.question}
              </div>
            </div>
          </div>
        </div>

        {/* Answer buttons – 2 × 2 grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 11, width: '100%', maxWidth: 710,
        }}>
          {optionKeys.map(k => (
            <AnswerBtn
              key={k}
              letter={k}
              text={question.options[k]!}
              selected={selected === k}
              onClick={() => setSelected(k)}
            />
          ))}
        </div>

        {/* Confirm button */}
        <button
          disabled={!selected}
          onClick={() => selected && onConfirm?.(selected)}
          onMouseEnter={() => setConfirmHov(true)}
          onMouseLeave={() => setConfirmHov(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 56px',
            background: selected
              ? confirmHov
                ? 'linear-gradient(135deg, #22c55e, #15803d)'
                : 'linear-gradient(135deg, #16a34a, #15803d)'
              : 'rgba(255,255,255,0.2)',
            border: `2.5px solid ${selected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)'}`,
            borderRadius: 999,
            fontSize: 15, fontWeight: 900,
            color: selected ? '#fff' : 'rgba(255,255,255,0.45)',
            cursor: selected ? 'pointer' : 'not-allowed',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            transition: 'all 0.22s',
            backdropFilter: 'blur(6px)',
            boxShadow: selected
              ? confirmHov
                ? '0 8px 32px rgba(22,163,74,0.6), 0 2px 0 rgba(255,255,255,0.2) inset'
                : '0 4px 20px rgba(22,163,74,0.45)'
              : 'none',
            transform: confirmHov && selected ? 'translateY(-3px) scale(1.02)' : 'none',
          }}
        >
          CONFIRMAR {selected && <IcoCheck />}
        </button>

        {/* Finalizar jogo */}
        <button
          onClick={() => onFinish?.()}
          style={{
            padding: '8px 32px',
            background: 'transparent',
            border: 'none',
            fontSize: 12, fontWeight: 700,
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            transition: 'color 0.18s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          Finalizar Jogo
        </button>
      </main>
    </div>
  );
}
