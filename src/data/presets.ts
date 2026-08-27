import type { Preset, TierRow } from "@/lib/types";
import { ITEMS } from "@/data/catalog";
import { DEFAULT_TIER_COLORS } from "@/lib/theme-colors";

export const DEFAULT_ROWS: TierRow[] = [
  { l: "S", sub: "", c: DEFAULT_TIER_COLORS[0], items: [] },
  { l: "A", sub: "", c: DEFAULT_TIER_COLORS[1], items: [] },
  { l: "B", sub: "", c: DEFAULT_TIER_COLORS[2], items: [] },
  { l: "C", sub: "", c: DEFAULT_TIER_COLORS[3], items: [] },
  { l: "D", sub: "", c: DEFAULT_TIER_COLORS[4], items: [] },
  { l: "F", sub: "", c: DEFAULT_TIER_COLORS[5], items: [] },
];

/** Default board — users add their own items. */
export const PRESETS: Preset[] = [
  {
    id: "blank",
    title: "Blank Board",
    desc: "Empty — upload or add your own",
    items: [],
    seed: {},
  },
];

/**
 * Old share links and saved boards still carry these ids. Kept for seed/reset
 * only — not listed in the preset picker.
 */
const LEGACY_PRESETS: Preset[] = [
  {
    id: "all",
    title: "All AI Tools",
    desc: "Full catalog",
    items: Object.keys(ITEMS),
    seed: {},
  },
  {
    id: "models",
    title: "Top AI Models 2026",
    desc: "Frontier models & chatbots",
    items: [
      "gpt5", "claude", "opus5", "fable5", "sonnet5", "gemini", "grok", "deepseek", "kimi", "glm",
      "lechat", "commandr", "novapro", "doubao", "yi",
    ],
    seed: { S: ["claude"], A: ["gpt5", "gemini"], B: ["grok", "kimi"] },
  },
  {
    id: "coding",
    title: "Best AI Coding Tools",
    desc: "Agents, IDEs & vibe coders",
    items: [
      "claudecode", "cursor", "composer", "codex", "ccopilot", "windsurf", "devin", "jules", "factory",
      "amazonq", "geminicode", "roocode", "continue", "v0", "bolt",
    ],
    seed: { S: ["claudecode"], A: ["cursor", "ccopilot"], B: ["opencode"] },
  },
  {
    id: "image",
    title: "AI Image Generation",
    desc: "Text-to-image models & apps",
    items: [
      "midjourney", "flux", "sd", "ideogram", "leonardo", "recraft", "krea", "adobefirefly", "gptimage",
      "imagen3", "playground", "canvaai", "fooocus", "magnific", "seedream",
    ],
    seed: { S: ["midjourney"], A: ["flux"], B: ["ideogram"] },
  },
  {
    id: "video-audio",
    title: "AI Video & Music",
    desc: "Generative video, music & voice",
    items: [
      "sora", "runway", "kling", "hailuo", "veo", "heygen", "synthesia", "pika", "luma", "pixverse",
      "wan", "seedance", "invideo", "descript", "filmora",
      "elevenlabs", "suno", "udio", "murf", "playht", "speechify", "resemble", "stableaudio", "beatoven",
      "kits", "cartesia", "wellsaid", "adobepodcast", "voicemod", "aiva",
    ],
    seed: { S: ["veo"], A: ["sora", "runway"], B: ["suno"] },
  },
  {
    id: "local",
    title: "Local & Self-Hosted AI",
    desc: "Run AI on your own hardware",
    items: [
      "ollama", "lmstudio", "openwebui", "jan", "comfyui", "vllm", "llamacpp", "gpt4all", "koboldcpp",
      "textgenwebui", "invokeai", "pinokio", "localai", "llamafile", "mlx",
    ],
    seed: { S: ["ollama"], A: ["lmstudio"], B: ["comfyui"] },
  },
];

export function findPreset(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? LEGACY_PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}
