# GitHub Launch Checklist

1. Confirm `.env` files are not committed.
2. Run backend compile: `.\venv\Scripts\python.exe -m compileall app`.
3. Run frontend typecheck: `npx tsc --noEmit`.
4. Run frontend build: `npm run build`.
5. Run Playwright tests: `npm run test:e2e`.
6. Capture screenshots: `npm run screenshots`.
7. Check README images render.
8. Push to GitHub.
9. Add GitHub repo description.
10. Add GitHub topics:
    - `nextjs`
    - `fastapi`
    - `postgresql`
    - `langgraph`
    - `ai`
    - `finance`
    - `paper-trading`
    - `playwright`
    - `docker`
11. Record demo video.
12. Add project to portfolio website.
13. Add project to resume.
