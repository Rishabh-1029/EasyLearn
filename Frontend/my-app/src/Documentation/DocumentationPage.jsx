import { useState } from "react";

const QUERY_FLOW_STEPS = [
  {
    id: "input",
    title: "Question + choices",
    label: "01",
    detail: "The browser saves the conversation transcript in local IndexedDB so it can be restored after a refresh. For each answer, only the current question and your selected learning depth and model choice configure the model request; earlier turns are not added.",
  },
  {
    id: "search",
    title: "Find candidates",
    label: "02",
    detail: "When Web search is on, the browser sends the question to EasyLearn’s backend. The backend asks DuckDuckGo Search (DDGS) for up to five candidate pages. When search is off, this branch is skipped.",
  },
  {
    id: "rank",
    title: "Extract + rank",
    label: "03",
    detail: "The backend fetches accessible pages, extracts their main text, splits it into chunks, and scores each chunk by the share of question keywords it contains. It returns up to three top-ranked chunks from distinct pages; a search snippet can be used if a page cannot be read.",
  },
  {
    id: "prompt",
    title: "Assemble prompt",
    label: "04",
    detail: "EasyLearn combines the selected teaching instructions with the current question. If search is on, retrieved excerpts are added with instructions to treat them as untrusted evidence and cite them. The prompt is sent to the local model runtime.",
  },
  {
    id: "webllm",
    title: "WebLLM in a worker",
    label: "05",
    detail: "WebLLM loads the selected model and runs chat completion in a Web Worker, away from the page’s interface thread. Model files are downloaded when needed and can be reused from the browser cache.",
  },
  {
    id: "webgpu",
    title: "WebGPU computes",
    label: "06",
    detail: "WebLLM uses the browser’s WebGPU interface to dispatch model computation to a compatible GPU on this device. The model produces the answer a token at a time; memory use and speed depend on the browser and hardware.",
  },
  {
    id: "output",
    title: "Answer reaches you",
    label: "07",
    detail: "The worker returns the completion to the page. EasyLearn parses the response sections and renders the lesson and any source references in the conversation.",
  },
];

function InteractiveQueryFlow() {
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [activeStep, setActiveStep] = useState("input");
  const [saveExpanded, setSaveExpanded] = useState(false);
  const selectedStep = QUERY_FLOW_STEPS.find((step) => step.id === activeStep) || QUERY_FLOW_STEPS[0];
  const searchStep = activeStep === "search" || activeStep === "rank";

  return (
    <div className="interactive-flow">
      <div className="interactive-flow-controls">
        <div className="interactive-flow-toggle" role="group" aria-label="Choose the web search path">
          <span>Web search</span>
          <button type="button" aria-pressed={!webSearchEnabled} onClick={() => setWebSearchEnabled(false)}>Off</button>
          <button type="button" aria-pressed={webSearchEnabled} onClick={() => setWebSearchEnabled(true)}>On</button>
        </div>
        <p>{webSearchEnabled ? "The retrieval branch is active for this example." : "Search is off by default, so the question goes straight to prompt assembly."}</p>
      </div>

      <div className="query-flow-columns">
        <div className="query-flow-map" aria-label="Interactive query processing stages">
          {QUERY_FLOW_STEPS.map((step, index) => {
            const bypassed = !webSearchEnabled && (step.id === "search" || step.id === "rank");
            return (
              <div className={`query-flow-stage-wrap${bypassed ? " is-bypassed" : ""}`} key={step.id}>
                <button
                  type="button"
                  className={`query-flow-stage stage-${step.id}${activeStep === step.id ? " is-active" : ""}`}
                  aria-pressed={activeStep === step.id}
                  aria-describedby="query-flow-detail"
                  onClick={() => setActiveStep(step.id)}
                >
                  <span className="query-flow-stage-index">{step.label}</span>
                  <strong>{step.title}</strong>
                  {bypassed && <small>Skipped</small>}
                  {!bypassed && (step.id === "search" || step.id === "rank") && <small>Search branch</small>}
                </button>
                {index < QUERY_FLOW_STEPS.length - 1 && <span className="query-flow-arrow" aria-hidden="true">↓</span>}
              </div>
            );
          })}
        </div>

        <div className="query-flow-explanation">
          <section className="query-flow-detail" id="query-flow-detail" aria-live="polite" aria-atomic="true">
            <span className="query-flow-detail-index">STEP {selectedStep.label}</span>
            <div>
              <h3>{selectedStep.title}</h3>
              <p>{searchStep && !webSearchEnabled
                ? "This optional stage is bypassed while Web search is off. No search request is sent; the current question goes directly into the local prompt."
                : selectedStep.detail}</p>
            </div>
          </section>

          <div className="query-flow-save">
            <span className="query-flow-save-branch" aria-hidden="true">↳</span>
            <div className="query-flow-save-content">
              <span className="query-flow-save-label">OPTIONAL BRANCH AFTER THE ANSWER</span>
              <button type="button" className="query-flow-save-button" aria-expanded={saveExpanded} onClick={() => setSaveExpanded((expanded) => !expanded)}>
                <span aria-hidden="true">▣</span> Save to Google Drive <span aria-hidden="true">{saveExpanded ? "−" : "+"}</span>
              </button>
              {saveExpanded && (
                <div className="query-flow-save-detail">
                  <p>Only after you choose <b>Save to Drive</b>, the browser creates a Markdown note containing the question and lesson, then uploads it directly to your EasyLearn folder in Drive.</p>
                  <ol>
                    <li>Google grants a short-lived token with the <code>drive.file</code> scope.</li>
                    <li>The browser uploads the note directly to Google Drive; EasyLearn’s backend does not receive its contents.</li>
                    <li>The saved note appears in your Library and can be opened in the app.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
          <p className="query-flow-footnote">The search branch retrieves evidence; the final answer is still generated locally by your selected model.</p>
        </div>
      </div>
    </div>
  );
}

export default function DocumentationPage() {
  return (
    <section
      className="documentation-page"
      aria-labelledby="documentation-title"
    >
      <header className="docs-hero">
        <div className="docs-hero-copy">
          <span className="eyebrow">
            THE IDEAS AND TECHNOLOGY BEHIND EASY LEARN
          </span>
          <h1 id="documentation-title">Learn how EasyLearn works.</h1>
          <p>
            A practical guide to the learning modes, on-device models, and the
            path from your question to a structured explanation.
          </p>
          <span className="docs-local-pill">
            <i /> Model inference runs on your device
          </span>
        </div>
        <div className="docs-hero-visual" aria-hidden="true">
          <svg viewBox="0 0 420 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="docs-core" x1="146" y1="80" x2="277" y2="220" gradientUnits="userSpaceOnUse">
                <stop stopColor="#A8E8C6" /><stop offset="1" stopColor="#399D7D" />
              </linearGradient>
              <radialGradient id="docs-glow" cx="0" cy="0" r="1" gradientTransform="matrix(0 128 -150 0 210 150)" gradientUnits="userSpaceOnUse">
                <stop stopColor="#75CBA3" stopOpacity=".27" /><stop offset="1" stopColor="#75CBA3" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="210" cy="150" r="145" fill="url(#docs-glow)" />
            <circle cx="210" cy="150" r="102" stroke="#87C5A4" strokeOpacity=".34" strokeDasharray="3 8" />
            <path d="M72 75C130 75 135 125 180 142M240 148c50-8 64-45 107-45M233 177c27 24 43 47 79 47" stroke="#83BFA0" strokeOpacity=".68" strokeWidth="2" />
            <circle cx="210" cy="150" r="53" fill="url(#docs-core)" />
            <circle cx="210" cy="150" r="43" stroke="white" strokeOpacity=".45" />
            <path d="M192 164v-27l18 13 18-13v27" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="72" cy="75" r="8" fill="#F1C978" stroke="white" strokeWidth="3" />
            <circle cx="347" cy="103" r="8" fill="#8AB7E5" stroke="white" strokeWidth="3" />
            <circle cx="312" cy="224" r="8" fill="#B597D5" stroke="white" strokeWidth="3" />
          </svg>
          <span className="docs-visual-chip chip-question"><i>?</i> Your question</span>
          <span className="docs-visual-chip chip-model"><i>◈</i> Local model</span>
          <span className="docs-visual-chip chip-answer"><i>✓</i> Clear answer</span>
        </div>
      </header>

      <div className="docs-layout">
        <nav className="docs-toc" aria-label="Documentation contents">
          <strong>On this page</strong>
          <a href="#about-easylearn">About EasyLearn</a>
          <a href="#using-easylearn">How to use it</a>
          <a href="#learning-modes">Learning modes</a>
          <a href="#technology">Technology</a>
          <a href="#request-flow">Interactive query flow</a>
          <a href="#web-search-flow">Live web search</a>
          <a href="#data-and-limits">Data and practical limits</a>
        </nav>

        <article className="docs-content">
          <section id="about-easylearn" className="docs-section">
            <span className="docs-section-number">01 / PURPOSE</span>
            <h2>An AI tutor for curious learners</h2>
            <p>
              EasyLearn turns a question into an explanation at a depth you
              choose. It is designed to make a topic easier to approach, whether
              you want the central idea quickly or want to work through a fuller
              explanation.
            </p>
            <p>
              The current app runs an open-weight language model in your
              browser. Once a model is ready, it generates the answer on your
              device instead of sending the prompt to a hosted LLM API.
            </p>
          </section>

          <section id="using-easylearn" className="docs-section">
            <span className="docs-section-number">02 / GET STARTED</span>
            <h2>How to use EasyLearn</h2>
            <ol className="docs-steps docs-steps-visual">
              <li>
                <span className="docs-step-index">01</span>
                <div>
                  <div className="docs-step-heading"><span className="docs-step-icon docs-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="4.5" width="17" height="12" rx="2" /><path d="M8 20h8M12 16.5V20m-4.5-6 2.5-2.5 2 2 3.5-4" /></svg></span><strong>Check your device</strong></div>
                  <p>
                    Open Models to see whether your browser can use WebGPU. A
                    supported browser and enough available graphics memory are
                    needed to run a model.
                  </p>
                </div>
              </li>
              <li>
                <span className="docs-step-index">02</span>
                <div>
                  <div className="docs-step-heading"><span className="docs-step-icon docs-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M9.5 3.5v3m5-3v3m-5 11v3m5-3v3m4-11h3m-3 5h3m-17-5h3m-3 5h3" /></svg></span><strong>Choose a model</strong></div>
                  <p>
                    Pick one of the three local models. The first preparation
                    downloads its model files; the browser can reuse its cached
                    copy later.
                  </p>
                </div>
              </li>
              <li>
                <span className="docs-step-index">03</span>
                <div>
                  <div className="docs-step-heading"><span className="docs-step-icon docs-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m12 4 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4M4 16l8 4 8-4" /></svg></span><strong>Pick a learning depth</strong></div>
                  <p>
                    Choose Quick, Guided, or Deep dive beneath the conversation.
                    Each choice selects a different teaching prompt and response
                    length.
                  </p>
                </div>
              </li>
              <li>
                <span className="docs-step-index">04</span>
                <div>
                  <div className="docs-step-heading"><span className="docs-step-icon docs-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-2.5 2v-5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg></span><strong>Ask and explore</strong></div>
                  <p>
                    Type a question and press Enter or select the send icon.
                    Shift + Enter adds a new line. You can copy a response after
                    it appears.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section id="learning-modes" className="docs-section">
            <span className="docs-section-number">
              03 / THREE WAYS TO LEARN
            </span>
            <h2>What each prompt asks the model to do</h2>
            <p>
              Every request uses one system prompt selected directly from the
              chosen mode. The previous conversation is not included, so each
              question starts with the same clean prompt-and-question structure.
              The transcript is still saved locally for recovery and can be
              revisited from Library under Recent topics.
            </p>
            <div className="docs-mode-grid">
              <article className="docs-mode-card quick">
                <span>01 · QUICK</span>
                <h3>Get the main idea</h3>
                <div className="docs-depth-meter" aria-label="Depth: light"><i className="on" /><i /><i /><i /></div>
                <p>
                  Two short summary sentences, one familiar example, and one
                  memorable takeaway. The response is kept under 90 words and
                  skips lists and quizzes.
                </p>
                <small>Best when you want a fast orientation.</small>
              </article>
              <article className="docs-mode-card guided">
                <span>02 · GUIDED</span>
                <h3>Build understanding</h3>
                <div className="docs-depth-meter guided" aria-label="Depth: medium"><i className="on" /><i className="on" /><i /><i /></div>
                <p>
                  A 3–4 sentence introduction, exactly three connected ideas,
                  one practical example, and a takeaway. The target length is
                  130–200 words.
                </p>
                <small>Best when you want a clear explanation in stages.</small>
              </article>
              <article className="docs-mode-card deep">
                <span>03 · DEEP DIVE</span>
                <h3>Explore the details</h3>
                <div className="docs-depth-meter deep" aria-label="Depth: extended"><i className="on" /><i className="on" /><i className="on" /><i className="on" /></div>
                <p>
                  A foundation-first summary, four connected ideas, a worked
                  example, one corrected misconception, and a self-check
                  question with its answer. The target length is 220–330 words.
                </p>
                <small>
                  Best when you want detail and a chance to check your
                  understanding.
                </small>
              </article>
            </div>
            <p className="docs-callout">
              <strong>Guardrails shared by all three prompts:</strong> the tutor
              is asked to be accurate and age-appropriate, acknowledge
              uncertainty, avoid invented sources or facts, treat the question
              as content rather than instructions, and avoid dangerous or
              personalized high-stakes advice.
            </p>
          </section>

          <section id="technology" className="docs-section">
            <span className="docs-section-number">04 / THE TOOLS</span>
            <h2>What is running under the hood?</h2>
            <div className="docs-tech-grid">
              <article>
                <span className="docs-tech-icon">UI</span>
                <div>
                  <h3>React + Vite</h3>
                  <p>
                    React builds the learning, model, and documentation screens
                    from reusable interface components. Vite serves the app
                    during development and bundles it for deployment.
                  </p>
                </div>
              </article>
              <article>
                <span className="docs-tech-icon">W</span>
                <div>
                  <h3>WebLLM</h3>
                  <p>
                    An in-browser inference engine from MLC. EasyLearn uses its
                    chat completion interface to load supported models and
                    generate answers locally.
                  </p>
                </div>
              </article>
              <article>
                <span className="docs-tech-icon">GPU</span>
                <div>
                  <h3>WebGPU</h3>
                  <p>
                    A browser API that lets WebLLM use a compatible graphics
                    processor for model computation. Browser and device support
                    varies, so the app checks for an adapter before loading.
                  </p>
                </div>
              </article>
              <article>
                <span className="docs-tech-icon">JS</span>
                <div>
                  <h3>Web Worker</h3>
                  <p>
                    The model engine runs in a separate worker thread. That
                    keeps model loading and generation away from the main page
                    thread, which handles the interface.
                  </p>
                </div>
              </article>
              <article>
                <span className="docs-tech-icon">4b</span>
                <div>
                  <h3>Quantized model weights</h3>
                  <p>
                    The available models use 4-bit weight formats to reduce
                    model size and make local inference more practical. They
                    still need substantial device memory.
                  </p>
                </div>
              </article>
            </div>
            <div className="docs-model-list">
              <strong>Available models</strong>
              <span>
                <b>Llama 3.2 1B</b> · smallest option · approx. 1.1 GB GPU
                memory
              </span>
              <span>
                <b>Gemma 2 2B</b> · compact option · approx. 2.5 GB GPU memory
              </span>
              <span>
                <b>Llama 3.2 3B</b> · larger option · approx. 3.0 GB GPU memory
              </span>
              <small>
                These are approximate requirements shown by the app. Actual
                memory use depends on the browser, device, and other
                applications.
              </small>
            </div>
          </section>

          <section id="request-flow" className="docs-section">
            <span className="docs-section-number">
              05 / FROM QUESTION TO ANSWER
            </span>
            <h2>Follow a query through EasyLearn</h2>
            <p>Choose whether web search is on, then select a stage to see what happens there. The Save to Drive branch is separate and only starts when you choose to save.</p>
            <InteractiveQueryFlow />
          </section>

          <section id="web-search-flow" className="docs-section">
            <span className="docs-section-number">06 / LIVE WEB SEARCH</span>
            <h2>Bring current sources into a lesson</h2>
            <p>
              Web search is optional and off by default. Turn it on when you
              want EasyLearn to find current sources and use relevant passages
              to inform an answer. Your selected model then generates the
              explanation on your device.
            </p>
            <ol className="docs-steps docs-steps-visual docs-search-steps">
              <li className="search-step search-step-discover">
                <span className="docs-step-index">01</span>
                <div>
                  <div className="docs-step-heading"><span className="docs-step-icon docs-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg></span><strong>Find useful sources</strong></div>
                  <p>EasyLearn searches the web for pages that may help answer your question and selects a small set of promising sources.</p>
                </div>
              </li>
              <li className="search-step search-step-extract">
                <span className="docs-step-index">02</span>
                <div>
                  <div className="docs-step-heading"><span className="docs-step-icon docs-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M6 3.75h8l4.25 4.5v12H6z" /><path d="M14 3.75v5h4.25M9 13h6M9 16.5h6" /></svg></span><strong>Gather relevant passages</strong></div>
                  <p>EasyLearn reads the selected pages, pulls out relevant passages, and gives more weight to content that matches your question. Some sites may not be accessible.</p>
                </div>
              </li>
              <li className="search-step search-step-answer">
                <span className="docs-step-index">03</span>
                <div>
                  <div className="docs-step-heading"><span className="docs-step-icon docs-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></svg></span><strong>Generate locally with sources</strong></div>
                  <p>Your selected local model uses those passages to shape its explanation. The answer includes links so you can open the sources and read more.</p>
                </div>
              </li>
            </ol>
            <div className="privacy-data-list">
              <article>
                <strong>Your question and sources</strong>
                <p>When web search is on, your question is sent to EasyLearn’s search service and the chosen source pages are retrieved to find useful context. EasyLearn does not save the question or retrieved passages. Search providers and source websites receive requests under their own policies, and some pages may not be available or relevant.</p>
              </article>
            </div>
          </section>

          <section
            id="data-and-limits"
            className="docs-section docs-last-section"
          >
            <span className="docs-section-number">07 / TRANSPARENCY</span>
            <h2>Data and practical limits</h2>
            <div className="docs-boundary-grid">
              <div>
                <strong>What stays in the browser</strong>
                <p>
                  After the model files are available, inference runs locally;
                  questions only go to the Backend API when you enable web
                  search. The active transcript is saved in this browser’s
                  IndexedDB and is not added to the LLM operations log. Open
                  Library and choose a Recent topic to jump back to it, or use
                  Clear conversation to remove the local transcript. The
                  operations log stores metadata and can be cleared from
                  Models. If you choose Save to Drive, only that selected
                  question and answer are uploaded directly to your Google
                  Drive as a Markdown note.
                </p>
              </div>
              <div>
                <strong>What needs a connection</strong>
                <p>
                  The first model download needs internet access. EasyLearn uses
                  WebLLM’s configured model assets, and the page also loads its
                  web fonts online. Sign-in is optional; Recent topics in the
                  Library work without Drive. Sign in, then choose Mount Google
                  Drive in the Library to load saved notes. Save to Drive
                  uploads a selected lesson. Search requests go to
                  EasyLearn, external search providers, and selected websites
                  only when search is enabled. Local inference does
                  not call a hosted LLM API; note content is sent to Drive only
                  when you explicitly save it.
                </p>
              </div>
              <div>
                <strong>What to keep in mind</strong>
                <p>
                  AI can misunderstand questions, miss nuance, or format an
                  answer imperfectly. The prompts guide the response but cannot
                  guarantee correctness. Verify important information with
                  trusted sources.
                </p>
              </div>
            </div>
          </section>
        </article>
      </div>
    </section>
  );
}

