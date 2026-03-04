<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from 'vue';
import AccountForm from './components/authenticator/AccountForm.vue';
import AccountList from './components/authenticator/AccountList.vue';
import TrashBinPanel from './components/authenticator/TrashBinPanel.vue';
import SettingsPanel from './components/settings/SettingsPanel.vue';
import LockScreen from './components/security/LockScreen.vue';
import { useAuthenticator } from './composables/useAuthenticator';
import { useAppSettings } from './composables/useAppSettings';
import { useI18n } from './composables/useI18n';
import type { AddAccountPayload, AppLanguage } from './types/auth';

const {
  loading,
  submitting,
  transferring,
  errorMessage,
  noticeMessage,
  mergedRows,
  trash,
  initialize,
  addAccount,
  removeAccount,
  refreshCodes,
  exportAccounts,
  importAccounts,
  restoreFromTrash,
  clearTrashItem,
  clearTrashAll
} = useAuthenticator();

const { t } = useI18n();
const {
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
  saving: savingSettings,
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
} = useAppSettings();

type PageKey = 'codes' | 'add' | 'trash' | 'settings';

const activePage = shallowRef<PageKey>('codes');
const lockRequired = shallowRef(false);
const unlocked = shallowRef(false);
const lockReady = shallowRef(false);
const unlocking = shallowRef(false);
const lockErrorMessage = shallowRef('');
const cooldownRemainingMs = shallowRef(0);
const authenticatorInitialized = shallowRef(false);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

const activePageTitle = computed(() => {
  if (activePage.value === 'codes') return t('menu.codes');
  if (activePage.value === 'add') return t('menu.add');
  if (activePage.value === 'trash') return t('menu.trash');
  return t('menu.settings');
});

async function handleAdd(payload: AddAccountPayload) {
  await addAccount(payload);
  activePage.value = 'codes';
}

async function handleLanguageChange(language: AppLanguage) {
  await updateLanguage(language);
}

async function handleHideTrayIconChange(hidden: boolean) {
  await updateHideTrayIcon(hidden);
}

async function handleLaunchAtLoginChange(enabled: boolean) {
  await updateLaunchAtLogin(enabled);
}

async function handleEnableFloatingBallChange(enabled: boolean) {
  await updateEnableFloatingBall(enabled);
}

async function handlePickFloatingBallBackgroundImage() {
  return pickFloatingBallBackgroundImage();
}

async function handleSaveFloatingBallAppearance(payload: {
  opacity: number;
  text: string;
  backgroundImage: string | null;
  backgroundColor: string;
}) {
  await saveFloatingBallAppearance(payload);
}

async function handleOpenRepository() {
  await openRepository();
}

async function handleOpenReleases() {
  await openReleases();
}

async function handleOpenIssues() {
  await openIssues();
}

async function handleUpdateMasterPassword(payload: {
  currentPassword?: string;
  newPassword: string;
}) {
  await updateMasterPassword(payload);
}

function stopCooldownTimer() {
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
    cooldownTimer = null;
  }
}

function startCooldownTimer() {
  stopCooldownTimer();
  if (cooldownRemainingMs.value <= 0) {
    return;
  }
  cooldownTimer = setInterval(() => {
    cooldownRemainingMs.value = Math.max(0, cooldownRemainingMs.value - 1000);
    if (cooldownRemainingMs.value <= 0) {
      stopCooldownTimer();
    }
  }, 1000);
}

async function initLockState() {
  const status = await window.authenticatorApi.getMasterPasswordLockStatus();
  lockRequired.value = status.required;
  unlocked.value = status.unlocked;
  cooldownRemainingMs.value = status.cooldownRemainingMs;
  startCooldownTimer();
  lockReady.value = true;
}

async function ensureAuthenticatorInitialized() {
  if (
    authenticatorInitialized.value ||
    !lockReady.value ||
    (lockRequired.value && !unlocked.value)
  ) {
    return;
  }
  await initialize();
  authenticatorInitialized.value = true;
}

async function handleUnlock(password: string) {
  unlocking.value = true;
  lockErrorMessage.value = '';
  try {
    const result = await window.authenticatorApi.verifyMasterPassword(password);
    cooldownRemainingMs.value = result.cooldownRemainingMs;
    startCooldownTimer();
    if (result.success) {
      unlocked.value = true;
      lockErrorMessage.value = '';
      await ensureAuthenticatorInitialized();
      return;
    }
    lockErrorMessage.value = result.errorMessage;
  } finally {
    unlocking.value = false;
  }
}

onMounted(async () => {
  await initLockState();
  await ensureAuthenticatorInitialized();
});

onUnmounted(() => {
  stopCooldownTimer();
});
</script>

<template>
  <LockScreen
    v-if="lockReady && lockRequired && !unlocked"
    :unlocking="unlocking"
    :cooldown-remaining-ms="cooldownRemainingMs"
    :error-message="lockErrorMessage"
    @unlock="handleUnlock"
  />
  <main v-else-if="lockReady" class="app-shell">
    <aside class="sidebar">
      <button class="brand-block brand-btn" type="button" @click="handleOpenRepository">
        <h1 class="brand-title">{{ t('app.title') }}</h1>
        <p class="brand-subtitle">{{ t('app.subtitle') }}</p>
      </button>

      <nav class="menu" :aria-label="t('menu.aria')">
        <button
          class="menu-item"
          :class="{ 'menu-item-active': activePage === 'codes' }"
          :aria-current="activePage === 'codes' ? 'page' : undefined"
          @click="activePage = 'codes'"
        >
          {{ t('menu.codes') }}
        </button>
        <button
          class="menu-item"
          :class="{ 'menu-item-active': activePage === 'add' }"
          :aria-current="activePage === 'add' ? 'page' : undefined"
          @click="activePage = 'add'"
        >
          {{ t('menu.add') }}
        </button>
        <button
          class="menu-item"
          :class="{ 'menu-item-active': activePage === 'trash' }"
          :aria-current="activePage === 'trash' ? 'page' : undefined"
          @click="activePage = 'trash'"
        >
          {{ t('menu.trash') }}
        </button>
        <button
          class="menu-item"
          :class="{ 'menu-item-active': activePage === 'settings' }"
          :aria-current="activePage === 'settings' ? 'page' : undefined"
          @click="activePage = 'settings'"
        >
          {{ t('menu.settings') }}
        </button>
      </nav>
    </aside>

    <section class="content">
      <header class="content-head">
        <div>
          <p class="content-eyebrow">{{ t('app.title') }}</p>
          <h2 class="content-title">{{ activePageTitle }}</h2>
        </div>
        <button class="release-btn" type="button" @click="handleOpenReleases">
          v{{ appVersion }}
        </button>
      </header>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-else-if="noticeMessage" class="notice">{{ noticeMessage }}</p>

      <div class="content-page">
        <AccountList
          v-if="activePage === 'codes'"
          :loading="loading"
          :transferring="transferring"
          :rows="mergedRows"
          @remove="removeAccount"
          @refresh="refreshCodes"
          @export="exportAccounts"
          @import="importAccounts"
        />
        <AccountForm v-else-if="activePage === 'add'" :submitting="submitting" @add="handleAdd" />
        <TrashBinPanel
          v-else-if="activePage === 'trash'"
          :transferring="transferring"
          :items="trash"
          :requires-master-password="hasMasterPassword"
          @restore="restoreFromTrash"
          @clear-item="clearTrashItem"
          @clear-all="clearTrashAll"
        />
        <SettingsPanel
          v-else
          :language="currentLanguage"
          :hide-tray-icon="hideTrayIcon"
          :launch-at-login="launchAtLogin"
          :enable-floating-ball="enableFloatingBall"
          :floating-ball-opacity="floatingBallOpacity"
          :floating-ball-text="floatingBallText"
          :floating-ball-background-image="floatingBallBackgroundImage"
          :floating-ball-background-color="floatingBallBackgroundColor"
          :has-master-password="hasMasterPassword"
          :app-version="appVersion"
          :pick-floating-ball-background-image="handlePickFloatingBallBackgroundImage"
          :set-master-password="handleUpdateMasterPassword"
          :open-repository="handleOpenRepository"
          :open-releases="handleOpenReleases"
          :open-issues="handleOpenIssues"
          :saving="savingSettings"
          @language-change="handleLanguageChange"
          @hide-tray-icon-change="handleHideTrayIconChange"
          @launch-at-login-change="handleLaunchAtLoginChange"
          @enable-floating-ball-change="handleEnableFloatingBallChange"
          @save-floating-ball-appearance="handleSaveFloatingBallAppearance"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.app-shell {
  height: 100vh;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  background: #070d1f;
}

.sidebar {
  border-right: 1px solid #1f2f56;
  background: linear-gradient(180deg, #0d1730 0%, #0a1329 100%);
  padding: 18px 14px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 6px;
}

.brand-block {
  margin-bottom: 18px;
  padding: 10px;
  border: 1px solid #2e4476;
  border-radius: 12px;
  background: rgba(31, 54, 99, 0.28);
}

.brand-btn {
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    transform 180ms ease;
}

.brand-btn:hover {
  background: rgba(49, 82, 146, 0.32);
  border-color: #4f74bc;
  transform: translateY(-1px);
}

.brand-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(86, 153, 255, 0.32);
}

.brand-title {
  margin: 0;
  color: #e6f0ff;
  font-size: 18px;
  line-height: 1.35;
}

.brand-subtitle {
  margin: 6px 0 0;
  color: #9db6e2;
  font-size: 13px;
}

.menu {
  display: grid;
  gap: 8px;
  align-content: start;
}

.menu-item {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid #314b80;
  background: #122143;
  color: #dce8ff;
  text-align: left;
  padding: 0 12px;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    transform 180ms ease;
}

.menu-item:hover {
  background: #1a2e59;
  border-color: #5076bf;
  transform: translateX(1px);
}

.menu-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(86, 153, 255, 0.32);
}

.menu-item-active {
  border-color: #5a92ff;
  background: #1d3670;
  box-shadow: inset 2px 0 0 #8eb6ff;
}

.content {
  padding: 18px 20px;
  min-width: 0;
  overflow: auto;
  background:
    radial-gradient(circle at 0% 0%, rgba(42, 73, 136, 0.2) 0%, rgba(10, 17, 34, 0) 36%),
    radial-gradient(circle at 100% 0%, rgba(54, 86, 155, 0.14) 0%, rgba(10, 17, 34, 0) 34%), #0b1226;
}

.content-head {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.content-eyebrow {
  margin: 0;
  color: #90afdf;
  font-size: 12px;
  letter-spacing: 0.3px;
}

.content-title {
  margin: 2px 0 0;
  color: #e7f0ff;
  font-size: 24px;
  line-height: 1.2;
}

.release-btn {
  min-height: 40px;
  border: 1px solid #3d5fa1;
  border-radius: 10px;
  background: #14254d;
  color: #cfe2ff;
  padding: 0 12px;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    border-color 180ms ease;
}

.release-btn:hover {
  border-color: #648fdc;
  background: #1b3468;
}

.release-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(86, 153, 255, 0.32);
}

.content-page {
  display: grid;
  gap: 14px;
}

.error {
  margin: 0 0 14px;
  color: #ffd5dc;
  background: #4a1c31;
  border: 1px solid #9c355d;
  border-radius: 10px;
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0 12px;
}

.notice {
  margin: 0 0 14px;
  color: #d7fbe8;
  background: #143a2b;
  border: 1px solid #2f8f64;
  border-radius: 10px;
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0 12px;
}

@media (max-width: 1080px) {
  .app-shell {
    grid-template-columns: 200px minmax(0, 1fr);
  }
}

@media (max-width: 780px) {
  .app-shell {
    grid-template-columns: 170px minmax(0, 1fr);
  }

  .content {
    padding: 12px;
  }

  .content-head {
    margin-bottom: 10px;
  }

  .content-title {
    font-size: 21px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-btn,
  .menu-item,
  .release-btn {
    transition: none;
  }
}
</style>
