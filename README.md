# EasyLearn

<p align="center">
  <img src="Frontend/my-app/src/assets/easylearn-logo.svg" alt="EasyLearn" width="280" />
</p>

EasyLearn is a browser-based learning app that explains a concept at three
depths. It runs a small language model on the learner’s device, and can save a
lesson as a Markdown file to the learner’s Google Drive.

---

## Core philosophy

Learning should be clear, adaptable, and led by the learner. EasyLearn runs
answer generation on the learner’s device by default, lets them choose how
deeply to explore a topic, and makes live web search an optional way to bring
current sources into an answer. A lesson is shared with Google Drive only when
the learner chooses to save it. The Library can list and open EasyLearn notes
saved in the app’s Drive folder.

---

## Tech stack

| Area               | Technologies                                            |
| ------------------ | ------------------------------------------------------- |
| Languages          | Python, JavaScript                                      |
| Frontend           | React                                                   |
| Local AI           | WebLLM, Web Workers, WebGPU                             |
| Backend and search | FastAPI, Pydantic, Uvicorn, `ddgs`, HTTPX, Trafilatura  |
| Google services    | Google Identity Services, Google Auth, Google Drive API |

---

## Learning modes

- **Quick** gives the core idea in a few sentences.
- **Guided** builds a clear explanation step by step.
- **Deep dive** adds more detail, an example, and a self-check.

---

## How it works

The React frontend runs [WebLLM](https://github.com/mlc-ai/web-llm) in a Web
Worker and uses WebGPU for local generation. The available models are Llama 3.2
1B, Gemma 2 2B, and Llama 3.2 3B. The selected model downloads in the browser
the first time it is used and is cached for later sessions. WebGPU support and
generation speed depend on the browser and device.

The FastAPI backend handles Google sign-in and the EasyLearn session. When a
learner enables **Web search**, EasyLearn finds relevant current sources and
uses them to inform a locally generated answer. When a learner chooses
**Save to Drive**, the
browser requests Google Drive access with the `drive.file` scope and uploads
that lesson as a Markdown file to an `EasyLearn` folder. The Library uses the
same permission to list those saved notes and open one in EasyLearn. The Drive
access token stays in browser memory; the app does not search unrelated Drive
files.

---

## Run locally

You need Python 3.10 or newer, Node.js, and a browser/device with WebGPU for
local model inference.

### 1. Configure environment files

Copy the examples:

```sh
cp Backend/.env.example Backend/.env
cp Frontend/my-app/.env.example Frontend/my-app/.env.local
```

Set the same Google OAuth **Web application** client ID in both files. In
`Backend/.env`, set `AUTH_SESSION_SECRET` to a random value of at least 32
characters. For local HTTP development, set `AUTH_COOKIE_SECURE=false` in
`Backend/.env`; keep it `true` in HTTPS deployments. The frontend API URL
defaults to `http://localhost:8000`.

To enable Drive saves, enable the Google Drive API in the OAuth client’s Google
Cloud project and add `http://localhost:5173` to its authorized JavaScript
origins. Add your deployed frontend origin there for production. The production
origin `https://easy-learn-ai.netlify.app` and local Vite origins are allowed by
default. Set `CORS_ORIGINS` in the backend environment to add any other exact
frontend origins. For the Netlify frontend and Render backend, set
`AUTH_COOKIE_SAMESITE=none` and keep `AUTH_COOKIE_SECURE=true` so the browser
will send the sign-in cookie across those sites. While the OAuth app is in
testing, add your Google account as a test user.

### 2. Start the backend

```sh
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Start the frontend

In another terminal:

```sh
cd Frontend/my-app
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Choose a
model, wait for its first download, then ask a question. Google sign-in is
optional; sign in and authorize Drive when you want to save a lesson or open
your Library.

---

## Live Web Search

Web search is optional and off by default. Turn on **Web search** in the
question composer when you want recent sources to inform an answer. EasyLearn
finds relevant passages and links the sources in its response; your selected
model generates the explanation in your browser. Search quality depends on the
sources available for your question.

---

## Environment variables

| Variable                | Where    | Purpose                                                                 |
| ----------------------- | -------- | ----------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | Frontend | Backend base URL; local default is `http://localhost:8000`.             |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | Google OAuth Web client ID used by Google Identity Services.            |
| `GOOGLE_CLIENT_ID`      | Backend  | The same client ID, used to verify sign-in credentials.                 |
| `AUTH_SESSION_SECRET`   | Backend  | Random secret of at least 32 characters for signing the session cookie. |
| `AUTH_COOKIE_SECURE`    | Backend  | `true` for HTTPS; use `false` only for local HTTP development.          |
| `AUTH_COOKIE_SAMESITE`  | Backend  | Session cookie policy; use `none` for the cross-site production setup.   |
| `CORS_ORIGINS`          | Backend  | Extra comma-separated, exact frontend origins allowed to call the API.  |

Keep `.env` and `.env.local` files private. Do not commit real credentials or
secrets. In deployment, configure these variables in the frontend and backend
hosting providers, use HTTPS, set `AUTH_COOKIE_SAMESITE=none`, and keep
`AUTH_COOKIE_SECURE=true`.

---

## Privacy and data

- Without web search, questions and answers are processed by the local model;
  they are not sent to EasyLearn’s backend for inference. The active transcript
  is saved locally in this browser’s IndexedDB. When web search is enabled,
  your question and relevant source
  content are used to inform the answer. EasyLearn does not store the question
  or retrieved content; search providers and source websites receive requests
  under their own privacy policies.
- The app keeps theme preference and model-usage metadata in browser
  `localStorage`; this metadata does not include question or answer text. The
  active conversation is saved in browser `IndexedDB` so it can be restored
  after a refresh. The saved copy is on this device and can be removed with
  **Clear conversation** in the chat.
- Google receives sign-in and Drive requests. A sign-in credential is sent to
  the backend for verification. A lesson is sent to Drive only after the
  learner chooses **Save to Drive**; Library requests read EasyLearn notes
  from the app folder. Library’s Recent topics are available locally without
  Drive; sign in and choose **Mount Google Drive** to load saved notes.
- Model files, Google sign-in assets, and fonts are fetched from their
  respective providers. Those requests can reveal ordinary connection details
  such as IP address and requested resources.
- EasyLearn does not include analytics or advertising event calls in the app
  code. Hosting providers may keep their own request logs.

For the in-app details, open **Privacy and Data** from the profile menu.

---

## Project structure

```text
Backend/main.py                    Uvicorn compatibility entry point
Backend/app/main.py                FastAPI app setup
Backend/app/api/                   Authentication and search routes
Backend/app/auth/                  Signed session-cookie helpers
Backend/app/services/              Web search, extraction, and ranking
Backend/app/config.py              Backend environment settings
Frontend/my-app/src/Home/          Main learning experience and shared styles
Frontend/my-app/src/Models/        Model configuration, runtime, worker, and UI
Frontend/my-app/src/Library/       Google Drive notes drawer and helpers
Frontend/my-app/src/Documentation/ Documentation page and query flow
Frontend/my-app/src/PrivacyData/   Privacy and data page
Frontend/my-app/src/assets/        Shared visual assets
```
