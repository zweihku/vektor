# Vektor Chrome Extension — PRD

## 1. Overview

The Vektor is a Chrome extension that enhances the LinkedIn job browsing experience by integrating with the Vektor application running locally. It allows users to analyze job descriptions, generate cover letters, and get resume tailoring suggestions — all without leaving LinkedIn.

### Goals

- Provide one-click JD analysis while browsing LinkedIn job listings
- Enable resume-to-JD match scoring with actionable improvement suggestions
- Generate tailored cover letters directly from job postings
- Offer a kanban-style job tracking board within the extension popup
- Keep all data local — the extension communicates only with the user's localhost dev server

## 2. Architecture

```
┌──────────────────────┐       HTTP (localhost:5173)       ┌──────────────────────┐
│   Chrome Extension   │  ◄──────────────────────────────► │  Vektor App  │
│                      │                                   │  (Vite Dev Server)   │
│  - Content Script    │                                   │                      │
│  - Popup (Kanban)    │                                   │  server/api.ts       │
│  - Detail Page       │                                   │  (Vite plugin)       │
└──────────────────────┘                                   └─────────┬────────────┘
                                                                     │
                                                                     │ HTTPS
                                                                     ▼
                                                           ┌──────────────────────┐
                                                           │   Gemini API         │
                                                           │   (Google AI)        │
                                                           └──────────────────────┘
```

### Key Components

1. **Chrome Extension** — content script injected into LinkedIn pages, popup UI with kanban board, and a full detail page for analysis results.
2. **Vite Plugin API** (`server/api.ts`) — middleware registered in the Vite dev server that exposes REST endpoints on `localhost:5173/api/*`.
3. **In-Memory Store** — resumes synced from the main app's localStorage into server memory, enabling the API to access resume data without direct browser storage access.
4. **Gemini Integration** — server-side calls to Google's Gemini API for JD analysis, cover letter generation, and resume tailoring.

## 3. API Endpoints

All endpoints are served from `http://localhost:5173/api/`.

### `POST /api/sync`

Syncs resume data from the browser app to server memory.

- **Request:** `{ resumes: Resume[], currentResumeId: string }`
- **Response:** `{ ok: true }`

### `GET /api/resume`

Returns the currently selected resume.

- **Response:** `Resume` object (or 404 if not synced)

### `GET /api/resumes`

Returns all synced resumes.

- **Response:** `Resume[]`

### `POST /api/analyze-jd`

Analyzes a job description against the current (or specified) resume.

- **Request:** `{ jdText: string, resumeId?: string }`
- **Response:** `JDAnalysis` — includes match score, core requirements, ATS keywords, missing skills, and improvement suggestions.

### `POST /api/generate-cover-letter`

Generates a cover letter tailored to a job description.

- **Request:** `{ jdText: string, style?: 'formal' | 'friendly' | 'concise', language?: 'zh' | 'en', resumeId?: string }`
- **Response:** `{ coverLetter: string }`

### `POST /api/tailor-resume`

Generates specific resume customization suggestions based on JD analysis.

- **Request:** `{ jdText: string, analysis: JDAnalysis, resumeId?: string }`
- **Response:** Tailoring suggestions including summary rewrite, skills to add/emphasize, bullet modifications, and overall strategy.

## 4. Data Flow

1. **Sync:** When the user saves any change in the Vektor app, `saveToStorage()` also fires `syncToServer()`, POSTing all resumes and the current resume ID to `/api/sync`. This is fire-and-forget.
2. **Extension reads resume:** The content script or popup fetches `GET /api/resume` to get the active resume for display or analysis.
3. **JD Analysis:** The content script extracts JD text from LinkedIn and sends it to `POST /api/analyze-jd`. The server combines it with the current resume and calls Gemini, returning structured analysis.
4. **Cover Letter:** The user triggers cover letter generation from the extension UI. The request goes to `POST /api/generate-cover-letter`, and the generated text is displayed in the extension.
5. **Resume Tailoring:** After analysis, the user can request tailoring suggestions via `POST /api/tailor-resume`, receiving actionable modifications.

## 5. Chrome Extension Features

### 5.1 Content Script

- Detects LinkedIn job detail pages (`linkedin.com/jobs/view/*`)
- Extracts job description text from the page DOM
- Injects a floating action button or sidebar panel
- Provides one-click "Analyze JD" and "Generate Cover Letter" actions
- Displays match score and key insights inline

### 5.2 Popup — Kanban Board

- Opens when clicking the extension icon
- Shows a kanban-style board for tracking job applications
- Columns: Interested / Applied / Interview / Offer / Rejected
- Each card shows job title, company, match score, and date
- Drag-and-drop between columns
- Data persisted in `chrome.storage.local`

### 5.3 Detail Page

- Full-page view for detailed analysis results
- Tabs: JD Analysis, Cover Letter, Resume Tailoring
- Shows match score breakdown, missing skills, ATS keywords
- Cover letter preview with copy-to-clipboard
- Resume tailoring suggestions with accept/reject per suggestion

## 6. Security Considerations

- **Localhost only:** The API runs exclusively on `localhost:5173`. No external network exposure.
- **No authentication:** Since the API is local-only, no auth tokens are needed. CORS is set to `*` for simplicity, but the server only binds to localhost.
- **API key protection:** The Gemini API key is stored in a `.env` file (`VITE_GEMINI_API_KEY`) and only used server-side. It is never exposed to the extension or client-side code.
- **No persistent server storage:** Resume data is held in memory only. Restarting the dev server clears all synced data; the browser app re-syncs on next save.
- **Input sanitization:** JD text from LinkedIn is passed to Gemini as-is. The server does not execute any user-provided code. Gemini output is parsed as JSON and validated before returning.
- **Extension permissions:** The extension requests minimal permissions — `activeTab` for LinkedIn pages and `storage` for kanban data. No broad host permissions required beyond `localhost`.
