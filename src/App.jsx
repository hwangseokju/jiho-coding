import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BLOCKS, CONCEPTS } from './stages.js';

// ============================================
// 시간여행 코드 (jiho-coding) v1.0
// 4개념 × 8스테이지 + 복습퀴즈
// ============================================

const STORAGE_KEY = 'jiho-coding-progress-v1';
// stars: { 'seq-0': 3, 'seq-1': 2, ... } 스테이지별 별점(1~3)
// badges: ['perfect_concept', 'no_hint', ...] 획득 배지 id
const DEFAULT_PROGRESS = {
  seq:{mastered:false}, loop:{mastered:false}, cond:{mastered:false}, var:{mastered:false},
  stars:{}, badges:[],
};

function loadProgress() {
  try { const r = localStorage.getItem(STORAGE_KEY); if (!r) return DEFAULT_PROGRESS; return { ...DEFAULT_PROGRESS, ...JSON.parse(r) }; }
  catch { return DEFAULT_PROGRESS; }
}
function saveProgress(p) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {} }

// 틀린 횟수 → 별점 (힌트는 안 깎음)
function calcStars(wrong) { return wrong === 0 ? 3 : wrong <= 2 ? 2 : 1; }

// 배지 정의
const BADGES = {
  first_clear:   { ico:'🎯', name:'첫 발사',     desc:'첫 스테이지 클리어' },
  first_master:  { ico:'🏆', name:'첫 마스터',   desc:'개념 하나를 마스터' },
  all_master:    { ico:'👑', name:'코딩 마스터', desc:'4개 개념 모두 마스터' },
  perfect_stage: { ico:'⭐', name:'완벽한 도약', desc:'별 3개로 클리어' },
  no_hint_master:{ ico:'🧠', name:'스스로 척척', desc:'힌트 없이 한 개념 마스터' },
  star_10:       { ico:'✨', name:'별 수집가',   desc:'별 10개 모으기' },
  star_50:       { ico:'🌟', name:'별 부자',     desc:'별 50개 모으기' },
  trap_master:   { ico:'🛡️', name:'함정 탐정',   desc:'함정 스테이지 별 3개' },
};
const TOTAL_STARS = 32 * 3; // 32스테이지 × 최대 3별

// ===== 효과음 (Web Audio) =====
const Sound = {
  ctx: null, on: true,
  ac() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); return this.ctx; },
  beep(f, d, t, v) { if (!this.on) return; const c = this.ac(), o = c.createOscillator(), g = c.createGain(); o.type = t || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(v || 0.15, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + d); },
  click() { this.beep(520, 0.08, 'triangle', 0.12); },
  place() { this.beep(660, 0.1, 'sine', 0.12); },
  engine() { if (!this.on) return; const c = this.ac(), o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(80, c.currentTime); o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.5); g.gain.setValueAtTime(0.2, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.6); },
  launch() { if (!this.on) return; const c = this.ac(), o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(120, c.currentTime); o.frequency.exponentialRampToValueAtTime(600, c.currentTime + 1); g.gain.setValueAtTime(0.25, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 1.2); },
  success() { if (!this.on) return;[523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.beep(f, 0.25, 'triangle', 0.18), i * 130)); },
  fanfare() { if (!this.on) return;[523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.beep(f, 0.3, 'triangle', 0.16), i * 120)); },
  fail() { this.beep(200, 0.3, 'square', 0.12); },
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));
function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[b[i], b[j]] = [b[j], b[i]]; } return b; }

// ===== 별 배경 =====
function StarField() {
  const stars = useRef(null);
  if (!stars.current) {
    stars.current = Array.from({ length: 70 }, () => ({
      size: Math.random() * 2 + 1, left: Math.random() * 100, top: Math.random() * 100, dur: Math.random() * 2 + 1,
    }));
  }
  return (
    <div className="stars">
      {stars.current.map((s, i) => (
        <div key={i} className="star" style={{ width: s.size, height: s.size, left: s.left + '%', top: s.top + '%', '--d': s.dur + 's' }} />
      ))}
    </div>
  );
}

// ===== 색종이 =====
function confettiBurst() {
  const cs = ['#18e0ff', '#b45cff', '#ffd23f', '#ff4d8d', '#fff', '#3affa3'];
  for (let i = 0; i < 55; i++) {
    const c = document.createElement('div'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = cs[Math.floor(Math.random() * cs.length)];
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    const d = Math.random() * 1.5 + 1.5; c.style.animation = `fall ${d}s linear forwards`; c.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.appendChild(c); setTimeout(() => c.remove(), (d + 0.6) * 1000);
  }
}
function masterCelebration() {
  const fx = document.createElement('div'); fx.className = 'master-fx show';
  for (let i = 0; i < 12; i++) { const r = document.createElement('div'); r.className = 'master-ray'; r.style.setProperty('--rot', (i * 30) + 'deg'); fx.appendChild(r); }
  const st = ['⭐', '🌟', '✨', '💫'];
  for (let i = 0; i < 20; i++) { const s = document.createElement('div'); s.className = 'master-star'; s.textContent = st[Math.floor(Math.random() * st.length)]; s.style.left = Math.random() * 100 + 'vw'; s.style.top = Math.random() * 100 + 'vh'; s.style.animationDelay = (Math.random() * 0.6) + 's'; fx.appendChild(s); }
  document.body.appendChild(fx);
  Sound.fanfare();
  setTimeout(() => fx.remove(), 2400);
}

// ===== 메인 앱 =====
export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [screen, setScreen] = useState('hub'); // hub | concept
  const [activeConcept, setActiveConcept] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [adminTaps, setAdminTaps] = useState(0);
  const adminTimer = useRef(null);

  useEffect(() => { saveProgress(progress); }, [progress]);
  useEffect(() => { Sound.on = soundOn; }, [soundOn]);

  const isUnlocked = useCallback((idx) => {
    if (idx === 0) return true;
    return progress[CONCEPTS[idx - 1].id].mastered;
  }, [progress]);

  const handleTitleTap = () => {
    setAdminTaps(prev => {
      const n = prev + 1;
      if (adminTimer.current) clearTimeout(adminTimer.current);
      adminTimer.current = setTimeout(() => setAdminTaps(0), 2000);
      if (n >= 5) {
        const allDone = CONCEPTS.every(c => progress[c.id].mastered);
        if (allDone) { if (confirm('관리자: 모든 진행을 초기화할까요? (별·배지 포함)')) setProgress(DEFAULT_PROGRESS); }
        else { if (confirm('관리자: 전체 해금할까요?')) { setProgress(prev => { const np = { ...prev }; CONCEPTS.forEach(c => np[c.id] = { mastered: true }); return np; }); } }
        return 0;
      }
      return n;
    });
  };

  const masterConcept = (id) => setProgress(prev => ({ ...prev, [id]: { mastered: true } }));

  // 스테이지 클리어 시 별점 기록 (기존보다 높은 별만 갱신) + 배지 체크
  const recordStar = (conceptId, stageIdx, wrong, stage) => {
    setProgress(prev => {
      const key = `${conceptId}-${stageIdx}`;
      const stars = calcStars(wrong);
      const prevStars = prev.stars[key] || 0;
      const newStars = { ...prev.stars, [key]: Math.max(prevStars, stars) };
      const totalStars = Object.values(newStars).reduce((a, b) => a + b, 0);
      const badges = new Set(prev.badges);
      // 배지 판정
      badges.add('first_clear');
      if (stars === 3) badges.add('perfect_stage');
      if (stars === 3 && stage && (stage.palette || []).some(k => BLOCKS[k]?.trap)) badges.add('trap_master');
      if (totalStars >= 10) badges.add('star_10');
      if (totalStars >= 50) badges.add('star_50');
      return { ...prev, stars: newStars, badges: [...badges] };
    });
  };

  // 개념 마스터 시 배지
  const recordMasterBadges = (conceptId, usedHintInConcept) => {
    setProgress(prev => {
      const badges = new Set(prev.badges);
      badges.add('first_master');
      if (!usedHintInConcept) badges.add('no_hint_master');
      const afterMaster = { ...prev, [conceptId]: { mastered: true } };
      if (CONCEPTS.every(c => afterMaster[c.id]?.mastered)) badges.add('all_master');
      return { ...prev, badges: [...badges] };
    });
  };

  return (
    <div className="app-root">
      <style>{STYLES}</style>
      <div className="space-bg" />
      <StarField />
      {screen === 'hub' && (
        <Hub progress={progress} isUnlocked={isUnlocked} soundOn={soundOn}
          onToggleSound={() => { setSoundOn(s => !s); Sound.click(); }}
          onTitleTap={handleTitleTap}
          onSelect={(c) => { Sound.click(); setActiveConcept(c); setScreen('concept'); }} />
      )}
      {screen === 'concept' && activeConcept && (
        <ConceptPlayer concept={activeConcept} soundOn={soundOn} progress={progress}
          onToggleSound={() => { setSoundOn(s => !s); Sound.click(); }}
          onBack={() => { Sound.click(); setScreen('hub'); }}
          onRecordStar={recordStar}
          onMaster={(usedHint) => recordMasterBadges(activeConcept.id, usedHint)} />
      )}
    </div>
  );
}

// ===== 허브 (4개념 선택) =====
function Hub({ progress, isUnlocked, soundOn, onToggleSound, onTitleTap, onSelect }) {
  const totalStars = Object.values(progress.stars || {}).reduce((a, b) => a + b, 0);
  const earnedBadges = progress.badges || [];
  const [showBadges, setShowBadges] = useState(false);

  // 개념별 획득 별 (8스테이지 합)
  const conceptStars = (cid) => {
    let s = 0; for (let i = 0; i < 8; i++) s += (progress.stars || {})[`${cid}-${i}`] || 0; return s;
  };

  return (
    <div className="hub">
      <div className="hud">
        <span style={{ width: 36 }} />
        <button className="sound-toggle" onClick={onToggleSound}>{soundOn ? '🔊' : '🔇'}</button>
      </div>
      <header className="hub-header">
        <div className="hub-logo" onClick={onTitleTap}>🚀</div>
        <h1 className="hub-title" onClick={onTitleTap}>시간여행 코드</h1>
        <p className="hub-sub">우주선을 코드로 조종해 과거로 떠나자!</p>
      </header>

      {/* 대시보드 */}
      <div className="dashboard">
        <div className="dash-item">
          <div className="dash-big">⭐ {totalStars}<span className="dash-small">/ {TOTAL_STARS}</span></div>
          <div className="dash-label">모은 별</div>
        </div>
        <div className="dash-bar-wrap">
          <div className="dash-bar"><div className="dash-fill" style={{ width: (totalStars / TOTAL_STARS * 100) + '%' }} /></div>
          <div className="dash-label">전체 진행률 {Math.round(totalStars / TOTAL_STARS * 100)}%</div>
        </div>
        <div className="dash-item dash-badge-btn" onClick={() => { Sound.click(); setShowBadges(true); }}>
          <div className="dash-big">🏅 {earnedBadges.length}<span className="dash-small">/ {Object.keys(BADGES).length}</span></div>
          <div className="dash-label">배지 보기</div>
        </div>
      </div>

      <div className="concept-grid">
        {CONCEPTS.map((c, idx) => {
          const unlocked = isUnlocked(idx);
          const mastered = progress[c.id].mastered;
          const cs = conceptStars(c.id);
          return (
            <div key={c.id} className={`concept-card ${unlocked ? '' : 'locked'} ${mastered ? 'mastered' : ''}`}
              style={{ '--cc': c.color }}
              onClick={() => unlocked && onSelect(c)}>
              <div className="cc-top">
                <span className="cc-num">개념 {idx + 1}</span>
                {unlocked && cs > 0 && <span className="cc-stars">⭐ {cs}/24</span>}
              </div>
              <div className="cc-ico">{c.ico}</div>
              <h2 className="cc-title">{c.title}</h2>
              <p className="cc-sub">{c.subtitle}</p>
              <p className="cc-desc">{c.desc}</p>
              <div className="cc-foot">
                {!unlocked ? <span className="cc-lock">🔒 이전 개념을 마치면 열려요</span>
                  : mastered ? <span className="cc-done">🏆 마스터 완료</span>
                    : <span className="cc-go">8단계 · 도전하기 →</span>}
              </div>
            </div>
          );
        })}
      </div>
      <footer className="hub-foot">v1.0 · 순차 · 반복 · 조건 · 변수</footer>

      {/* 배지 모달 */}
      {showBadges && (
        <div className="modal-bg show" onClick={() => setShowBadges(false)}>
          <div className="modal badge-modal" onClick={e => e.stopPropagation()}>
            <h2>🏅 배지 도감</h2>
            <div className="badge-grid">
              {Object.entries(BADGES).map(([id, b]) => {
                const got = earnedBadges.includes(id);
                return (
                  <div key={id} className={`badge-item ${got ? 'got' : ''}`}>
                    <div className="badge-ico">{got ? b.ico : '🔒'}</div>
                    <div className="badge-name">{b.name}</div>
                    <div className="badge-desc">{got ? b.desc : '???'}</div>
                  </div>
                );
              })}
            </div>
            <button className="next" onClick={() => { Sound.click(); setShowBadges(false); }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 이하 ConceptPlayer, 엔진들, STYLES는 다음 파트에서 합쳐짐

// ============================================
// ConceptPlayer: 한 개념의 8스테이지 + 퀴즈 진행
// ============================================
function ConceptPlayer({ concept, soundOn, progress, onToggleSound, onBack, onRecordStar, onMaster }) {
  const [phase, setPhase] = useState('stage'); // stage | quiz
  const [stageIdx, setStageIdx] = useState(0);
  const [modal, setModal] = useState(null);
  const usedHintRef = useRef(false); // 이 개념 진행 중 힌트를 한 번이라도 썼는지

  const stages = concept.stages;
  const total = stages.length;

  const reviewCard = (answerKeys) => {
    const seen = new Set(); const rows = [];
    answerKeys.forEach(k => {
      const b = BLOCKS[k]; if (!b || b.trap) return;
      const key = b.name + '|' + b.concept; if (seen.has(key)) return; seen.add(key);
      rows.push(`<div class="rv-row"><span>${b.ico}</span><b>${b.name}</b><span class="rv-arrow">→</span><span class="rv-con">${b.concept}</span></div>`);
    });
    if (!rows.length) return '';
    return `<div class="review-card"><div class="rv-label">📖 방금 쓴 명령, 코딩에선 이렇게 불러요</div>${rows.join('')}</div>`;
  };

  const starHtml = (wrong) => {
    const s = calcStars(wrong);
    const full = '⭐'.repeat(s); const empty = '☆'.repeat(3 - s);
    const msg = s === 3 ? '완벽해요! 한 번에 성공!' : s === 2 ? '잘했어요!' : '클리어! 다음엔 별 3개 도전!';
    return `<div class="star-result"><div class="star-row">${full}${empty}</div><div class="star-msg">${msg}</div></div>`;
  };

  // onClear가 (answerKeys, wrong, stage)를 받음
  const onStageClear = (answerKeys, wrong, stage) => {
    if (usedHint()) {} // no-op
    onRecordStar(concept.id, stageIdx, wrong, stage);
    if (stageIdx < total - 1) {
      setModal({ badge: '🎖️', title: '스테이지 클리어!', html: `${starHtml(wrong)}<b>${stages[stageIdx].name}</b> 통과!${reviewCard(answerKeys)}`, onNext: () => { setModal(null); setStageIdx(stageIdx + 1); } });
    } else {
      setModal({ badge: '📚', title: `${concept.title} 8단계 완주!`, html: `${starHtml(wrong)}<b>대단해요!</b>${reviewCard(answerKeys)}<br>이제 마지막 <b>복습 퀴즈</b>를 풀면 "${concept.title} 마스터" 메달을 받아요!`, onNext: () => { setModal(null); setPhase('quiz'); } });
    }
  };

  const usedHint = () => usedHintRef.current;
  const markHintUsed = () => { usedHintRef.current = true; };

  const onQuizDone = (score, passLine) => {
    const pass = score >= passLine;
    if (pass) { masterCelebration(); confettiBurst(); onMaster(!usedHintRef.current); }
    setModal({
      badge: pass ? '🏆' : '📖', trophy: pass,
      title: pass ? `${concept.title} 마스터 달성!` : '조금 더 복습해요',
      html: pass ? `<b>축하해요! ${concept.quiz.length}문제 중 ${score}개 정답!</b><br>${concept.masterLesson}<br><br>🔓 다음 개념이 해금되었어요!`
        : `${concept.quiz.length}문제 중 ${score}개 맞혔어요. ${passLine}개 이상 맞혀야 마스터예요. 다시 도전!`,
      onNext: () => { setModal(null); if (pass) onBack(); else setPhase('quiz-retry'); }
    });
  };

  return (
    <div className="concept-player">
      <div className="hud">
        <button className="back-btn" onClick={onBack}>← 개념 선택</button>
        <span className="mission-tag" style={{ '--cc': concept.color }}>{concept.ico} {concept.title}</span>
        <button className="sound-toggle" onClick={onToggleSound}>{soundOn ? '🔊' : '🔇'}</button>
      </div>

      {phase === 'stage' && (
        <StageRouter key={stageIdx} concept={concept} stageIdx={stageIdx} total={total} onClear={onStageClear} onHintUsed={markHintUsed} stars={progress.stars} />
      )}
      {(phase === 'quiz' || phase === 'quiz-retry') && (
        <Quiz key={phase} concept={concept} onDone={onQuizDone} />
      )}

      {modal && <Modal {...modal} />}
    </div>
  );
}

// 진행바
function ProgressBar({ idx, total, label }) {
  return (
    <>
      <div className="ptrack">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`pdot ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}`} />
        ))}
      </div>
      <div className="plabel">{label || `STAGE ${idx + 1} / ${total}`}</div>
    </>
  );
}

// 스테이지 타입별 라우팅
function StageRouter({ concept, stageIdx, total, onClear, onHintUsed }) {
  const s = concept.stages[stageIdx];
  const common = { concept, stage: s, stageIdx, total, onClear, onHintUsed };
  if (concept.type === 'seq') return <SeqStage {...common} />;
  if (concept.type === 'loop') return <LoopStage {...common} />;
  if (concept.type === 'cond') return <CondStage {...common} />;
  if (concept.type === 'var') return <VarStage {...common} />;
  return null;
}

// 공통: 무대(우주선) + 상태

// ============================================
// 순차 엔진
// ============================================
function SeqStage({ concept, stage, stageIdx, total, onClear, onHintUsed }) {
  const [placed, setPlaced] = useState([]);
  const [running, setRunning] = useState(false);
  const [execIdx, setExecIdx] = useState(-1);
  const [status, setStatus] = useState('명령을 넣고 발사하세요');
  const [fail, setFail] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [wrong, setWrong] = useState(0);
  const [anim, setAnim] = useState(''); // '', 'lift', 'land', 'warp'
  const [flame, setFlame] = useState(0);
  const [showEra, setShowEra] = useState(false);
  const palette = useRef(makeShuffled(stage)).current;

  const reset = () => { if (running) return; Sound.click(); setPlaced([]); setFail(''); setAnim(''); setFlame(0); setStatus('명령을 넣고 발사하세요'); };
  const add = (k) => { if (running) return; Sound.place(); setPlaced(p => [...p, k]); setFail(''); };
  const remove = (i) => { if (running) return; Sound.click(); setPlaced(p => p.filter((_, x) => x !== i)); setFail(''); };

  const usedCount = {}; placed.forEach(k => usedCount[k] = (usedCount[k] || 0) + 1);
  const availList = []; const tmp = { ...usedCount };
  palette.forEach(k => { if (tmp[k]) { tmp[k]--; return; } availList.push(k); });

  const run = async () => {
    if (running || !placed.length) return; Sound.ac(); setRunning(true); setFail('');
    for (let i = 0; i < placed.length; i++) {
      setExecIdx(i); const k = placed[i], b = BLOCKS[k];
      setStatus(`${b.ico} ${b.name}...`);
      if (k === 'engine') { setFlame(0.6); Sound.engine(); }
      else if (k === 'booster') { setFlame(1); Sound.engine(); }
      else if (k === 'slow') Sound.engine();
      else if (b.trap) { setStatus(`${b.ico} ${b.name}?! (이건 아닌데...)`); Sound.fail(); }
      await wait(800);
    }
    setExecIdx(-1);
    const correct = placed.length === stage.answer.length && placed.every((k, i) => k === stage.answer[i]);
    if (correct) {
      if (stage.landing) { setStatus('🛬 착륙!'); setAnim('land'); }
      else { setStatus('🚀 발사!'); setAnim('lift-warp'); }
      Sound.launch(); await wait(1200);
      setShowEra(true); Sound.success(); confettiBurst(); await wait(1400);
      onClear(stage.answer, wrong, stage);
    } else {
      setWrong(w => w + 1); Sound.fail(); setStatus('💥 실패!');
      let msg = '😢 임무 실패! ';
      const trap = placed.some(k => BLOCKS[k].trap);
      if (trap) msg += '엉뚱한 명령이 섞였어요. 우주선에 필요한 것만!';
      else if (placed.length < stage.answer.length) msg += `명령이 부족해요. ${stage.answer.length}개 필요.`;
      else if (placed.length > stage.answer.length) msg += '명령이 너무 많아요. 필요 없는 건 빼세요.';
      else { const w = placed.findIndex((k, i) => k !== stage.answer[i]); msg += `${w + 1}번째 명령의 순서가 안 맞아요.`; }
      if (wrong + 1 >= 3) msg += ' (' + stage.hint + ')';
      setFail(msg); setRunning(false);
    }
  };

  return (
    <div>
      <ProgressBar idx={stageIdx} total={total} />
      <h1 className="big-title" style={{ '--cc': concept.color }}>시간여행 코드</h1>
      <div className="stage-name" style={{ color: concept.color }}>{stage.name}</div>
      <Comms text={stage.comms} />
      <div className="game">
        <RocketStage anim={anim} flame={flame} status={status} era={stage.era} showEra={showEra} />
        <div className="code-zone">
          <Panel label="▶ 명령 시퀀스" right={`${placed.length}개`}>
            {placed.length === 0 ? <div className="empty">아래 명령을 눌러 추가</div> :
              placed.map((k, i) => <Block key={i} bk={k} num={i + 1} placed exec={execIdx === i} onClick={() => remove(i)} dis={running} />)}
          </Panel>
          <Panel label="⚙ 사용 가능한 명령">
            {availList.length === 0 ? <div className="empty">명령을 모두 배치했어요</div> :
              availList.map((k, i) => <Block key={i} bk={k} avail onClick={() => add(k)} dis={running} />)}
          </Panel>
        </div>
      </div>
      <Controls onHint={() => { Sound.click(); if (onHintUsed) onHintUsed(); setShowHint(h => !h); }} onReset={reset} onRun={run} running={running} canRun={placed.length > 0} />
      {showHint && <div className="hint">💡 {stage.hint}</div>}
      {fail && <div className="fail-msg">{fail}</div>}
    </div>
  );
}

// ============================================
// 반복 엔진 (중첩 블록)
// ============================================
function LoopStage({ concept, stage, stageIdx, total, onClear, onHintUsed }) {
  // 구조: outer(반복 밖, outerFirst면 앞) + loop{times, body[]}
  const [outerBlocks, setOuterBlocks] = useState([]); // 반복 밖 명령
  const [loopMade, setLoopMade] = useState(false);
  const [loopBody, setLoopBody] = useState([]); // 반복 안 명령
  const [targetSlot, setTargetSlot] = useState('loop'); // 'outer' | 'loop' : 다음 블록 위치
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('명령을 넣고 발사하세요');
  const [fail, setFail] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [wrong, setWrong] = useState(0);
  const [anim, setAnim] = useState(''); const [flame, setFlame] = useState(0); const [showEra, setShowEra] = useState(false);
  const [execInfo, setExecInfo] = useState(null); // {where, idx}
  const palette = useRef(shuffle(stage.palette)).current;

  const hasOuter = stage.outer && stage.outer.length > 0;

  const reset = () => { if (running) return; Sound.click(); setOuterBlocks([]); setLoopMade(false); setLoopBody([]); setTargetSlot('loop'); setFail(''); setAnim(''); setFlame(0); setStatus('명령을 넣고 발사하세요'); };
  const makeLoop = () => { if (running || loopMade) return; Sound.place(); setLoopMade(true); setTargetSlot('loop'); };
  const addBlock = (k) => {
    if (running) return; Sound.place(); setFail('');
    if (targetSlot === 'loop') { if (!loopMade) { setFail('먼저 "반복하기" 블록을 만들어요!'); return; } setLoopBody(b => [...b, k]); }
    else setOuterBlocks(b => [...b, k]);
  };
  const removeOuter = (i) => { if (running) return; Sound.click(); setOuterBlocks(b => b.filter((_, x) => x !== i)); setFail(''); };
  const removeBody = (i) => { if (running) return; Sound.click(); setLoopBody(b => b.filter((_, x) => x !== i)); setFail(''); };
  const removeLoop = () => { if (running) return; Sound.click(); setLoopMade(false); setLoopBody([]); setFail(''); };

  const run = async () => {
    if (running) return; Sound.ac(); setRunning(true); setFail('');
    // 실행: outerFirst면 outer 먼저, 아니면 loop 먼저 (이 게임은 outerFirst만 사용)
    const runOuter = async () => { for (let i = 0; i < outerBlocks.length; i++) { setExecInfo({ where: 'outer', idx: i }); const b = BLOCKS[outerBlocks[i]]; setStatus(`${b.ico} ${b.name}...`); if (outerBlocks[i] === 'engine') { setFlame(0.6); Sound.engine(); } await wait(700); } };
    const runLoop = async () => { for (let t = 0; t < stage.loopTimes; t++) { for (let i = 0; i < loopBody.length; i++) { setExecInfo({ where: 'loop', idx: i, turn: t }); const b = BLOCKS[loopBody[i]]; setStatus(`🔁 ${t + 1}/${stage.loopTimes}회 · ${b.ico} ${b.name}`); Sound.engine(); await wait(500); } } };
    if (stage.outerFirst) { await runOuter(); if (loopMade) await runLoop(); }
    else { if (loopMade) await runLoop(); await runOuter(); }
    setExecInfo(null);

    // 정답 판정: 반복 만들었고, 반복 안 명령이 정답순서, 반복 밖이 정답, (횟수는 블록이 고정이라 항상 맞음)
    const bodyOk = loopMade && loopBody.length === stage.loopBody.length && loopBody.every((k, i) => k === stage.loopBody[i]);
    const outerOk = outerBlocks.length === (stage.outer ? stage.outer.length : 0) && outerBlocks.every((k, i) => k === stage.outer[i]);
    const correct = bodyOk && outerOk;

    if (correct) {
      setStatus('🚀 발사!'); setAnim('lift-warp'); setFlame(1); Sound.launch(); await wait(1200);
      setShowEra(true); Sound.success(); confettiBurst(); await wait(1400);
      onClear([...(stage.outer || []), ...stage.loopBody], wrong, stage);
    } else {
      setWrong(w => w + 1); Sound.fail(); setStatus('💥 실패!');
      let msg = '😢 임무 실패! ';
      if (!loopMade) msg += '"반복하기" 블록을 만들어서 그 안에 명령을 넣어야 해요!';
      else if (loopBody.some(k => BLOCKS[k].trap) || outerBlocks.some(k => BLOCKS[k].trap)) msg += '엉뚱한 명령이 섞였어요!';
      else if (!bodyOk) msg += '반복 블록 안의 명령이 맞지 않아요. 순서를 확인하세요.';
      else if (!outerOk) msg += '반복 블록 밖의 명령을 확인하세요.';
      if (wrong + 1 >= 3) msg += ' (' + stage.hint + ')';
      setFail(msg); setRunning(false);
    }
  };

  // 팔레트 (이미 쓴 건 숨김: outer+body 합산)
  const used = {}; [...outerBlocks, ...loopBody].forEach(k => used[k] = (used[k] || 0) + 1);
  const availList = []; const tmp = { ...used };
  palette.forEach(k => { if (tmp[k]) { tmp[k]--; return; } availList.push(k); });

  return (
    <div>
      <ProgressBar idx={stageIdx} total={total} />
      <h1 className="big-title" style={{ '--cc': concept.color }}>시간여행 코드</h1>
      <div className="stage-name" style={{ color: concept.color }}>{stage.name}</div>
      <Comms text={stage.comms} />
      <div className="game">
        <RocketStage anim={anim} flame={flame} status={status} era={stage.era} showEra={showEra} />
        <div className="code-zone">
          <Panel label="▶ 명령 프로그램">
            {/* 반복 밖 (outerFirst면 위에) */}
            {hasOuter && stage.outerFirst && outerBlocks.map((k, i) => <Block key={'o' + i} bk={k} num={i + 1} placed exec={execInfo?.where === 'outer' && execInfo.idx === i} onClick={() => removeOuter(i)} dis={running} />)}
            {/* 반복 블록 */}
            {loopMade ? (
              <div className="loop-block">
                <div className="loop-head" onClick={removeLoop}>🔁 {stage.loopTimes}번 반복하기 {!running && <span className="x">✕</span>}</div>
                <div className="loop-body">
                  {loopBody.length === 0 ? <div className="empty-loop">↓ 여기에 반복할 명령을 넣어요</div> :
                    loopBody.map((k, i) => <Block key={'b' + i} bk={k} placed inner exec={execInfo?.where === 'loop' && execInfo.idx === i} onClick={() => removeBody(i)} dis={running} />)}
                </div>
              </div>
            ) : (outerBlocks.length === 0 && <div className="empty">아래에서 블록을 추가하세요</div>)}
            {hasOuter && !stage.outerFirst && outerBlocks.map((k, i) => <Block key={'o' + i} bk={k} placed exec={execInfo?.where === 'outer' && execInfo.idx === i} onClick={() => removeOuter(i)} dis={running} />)}
          </Panel>
          <Panel label="⚙ 블록">
            {/* 슬롯 선택 토글 (반복 밖이 필요한 스테이지만) */}
            {hasOuter && (
              <div className="slot-toggle">
                <button className={targetSlot === 'outer' ? 'on' : ''} onClick={() => { Sound.click(); setTargetSlot('outer'); }}>반복 밖에 넣기</button>
                <button className={targetSlot === 'loop' ? 'on' : ''} onClick={() => { Sound.click(); setTargetSlot('loop'); }}>반복 안에 넣기</button>
              </div>
            )}
            {!loopMade && <Block special bk={null} label={`🔁 ${stage.loopTimes}번 반복하기`} onClick={makeLoop} dis={running} />}
            {availList.map((k, i) => <Block key={i} bk={k} avail onClick={() => addBlock(k)} dis={running} />)}
            {loopMade && availList.length === 0 && <div className="empty">명령을 모두 배치했어요</div>}
          </Panel>
        </div>
      </div>
      <Controls onHint={() => { Sound.click(); if (onHintUsed) onHintUsed(); setShowHint(h => !h); }} onReset={reset} onRun={run} running={running} canRun={loopMade || outerBlocks.length > 0} />
      {showHint && <div className="hint">💡 {stage.hint}</div>}
      {fail && <div className="fail-msg">{fail}</div>}
    </div>
  );
}

function makeShuffled(stage) {
  if (!stage.answer || stage.palette.length <= 2) return shuffle(stage.palette);
  for (let t = 0; t < 20; t++) {
    const sh = shuffle(stage.palette);
    const only = sh.filter(k => stage.answer.includes(k));
    const same = only.length === stage.answer.length && only.every((k, i) => k === stage.answer[i]);
    if (!same) return sh;
  }
  return shuffle(stage.palette);
}

// ============================================
// 조건 엔진 (만약~라면~아니면)
// ============================================
function CondStage({ concept, stage, stageIdx, total, onClear, onHintUsed }) {
  const [thenAct, setThenAct] = useState(null);
  const [elseAct, setElseAct] = useState(null);
  const [running, setRunning] = useState(false);
  const [curScen, setCurScen] = useState(-1);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('조건을 채우고 실행하세요');
  const [fail, setFail] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [wrong, setWrong] = useState(0);
  const [showEra, setShowEra] = useState(false);
  const palette = useRef(shuffle(stage.actions)).current;

  const reset = () => { if (running) return; Sound.click(); setThenAct(null); setElseAct(null); setResults([]); setCurScen(-1); setFail(''); setStatus('조건을 채우고 실행하세요'); };
  const fillSlot = (k) => {
    if (running) return; Sound.place(); setFail('');
    if (!thenAct) setThenAct(k); else if (!elseAct) setElseAct(k);
  };
  const clearThen = () => { if (!running) { Sound.click(); setThenAct(null); setFail(''); } };
  const clearElse = () => { if (!running) { Sound.click(); setElseAct(null); setFail(''); } };

  const run = async () => {
    if (running || !thenAct || !elseAct) { if (!thenAct || !elseAct) setFail('😢 "그러면"과 "아니면" 둘 다 채워주세요!'); return; }
    Sound.ac(); setRunning(true); setFail(''); setResults([]);
    const res = [];
    for (let i = 0; i < stage.scenarios.length; i++) {
      setCurScen(i); await wait(900);
      const sc = stage.scenarios[i];
      const chosen = sc.cond ? thenAct : elseAct;
      const want = sc.cond ? stage.thenAns : stage.elseAns;
      const ok = chosen === want;
      res.push(ok); setResults([...res]);
      const b = BLOCKS[chosen];
      setStatus(`${sc.sit} → ${b.ico} ${b.name}`);
      if (ok) Sound.place(); else Sound.fail();
      await wait(700);
    }
    setCurScen(-1);
    const allOk = res.every(r => r);
    if (allOk) {
      setStatus('✅ 모든 상황 완벽 대응!'); Sound.success(); confettiBurst(); setShowEra(true); await wait(1600);
      onClear([stage.thenAns, stage.elseAns], wrong, stage);
    } else {
      setWrong(w => w + 1); Sound.fail(); setStatus('💥 일부 상황 실패');
      let msg = '😢 일부 상황에서 잘못 대응했어요. ';
      if (BLOCKS[thenAct].trap || BLOCKS[elseAct].trap) msg += '엉뚱한 행동이 들어갔어요!';
      else msg += '조건을 다시 생각해보세요.';
      if (wrong + 1 >= 3) msg += ' (' + stage.hint + ')';
      setFail(msg); setRunning(false);
    }
  };

  const used = [thenAct, elseAct].filter(Boolean);
  const avail = palette.filter(k => { const c = used.filter(u => u === k).length; const placedC = used.indexOf(k) >= 0 ? 1 : 0; return !used.includes(k); });
  // 같은 액션 중복 허용 안 함: then/else에 쓴 건 숨김
  const availList = palette.filter(k => !(thenAct === k) && !(elseAct === k));

  return (
    <div>
      <ProgressBar idx={stageIdx} total={total} />
      <h1 className="big-title" style={{ '--cc': concept.color }}>시간여행 코드</h1>
      <div className="stage-name" style={{ color: concept.color }}>{stage.name}</div>
      <Comms text={stage.comms} />
      <div className="game">
        <div className="stage-view cond-view">
          <div className="scen-box">
            {curScen >= 0 ? <div className="scen-current">{stage.scenarios[curScen].sit}</div>
              : <div className="scen-current dim">상황이 여기 나타나요</div>}
          </div>
          <div className="scen-dots">
            {stage.scenarios.map((_, i) => (
              <div key={i} className={`sdot ${results[i] === true ? 'ok' : results[i] === false ? 'no' : ''} ${curScen === i ? 'cur' : ''}`}>
                {results[i] === true ? '✓' : results[i] === false ? '✗' : i + 1}
              </div>
            ))}
          </div>
          <div className="status-line">{status}</div>
        </div>
        <div className="code-zone">
          <Panel label="❓ 조건 블록">
            <div className="if-block">
              <div className="if-head">❓ 만약 [적/위험이 보이면]</div>
              <div className="if-rows">
                <div className="if-row">
                  <span className="if-lab">→ 그러면:</span>
                  {thenAct ? <Block bk={thenAct} placed inner onClick={clearThen} dis={running} /> : <div className="slot-empty">아래에서 행동 선택</div>}
                </div>
                <div className="if-row">
                  <span className="if-lab">→ 아니면:</span>
                  {elseAct ? <Block bk={elseAct} placed inner onClick={clearElse} dis={running} /> : <div className="slot-empty">아래에서 행동 선택</div>}
                </div>
              </div>
            </div>
          </Panel>
          <Panel label="⚙ 행동">
            {availList.length === 0 ? <div className="empty">행동을 모두 배치했어요</div> :
              availList.map((k, i) => <Block key={i} bk={k} avail onClick={() => fillSlot(k)} dis={running} />)}
          </Panel>
        </div>
      </div>
      <Controls onHint={() => { Sound.click(); if (onHintUsed) onHintUsed(); setShowHint(h => !h); }} onReset={reset} onRun={run} running={running} canRun={!!(thenAct && elseAct)} runLabel="▶ 상황 실행" />
      {showHint && <div className="hint">💡 {stage.hint}</div>}
      {fail && <div className="fail-msg">{fail}</div>}
    </div>
  );
}

// ============================================
// 변수 엔진 (게이지 관리) - before/loop/after 3영역 구조
// ============================================
function VarStage({ concept, stage, stageIdx, total, onClear, onHintUsed }) {
  // 프로그램 영역: before(반복 앞) / loopBody(반복 안) / after(반복 뒤)
  // useLoop 아니면 before만 평면 시퀀스로 사용
  const [before, setBefore] = useState([]);
  const [loopMade, setLoopMade] = useState(false);
  const [loopBody, setLoopBody] = useState([]);
  const [after, setAfter] = useState([]);
  const [targetSlot, setTargetSlot] = useState(stage.useLoop ? 'before' : 'before'); // before|loop|after
  const [running, setRunning] = useState(false);
  const [fuel, setFuel] = useState(null);
  const [status, setStatus] = useState('블록을 넣고 실행하세요');
  const [fail, setFail] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [wrong, setWrong] = useState(0);
  const [showEra, setShowEra] = useState(false);
  const [execId, setExecId] = useState(null); // 'before-i' | 'loop-i' | 'after-i'
  const palette = useRef(shuffle(stage.palette)).current;

  const reset = () => { if (running) return; Sound.click(); setBefore([]); setLoopMade(false); setLoopBody([]); setAfter([]); setTargetSlot('before'); setFuel(null); setFail(''); setStatus('블록을 넣고 실행하세요'); };
  const makeLoop = () => { if (running || loopMade) return; Sound.place(); setLoopMade(true); setTargetSlot('loop'); };
  const addBlock = (k) => {
    if (running) return; Sound.place(); setFail('');
    if (!stage.useLoop) { setBefore(b => [...b, k]); return; }
    if (targetSlot === 'loop') { if (!loopMade) { setFail('먼저 "반복하기" 블록을 만들어요!'); return; } setLoopBody(b => [...b, k]); }
    else if (targetSlot === 'after') setAfter(b => [...b, k]);
    else setBefore(b => [...b, k]);
  };
  const rm = (area, i) => {
    if (running) return; Sound.click(); setFail('');
    if (area === 'before') setBefore(b => b.filter((_, x) => x !== i));
    else if (area === 'loop') setLoopBody(b => b.filter((_, x) => x !== i));
    else setAfter(b => b.filter((_, x) => x !== i));
  };
  const removeLoop = () => { if (running) return; Sound.click(); setLoopMade(false); setLoopBody([]); setFail(''); };

  const run = async () => {
    if (running) return; Sound.ac(); setRunning(true); setFail(''); setFuel(null);
    let f = null, inited = false, usedTrap = false, earlyError = false;
    const exec = async (k, id) => {
      const b = BLOCKS[k]; setExecId(id);
      if (b.trap) { usedTrap = true; setStatus(`${b.ico} ${b.name}?!`); Sound.fail(); await wait(450); return; }
      if (k === 'fuelInit') { f = 0; inited = true; setFuel(0); setStatus('📦 연료통을 0으로!'); Sound.place(); }
      else if (k === 'fuelP' || k === 'charge') { if (f === null) { earlyError = true; setStatus('⚠️ 연료통이 없어요!'); Sound.fail(); await wait(450); return; } f++; setFuel(f); setStatus(`⛽ 연료 +1 → ${f}`); Sound.place(); }
      else if (k === 'fuelM') { if (f === null) { earlyError = true; setStatus('⚠️ 연료통이 없어요!'); Sound.fail(); await wait(450); return; } f--; setFuel(f); setStatus(`➖ 연료 -1 → ${f}`); Sound.click(); }
      await wait(520);
    };
    // 실행 순서: before → loop(×times) → after
    for (let i = 0; i < before.length; i++) { await exec(before[i], 'before-' + i); if (earlyError) break; }
    if (!earlyError && loopMade) for (let t = 0; t < stage.loopTimes; t++) { for (let i = 0; i < loopBody.length; i++) { await exec(loopBody[i], 'loop-' + i); if (earlyError) break; } if (earlyError) break; }
    if (!earlyError) for (let i = 0; i < after.length; i++) { await exec(after[i], 'after-' + i); if (earlyError) break; }
    setExecId(null);

    const correct = !usedTrap && !earlyError && inited && f === stage.target;
    if (correct) {
      setStatus(`🎯 연료 ${stage.target} 달성!`); Sound.launch(); confettiBurst(); setShowEra(true); await wait(1500);
      onClear([...before, ...(loopMade ? loopBody : []), ...after], wrong, stage);
    } else {
      setWrong(w => w + 1); Sound.fail();
      let msg = '😢 실패! ';
      if (usedTrap) msg += '엉뚱한 블록이 섞였어요!';
      else if (earlyError) msg += '연료통을 안 만들고 연료를 바꾸려 했어요. [연료통 = 0]을 먼저!';
      else if (!inited) msg += '[연료통 = 0]으로 시작해야 해요!';
      else if (f !== stage.target) msg += `연료가 ${f}이에요. 목표는 ${stage.target}! ${f > stage.target ? '너무 많아요.' : '더 채우세요.'}`;
      if (wrong + 1 >= 3) msg += ' (' + stage.hint + ')';
      setFail(msg); setStatus('💥 실패'); setRunning(false);
    }
  };

  // fuelInit은 1개만 허용 (어느 영역이든 이미 있으면 팔레트에서 숨김)
  const hasInit = [...before, ...loopBody, ...after].includes('fuelInit');
  const availList = palette.filter(k => !(k === 'fuelInit' && hasInit));
  const totalCount = before.length + loopBody.length + after.length;

  return (
    <div>
      <ProgressBar idx={stageIdx} total={total} />
      <h1 className="big-title" style={{ '--cc': concept.color }}>시간여행 코드</h1>
      <div className="stage-name" style={{ color: concept.color }}>{stage.name}</div>
      <Comms text={stage.comms} />
      <div className="game">
        <div className="stage-view var-view">
          <div className="fuel-gauge">
            <div className="fuel-label">📦 연료통</div>
            <div className="fuel-num" style={{ color: fuel === null ? '#789' : fuel === stage.target ? 'var(--green)' : 'var(--gold)' }}>{fuel === null ? '?' : fuel}</div>
            <div className="fuel-target">목표: {stage.target}</div>
            <div className="fuel-bar"><div className="fuel-fill" style={{ width: fuel === null ? '0%' : Math.min(100, (fuel / stage.target) * 100) + '%' }} /></div>
          </div>
          <div className="status-line">{status}</div>
        </div>
        <div className="code-zone">
          <Panel label="▶ 명령 프로그램" right={`${totalCount}개`}>
            {before.map((k, i) => <Block key={'bf' + i} bk={k} placed exec={execId === 'before-' + i} onClick={() => rm('before', i)} dis={running} />)}
            {stage.useLoop && loopMade && (
              <div className="loop-block">
                <div className="loop-head" onClick={removeLoop}>🔁 {stage.loopTimes}번 반복하기 {!running && <span className="x">✕</span>}</div>
                <div className="loop-body">
                  {loopBody.length === 0 ? <div className="empty-loop">↓ 반복할 명령 넣기</div> :
                    loopBody.map((k, i) => <Block key={'lp' + i} bk={k} placed inner exec={execId === 'loop-' + i} onClick={() => rm('loop', i)} dis={running} />)}
                </div>
              </div>
            )}
            {after.map((k, i) => <Block key={'af' + i} bk={k} placed exec={execId === 'after-' + i} onClick={() => rm('after', i)} dis={running} />)}
            {totalCount === 0 && !loopMade && <div className="empty">아래에서 블록을 추가하세요</div>}
          </Panel>
          <Panel label="⚙ 블록">
            {stage.useLoop && (
              <div className="slot-toggle">
                <button className={targetSlot === 'before' ? 'on' : ''} onClick={() => { Sound.click(); setTargetSlot('before'); }}>반복 앞</button>
                <button className={targetSlot === 'loop' ? 'on' : ''} onClick={() => { Sound.click(); setTargetSlot('loop'); }}>반복 안</button>
                <button className={targetSlot === 'after' ? 'on' : ''} onClick={() => { Sound.click(); setTargetSlot('after'); }}>반복 뒤</button>
              </div>
            )}
            {stage.useLoop && !loopMade && <Block special bk={null} label={`🔁 ${stage.loopTimes}번 반복하기`} onClick={makeLoop} dis={running} />}
            {availList.map((k, i) => <Block key={i} bk={k} avail onClick={() => addBlock(k)} dis={running} />)}
          </Panel>
        </div>
      </div>
      <Controls onHint={() => { Sound.click(); if (onHintUsed) onHintUsed(); setShowHint(h => !h); }} onReset={reset} onRun={run} running={running} canRun={totalCount > 0 || loopMade} runLabel="▶ 실행" />
      {showHint && <div className="hint">💡 {stage.hint}</div>}
      {fail && <div className="fail-msg">{fail}</div>}
    </div>
  );
}


// ============================================
// 퀴즈
// ============================================
function Quiz({ concept, onDone }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const [fb, setFb] = useState('');
  const quiz = concept.quiz;
  const passLine = Math.ceil(quiz.length * 2 / 3); // 3문제 중 2개

  const pick = (i) => {
    if (picked !== null) return;
    const q = quiz[idx]; const ok = i === q.answer;
    setPicked(i);
    const nr = [...results]; nr[idx] = ok; setResults(nr);
    if (ok) { Sound.place(); setScore(s => s + 1); setFb('⭕ 정답!'); }
    else { Sound.fail(); setFb('❌ 틀렸어요. 초록색이 정답이에요.'); }
    setTimeout(() => {
      if (idx < quiz.length - 1) { setIdx(idx + 1); setPicked(null); setFb(''); }
      else onDone(ok ? score + 1 : score, passLine);
    }, ok ? 1300 : 2000);
  };

  const q = quiz[idx];
  return (
    <div>
      <ProgressBar idx={idx} total={quiz.length} label={`퀴즈 ${idx + 1} / ${quiz.length}`} />
      <h1 className="big-title" style={{ '--cc': concept.color }}>{concept.title} 마스터 테스트</h1>
      <div className="quiz-score">
        {quiz.map((_, i) => <span key={i} style={{ color: results[i] === true ? 'var(--green)' : results[i] === false ? 'var(--pink)' : 'rgba(255,255,255,.25)' }}>{results[i] === true ? '✓' : results[i] === false ? '✗' : '○'}</span>)}
        <span className="qs-num">현재 {score}개 정답</span>
      </div>
      <div className="quiz-q">
        <h3>Q{idx + 1}. {q.q}</h3>
        {q.opts.map((o, i) => (
          <div key={i} className={`quiz-opt ${picked !== null && i === q.answer ? 'correct' : ''} ${picked === i && i !== q.answer ? 'wrong' : ''}`} onClick={() => pick(i)}>{o}</div>
        ))}
        {fb && <div className="quiz-fb" style={{ color: fb[0] === '⭕' ? 'var(--green)' : 'var(--pink)' }}>{fb}</div>}
      </div>
    </div>
  );
}

// ============================================
// 공통 컴포넌트
// ============================================
function Comms({ text }) {
  return <div className="comms"><span className="who">📡 관제센터:</span> {text}</div>;
}
function Panel({ label, right, children }) {
  return (
    <div className="panel">
      <div className="panel-label"><span>{label}</span>{right && <span>{right}</span>}</div>
      <div>{children}</div>
    </div>
  );
}
function Block({ bk, num, placed, avail, inner, special, exec, label, onClick, dis }) {
  const b = bk ? BLOCKS[bk] : null;
  const cls = ['block'];
  if (avail) cls.push('avail'); if (placed) cls.push('placed'); if (inner) cls.push('inner');
  if (special) cls.push('special'); if (exec) cls.push('executing'); if (b?.trap) cls.push('trap');
  return (
    <div className={cls.join(' ')} onClick={dis ? undefined : onClick}>
      {num != null && <span className="num">{num}</span>}
      {b ? <><span className="ico">{b.ico}</span>{b.name}</> : label}
      {placed && !dis && <span className="x">✕</span>}
    </div>
  );
}
function Controls({ onHint, onReset, onRun, running, canRun, runLabel }) {
  return (
    <div className="controls">
      <button className="btn-hint" onClick={onHint}>💡 힌트</button>
      <button className="btn-reset" onClick={onReset} disabled={running}>↺ 초기화</button>
      <button className="btn-launch" onClick={onRun} disabled={running || !canRun}>{runLabel || '🚀 발사!'}</button>
    </div>
  );
}
function RocketStage({ anim, flame, status, era, showEra }) {
  const cls = ['stage-view'];
  if (anim === 'lift-warp') cls.push('warping');
  return (
    <div className={cls.join(' ')}>
      {anim === 'lift-warp' && Array.from({ length: 8 }, (_, i) => <div key={i} className="warp-line" style={{ transform: `rotate(${i * 45}deg)` }} />)}
      {showEra && <div className="era-label show">{era}</div>}
      <svg className={`rocket ${anim === 'lift-warp' ? 'lifting' : ''} ${anim === 'land' ? 'landing' : ''}`} viewBox="0 0 100 160">
        <g style={{ opacity: flame }}>
          <ellipse cx="50" cy="148" rx="12" ry="20" fill="#ffd23f" /><ellipse cx="50" cy="144" rx="7" ry="14" fill="#ff6b00" /><ellipse cx="50" cy="140" rx="4" ry="9" fill="#fff" />
        </g>
        <path d="M50 8 Q70 40 70 100 L70 125 L30 125 L30 100 Q30 40 50 8 Z" fill="#dfe9ff" />
        <path d="M50 8 Q70 40 70 100 L70 125 L50 125 Z" fill="#aebfdf" />
        <circle cx="50" cy="55" r="11" fill="#18e0ff" /><circle cx="50" cy="55" r="11" fill="none" stroke="#0a3a4a" strokeWidth="3" /><circle cx="46" cy="51" r="3" fill="#bff" />
        <path d="M30 100 L12 130 L30 122 Z" fill="#b45cff" /><path d="M70 100 L88 130 L70 122 Z" fill="#b45cff" />
      </svg>
      <div className="status-line">{status}</div>
    </div>
  );
}
function Modal({ badge, title, html, onNext, trophy }) {
  return (
    <div className="modal-bg show">
      <div className="modal">
        <div className={`badge ${trophy ? 'trophy' : ''}`}>{badge}</div>
        <h2>{title}</h2>
        <div className="learn" dangerouslySetInnerHTML={{ __html: html }} />
        <button className="next" onClick={onNext}>다음 →</button>
      </div>
    </div>
  );
}

// ============================================
// 스타일
// ============================================
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&family=Gowun+Dodum&display=swap');
* { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
.app-root { --space-deep:#050818; --cyan:#18e0ff; --purple:#b45cff; --gold:#ffd23f; --pink:#ff4d8d; --green:#3affa3; --panel:rgba(20,35,70,0.6);
  font-family:'Gowun Dodum',sans-serif; background:var(--space-deep); color:#e8f0ff; min-height:100vh; position:relative; overflow-x:hidden; user-select:none; }
.space-bg { position:fixed; inset:0; z-index:0; background:radial-gradient(ellipse at 20% 30%,rgba(180,92,255,.15),transparent 40%),radial-gradient(ellipse at 80% 70%,rgba(24,224,255,.12),transparent 40%),linear-gradient(180deg,#050818,#0d1b3a 60%,#1a0d2e); }
.stars { position:fixed; inset:0; z-index:0; overflow:hidden; }
.star { position:absolute; background:#fff; border-radius:50%; animation:tw var(--d) ease-in-out infinite alternate; }
@keyframes tw { from{opacity:.2} to{opacity:1} }

.hud { position:relative; z-index:2; display:flex; justify-content:space-between; align-items:center; gap:8px; padding:14px 16px 0; max-width:1100px; margin:0 auto; }
.back-btn,.sound-toggle { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.2); color:#cfe; border-radius:8px; font-family:inherit; cursor:pointer; }
.back-btn { padding:8px 14px; font-size:14px; }
.sound-toggle { width:36px; height:36px; border-radius:50%; font-size:15px; }
.mission-tag { font-family:'Orbitron',sans-serif; font-weight:800; font-size:12px; color:var(--cc,#18e0ff); letter-spacing:1px; border:1px solid var(--cc,#18e0ff); padding:6px 12px; border-radius:20px; background:rgba(24,224,255,.08); }

/* 허브 */
.hub { position:relative; z-index:1; max-width:1100px; margin:0 auto; padding:0 16px 30px; min-height:100vh; }
.hub-header { text-align:center; padding:24px 0 20px; }
.hub-logo { font-size:54px; cursor:pointer; animation:float 3s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.hub-title { font-family:'Orbitron',sans-serif; font-weight:900; font-size:clamp(28px,6vw,46px); cursor:pointer; background:linear-gradient(90deg,var(--cyan),var(--purple),var(--pink)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; filter:drop-shadow(0 0 20px rgba(24,224,255,.4)); }
.hub-sub { color:#9ab; margin-top:8px; font-size:15px; }
.concept-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:16px; }
.concept-card { background:linear-gradient(145deg,rgba(20,35,70,.7),rgba(10,20,45,.7)); border:2px solid var(--cc,#18e0ff); border-radius:16px; padding:22px; cursor:pointer; position:relative; overflow:hidden; transition:transform .2s,box-shadow .2s; backdrop-filter:blur(8px); }
.concept-card:not(.locked):hover { transform:translateY(-5px); box-shadow:0 10px 30px rgba(0,0,0,.4),0 0 20px var(--cc); }
.concept-card.locked { opacity:.5; filter:grayscale(.6); cursor:not-allowed; border-color:#445; }
.concept-card.mastered { box-shadow:0 0 20px var(--cc); }
.cc-num { font-family:'Orbitron',sans-serif; font-size:12px; color:var(--cc); letter-spacing:2px; }
.cc-ico { font-size:46px; margin:8px 0; }
.cc-title { font-family:'Orbitron',sans-serif; font-size:26px; color:#e8f0ff; }
.cc-sub { color:var(--cc); font-size:13px; margin:4px 0; }
.cc-desc { color:#9ab; font-size:14px; margin:8px 0 14px; }
.cc-foot { font-size:13px; }
.cc-lock { color:#89a; }
.cc-done { color:var(--gold); font-weight:bold; }
.cc-go { color:var(--cc); font-weight:bold; }
.hub-foot { text-align:center; color:#678; font-size:12px; margin-top:24px; }

/* 대시보드 */
.dashboard { display:flex; align-items:center; justify-content:center; gap:18px; flex-wrap:wrap; margin:0 auto 22px; max-width:680px; background:var(--panel); border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:16px 20px; backdrop-filter:blur(8px); }
.dash-item { text-align:center; }
.dash-big { font-family:'Orbitron',sans-serif; font-weight:800; font-size:24px; color:var(--gold); }
.dash-small { font-size:13px; color:#789; margin-left:4px; }
.dash-label { font-size:12px; color:#9ab; margin-top:2px; }
.dash-bar-wrap { flex:1; min-width:160px; }
.dash-bar { height:12px; background:rgba(255,255,255,.1); border-radius:8px; overflow:hidden; }
.dash-fill { height:100%; background:linear-gradient(90deg,var(--cyan),var(--green)); transition:width .5s; }
.dash-badge-btn { cursor:pointer; padding:6px 10px; border-radius:10px; transition:.15s; }
.dash-badge-btn:hover { background:rgba(255,255,255,.08); }

/* 카드 별점 */
.cc-top { display:flex; justify-content:space-between; align-items:center; }
.cc-stars { font-size:12px; color:var(--gold); font-weight:bold; }

/* 별 결과 (모달) */
.star-result { text-align:center; margin-bottom:12px; }
.star-row { font-size:40px; letter-spacing:6px; animation:starsPop .6s cubic-bezier(.34,1.56,.64,1); }
@keyframes starsPop { from{transform:scale(0)} to{transform:scale(1)} }
.star-msg { font-size:14px; color:var(--gold); margin-top:4px; font-weight:bold; }

/* 배지 모달 */
.badge-modal { max-width:520px; }
.badge-modal h2 { font-family:'Orbitron',sans-serif; color:var(--gold); margin-bottom:16px; }
.badge-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:12px; margin-bottom:16px; }
.badge-item { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:14px 8px; text-align:center; opacity:.5; }
.badge-item.got { opacity:1; border-color:var(--gold); box-shadow:0 0 14px rgba(255,210,63,.3); background:rgba(255,210,63,.08); }
.badge-ico { font-size:32px; }
.badge-name { font-size:13px; font-weight:bold; margin-top:6px; color:#e8f0ff; }
.badge-desc { font-size:11px; color:#9ab; margin-top:3px; line-height:1.3; }

/* 개념 플레이어 */
.concept-player { position:relative; z-index:1; max-width:1100px; margin:0 auto; padding:0 16px 30px; }
.ptrack { display:flex; gap:5px; margin:10px 0 4px; }
.pdot { flex:1; height:7px; border-radius:4px; background:rgba(255,255,255,.12); transition:.3s; }
.pdot.done { background:linear-gradient(90deg,var(--cyan),var(--green)); }
.pdot.current { background:var(--gold); box-shadow:0 0 8px var(--gold); }
.plabel { font-size:12px; color:#9ab; text-align:center; font-family:'Orbitron',sans-serif; letter-spacing:1px; }
.big-title { font-family:'Orbitron',sans-serif; font-weight:900; font-size:clamp(20px,4.5vw,30px); text-align:center; margin:8px 0 2px; background:linear-gradient(90deg,var(--cyan),var(--purple),var(--pink)); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.stage-name { text-align:center; font-family:'Orbitron',sans-serif; font-size:15px; margin-bottom:6px; }
.comms { background:var(--panel); border:1px solid rgba(24,224,255,.3); border-left:4px solid var(--cyan); border-radius:10px; padding:13px 15px; margin:10px 0; font-size:14.5px; line-height:1.55; backdrop-filter:blur(8px); }
.comms .who { color:var(--gold); font-weight:bold; font-family:'Orbitron',sans-serif; font-size:12px; }

.game { display:grid; grid-template-columns:1.05fr .95fr; gap:14px; margin:14px 0; }
@media (max-width:760px){ .game{grid-template-columns:1fr} }
.stage-view { background:radial-gradient(ellipse at center bottom,rgba(24,224,255,.08),transparent 70%),rgba(5,8,24,.6); border:1px solid rgba(180,92,255,.3); border-radius:14px; position:relative; overflow:hidden; min-height:300px; display:flex; align-items:center; justify-content:center; flex-direction:column; }
.warp-line { position:absolute; width:2px; height:0; background:linear-gradient(transparent,var(--cyan)); left:50%; top:50%; transform-origin:top center; opacity:0; }
.stage-view.warping .warp-line { animation:warp .8s ease-in forwards; }
@keyframes warp { 0%{opacity:0;height:0} 30%{opacity:1} 100%{opacity:0;height:400px} }
.rocket { position:relative; z-index:2; width:115px; }
.rocket.lifting { animation:lift 1.2s ease-in forwards; }
@keyframes lift { 0%{transform:translateY(0)} 30%{transform:translateY(8px)} 100%{transform:translateY(-420px)} }
.rocket.landing { animation:land 1.2s ease-out forwards; }
@keyframes land { 0%{transform:translateY(-200px);opacity:.5} 100%{transform:translateY(0);opacity:1} }
.era-label { position:absolute; top:18px; left:50%; transform:translateX(-50%); font-family:'Orbitron',sans-serif; font-weight:900; font-size:19px; color:var(--gold); text-shadow:0 0 18px var(--gold); opacity:0; z-index:5; white-space:nowrap; }
.era-label.show { animation:arr 2s ease forwards; }
@keyframes arr { 0%{opacity:0;transform:translateX(-50%) scale(.5)} 30%{opacity:1;transform:translateX(-50%) scale(1.1)} 100%{opacity:.9;transform:translateX(-50%) scale(1)} }
.status-line { position:absolute; bottom:12px; left:0; right:0; text-align:center; font-family:'Orbitron',sans-serif; font-size:12.5px; color:var(--cyan); letter-spacing:.5px; min-height:16px; padding:0 10px; }

.code-zone { display:flex; flex-direction:column; gap:10px; }
.panel { background:var(--panel); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:13px; backdrop-filter:blur(8px); }
.panel-label { font-family:'Orbitron',sans-serif; font-size:11px; letter-spacing:1px; color:var(--purple); margin-bottom:9px; padding-bottom:6px; border-bottom:1px solid rgba(180,92,255,.3); display:flex; justify-content:space-between; }
.empty,.empty-loop { text-align:center; color:rgba(255,255,255,.35); font-size:13px; padding:16px; font-style:italic; }
.empty-loop { padding:10px; }

.block { background:linear-gradient(135deg,#1a3a6a,#0d2348); border:1px solid rgba(24,224,255,.4); color:#e8f0ff; padding:12px 14px; border-radius:9px; margin:6px 0; font-weight:600; font-size:14.5px; cursor:pointer; position:relative; transition:all .15s; display:flex; align-items:center; gap:7px; }
.block .ico { font-size:17px; }
.block.avail:hover { transform:translateX(5px); border-color:var(--cyan); box-shadow:0 0 12px rgba(24,224,255,.3); }
.block.avail:active { transform:scale(.96); }
.block.placed { background:linear-gradient(135deg,#0d2348,#081830); }
.block.special { background:linear-gradient(135deg,var(--purple),#6a2aaf); border-color:var(--purple); }
.block.executing { background:linear-gradient(135deg,var(--gold),#ff9d00)!important; color:#1a1a1a; border-color:var(--gold); box-shadow:0 0 22px var(--gold); transform:scale(1.04); }
.block .num { font-family:'Orbitron',sans-serif; color:var(--cyan); font-weight:800; }
.block.executing .num { color:#1a1a1a; }
.block .x { margin-left:auto; opacity:.4; font-size:13px; }
.block.placed:hover .x { opacity:1; }

.loop-block { border:2px dashed var(--purple); border-radius:10px; padding:8px; margin:6px 0; background:rgba(180,92,255,.06); }
.loop-head { background:linear-gradient(135deg,var(--purple),#6a2aaf); color:#fff; padding:10px 13px; border-radius:6px; font-weight:700; cursor:pointer; font-size:14px; }
.loop-head .x { float:right; opacity:.6; }
.loop-body { padding:8px 0 2px 16px; border-left:3px solid var(--purple); margin:8px 0 0 8px; }

.slot-toggle { display:flex; gap:6px; margin-bottom:10px; }
.slot-toggle button { flex:1; padding:8px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.05); color:#9ab; border-radius:6px; font-family:inherit; font-size:12.5px; cursor:pointer; }
.slot-toggle button.on { background:rgba(180,92,255,.25); color:#fff; border-color:var(--purple); }

.if-block { border:2px dashed var(--gold); border-radius:10px; padding:10px; background:rgba(255,210,63,.06); }
.if-head { background:linear-gradient(135deg,var(--gold),#d4a017); color:#1a1a1a; padding:10px 13px; border-radius:6px; font-weight:700; font-size:14px; }
.if-rows { padding-top:8px; }
.if-row { display:flex; align-items:center; gap:8px; margin:8px 0; }
.if-lab { font-weight:700; color:#cdb; min-width:62px; font-size:13px; }
.if-row .block { flex:1; margin:0; }
.slot-empty { flex:1; text-align:center; color:rgba(255,255,255,.35); font-size:12.5px; padding:10px; border:1px dashed rgba(255,255,255,.2); border-radius:8px; font-style:italic; }

.cond-view, .var-view { gap:14px; padding:16px; }
.scen-box { width:90%; }
.scen-current { background:rgba(255,210,63,.1); border:1px solid var(--gold); border-radius:10px; padding:16px; text-align:center; font-size:16px; font-weight:600; color:#ffe; }
.scen-current.dim { color:#789; border-color:#445; background:rgba(255,255,255,.04); }
.scen-dots { display:flex; gap:8px; margin-top:14px; }
.sdot { width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center; font-weight:bold; font-family:'Orbitron',sans-serif; font-size:13px; }
.sdot.ok { background:var(--green); color:#062; }
.sdot.no { background:var(--pink); color:#fff; }
.sdot.cur { outline:2px solid var(--gold); }

.fuel-gauge { width:80%; text-align:center; }
.fuel-label { font-family:'Orbitron',sans-serif; color:var(--cyan); font-size:13px; }
.fuel-num { font-family:'Orbitron',sans-serif; font-size:56px; font-weight:900; line-height:1.1; }
.fuel-target { color:#9ab; font-size:13px; }
.fuel-bar { height:14px; background:rgba(255,255,255,.1); border-radius:8px; overflow:hidden; margin-top:10px; }
.fuel-fill { height:100%; background:linear-gradient(90deg,var(--cyan),var(--green)); transition:width .4s; }

.controls { display:flex; gap:9px; justify-content:center; flex-wrap:wrap; margin:14px 0; }
.controls button { padding:12px 22px; border:none; border-radius:10px; font-family:'Orbitron',sans-serif; font-weight:700; font-size:14px; cursor:pointer; transition:.15s; letter-spacing:1px; }
.controls button:active { transform:scale(.95); }
.controls button:disabled { opacity:.4; cursor:not-allowed; }
.btn-hint { background:rgba(180,92,255,.25); color:var(--purple); border:1px solid var(--purple)!important; }
.btn-reset { background:rgba(255,255,255,.1); color:#aaa; }
.btn-launch { background:linear-gradient(135deg,var(--cyan),var(--purple)); color:#061018; font-size:16px; padding:12px 30px; box-shadow:0 0 22px rgba(24,224,255,.5); }
.hint { background:rgba(180,92,255,.12); border:1px dashed var(--purple); border-radius:10px; padding:11px 15px; margin:9px 0; line-height:1.55; font-size:14px; }
.fail-msg { background:rgba(255,77,141,.12); border:1px solid var(--pink); border-radius:10px; padding:11px 15px; margin:9px 0; text-align:center; font-size:14px; }

/* 퀴즈 */
.quiz-score { text-align:center; font-family:'Orbitron',sans-serif; font-size:22px; letter-spacing:8px; margin:14px 0 6px; }
.quiz-score .qs-num { display:block; font-size:13px; letter-spacing:1px; color:var(--cyan); margin-top:6px; }
.quiz-q { background:var(--panel); border:1px solid rgba(255,255,255,.15); border-radius:12px; padding:18px; margin:12px 0; max-width:600px; margin-left:auto; margin-right:auto; }
.quiz-q h3 { font-size:17px; margin-bottom:14px; }
.quiz-opt { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.15); border-radius:8px; padding:13px 15px; margin:8px 0; cursor:pointer; transition:.15s; font-size:15px; }
.quiz-opt:hover { border-color:var(--cyan); background:rgba(24,224,255,.1); }
.quiz-opt.correct { border-color:var(--green); background:rgba(58,255,163,.15); }
.quiz-opt.wrong { border-color:var(--pink); background:rgba(255,77,141,.15); }
.quiz-fb { text-align:center; margin-top:12px; font-weight:bold; font-size:15px; }

/* 모달 */
.modal-bg { position:fixed; inset:0; background:rgba(5,8,24,.85); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; backdrop-filter:blur(6px); animation:fade .3s; }
@keyframes fade { from{opacity:0} to{opacity:1} }
.modal { background:linear-gradient(145deg,#14254d,#0a1530); border:2px solid var(--gold); border-radius:18px; padding:28px; max-width:460px; width:100%; text-align:center; box-shadow:0 0 60px rgba(255,210,63,.4); animation:pop .5s cubic-bezier(.34,1.56,.64,1); }
@keyframes pop { from{transform:scale(.6);opacity:0} to{transform:scale(1);opacity:1} }
.modal .badge { font-size:70px; animation:bsp 1.5s ease; }
.modal .badge.trophy { animation:trophyGlow 2s ease infinite alternate, bsp 1.5s ease; }
@keyframes bsp { 0%{transform:rotateY(0) scale(0)} 100%{transform:rotateY(720deg) scale(1)} }
@keyframes trophyGlow { from{filter:drop-shadow(0 0 10px var(--gold))} to{filter:drop-shadow(0 0 30px var(--gold)) drop-shadow(0 0 50px #ff9d00)} }
.modal h2 { font-family:'Orbitron',sans-serif; color:var(--gold); margin:10px 0; font-size:20px; }
.modal .learn { background:rgba(24,224,255,.08); border-radius:10px; padding:14px; margin:14px 0; text-align:left; line-height:1.55; font-size:13.5px; }
.modal .learn b { color:var(--cyan); }
.review-card { margin-top:10px; }
.rv-label { color:var(--gold); font-size:13px; margin-bottom:6px; }
.rv-row { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,.08); font-size:13.5px; }
.rv-arrow { color:#9ab; }
.rv-con { color:var(--cyan); font-weight:bold; }
.modal .next { background:linear-gradient(135deg,var(--cyan),var(--purple)); color:#061018; border:none; padding:13px 30px; border-radius:10px; font-family:'Orbitron',sans-serif; font-weight:700; font-size:15px; cursor:pointer; margin-top:6px; }

.confetti { position:fixed; width:10px; height:10px; top:-20px; z-index:200; pointer-events:none; }
@keyframes fall { to{transform:translateY(105vh) rotate(720deg);opacity:0} }
.master-fx { position:fixed; inset:0; z-index:150; pointer-events:none; }
.master-ray { position:absolute; top:50%; left:50%; width:6px; height:50vh; background:linear-gradient(transparent,var(--gold),transparent); transform-origin:top center; opacity:0; animation:rayBurst 1.6s ease-out forwards; }
@keyframes rayBurst { 0%{opacity:0;transform:rotate(var(--rot)) scaleY(0)} 40%{opacity:.8} 100%{opacity:0;transform:rotate(var(--rot)) scaleY(1.2)} }
.master-star { position:absolute; font-size:30px; opacity:0; animation:starPop 1.8s ease-out forwards; }
@keyframes starPop { 0%{opacity:0;transform:scale(0) rotate(0)} 30%{opacity:1;transform:scale(1.4) rotate(180deg)} 100%{opacity:0;transform:scale(.8) rotate(360deg) translateY(-40px)} }
`;
