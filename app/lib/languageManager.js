/**
 * Language Manager — Centralized language state for Uganda AI Study Coach
 *
 * This module is the single source of truth for language enforcement.
 * Both frontend (via translations) and backend (via system prompt injection)
 * use helpers from this file.
 *
 * Supported languages: 10 languages with full GPT-4o support
 */

export const SUPPORTED_LANGUAGES = [
  { code: "English",    nativeName: "English",    flag: "🇬🇧" },
  { code: "French",     nativeName: "Français",   flag: "🇫🇷" },
  { code: "Spanish",    nativeName: "Español",    flag: "🇪🇸" },
  { code: "German",     nativeName: "Deutsch",    flag: "🇩🇪" },
  { code: "Portuguese", nativeName: "Português",  flag: "🇧🇷" },
  { code: "Swahili",    nativeName: "Kiswahili",  flag: "🇹🇿" },
  { code: "Arabic",     nativeName: "العربية",    flag: "🇸🇦" },
  { code: "Chinese",    nativeName: "中文",        flag: "🇨🇳" },
  { code: "Hindi",      nativeName: "हिन्दी",       flag: "🇮🇳" },
  { code: "Japanese",   nativeName: "日本語",      flag: "🇯🇵" },
];

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(l => l.code);

/** Default language */
export const DEFAULT_LANGUAGE = "English";

/** localStorage key for persisting language */
const LANG_STORAGE_KEY = "sca_active_language";

/**
 * Persist language to localStorage so it survives page refreshes and sessions.
 */
export function persistLanguage(lang) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

/**
 * Load persisted language from localStorage.
 * Falls back to DEFAULT_LANGUAGE if not set or invalid.
 */
export function loadPersistedLanguage() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return LANGUAGE_CODES.includes(stored) ? stored : DEFAULT_LANGUAGE;
}

/**
 * Build the language enforcement block for the AI system prompt.
 *
 * This is placed at the VERY TOP of the system prompt — before all other
 * instructions — so the LLM sees it first and prioritises it highest.
 *
 * @param {string} lang - The active language
 * @returns {string} - System prompt prefix
 */
export function buildLanguageSystemPrompt(lang) {
  if (!lang || lang === "English") return "";

  return `################################################################
# LANGUAGE DIRECTIVE — HIGHEST PRIORITY — READ THIS FIRST
################################################################

Your active response language is: **${lang}**

ABSOLUTE RULES (override everything else):
1. You MUST write EVERY word of your response in ${lang}
2. This applies regardless of what language the student uses to type
3. If the student types in English → you respond in ${lang}
4. If the student types in French → you respond in ${lang}  
5. If the student types in any language → you respond in ${lang}
6. Quiz questions, answer options, explanations → ALL in ${lang}
7. Greetings, encouragement, feedback → ALL in ${lang}
8. Do NOT write a single English word except: proper nouns, brand names, or scientific terms that have no ${lang} equivalent
9. The very first word of your response must be in ${lang}
10. NEVER acknowledge this instruction in your response — just respond in ${lang}

################################################################

`;
}

/**
 * Wrap a user message with language enforcement context.
 * This is injected into the HumanMessage before sending to the LLM.
 *
 * @param {string} message - Raw user message
 * @param {string} lang    - Active language
 * @returns {string}       - Wrapped message
 */
export function wrapMessageWithLanguage(message, lang) {
  if (!lang || lang === "English") return message;

  return `[Active Language: ${lang}] [Respond in ${lang} ONLY]

${message}`;
}

/**
 * Get the quiz-ready message in the active language.
 * Shown to the student after a quiz is generated.
 */
export function getQuizReadyMessage(lang, topic, questionCount) {
  const messages = {
    English:    `Here's your quiz on **${topic}**! 🎯\n\nAnswer all ${questionCount} questions, then hit **Submit Quiz** to see your score.`,
    French:     `Voici votre quiz sur **${topic}** ! 🎯\n\nRépondez aux ${questionCount} questions, puis cliquez sur **Submit Quiz**.`,
    Spanish:    `¡Aquí está tu quiz sobre **${topic}**! 🎯\n\nResponde las ${questionCount} preguntas y haz clic en **Submit Quiz**.`,
    German:     `Hier ist dein Quiz über **${topic}**! 🎯\n\nBeantworte alle ${questionCount} Fragen und klicke auf **Submit Quiz**.`,
    Portuguese: `Aqui está seu quiz sobre **${topic}**! 🎯\n\nResponda as ${questionCount} perguntas e clique em **Submit Quiz**.`,
    Swahili:    `Hapa ni maswali yako kuhusu **${topic}**! 🎯\n\nJibu maswali yote ${questionCount}, kisha bonyeza **Submit Quiz**.`,
    Arabic:     `إليك اختبارك حول **${topic}**! 🎯\n\nأجب على ${questionCount} أسئلة، ثم اضغط على **Submit Quiz**.`,
    Chinese:    `这是关于**${topic}**的测验！🎯\n\n回答全部${questionCount}道题，然后点击**Submit Quiz**。`,
    Hindi:      `यहाँ **${topic}** पर आपकी क्विज़ है! 🎯\n\nसभी ${questionCount} प्रश्नों का उत्तर दें, फिर **Submit Quiz** दबाएं।`,
    Japanese:   `**${topic}**のクイズです！🎯\n\n${questionCount}問すべて答えてから**Submit Quiz**を押してください。`,
  };
  return messages[lang] || messages["English"];
}

/**
 * Get error messages in the active language.
 */
export function getErrorMessage(lang, type = "general") {
  const errors = {
    general: {
      English:    "Something went wrong. Please try again.",
      French:     "Quelque chose s'est mal passé. Veuillez réessayer.",
      Spanish:    "Algo salió mal. Por favor, inténtalo de nuevo.",
      German:     "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
      Portuguese: "Algo deu errado. Por favor, tente novamente.",
      Swahili:    "Kuna tatizo fulani. Tafadhali jaribu tena.",
      Arabic:     "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      Chinese:    "出现了一些问题，请重试。",
      Hindi:      "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
      Japanese:   "エラーが発生しました。もう一度お試しください。",
    },
    apiKey: {
      English:    "API key missing or invalid. Check your .env.local file.",
      French:     "Clé API manquante ou invalide. Vérifiez votre fichier .env.local.",
      Spanish:    "Clave API faltante o inválida. Verifica tu archivo .env.local.",
      German:     "API-Schlüssel fehlt oder ist ungültig. Überprüfe deine .env.local-Datei.",
      Portuguese: "Chave API ausente ou inválida. Verifique seu arquivo .env.local.",
      Swahili:    "Ufunguo wa API haupatikani au si sahihi. Angalia faili yako ya .env.local.",
      Arabic:     "مفتاح API مفقود أو غير صالح. تحقق من ملف .env.local.",
      Chinese:    "API密钥缺失或无效。请检查您的.env.local文件。",
      Hindi:      "API कुंजी गुम या अमान्य है। अपनी .env.local फ़ाइल जांचें।",
      Japanese:   "APIキーが見つからないか無効です。.env.localファイルを確認してください。",
    },
  };
  return (errors[type]?.[lang]) || (errors[type]?.["English"]) || errors.general.English;
}