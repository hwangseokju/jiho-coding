import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages는 https://아이디.github.io/jiho-coding/ 하위 경로로 배포되므로
// base를 저장소 이름과 일치시켜야 화면(CSS/JS)이 깨지지 않음
export default defineConfig({
  base: '/jiho-coding/',
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
