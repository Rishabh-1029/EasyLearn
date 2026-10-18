export default function PrivacyPage() {
  return (
    <section className="documentation-page privacy-page" aria-labelledby="privacy-title">
      <header className="docs-hero">
        <div className="docs-hero-copy">
          <span className="eyebrow">PRIVACY &amp; DATA</span>
          <h1 id="privacy-title">How EasyLearn handles your data.</h1>
          <p>
            EasyLearn runs its current learning experience in your browser. Here
            is what that protects, what still uses the internet, and what
            information leaves the app.
          </p>
          <span className="docs-local-pill"><i /> Learning prompts are processed locally</span>
        </div>
        <div className="docs-hero-visual privacy-hero-visual" aria-hidden="true">
          <svg viewBox="0 0 420 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="privacy-glow" cx="0" cy="0" r="1" gradientTransform="matrix(0 125 -145 0 210 150)" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7DCDA6" stopOpacity=".28" /><stop offset="1" stopColor="#7DCDA6" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="210" cy="150" r="145" fill="url(#privacy-glow)" />
            <circle cx="210" cy="150" r="104" stroke="#8BC9A7" strokeOpacity=".4" strokeDasharray="3 8" />
            <path d="M79 80c48 0 58 31 87 48m82 24c42-5 57-32 93-32M229 182c35 16 39 40 69 47" stroke="#83BFA0" strokeOpacity=".58" strokeWidth="2" />
            <path d="M210 91 266 114v43c0 36-25 62-56 78-31-16-56-42-56-78v-43l56-23Z" fill="#4AA681" />
            <path d="M210 105 253 122v34c0 27-18 48-43 63-25-15-43-36-43-63v-34l43-17Z" stroke="white" strokeOpacity=".58" strokeWidth="2" />
            <path d="m190 153 14 14 28-31" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="79" cy="80" r="8" fill="#F1C978" stroke="white" strokeWidth="3" />
            <circle cx="341" cy="120" r="8" fill="#8AB7E5" stroke="white" strokeWidth="3" />
            <circle cx="298" cy="229" r="8" fill="#B597D5" stroke="white" strokeWidth="3" />
          </svg>
          <span className="docs-visual-chip chip-question"><i>?</i> Your question</span>
          <span className="docs-visual-chip chip-model"><i>◈</i> On-device</span>
          <span className="docs-visual-chip chip-answer"><i>✓</i> Your answer</span>
        </div>
      </header>

      <div className="docs-layout">
        <nav className="docs-toc" aria-label="Privacy and data contents">
          <strong>On this page</strong>
          <a href="#privacy-summary">At a glance</a>
          <a href="#local-processing">Why on-device?</a>
          <a href="#outgoing-data">What goes out</a>
          <a href="#account-data">Google sign-in</a>
          <a href="#stored-data">What is stored</a>
          <a href="#privacy-limits">Protection and limits</a>
          <a href="#privacy-controls">Your controls</a>
        </nav>

        <article className="docs-content">
          <section id="privacy-summary" className="docs-section">
            <span className="docs-section-number">01 / THE SHORT VERSION</span>
            <h2>Learning happens in your browser</h2>
            <p>
              In the current Learn page, EasyLearn sends the selected teaching
              prompt and your current question to the on-device model. The
              model runs in a Web Worker using WebGPU. The question and answer
              are not sent to EasyLearn’s backend or a hosted LLM provider by
              this flow, and previous chat turns are not included in the next
              model request.
            </p>
            <div className="privacy-callout">
              <strong>On-device processing reduces who receives your question;</strong>
              <span> it does not make the whole website offline or guarantee absolute privacy.</span>
            </div>
            <div className="privacy-flow-diagram" role="img" aria-label="Your question is processed locally unless you enable web search, which sends it to the backend and DuckDuckGo for retrieval. Google handles sign-in, and a lesson is sent to Drive only when you save it.">
              <div className="privacy-flow-local">
                <div className="privacy-flow-title"><span className="privacy-flow-dot" /> On this device</div>
                <div className="privacy-flow-steps">
                  <div><span>?</span><strong>Your question</strong></div>
                  <b aria-hidden="true">→</b>
                  <div><span>◈</span><strong>WebLLM + WebGPU</strong></div>
                  <b aria-hidden="true">→</b>
                  <div><span>✓</span><strong>Your answer</strong></div>
                </div>
              </div>
              <div className="privacy-flow-network">
                <div className="privacy-flow-title"><span className="privacy-flow-dot network" /> Network requests</div>
                <p>Site &amp; fonts · model files · sign-in · optional web search · Drive</p>
                <small>With web search enabled, your question is sent for retrieval and answer generation stays local. The Library reads EasyLearn notes from Google Drive; saving sends a lesson there.</small>
              </div>
            </div>
          </section>

          <section id="local-processing" className="docs-section">
            <span className="docs-section-number">02 / WHY ON-DEVICE</span>
            <h2>Your device does the model work</h2>
            <div className="privacy-card-grid">
              <article>
                <span className="docs-tech-icon">01</span>
                <div><h3>Questions go to the local model</h3><p>Without web search, the current question is passed directly to the local model. When Search the web is enabled, it is sent to EasyLearn’s backend to find and retrieve sources; those excerpts are then passed to the local model. Earlier conversation turns are not added.</p></div>
              </article>
              <article>
                <span className="docs-tech-icon">02</span>
                <div><h3>Inference runs locally</h3><p>WebLLM executes the model in a browser worker using your device’s supported graphics processor. No hosted model API is needed for answers in this flow.</p></div>
              </article>
              <article>
                <span className="docs-tech-icon">03</span>
                <div><h3>Generation stays local</h3><p>The app does not send the question to a hosted model for generation. Opt-in web search sends it to EasyLearn’s backend and DuckDuckGo for retrieval; selected result sites are fetched by the backend.</p></div>
              </article>
            </div>
          </section>

          <section id="outgoing-data" className="docs-section">
            <span className="docs-section-number">03 / NETWORK DISCLOSURE</span>
            <h2>What information leaves EasyLearn?</h2>
            <p>EasyLearn makes these network requests for the site and, when selected, live search or Google Drive:</p>
            <div className="privacy-data-list">
              <article><strong>Website and fonts</strong><p>Your browser requests the app files from the site host. The stylesheet also loads fonts from Google Fonts. Those hosts receive ordinary connection details such as your IP address, browser, and requested files.</p></article>
              <article><strong>Model downloads</strong><p>When a model is not cached, WebLLM downloads its model files from the asset locations configured by WebLLM. Those requests reveal connection metadata and which assets are requested, but the model download does not include your question.</p></article>
              <article><strong>Google sign-in and Drive connection</strong><p>Google Identity Services loads from Google. If you are not signed in, the Library offers a sign-in option, while saving a note opens the profile sign-in flow; the identity credential goes to EasyLearn’s backend for verification and establishes a signed session cookie. Drive authorization then obtains a short-lived token with the <code>drive.file</code> scope and calls Google Drive directly to find or create the app folder, list its EasyLearn notes, open a selected note, or upload a note you chose to save. EasyLearn does not store that Drive token. If Google provides a profile image, the browser also loads it directly from Google.</p></article>
              <article><strong>Optional live web search</strong><p>When Search the web is enabled, EasyLearn sends your question to its backend. The backend uses the <code>ddgs</code> library with its DuckDuckGo backend, fetches selected result pages, and returns up to three relevant excerpts. The browser sends those excerpts to the local model for generation. EasyLearn does not persist the query or excerpts; DuckDuckGo and fetched sites receive requests under their own policies.</p></article>
              <article><strong>Inference stays on your device</strong><p>The Learn page runs generation in your browser. EasyLearn does not send your question or retrieved excerpts to a hosted model for generation.</p></article>
              <article><strong>Hosting and infrastructure</strong><p>Web hosting, backend hosting, and network providers may receive connection metadata when your browser contacts them. Their server logs and retention depend on the hosting configuration and provider policies.</p></article>
            </div>
            <p className="privacy-footnote">The app code currently has no separate analytics or advertising event calls. This does not prevent site, Google, CDN, or hosting infrastructure from receiving standard request metadata.</p>
          </section>

          <section id="account-data" className="docs-section">
            <span className="docs-section-number">04 / GOOGLE ACCOUNT</span>
            <h2>What sign-in does and does not do</h2>
            <p>
              You can use the learning app without signing in. If you are not
              signed in, saving a note opens the profile sign-in flow and the
              Library offers a sign-in option. Google sends an identity credential to
              the EasyLearn backend, which verifies it and issues a signed,
              HttpOnly session cookie with the account ID, name, email,
              profile image URL, and expiry. The cookie is signed, not
              encrypted; HTTPS protects it in transit when deployed with
              secure cookies. The backend does not save a user profile or
              learning history in a database.
            </p>
            <p>
              Drive access is a separate Google permission requested when you
              save a note or open the Library, using the narrow <code>drive.file</code> scope.
              The app then searches for
              or creates an “EasyLearn” folder. Use the same Google account for
              Drive that you used to sign in. The short-lived access token and
              folder ID stay in browser memory; EasyLearn does not save them.
              After a reload or token expiry, authorize Drive again. With this
              scope the app can access files created or opened with EasyLearn
              and lists the Markdown notes in its app folder. It cannot search
              every folder in Drive. A manually created
              “EasyLearn” folder may not be visible, so the app may create its
              own folder with that name.
            </p>
          </section>

          <section id="stored-data" className="docs-section">
            <span className="docs-section-number">05 / BROWSER STORAGE</span>
            <h2>What EasyLearn keeps on this device</h2>
            <div className="privacy-data-list">
              <article><strong>Model files</strong><p>WebLLM and the browser cache downloaded model assets so they can be reused. They may take substantial storage and can be removed through your browser’s site data controls.</p></article>
              <article><strong>Operations dashboard</strong><p>The Models page saves model name, learning mode, timestamps, success or failure, latency, token counts, output length, and generation settings in this browser’s localStorage. It does not save question or answer text. Use “Clear local log” on Models to remove this record.</p></article>
              <article><strong>Theme preference</strong><p>Your light or dark theme choice is stored in this browser’s localStorage.</p></article>
              <article><strong>Current conversation</strong><p>Messages are held in page memory while the page is open. The app does not persist them; refreshing or closing the page clears them.</p></article>
              <article><strong>Saved notes in your Drive</strong><p>When you choose “Save to Drive,” EasyLearn sends that question, answer, title, learning mode, model label, and save date directly from your browser to Google Drive as a Markdown file. EasyLearn’s backend does not receive or store the note. Google stores it in your Drive under the EasyLearn folder.</p></article>
            </div>
          </section>

          <section id="privacy-limits" className="docs-section">
            <span className="docs-section-number">06 / SECURITY BOUNDARIES</span>
            <h2>How your data is protected—and the limits</h2>
            <p>
              Local inference keeps the question out of the model API request
              path, and browser origin controls keep this site’s localStorage
              separate from other sites. The session cookie is HttpOnly so
              ordinary page JavaScript cannot read it. In production, serve
              the app and API over HTTPS and configure the cookie as Secure.
            </p>
            <p>
              These measures are not encryption of data on your device. Anyone
              with access to your unlocked browser profile, a malicious
              extension, compromised device, or the app’s running page may be
              able to access information available there. Model downloads,
              sign-in, and user-requested note uploads require third-party
              network services. Signing out clears the EasyLearn session and
              in-memory Drive token; it does not revoke Google’s Drive grant.
              AI answers
              can also be wrong, so avoid entering secrets or information you
              would not want processed on your device.
            </p>
          </section>

          <section id="privacy-controls" className="docs-section docs-last-section">
            <span className="docs-section-number">07 / YOUR CONTROLS</span>
            <h2>Manage your data</h2>
            <ul className="privacy-controls-list">
              <li>Clear the operations record from the Models page using <strong>Clear local log</strong>.</li>
              <li>Clear cached model files, theme preference, and other site data in your browser’s settings.</li>
              <li>Delete saved Markdown notes or the EasyLearn folder from your Google Drive.</li>
              <li>Use the profile menu to sign out and clear the EasyLearn session cookie and in-memory Drive token.</li>
              <li><a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">Revoke EasyLearn’s Google access</a> from your Google Account permissions.</li>
            </ul>
            <p className="privacy-footnote">This page describes the current application code and configured flows. Your deployed hosting, cookie settings, and third-party provider policies may affect the network and retention details.</p>
          </section>
        </article>
      </div>
    </section>
  );
}

