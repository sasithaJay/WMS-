import { useState } from "react";
import type { Lang } from "../types";

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("en");
  return { lang, setLang };
}
