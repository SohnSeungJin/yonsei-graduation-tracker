# 🎓 Yonsei Graduation Tracker

연세대학교 **경영학과(본전공) + 응용통계학과(캠퍼스내 복수전공)** 학생을 위한 졸업요건 확인 서비스입니다.
---

🌐 **배포 사이트**

https://yonsei-biz-stat-graduation-tracker.vercel.app

## 📌 프로젝트 소개

연세대학교 경영학과(본전공)와 응용통계학과(캠퍼스내 복수전공) 학생들이 졸업요건을 쉽고 직관적으로 확인할 수 있도록 제작한 웹 서비스입니다.

연세포탈에서는 졸업요건과 교차인정 과목을 한눈에 확인하기 어렵다는 점에 착안하여 개발했습니다.

학생이 직접 과목과 이수 현황을 입력하면 졸업요건 충족 여부를 자동으로 계산합니다.

---

## ✨ 주요 기능

- 학번별 졸업요건 자동 적용 (2018학번 이후 지원)
- 교기·기초교육·대학교양·RC 필수요건 확인
- 경영학과 및 응용통계학과 졸업요건 자동 계산
- 총 취득학점 자동 계산
- 일반선택 학점 자동 계산
- 3·4000단위 학점 자동 계산
- 회계원리(1), 회계원리(2) 교차인정 자동 계산
- 남은 필수요건 자동 표시
- 브라우저(Local Storage) 자동 저장

---

## 🛠 Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

### Deployment

- GitHub
- Vercel

- ---

## 🚀 Getting Started

### Install
---

## 📂 Project Structure

```
src
├── components
├── data
├── utils
├── App.tsx
├── main.tsx
└── ...
```
---

## ⚠️ Notice

- 본 서비스는 연세대학교 학생들의 편의를 위한 비공식 서비스입니다.
- 최종 졸업 가능 여부는 반드시 연세대학교 공식 졸업사정 결과를 확인하시기 바랍니다.
- 현재는 **경영학과(본전공) + 응용통계학과(캠퍼스내 복수전공)** 기준만 지원합니다.
- ---

## 👨‍💻 Developer

**손승진**

- Yonsei University
- Business Administration
- Applied Statistics (Double Major)

GitHub

https://github.com/SohnSeungJin

```bash
npm install
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```
