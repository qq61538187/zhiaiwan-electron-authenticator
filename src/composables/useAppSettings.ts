import { onMounted, shallowRef } from 'vue';
import type { AppLanguage, AppSettings } from '../types/auth';
import { setLanguage as applyLanguage } from './useI18n';

export function useAppSettings() {
  const currentLanguage = shallowRef<AppLanguage>('zh-CN');
  const hideTrayIcon = shallowRef(false);
  const launchAtLogin = shallowRef(false);
  const enableFloatingBall = shallowRef(false);
  const floatingBallOpacity = shallowRef(0.9);
  const floatingBallText = shallowRef('OTP');
  const floatingBallBackgroundImage = shallowRef<string | null>(null);
  const floatingBallBackgroundColor = shallowRef('#6aa4ff');
  const hasMasterPassword = shallowRef(false);
  const appVersion = shallowRef('1.0.0');
  const saving = shallowRef(false);

  function applySettings(settings: AppSettings) {
    currentLanguage.value = settings.language;
    hideTrayIcon.value = settings.hideTrayIcon;
    launchAtLogin.value = settings.launchAtLogin;
    enableFloatingBall.value = settings.enableFloatingBall;
    floatingBallOpacity.value = settings.floatingBallOpacity;
    floatingBallText.value = settings.floatingBallText;
    floatingBallBackgroundImage.value = settings.floatingBallBackgroundImage;
    floatingBallBackgroundColor.value = settings.floatingBallBackgroundColor;
    hasMasterPassword.value = settings.hasMasterPassword;
    applyLanguage(settings.language);
  }

  async function loadSettings() {
    const [settings, version] = await Promise.all([
      window.authenticatorApi.getSettings(),
      window.authenticatorApi.getAppVersion()
    ]);
    applySettings(settings);
    appVersion.value = version || '1.0.0';
  }

  async function openRepository() {
    await window.authenticatorApi.openRepository();
  }

  async function openReleases() {
    await window.authenticatorApi.openReleases();
  }

  async function openIssues() {
    await window.authenticatorApi.openIssues();
  }

  async function updateMasterPassword(payload: { currentPassword?: string; newPassword: string }) {
    saving.value = true;
    try {
      const settings = await window.authenticatorApi.setMasterPassword(payload);
      applySettings(settings);
      return settings;
    } finally {
      saving.value = false;
    }
  }

  async function updateLanguage(language: AppLanguage) {
    saving.value = true;
    try {
      const settings = await window.authenticatorApi.setLanguage(language);
      applySettings(settings);
      return settings;
    } finally {
      saving.value = false;
    }
  }

  async function updateHideTrayIcon(hidden: boolean) {
    saving.value = true;
    try {
      const settings = await window.authenticatorApi.setHideTrayIcon(hidden);
      applySettings(settings);
      return settings;
    } finally {
      saving.value = false;
    }
  }

  async function updateLaunchAtLogin(enabled: boolean) {
    saving.value = true;
    try {
      const settings = await window.authenticatorApi.setLaunchAtLogin(enabled);
      applySettings(settings);
      return settings;
    } finally {
      saving.value = false;
    }
  }

  async function updateEnableFloatingBall(enabled: boolean) {
    saving.value = true;
    try {
      const settings = await window.authenticatorApi.setEnableFloatingBall(enabled);
      applySettings(settings);
      return settings;
    } finally {
      saving.value = false;
    }
  }

  async function pickFloatingBallBackgroundImage() {
    return window.authenticatorApi.pickFloatingBallBackgroundImage();
  }

  async function saveFloatingBallAppearance(payload: {
    opacity: number;
    text: string;
    backgroundImage: string | null;
    backgroundColor: string;
  }) {
    saving.value = true;
    try {
      const settings = await window.authenticatorApi.saveFloatingBallAppearance(payload);
      applySettings(settings);
      return settings;
    } finally {
      saving.value = false;
    }
  }

  onMounted(async () => {
    await loadSettings();
  });

  return {
    currentLanguage,
    hideTrayIcon,
    launchAtLogin,
    enableFloatingBall,
    floatingBallOpacity,
    floatingBallText,
    floatingBallBackgroundImage,
    floatingBallBackgroundColor,
    hasMasterPassword,
    appVersion,
    saving,
    updateLanguage,
    updateHideTrayIcon,
    updateLaunchAtLogin,
    updateEnableFloatingBall,
    pickFloatingBallBackgroundImage,
    saveFloatingBallAppearance,
    openRepository,
    openReleases,
    openIssues,
    updateMasterPassword
  };
}
