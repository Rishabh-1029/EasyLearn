import { MODELS } from "./modelConfig.js";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unavailable";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit > 1 ? 1 : 0)} ${units[unit]}`;
}

function formatLatency(milliseconds) {
  if (!Number.isFinite(milliseconds)) return "—";
  return milliseconds < 1000
    ? `${Math.round(milliseconds)} ms`
    : `${(milliseconds / 1000).toFixed(1)} s`;
}

function formatCallTime(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Recent"
    : date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export default function ModelsPage({
  model,
  setModel,
  error,
  opsData,
  loadedModel,
  gpuStatus,
  storageEstimate,
  levels,
  cachedModels,
  loading,
  modelProgress,
  modelProgressPercent,
  setActivePage,
  handleModelDownload,
  clearInferenceLog,
  formatCount,
}) {
  return (
    <section className="models-page" aria-labelledby="models-heading">
      <div className="ops-hero">
        <div className="models-intro">
          <span className="eyebrow">LOCAL MODEL OPERATIONS</span>
          <h1 id="models-heading">Model operations</h1>
          <p>
            See which model is ready, what resources the browser is using,
            and how each local inference request is configured.
          </p>
        </div>
        <span className="runtime-pill">
          <i /> Inference runs in this browser
        </span>
      </div>
      {error && (
        <p className="error-notice model-error" role="alert">
          {error}
        </p>
      )}

      <div className="ops-metrics">
        <article className="ops-metric">
          <span>LOCAL INFERENCE CALLS</span>
          <strong>{formatCount(opsData.totals.calls)}</strong>
          <small>
            {formatCount(opsData.totals.succeeded)} succeeded ·{" "}
            {formatCount(opsData.totals.failed)} failed
          </small>
        </article>
        <article className="ops-metric">
          <span>OUTPUT TOKENS</span>
          <strong>{formatCount(opsData.totals.outputTokens)}</strong>
          <small>Measured when available; otherwise estimated</small>
        </article>
        <article className="ops-metric">
          <span>ACTIVE MODEL</span>
          <strong>
            {loadedModel
              ? Object.values(MODELS).find(
                  (entry) => entry.id === loadedModel,
                )?.label || "Loaded"
              : "None"}
          </strong>
          <small>
            {loadedModel
              ? "Loaded in the browser worker"
              : "Choose and prepare a model below"}
          </small>
        </article>
        <article className="ops-metric">
          <span>HOSTED LLM API CALLS</span>
          <strong>0</strong>
          <small>Model files are fetched separately when needed</small>
        </article>
      </div>

      <section
        className="ops-panel request-contract"
        aria-labelledby="request-contract-title"
      >
        <div className="ops-panel-heading">
          <div>
            <span className="eyebrow">REQUEST TRANSPARENCY</span>
            <h2 id="request-contract-title">What happens when you ask?</h2>
          </div>
          <span className="local-badge">No hosted inference</span>
        </div>
        <div className="request-flow">
          <div>
            <span>01</span>
            <strong>Selected depth prompt</strong>
            <small>Quick, Guided, or Deep dive system prompt</small>
          </div>
          <b aria-hidden="true">+</b>
          <div>
            <span>02</span>
            <strong>Current question</strong>
            <small>Only this question is sent to the model</small>
          </div>
          <b aria-hidden="true">→</b>
          <div>
            <span>03</span>
            <strong>Local generation</strong>
            <small>WebLLM worker using WebGPU</small>
          </div>
        </div>
        <p className="request-footnote">
          Previous chat turns are not included. The browser downloads model
          weights on first use and caches them for later sessions; inference
          runs locally after the model is ready.
        </p>
      </section>

      <div className="ops-columns">
        <section
          className="ops-panel resource-panel"
          aria-labelledby="resource-title"
        >
          <div className="ops-panel-heading">
            <div>
              <span className="eyebrow">DEVICE & STORAGE</span>
              <h2 id="resource-title">Runtime resources</h2>
            </div>
          </div>
          <div className="resource-row">
            <span>Graphics runtime</span>
            <strong
              className={
                gpuStatus.available === null
                  ? ""
                  : gpuStatus.available
                    ? "status-good"
                    : "status-bad"
              }
            >
              {gpuStatus.available === null
                ? "Checking…"
                : gpuStatus.available
                  ? "WebGPU adapter available"
                  : "WebGPU unavailable"}
            </strong>
          </div>
          <div className="resource-row">
            <span>Inference engine</span>
            <strong>WebLLM · browser worker</strong>
          </div>
          <div className="resource-row">
            <span>Site storage used</span>
            <strong>{formatBytes(storageEstimate?.usage)}</strong>
          </div>
          <div className="resource-row">
            <span>Browser storage quota</span>
            <strong>{formatBytes(storageEstimate?.quota)}</strong>
          </div>
          {Number.isFinite(storageEstimate?.usage) &&
            Number.isFinite(storageEstimate?.quota) &&
            storageEstimate.quota > 0 && (
              <div className="storage-meter">
                <span
                  style={{
                    width: `${Math.min(100, (storageEstimate.usage / storageEstimate.quota) * 100)}%`,
                  }}
                />
              </div>
            )}
          <p className="panel-footnote">
            Storage figures cover this site’s browser data, not just model
            files. GPU memory is not exposed consistently by browsers;
            per-model memory figures below are approximate requirements.
          </p>
        </section>

        <section
          className="ops-panel level-usage-panel"
          aria-labelledby="level-usage-title"
        >
          <div className="ops-panel-heading">
            <div>
              <span className="eyebrow">PROMPT USAGE</span>
              <h2 id="level-usage-title">Calls by learning depth</h2>
            </div>
          </div>
          {levels.map((entry) => {
            const count = opsData.byLevel[entry.id]?.calls || 0;
            const max = Math.max(
              1,
              ...levels.map((item) => opsData.byLevel[item.id]?.calls || 0),
            );
            return (
              <div className="level-usage-row" key={entry.id}>
                <div>
                  <strong>{entry.title}</strong>
                  <span>{formatCount(count)} calls</span>
                </div>
                <div className="usage-track">
                  <span style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
          <p className="panel-footnote">
            Approx. {formatCount(opsData.totals.inputTokens)} input tokens ·{" "}
            {formatCount(opsData.totals.outputTokens)} output tokens
            recorded in this browser.
          </p>
        </section>
      </div>

      <section
        className="ops-section"
        aria-labelledby="model-inventory-title"
      >
        <div className="ops-section-heading">
          <div>
            <span className="eyebrow">MODEL INVENTORY</span>
            <h2 id="model-inventory-title">Available on-device models</h2>
          </div>
          <p>
            Choose a model to download, load, or start learning with it.
          </p>
        </div>
        <div className="model-grid">
          {Object.entries(MODELS).map(([key, info]) => {
            const isLoaded = loadedModel === info.id;
            const isCached = cachedModels[key];
            const usage = opsData.byModel[key] || {
              calls: 0,
              outputTokens: 0,
            };
            return (
              <article
                className={`model-card ${model === key ? "selected" : ""}`}
                key={key}
              >
                <div className="model-card-top">
                  <span className="model-chip">4-bit · local</span>
                  <span
                    className={`cache-state ${isLoaded ? "ready" : isCached ? "cached" : ""}`}
                  >
                    {isLoaded
                      ? "Loaded"
                      : isCached
                        ? "Cached"
                        : "Not downloaded"}
                  </span>
                </div>
                <h3>{info.label}</h3>
                <p>{info.description}</p>
                <dl className="model-facts">
                  <div>
                    <dt>Model ID</dt>
                    <dd>{info.id}</dd>
                  </div>
                  <div>
                    <dt>Approx. GPU memory</dt>
                    <dd>{info.memory}</dd>
                  </div>
                  <div>
                    <dt>Local calls</dt>
                    <dd>{formatCount(usage.calls)}</dd>
                  </div>
                  <div>
                    <dt>Output tokens</dt>
                    <dd>{formatCount(usage.outputTokens)}</dd>
                  </div>
                </dl>
                <button
                  className="model-action"
                  disabled={loading || gpuStatus.available === false}
                  onClick={() =>
                    isLoaded
                      ? (setModel(key), setActivePage("learn"))
                      : handleModelDownload(key)
                  }
                >
                  {loading && model === key
                    ? modelProgress || "Preparing…"
                    : isLoaded
                      ? "Use this model"
                      : isCached
                        ? "Load from browser cache"
                        : "Download and prepare"}
                </button>
                {loading && model === key && (
                  <progress
                    className="model-progress"
                    max="100"
                    value={modelProgressPercent}
                    aria-label={`Model preparation progress: ${modelProgressPercent}%`}
                  />
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="ops-panel calls-panel"
        aria-labelledby="recent-calls-title"
      >
        <div className="ops-panel-heading">
          <div>
            <span className="eyebrow">LOCAL REQUEST LOG</span>
            <h2 id="recent-calls-title">Recent inference calls</h2>
          </div>
          <button
            className="clear-log-button"
            disabled={!opsData.recent.length}
            onClick={clearInferenceLog}
          >
            Clear local log
          </button>
        </div>
        {opsData.recent.length ? (
          <div className="calls-table-wrap">
            <table className="calls-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Model / depth</th>
                  <th>Time</th>
                  <th>Generation latency</th>
                  <th>Input / output tokens</th>
                </tr>
              </thead>
              <tbody>
                {opsData.recent.map((call) => (
                  <tr key={call.id}>
                    <td>
                      <span className={`call-status ${call.status}`}>
                        {call.status === "success" ? "Succeeded" : "Failed"}
                      </span>
                      {call.errorName && <small>{call.errorName}</small>}
                    </td>
                    <td>
                      <strong>{call.modelLabel}</strong>
                      <small>
                        {levels.find((entry) => entry.id === call.level)
                          ?.title || call.level}{" "}
                        · {call.operation}
                      </small>
                    </td>
                    <td>{formatCallTime(call.timestamp)}</td>
                    <td>{formatLatency(call.latencyMs)}</td>
                    <td>
                      {call.tokenCountsEstimated ? "≈" : ""}
                      {formatCount(call.inputTokens)} /{" "}
                      {call.tokenCountsEstimated ? "≈" : ""}
                      {formatCount(call.outputTokens)}
                      <small>
                        {call.messageCount} messages · max {call.maxTokens}{" "}
                        · temp {call.temperature}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-call-log">
            <span>◎</span>
            <strong>No inference calls yet</strong>
            <p>Your first question will add a local request record here.</p>
          </div>
        )}
        <p className="panel-footnote">
          Only operational metadata is saved here. Question and response
          text are not stored in this log. History stays in this browser and
          can be cleared above.
        </p>
      </section>
    </section>
  );
}
