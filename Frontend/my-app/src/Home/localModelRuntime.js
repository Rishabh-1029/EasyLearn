import {
  CreateWebWorkerMLCEngine,
  hasModelInCache,
  prebuiltAppConfig,
} from "@mlc-ai/web-llm";

export const MODELS = {
  "llama-1b": {
    label: "Llama 3.2 1B",
    id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    memory: "~1.1 GB GPU memory",
    description: "Smallest option, intended for lower-resource devices.",
  },
  "gemma-2b": {
    label: "Gemma 2 2B",
    id: "gemma-2-2b-it-q4f32_1-MLC",
    memory: "~2.5 GB GPU memory",
    description: "A compact Gemma model for devices with more available memory.",
  },
  "llama-3b": {
    label: "Llama 3.2 3B",
    id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
    memory: "~3.0 GB GPU memory",
    description: "Larger option that may give stronger answers, with a higher device requirement.",
  },
};

let engine = null;
let worker = null;
let loadedModelId = null;
let pendingLoad = null;
let pendingModelId = null;

export async function checkWebGPU() {
  if (!globalThis.navigator?.gpu) {
    return { available: false, message: "WebGPU is not available in this browser. Try an up-to-date Chrome or Edge browser on a supported device." };
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { available: false, message: "The browser has WebGPU, but it could not find a compatible graphics adapter." };
    }
    return { available: true, message: "This browser found a WebGPU graphics adapter." };
  } catch (error) {
    return { available: false, message: error?.message || "The browser could not initialize WebGPU." };
  }
}

export async function getCachedModels() {
  const entries = await Promise.all(Object.entries(MODELS).map(async ([key, model]) => {
    try {
      return [key, await hasModelInCache(model.id, prebuiltAppConfig)];
    } catch {
      return [key, false];
    }
  }));
  return Object.fromEntries(entries);
}

export function getLoadedModelId() {
  return loadedModelId;
}

export function getModelErrorMessage(error) {
  if (typeof error === "string") return error;
  if (error?.message) return `${error.name ? `${error.name}: ` : ""}${error.message}`;
  if (error?.type === "error" && error.message) return error.message;
  try {
    const serialized = JSON.stringify(error);
    return serialized && serialized !== "{}" ? serialized : "The model failed to load or generate a response. Check WebGPU support and available device memory.";
  } catch {
    return "The model failed to load or generate a response. Check WebGPU support and available device memory.";
  }
}

export async function loadLocalModel(modelKey, onProgress = () => {}) {
  const model = MODELS[modelKey];
  if (!model) throw new Error("Choose one of the available local models.");

  const gpu = await checkWebGPU();
  if (!gpu.available) throw new Error(gpu.message);
  if (loadedModelId === model.id && engine) return engine;
  if (pendingLoad) {
    if (pendingModelId !== model.id) await pendingLoad;
    else return pendingLoad;
  }

  pendingModelId = model.id;
  pendingLoad = (async () => {
    const reportProgress = (report) => onProgress(report);
    try {
      if (!engine) {
        worker = new Worker(new URL("./model.worker.js", import.meta.url), { type: "module" });
        engine = await CreateWebWorkerMLCEngine(worker, model.id, {
          appConfig: prebuiltAppConfig,
          initProgressCallback: reportProgress,
        });
      } else {
        await engine.reload(model.id);
      }
      loadedModelId = model.id;
      return engine;
    } catch (error) {
      engine?.unload().catch(() => {});
      worker?.terminate();
      engine = null;
      worker = null;
      loadedModelId = null;
      throw error;
    } finally {
      pendingLoad = null;
      pendingModelId = null;
    }
  })();

  return pendingLoad;
}
