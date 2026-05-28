// ============================================
// 시간여행 코드 - 전체 스테이지 데이터
// 4개념 × 8스테이지 + 복습퀴즈
// ============================================

// 블록 사전: name=게임용어(화면표시), concept=코딩개념어(복습카드용)
export const BLOCKS = {
  // 순차용
  belt:   {name:'안전벨트 매기', concept:'준비 단계', ico:'🔒'},
  coord:  {name:'좌표 입력',     concept:'값 설정(입력)', ico:'🎯'},
  engine: {name:'엔진 켜기',     concept:'명령 실행', ico:'🔥'},
  booster:{name:'부스터 켜기',   concept:'명령 실행', ico:'⚡'},
  go:     {name:'출발!',         concept:'실행(run)', ico:'🚀'},
  slow:   {name:'속도 줄이기',   concept:'명령 실행', ico:'🛑'},
  gear:   {name:'착륙기어 내리기',concept:'명령 실행', ico:'🦵'},
  land:   {name:'착륙!',         concept:'실행(run)', ico:'🛬'},
  // 반복용
  warp:   {name:'워프 점프',     concept:'반복할 명령', ico:'🌀'},
  shield: {name:'방어막 켜기',   concept:'반복할 명령', ico:'🛡️'},
  scan:   {name:'우주 스캔',     concept:'반복할 명령', ico:'📡'},
  // 조건용
  dodge:  {name:'회피 기동',     concept:'조건 참일 때 행동', ico:'↩️'},
  attack: {name:'레이저 발사',   concept:'조건 참일 때 행동', ico:'🔫'},
  cruise: {name:'항해 계속',     concept:'조건 거짓일 때 행동', ico:'🛰️'},
  brake:  {name:'급정거',        concept:'조건 참일 때 행동', ico:'🅿️'},
  // 변수용
  fuelInit:{name:'연료통 = 0',   concept:'변수 초기화', ico:'📦'},
  fuelP:  {name:'연료 +1',       concept:'변수 증가', ico:'➕'},
  fuelM:  {name:'연료 -1',       concept:'변수 감소', ico:'➖'},
  charge: {name:'연료 충전',     concept:'반복할 명령', ico:'⛽'},
  // 함정들 (게임 중엔 평범, 내용으로 판단)
  ramen:  {name:'라면 끓이기',   concept:'불필요한 명령', ico:'🍜', trap:true},
  dance:  {name:'춤추기',        concept:'불필요한 명령', ico:'💃', trap:true},
  nap:    {name:'낮잠 자기',     concept:'불필요한 명령', ico:'😴', trap:true},
  game:   {name:'게임하기',      concept:'불필요한 명령', ico:'🎮', trap:true},
  fast:   {name:'속도 올리기',   concept:'반대 명령', ico:'💨', trap:true},
  selfie: {name:'셀카 찍기',     concept:'불필요한 명령', ico:'🤳', trap:true},
};

// ============================================
// 개념 1: 순차 (type: 'seq')
// ============================================
export const SEQ_STAGES = [
  { name:'STAGE 1 · 첫 출항', comms:'우주선을 처음 출발시켜 봐요. 엔진을 켜고 → 부스터를 켜고 → 출발! 순서대로 명령을 넣으세요.',
    answer:['engine','booster','go'], palette:['engine','booster','go'], hint:'엔진 → 부스터 → 출발!', era:'⚡ 발사 성공! ⚡' },
  { name:'STAGE 2 · 안전 점검', comms:'출발 전 안전벨트부터! 안전벨트 → 엔진 → 출발! "출발"은 항상 마지막이에요.',
    answer:['belt','engine','go'], palette:['belt','engine','go'], hint:'안전벨트 먼저! 출발은 마지막.', era:'⚡ 안전 출발! ⚡' },
  { name:'STAGE 3 · 좌표 입력', comms:'조선시대로 가려면 좌표 입력! 좌표 → 엔진 → 부스터 → 출발! 4개 순서대로.',
    answer:['coord','engine','booster','go'], palette:['coord','engine','booster','go'], hint:'좌표 먼저, 엔진→부스터→출발!', era:'⚡ 좌표 도착! ⚡' },
  { name:'STAGE 4 · 완벽 준비', comms:'완전 준비 출항! 안전벨트 → 좌표 → 엔진 → 부스터 → 출발! 5개예요.',
    answer:['belt','coord','engine','booster','go'], palette:['belt','coord','engine','booster','go'], hint:'안전벨트→좌표→엔진→부스터→출발!', era:'⚡ 완벽한 출항! ⚡' },
  { name:'STAGE 5 · 함정 등장!', comms:'⚠️ 팔레트에 상관없는 명령이 섞여 있어요. 필요한 것만! (다 쓸 필요 없어요)',
    answer:['engine','booster','go'], palette:['engine','ramen','booster','go'], hint:'라면 끓이기는 빼세요! 엔진→부스터→출발.', era:'⚡ 함정 통과! ⚡' },
  { name:'STAGE 6 · 함정 2개!', comms:'⚠️ 엉뚱한 명령 2개! 좌표 → 엔진 → 부스터 → 출발! 필요한 것만 골라요.',
    answer:['coord','engine','booster','go'], palette:['dance','coord','engine','nap','booster','go'], hint:'춤추기, 낮잠 자기는 빼세요!', era:'⚡ 함정 돌파! ⚡' },
  { name:'STAGE 7 · 착륙은 반대로!', comms:'조선시대 착륙! 착륙은 출발의 반대. 속도 줄이기 → 착륙기어 → 착륙! "속도 올리기"는 함정.',
    answer:['slow','gear','land'], palette:['fast','slow','gear','land'], hint:'착륙은 속도를 줄여야죠! 속도줄이기→기어→착륙.', era:'🏯 조선시대 착륙! 🏯', landing:true },
  { name:'STAGE 8 · 최종 임무!', comms:'🌟 보스! 조선시대 왕복 임무. 안전벨트 → 좌표 → 엔진 → 부스터 → 출발! 함정 2개 조심!',
    answer:['belt','coord','engine','booster','go'], palette:['belt','ramen','coord','engine','game','booster','go'], hint:'라면, 게임하기는 함정!', era:'🏆 임무 완수! 🏆' },
];
export const SEQ_QUIZ = [
  { q:'코드(명령)는 어느 방향으로 실행될까요?', opts:['위 → 아래로 차례차례','아래 → 위로','마음대로 섞여서'], answer:0 },
  { q:'"출발!" 명령은 보통 몇 번째에 올까요?', opts:['맨 처음','중간','맨 마지막'], answer:2 },
  { q:'팔레트의 모든 블록을 꼭 다 써야 할까요?', opts:['네, 전부','아니요, 필요한 것만'], answer:1 },
];

// ============================================
// 개념 2: 반복 (type: 'loop') - 중첩블록
// loopTimes: 반복 횟수, loopBody: 반복 안에 들어갈 정답 명령들
// outerAnswer: 반복 밖 명령(있으면), expectedTotal: 최종 실행 결과 체크
// 정답 판정: 반복 블록 안의 명령 순서 + 횟수 + 밖의 명령
// ============================================
export const LOOP_STAGES = [
  { name:'STAGE 1 · 워프 3번', comms:'먼 우주로! 워프 점프를 3번 해야 해요. "3번 반복하기" 블록 안에 [워프 점프]를 넣으세요. 한 번만 넣어도 3번 실행돼요!',
    loopTimes:3, loopBody:['warp'], outer:[], palette:['warp'], needLoop:true, hint:'3번 반복하기 블록을 만들고, 그 안에 워프 점프를 넣어요.', era:'🌀 워프 성공! 🌀' },
  { name:'STAGE 2 · 방어막 4번', comms:'운석 지대 통과! 방어막을 4번 켜야 해요. "4번 반복하기" 안에 [방어막 켜기]를 넣으세요.',
    loopTimes:4, loopBody:['shield'], outer:[], palette:['shield'], needLoop:true, hint:'4번 반복 안에 방어막 켜기!', era:'🛡️ 운석 통과! 🛡️' },
  { name:'STAGE 3 · 스캔과 워프', comms:'반복 안에 명령 2개! "3번 반복하기" 안에 [우주 스캔] → [워프 점프] 순서로 넣으세요.',
    loopTimes:3, loopBody:['scan','warp'], outer:[], palette:['scan','warp'], needLoop:true, hint:'반복 안에 스캔 먼저, 워프 다음!', era:'🌀 탐사 완료! 🌀' },
  { name:'STAGE 4 · 준비 후 반복', comms:'먼저 엔진을 켜고(반복 밖), 그 다음 워프를 3번(반복 안)! 반복 밖에 [엔진 켜기], 반복 안에 [워프 점프].',
    loopTimes:3, loopBody:['warp'], outer:['engine'], palette:['engine','warp'], needLoop:true, outerFirst:true, hint:'엔진은 반복 밖에 먼저! 워프는 반복 안에 3번.', era:'🌀 장거리 워프! 🌀' },
  { name:'STAGE 5 · 함정 등장!', comms:'⚠️ 엉뚱한 명령이 섞였어요. 5번 반복 안에 [워프 점프]만! 다른 건 빼세요.',
    loopTimes:5, loopBody:['warp'], outer:[], palette:['warp','dance'], needLoop:true, hint:'춤추기는 빼고, 워프 점프만 5번 반복!', era:'🌀 함정 통과! 🌀' },
  { name:'STAGE 6 · 정확히 5번', comms:'반복 횟수가 중요해요! 방어막을 정확히 5번. "5번 반복하기" 안에 [방어막 켜기].',
    loopTimes:5, loopBody:['shield'], outer:[], palette:['shield','nap'], needLoop:true, hint:'낮잠은 빼고, 방어막 5번 반복!', era:'🛡️ 완벽 방어! 🛡️' },
  { name:'STAGE 7 · 3개 명령 반복', comms:'반복 안에 명령 3개! "2번 반복하기" 안에 [우주 스캔] → [방어막 켜기] → [워프 점프] 순서로.',
    loopTimes:2, loopBody:['scan','shield','warp'], outer:[], palette:['scan','shield','warp','selfie'], needLoop:true, hint:'셀카는 빼고! 스캔→방어막→워프 순서로 2번 반복.', era:'🌀 정밀 항해! 🌀' },
  { name:'STAGE 8 · 최종 임무!', comms:'🌟 보스! 엔진 켜고(밖) → 4번 반복[스캔→워프](안). 함정 조심!',
    loopTimes:4, loopBody:['scan','warp'], outer:['engine'], palette:['engine','scan','warp','game'], needLoop:true, outerFirst:true, hint:'게임하기는 함정! 엔진(밖) 먼저, 반복 안엔 스캔→워프.', era:'🏆 임무 완수! 🏆' },
];
export const LOOP_QUIZ = [
  { q:'같은 일을 여러 번 할 때 가장 좋은 방법은?', opts:['똑같은 명령을 여러 번 쓴다','반복 블록을 쓴다','한 번만 쓴다'], answer:1 },
  { q:'"3번 반복하기" 안에 [점프]를 1개 넣으면 점프는 몇 번?', opts:['1번','3번','0번'], answer:1 },
  { q:'반복 블록 안의 명령 순서는 중요할까요?', opts:['네, 순서대로 실행돼요','아니요, 상관없어요'], answer:0 },
];

// ============================================
// 개념 3: 조건 (type: 'cond') - 만약~라면~아니면
// scenarios: 여러 상황 [{situation, condition(t/f), correctAction}]
// ifThen/ifElse: 플레이어가 채울 슬롯. condition 참이면 then, 거짓이면 else 실행
// ============================================
export const COND_STAGES = [
  { name:'STAGE 1 · 적을 만나면', comms:'적 우주선을 만나면 회피해야 해요! "만약 [적이 보이면] → 회피 기동" 을 만드세요.',
    actions:['dodge','cruise'], thenAns:'dodge', elseAns:'cruise',
    scenarios:[{sit:'적 우주선 발견!',cond:true},{sit:'텅 빈 우주...',cond:false},{sit:'또 적이다!',cond:true}],
    hint:'적이 보이면 회피, 아니면 항해 계속!', era:'↩️ 회피 성공! ↩️' },
  { name:'STAGE 2 · 회피 또는 항해', comms:'만약 적이 보이면 → 회피, 아니면 → 항해 계속! 두 슬롯을 다 채우세요.',
    actions:['dodge','cruise'], thenAns:'dodge', elseAns:'cruise',
    scenarios:[{sit:'안개 속, 아무것도 없음',cond:false},{sit:'적 함대 출현!',cond:true},{sit:'평화로운 우주',cond:false}],
    hint:'적O→회피, 적X→항해 계속.', era:'🛰️ 안전 항해! 🛰️' },
  { name:'STAGE 3 · 3연속 판단', comms:'3가지 상황이 와요. 적이 보이면 레이저 발사, 아니면 항해 계속!',
    actions:['attack','cruise'], thenAns:'attack', elseAns:'cruise',
    scenarios:[{sit:'적 발견!',cond:true},{sit:'빈 공간',cond:false},{sit:'적 발견!',cond:true}],
    hint:'적이 보이면 레이저, 아니면 항해.', era:'🔫 격퇴 완료! 🔫' },
  { name:'STAGE 4 · 위험할 때만 급정거', comms:'조심! 장애물이 있으면 급정거, 없으면 항해 계속! 슬롯을 맞게 채우세요.',
    actions:['brake','cruise'], thenAns:'brake', elseAns:'cruise',
    scenarios:[{sit:'앞에 운석!',cond:true},{sit:'길이 뚫렸다',cond:false},{sit:'또 운석!',cond:true}],
    hint:'운석O→급정거, 운석X→항해.', era:'🅿️ 충돌 회피! 🅿️' },
  { name:'STAGE 5 · 함정 행동', comms:'⚠️ 팔레트에 엉뚱한 행동이 섞였어요. 적이 보이면 회피, 아니면 항해. 함정은 빼고!',
    actions:['dodge','cruise','dance'], thenAns:'dodge', elseAns:'cruise',
    scenarios:[{sit:'적 발견!',cond:true},{sit:'빈 우주',cond:false},{sit:'적 발견!',cond:true}],
    hint:'춤추기는 함정! 적O→회피, 적X→항해.', era:'↩️ 함정 통과! ↩️' },
  { name:'STAGE 6 · 레이저 판단', comms:'적이 보이면 레이저 발사, 아니면 항해 계속! 4가지 상황을 통과하세요.',
    actions:['attack','cruise','nap'], thenAns:'attack', elseAns:'cruise',
    scenarios:[{sit:'적!',cond:true},{sit:'빈 공간',cond:false},{sit:'적!',cond:true},{sit:'평화',cond:false}],
    hint:'낮잠은 함정! 적O→레이저, 적X→항해.', era:'🔫 4연속 성공! 🔫' },
  { name:'STAGE 7 · 정확한 대응', comms:'운석이 있으면 급정거, 없으면 항해. 함정 조심하고 5가지 상황 통과!',
    actions:['brake','cruise','game'], thenAns:'brake', elseAns:'cruise',
    scenarios:[{sit:'운석!',cond:true},{sit:'뻥 뚫림',cond:false},{sit:'운석!',cond:true},{sit:'운석!',cond:true},{sit:'안전',cond:false}],
    hint:'게임하기는 함정! 운석O→급정거.', era:'🅿️ 완벽 회피! 🅿️' },
  { name:'STAGE 8 · 최종 임무!', comms:'🌟 보스! 적이 보이면 레이저, 아니면 항해. 6가지 상황 완벽 대응! 함정 조심!',
    actions:['attack','cruise','selfie'], thenAns:'attack', elseAns:'cruise',
    scenarios:[{sit:'적!',cond:true},{sit:'빈 공간',cond:false},{sit:'적!',cond:true},{sit:'적!',cond:true},{sit:'평화',cond:false},{sit:'적!',cond:true}],
    hint:'셀카는 함정! 적O→레이저, 적X→항해.', era:'🏆 임무 완수! 🏆' },
];
export const COND_QUIZ = [
  { q:'상황에 따라 다르게 행동하게 하는 것은?', opts:['순서대로만 실행','조건(만약~라면)','무조건 반복'], answer:1 },
  { q:'"만약 적이 보이면 회피, 아니면 항해"에서 적이 없으면?', opts:['회피한다','항해한다','멈춘다'], answer:1 },
  { q:'조건문은 코드를 어떻게 만들어줄까요?', opts:['더 똑똑하게(상황 판단)','더 느리게','더 짧게만'], answer:0 },
];

// ============================================
// 개념 4: 변수 (type: 'var') - 게이지 관리
// target: 목표 연료값, needInit: 초기화 필요 여부
// 정답: 블록들을 실행했을 때 연료가 target과 같아야 + 초기화 먼저
// ============================================
export const VAR_STAGES = [
  { name:'STAGE 1 · 연료통 만들기', comms:'연료통(변수)을 만들어요! [연료통 = 0]으로 시작한 뒤 [연료 +1]을 3번 넣어 연료를 3으로 만드세요.',
    target:3, needInit:true, palette:['fuelInit','fuelP'], hint:'연료통=0 먼저! 그다음 연료+1을 3번.', era:'📦 연료 3! 📦' },
  { name:'STAGE 2 · 연료 5 채우기', comms:'연료를 5까지! [연료통 = 0] 후 [연료 +1]을 5번 넣으세요.',
    target:5, needInit:true, palette:['fuelInit','fuelP'], hint:'연료통=0, 그다음 +1을 5번!', era:'📦 연료 5! 📦' },
  { name:'STAGE 3 · 너무 넣었다!', comms:'연료를 2로 맞춰요. +1을 넣다가 많으면 [연료 -1]로 빼면 돼요! 연료통=0 후 정확히 2로.',
    target:2, needInit:true, palette:['fuelInit','fuelP','fuelM'], hint:'연료통=0 후 +1 두 번. (많이 넣었으면 -1로 빼기)', era:'📦 연료 2! 📦' },
  { name:'STAGE 4 · 초기화를 잊지마!', comms:'⚠️ 연료통을 안 만들고 +1만 하면 폭발해요! 꼭 [연료통 = 0]을 먼저! 목표는 4.',
    target:4, needInit:true, palette:['fuelInit','fuelP'], strictInit:true, hint:'반드시 연료통=0 먼저! 그다음 +1을 4번.', era:'📦 연료 4! 📦' },
  { name:'STAGE 5 · 반복으로 충전', comms:'반복으로 편하게! [연료통 = 0] 후, "3번 반복하기" 안에 [연료 충전](=+1)을 넣어 연료 3 만들기.',
    target:3, needInit:true, useLoop:true, loopTimes:3, loopBody:['charge'], outer:['fuelInit'], palette:['fuelInit','charge'], hint:'연료통=0(밖) 후, 3번 반복 안에 연료 충전!', era:'⛽ 자동 충전! ⛽' },
  { name:'STAGE 6 · 6까지 자동충전', comms:'연료 6을 반복으로! [연료통 = 0] 후 "6번 반복하기" 안에 [연료 충전].',
    target:6, needInit:true, useLoop:true, loopTimes:6, loopBody:['charge'], outer:['fuelInit'], palette:['fuelInit','charge','nap'], hint:'낮잠은 함정! 연료통=0 후 6번 반복 충전.', era:'⛽ 풀충전! ⛽' },
  { name:'STAGE 7 · 정확히 맞추기', comms:'연료를 정확히 4로! 반복(3번 충전) 후 +1 한 번 더하면 4. 연료통=0 → 3번반복[충전] → +1.',
    target:4, needInit:true, useLoop:true, loopTimes:3, loopBody:['charge'], outer:['fuelInit','fuelP'], outerAfter:true, palette:['fuelInit','charge','fuelP'], hint:'연료통=0 후 3번 반복 충전, 마지막에 +1 한 번!', era:'📦 정밀 충전! 📦' },
  { name:'STAGE 8 · 최종 임무!', comms:'🌟 보스! 연료 5를 만들어 귀환! 연료통=0 후 5번 반복 충전. 함정 조심!',
    target:5, needInit:true, useLoop:true, loopTimes:5, loopBody:['charge'], outer:['fuelInit'], palette:['fuelInit','charge','game'], hint:'게임하기는 함정! 연료통=0 후 5번 반복 충전.', era:'🏆 귀환 성공! 🏆' },
];
export const VAR_QUIZ = [
  { q:'값을 담아두는 상자를 코딩에서 뭐라고 할까요?', opts:['반복','변수','조건'], answer:1 },
  { q:'연료통을 만들 때 가장 먼저 해야 할 일은?', opts:['연료통 = 0 (초기화)','바로 +1','아무거나'], answer:0 },
  { q:'변수로 할 수 있는 것은?', opts:['점수·체력·연료 등을 저장','화면 색칠만','소리내기만'], answer:0 },
];

// ============================================
// 개념 메타데이터
// ============================================
export const CONCEPTS = [
  { id:'seq',  type:'seq',  title:'순차',   subtitle:'順次 · 차례차례', ico:'🚀', color:'#18e0ff',
    desc:'명령을 순서대로!', stages:SEQ_STAGES, quiz:SEQ_QUIZ,
    masterLesson:'코드는 위에서 아래로 순서대로 실행돼요. 모든 코딩의 첫걸음이에요!' },
  { id:'loop', type:'loop', title:'반복',   subtitle:'反復 · 빙글빙글', ico:'🌀', color:'#b45cff',
    desc:'같은 일을 여러 번!', stages:LOOP_STAGES, quiz:LOOP_QUIZ,
    masterLesson:'반복(루프)은 같은 일을 여러 번 할 때 써요. 100번이든 1000번이든 한 번만 쓰면 돼요!' },
  { id:'cond', type:'cond', title:'조건',   subtitle:'條件 · 만약에', ico:'❓', color:'#ffd23f',
    desc:'상황에 따라 다르게!', stages:COND_STAGES, quiz:COND_QUIZ,
    masterLesson:'조건문(만약~라면)은 상황에 따라 다른 행동을 하게 해줘요. 코드가 똑똑해지는 비결!' },
  { id:'var',  type:'var',  title:'변수',   subtitle:'變數 · 연료통', ico:'📦', color:'#3affa3',
    desc:'값을 담는 상자!', stages:VAR_STAGES, quiz:VAR_QUIZ,
    masterLesson:'변수는 값을 담는 상자예요. 점수, 체력, 연료… 모두 변수로 관리해요!' },
];
