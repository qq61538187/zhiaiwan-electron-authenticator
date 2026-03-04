import { shallowRef } from 'vue';
import { MESSAGES, type MessageKey } from '../i18n/messages';
import type { AppLanguage } from '../types/auth';

const language = shallowRef<AppLanguage>('zh-CN');

export function setLanguage(lang: AppLanguage) {
  language.value = lang;
}

export function useI18n() {
  function t(key: MessageKey): string {
    return MESSAGES[language.value][key] ?? key;
  }

  return {
    language,
    setLanguage,
    t
  };
}
