# 코딩 모험가 (Coding Adventurer) v1

초3 아이를 위한 역사 테마 코딩 학습 웹앱. 거북선 모험 4챕터로 코딩의 4대 기초 개념(순서·반복·조건·변수)을 익힌다.

## 구조

- **v1 거북선 모험** (활성): 임진왜란 테마, 4챕터 — 거북선 출항(순서) / 왜선 격파(반복) / 안개 갈림길(조건) / 전공 기록(변수)
- **v2 삼국 통일** (잠금): v1 완주 시 카드 표시, 콘텐츠는 추후 추가
- **v3 광개토 코드** (잠금): v2 완주 시 활성, Python 입문 예정

## 진행 상황 저장

- localStorage에 `coding-adventurer-progress` 키로 저장
- 태블릿 하나에서만 기억됨 (다른 기기에선 처음부터)

## 관리자 쿨릭

메인 화면 **나침반 아이콘 또는 "코딩 모험가" 제목을 2초 안에 5번 빠르게 탭** 하면 관리자 모드 발동:
- 전체 잠금 상태: 모든 챕터·단계 강제 해금
- 전체 완료 상태: 진행 초기화

## 로컬 실행

```bash
cd coding-adventurer
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 빌드

```bash
npm run build
```

`dist/` 폴더가 생성됨. 이걸 그대로 Netlify에 배포하면 됨.

## Netlify 배포 방법 (greatseokju@gmail.com 계정)

**방법 1: 드래그앤드롭 (제일 쉬움)**
1. https://app.netlify.com 로그인 (greatseokju@gmail.com)
2. "Add new site" → "Deploy manually"
3. `dist/` 폴더를 드래그앤드롭
4. 배포 완료 → URL 받음

**방법 2: GitHub 연동 (자동 배포)**
1. GitHub에 이 폴더 push
2. Netlify → "Add new site" → "Import from Git"
3. Build command: `npm run build`
4. Publish directory: `dist`

## 태블릿에 PWA로 설치

1. 배포된 URL을 태블릿 브라우저(크롬/사파리)로 접속
2. **iPad**: 공유 버튼 → "홈 화면에 추가"
3. **안드로이드**: 메뉴 → "앱 설치" 또는 "홈 화면에 추가"

홈 화면에 나침반 아이콘으로 설치됨. 전체화면 모드로 실행되어 일반 앱처럼 사용 가능.

## 다음 단계 (v2 작업할 때 추가할 것)

- 챕터 1~4 외 추가 챕터 (난이도 차등)
- 함수 개념
- 리스트 개념
- 블록 → 텍스트 코드 전환 미리보기
