// Available local model definitions.

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
