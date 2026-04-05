
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type FontSize = "sm" | "md" | "lg";

export const COLOR_PRESETS = [
  { name: "Red",    value: "red",    hsl: "4 85% 52%",   fg: "0 0% 100%",  glow: "4,85%,52%",   hex: "#D9382A" },
  { name: "Lime",   value: "lime",   hsl: "82 99% 67%",  fg: "224 24% 9%", glow: "82,99%,67%",  hex: "#CAFF4D" },
  { name: "Cyan",   value: "cyan",   hsl: "185 88% 52%", fg: "224 24% 9%", glow: "185,88%,52%", hex: "#18D9E4" },
  { name: "Orange", value: "orange", hsl: "28 100% 58%", fg: "0 0% 100%",  glow: "28,100%,58%", hex: "#FF7A20" },
  { name: "Rose",   value: "rose",   hsl: "350 88% 60%", fg: "0 0% 100%",  glow: "350,88%,60%", hex: "#F43060" },
  { name: "Blue",   value: "blue",   hsl: "217 91% 60%", fg: "0 0% 100%",  glow: "217,91%,60%", hex: "#3B82F6" },
  { name: "Violet", value: "violet", hsl: "262 83% 65%", fg: "0 0% 100%",  glow: "262,83%,65%", hex: "#8B5CF6" },
  { name: "Amber",  value: "amber",  hsl: "43 96% 56%",  fg: "224 24% 9%", glow: "43,96%,56%",  hex: "#F59E0B" },
  { name: "Teal",   value: "teal",   hsl: "162 72% 45%", fg: "224 24% 9%", glow: "162,72%,45%", hex: "#14B8A6" },
];

/** Convert a #rrggbb hex string to an HSL object */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Determine whether white or dark text is more readable on a given HSL lightness */
export function getForegroundForLightness(l: number): string {
  return l > 58 ? "224 24% 9%" : "0 0% 100%";
}

export const FONT_SIZES: Record<FontSize, string> = {
  sm: "12px",
  md: "14px",
  lg: "16px",
};

export const LANGUAGES = [
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी",      flag: "🇮🇳" },
  { code: "mr", label: "मराठी",       flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்",       flag: "🇮🇳" },
  { code: "te", label: "తెలుగు",      flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ",       flag: "🇮🇳" },
];

function applyHsl(hsl: string, fg: string, glow: string) {
  const root = document.documentElement;
  const [h, s, l] = hsl.split(" ");
  const darkerL = Math.max(parseInt(l) - 12, 30) + "%";

  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--primary-foreground", fg);
  root.style.setProperty("--accent", hsl);
  root.style.setProperty("--accent-foreground", fg);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-primary-foreground", fg);
  root.style.setProperty("--sidebar-ring", hsl);
  root.style.setProperty(
    "--gradient-cta",
    `linear-gradient(135deg, hsl(${h}, ${s}, ${l}), hsl(${h}, ${s}, ${darkerL}))`
  );
  root.style.setProperty("--shadow-glow", `0 0 30px -5px hsla(${glow}, 0.25)`);
}

function applyColorPreset(preset: (typeof COLOR_PRESETS)[0]) {
  applyHsl(preset.hsl, preset.fg, preset.glow);
}

function applyCustomHex(hex: string) {
  const { h, s, l } = hexToHsl(hex);
  const hsl = `${h} ${s}% ${l}%`;
  const fg = getForegroundForLightness(l);
  const glow = `${h},${s}%,${l}%`;
  applyHsl(hsl, fg, glow);
}

interface AppearanceContextType {
  colorPreset: string;
  setColorPreset: (v: string) => void;
  customHex: string;
  setCustomHex: (hex: string) => void;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
  language: string;
  setLanguage: (l: string) => void;
  currentPreset: (typeof COLOR_PRESETS)[0];
}

const AppearanceContext = createContext<AppearanceContextType>({
  colorPreset: "red",
  setColorPreset: () => {},
  customHex: "#D9382A",
  setCustomHex: () => {},
  fontSize: "md",
  setFontSize: () => {},
  language: "en",
  setLanguage: () => {},
  currentPreset: COLOR_PRESETS[0],
});

export const useAppearance = () => useContext(AppearanceContext);

export const AppearanceProvider = ({ children }: { children: ReactNode }) => {
  const [colorPreset, setColorPresetState] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem("eq-color") : null) ?? "red"
  );
  const [customHex, setCustomHexState] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem("eq-custom-hex") : null) ?? "#D9382A"
  );
  const [fontSize, setFontSizeState] = useState<FontSize>(
    () =>
      ((typeof window !== "undefined" ? localStorage.getItem("eq-fontsize") : null) as FontSize) ?? "md"
  );
  const [language, setLanguageState] = useState<string>(
    () => (typeof window !== "undefined" ? localStorage.getItem("eq-lang") : null) ?? "en"
  );

  useEffect(() => {
    if (colorPreset === "custom") {
      applyCustomHex(customHex);
    } else {
      const preset = COLOR_PRESETS.find((p) => p.value === colorPreset) ?? COLOR_PRESETS[0];
      applyColorPreset(preset);
    }
  }, [colorPreset, customHex]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize];
    localStorage.setItem("eq-fontsize", fontSize);
  }, [fontSize]);

  const setColorPreset = (v: string) => {
    setColorPresetState(v);
    localStorage.setItem("eq-color", v);
  };

  const setCustomHex = (hex: string) => {
    setCustomHexState(hex);
    setColorPresetState("custom");
    localStorage.setItem("eq-custom-hex", hex);
    localStorage.setItem("eq-color", "custom");
  };

  const setFontSize = (s: FontSize) => {
    setFontSizeState(s);
    localStorage.setItem("eq-fontsize", s);
  };

  const setLanguage = (l: string) => {
    setLanguageState(l);
    localStorage.setItem("eq-lang", l);
  };

  const currentPreset = COLOR_PRESETS.find((p) => p.value === colorPreset) ?? COLOR_PRESETS[0];

  return (
    <AppearanceContext.Provider
      value={{ colorPreset, setColorPreset, customHex, setCustomHex, fontSize, setFontSize, language, setLanguage, currentPreset }}
    >
      {children}
    </AppearanceContext.Provider>
  );
};
