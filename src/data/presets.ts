import type { Preset, TierRow } from "@/lib/types";
import { ITEMS } from "@/data/catalog";

export const DEFAULT_ROWS: TierRow[] = [
  { l: "S", sub: "Goated", c: "#ff6b6b", items: [] },
  { l: "A", sub: "Great", c: "#ffa94d", items: [] },
  { l: "B", sub: "Solid", c: "#ffd43b", items: [] },
  { l: "C", sub: "Fine", c: "#51cf66", items: [] },
  { l: "D", sub: "Mid", c: "#74c0fc", items: [] },
  { l: "F", sub: "Oof", c: "#b197fc", items: [] },
];

export const PRESETS: Preset[] = [
  {
    id: "models",
    title: "Top AI Models 2026",
    desc: "Frontier models & chatbots",
    items: ["gpt5", "chatgpt", "claude", "opus5", "fable5", "sonnet5", "gemini", "grok", "deepseek", "llama", "mistral", "qwen", "kimi", "glm", "perplexity", "copilot", "metaai", "poe"],
    seed: { S: ["claude"], A: ["gpt5", "gemini"], B: ["grok", "kimi"] },
  },
  {
    id: "coding",
    title: "Best AI Coding Tools",
    desc: "Agents, IDEs & vibe coders",
    items: ["ccopilot", "claudecode", "codex", "composer", "cursor", "windsurf", "opencode", "aider", "cline", "v0", "bolt", "lovable", "replit", "zed", "devin"],
    seed: { S: ["claudecode"], A: ["cursor", "ccopilot"], B: ["opencode"] },
  },
  {
    id: "image",
    title: "AI Image Generation",
    desc: "Text-to-image models & apps",
    items: ["midjourney", "flux", "sd", "ideogram", "leonardo", "recraft", "krea"],
    seed: { S: ["midjourney"], A: ["flux"], B: ["ideogram"] },
  },
  {
    id: "video-audio",
    title: "AI Video & Music",
    desc: "Generative video, music & voice",
    items: ["sora", "runway", "kling", "hailuo", "veo", "heygen", "synthesia", "elevenlabs", "suno", "udio"],
    seed: { S: ["veo"], A: ["sora", "runway"], B: ["suno"] },
  },
  {
    id: "local",
    title: "Local & Self-Hosted AI",
    desc: "Run AI on your own hardware",
    items: ["ollama", "lmstudio", "openwebui", "jan", "comfyui", "vllm", "llamacpp", "hf"],
    seed: { S: ["ollama"], A: ["lmstudio"], B: ["comfyui"] },
  },
  {
    id: "all",
    title: "All AI Tools",
    desc: "Every category in one board",
    items: Object.keys(ITEMS),
    seed: {},
  },
  {
    id: "blank",
    title: "Blank Board",
    desc: "Start empty — add your own items",
    items: [],
    seed: {},
  },
];
