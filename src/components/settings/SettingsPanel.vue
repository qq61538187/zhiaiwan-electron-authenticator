<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import type { AppLanguage } from '../../types/auth';
import { useI18n } from '../../composables/useI18n';

interface Props {
  language: AppLanguage;
  hideTrayIcon: boolean;
  launchAtLogin: boolean;
  enableFloatingBall: boolean;
  floatingBallOpacity: number;
  floatingBallText: string;
  floatingBallBackgroundImage: string | null;
  floatingBallBackgroundColor: string;
  hasMasterPassword: boolean;
  appVersion: string;
  pickFloatingBallBackgroundImage: () => Promise<string | null>;
  setMasterPassword: (payload: { currentPassword?: string; newPassword: string }) => Promise<void>;
  openRepository: () => Promise<void>;
  openReleases: () => Promise<void>;
  openIssues: () => Promise<void>;
  saving: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  languageChange: [language: AppLanguage];
  hideTrayIconChange: [hidden: boolean];
  launchAtLoginChange: [enabled: boolean];
  enableFloatingBallChange: [enabled: boolean];
  saveFloatingBallAppearance: [
    payload: {
      opacity: number;
      text: string;
      backgroundImage: string | null;
      backgroundColor: string;
    }
  ];
}>();

const { t } = useI18n();

const draftOpacity = shallowRef(0.9);
const draftText = shallowRef('OTP');
const draftBackgroundImage = shallowRef<string | null>(null);
const draftBackgroundColor = shallowRef('#6aa4ff');
const currentPassword = shallowRef('');
const newPassword = shallowRef('');
const confirmPassword = shallowRef('');
const revealCurrentPassword = shallowRef(false);
const revealNewPassword = shallowRef(false);
const revealConfirmPassword = shallowRef(false);
const passwordError = shallowRef('');

function hexToRgba(hex: string, alpha: number) {
  const normalized = String(hex || '')
    .trim()
    .toLowerCase();
  const valid = /^#[0-9a-f]{6}$/.test(normalized) ? normalized : '#6aa4ff';
  const r = Number.parseInt(valid.slice(1, 3), 16);
  const g = Number.parseInt(valid.slice(3, 5), 16);
  const b = Number.parseInt(valid.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function syncDraftFromProps() {
  draftOpacity.value = props.floatingBallOpacity;
  draftText.value = props.floatingBallText;
  draftBackgroundImage.value = props.floatingBallBackgroundImage;
  draftBackgroundColor.value = props.floatingBallBackgroundColor;
}

watch(
  () => [
    props.floatingBallOpacity,
    props.floatingBallText,
    props.floatingBallBackgroundImage,
    props.floatingBallBackgroundColor
  ],
  () => syncDraftFromProps(),
  { immediate: true }
);

const hasDraftChanges = computed(
  () =>
    Math.abs(draftOpacity.value - props.floatingBallOpacity) > 0.001 ||
    draftText.value !== props.floatingBallText ||
    draftBackgroundImage.value !== props.floatingBallBackgroundImage ||
    draftBackgroundColor.value !== props.floatingBallBackgroundColor
);
const previewStyle = computed(() => ({
  opacity: draftOpacity.value,
  backgroundColor: draftBackgroundColor.value,
  backgroundImage: draftBackgroundImage.value
    ? `linear-gradient(${hexToRgba(draftBackgroundColor.value, 0.5)}, ${hexToRgba(draftBackgroundColor.value, 0.5)}), url(${draftBackgroundImage.value})`
    : 'none',
  backgroundBlendMode: draftBackgroundImage.value ? 'multiply' : 'normal'
}));

async function handleChooseImage() {
  if (props.saving) return;
  const image = await props.pickFloatingBallBackgroundImage();
  if (image) {
    draftBackgroundImage.value = image;
  }
}

function handleClearImage() {
  draftBackgroundImage.value = null;
}

function handleRestore() {
  syncDraftFromProps();
}

function handleConfirm() {
  emit('saveFloatingBallAppearance', {
    opacity: draftOpacity.value,
    text: draftText.value,
    backgroundImage: draftBackgroundImage.value,
    backgroundColor: draftBackgroundColor.value
  });
}

function resetPasswordDraft() {
  currentPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  revealCurrentPassword.value = false;
  revealNewPassword.value = false;
  revealConfirmPassword.value = false;
}

async function handleSubmitMasterPassword() {
  passwordError.value = '';
  if (props.hasMasterPassword && !currentPassword.value.trim()) {
    passwordError.value = t('error.masterPasswordRequired');
    return;
  }
  if (newPassword.value.trim().length < 6) {
    passwordError.value = t('error.masterPasswordTooShort');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = t('error.masterPasswordConfirmMismatch');
    return;
  }

  try {
    await props.setMasterPassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    });
    resetPasswordDraft();
  } catch (error) {
    passwordError.value = error instanceof Error ? error.message : t('error.saveSettings');
  }
}

async function handleOpenRepository() {
  if (props.saving) return;
  await props.openRepository();
}

async function handleOpenReleases() {
  if (props.saving) return;
  await props.openReleases();
}

async function handleOpenIssues() {
  if (props.saving) return;
  await props.openIssues();
}
</script>

<template>
  <section class="panel">
    <h2 class="panel-title">{{ t('settings.title') }}</h2>
    <p class="panel-hint">{{ t('settings.description') }}</p>

    <label class="field">
      <span class="field-label">{{ t('settings.language') }}</span>
      <select
        class="field-select"
        :disabled="props.saving"
        :value="props.language"
        @change="emit('languageChange', ($event.target as HTMLSelectElement).value as AppLanguage)"
      >
        <option value="zh-CN">{{ t('settings.option.zh') }}</option>
        <option value="en-US">{{ t('settings.option.en') }}</option>
      </select>
    </label>

    <section class="group">
      <h3 class="group-title">{{ t('settings.preferenceTitle') }}</h3>

      <div class="hotkey-row">
        <span class="field-label">{{ t('settings.summonHotkey') }}</span>
        <div class="hotkey-box">Option+Space</div>
      </div>

      <p class="hotkey-hint">⌥+Space</p>

      <label class="checkbox-field">
        <input
          type="checkbox"
          class="field-checkbox"
          :disabled="props.saving"
          :checked="props.enableFloatingBall"
          @change="emit('enableFloatingBallChange', ($event.target as HTMLInputElement).checked)"
        />
        <span class="field-label">{{ t('settings.enableFloatingBall') }}</span>
      </label>

      <section v-if="props.enableFloatingBall" class="floating-ball-card">
        <div class="floating-header">
          <div class="floating-meta">
            <span class="field-label">{{ t('settings.enableFloatingBall') }}</span>
            <span v-if="hasDraftChanges" class="dirty-tip">{{ t('settings.unsaved') }}</span>
          </div>
          <div class="floating-preview" :style="previewStyle">
            {{ draftText || 'OTP' }}
          </div>
        </div>

        <div class="controls-grid">
          <label class="field">
            <span class="field-label">
              {{ t('settings.floatingBallOpacity') }} {{ Math.round(draftOpacity * 100) }}%
            </span>
            <input
              class="field-range"
              type="range"
              min="20"
              max="100"
              step="1"
              :disabled="props.saving"
              :value="Math.round(draftOpacity * 100)"
              @input="draftOpacity = Number(($event.target as HTMLInputElement).value) / 100"
            />
          </label>

          <label class="field">
            <span class="field-label">{{ t('settings.floatingBallText') }}</span>
            <input
              class="field-input"
              type="text"
              maxlength="8"
              :disabled="props.saving"
              :value="draftText"
              @input="draftText = ($event.target as HTMLInputElement).value.slice(0, 8)"
            />
          </label>

          <label class="field">
            <span class="field-label">{{ t('settings.floatingBallBackgroundColor') }}</span>
            <input
              class="field-color"
              type="color"
              :disabled="props.saving"
              :value="draftBackgroundColor"
              @input="draftBackgroundColor = ($event.target as HTMLInputElement).value"
            />
          </label>
        </div>

        <div class="image-actions">
          <button
            class="action-btn"
            type="button"
            :disabled="props.saving"
            @click="handleChooseImage"
          >
            {{ t('settings.floatingBallChooseImage') }}
          </button>
          <button
            class="action-btn danger"
            type="button"
            :disabled="props.saving || !draftBackgroundImage"
            @click="handleClearImage"
          >
            {{ t('settings.floatingBallClearImage') }}
          </button>
        </div>

        <div class="confirm-actions">
          <button
            class="action-btn"
            type="button"
            :disabled="props.saving || !hasDraftChanges"
            @click="handleRestore"
          >
            {{ t('settings.restore') }}
          </button>
          <button
            class="action-btn primary"
            type="button"
            :disabled="props.saving || !hasDraftChanges"
            @click="handleConfirm"
          >
            {{ t('settings.confirm') }}
          </button>
        </div>
      </section>
    </section>

    <label class="checkbox-field">
      <input
        type="checkbox"
        class="field-checkbox"
        :disabled="props.saving"
        :checked="props.hideTrayIcon"
        @change="emit('hideTrayIconChange', ($event.target as HTMLInputElement).checked)"
      />
      <span class="field-label">{{ t('settings.hideTrayIcon') }}</span>
    </label>

    <label class="checkbox-field">
      <input
        type="checkbox"
        class="field-checkbox"
        :disabled="props.saving"
        :checked="props.launchAtLogin"
        @change="emit('launchAtLoginChange', ($event.target as HTMLInputElement).checked)"
      />
      <span class="field-label">{{ t('settings.launchAtLogin') }}</span>
    </label>

    <section class="group">
      <h3 class="group-title">{{ t('settings.securityTitle') }}</h3>
      <p class="panel-hint security-hint">{{ t('settings.masterPasswordHint') }}</p>

      <label v-if="props.hasMasterPassword" class="field">
        <span class="field-label">{{ t('settings.currentMasterPassword') }}</span>
        <div class="password-row">
          <input
            class="field-input"
            :type="revealCurrentPassword ? 'text' : 'password'"
            :disabled="props.saving"
            :value="currentPassword"
            @input="currentPassword = ($event.target as HTMLInputElement).value"
          />
          <button
            class="action-btn"
            type="button"
            :disabled="props.saving"
            @click="revealCurrentPassword = !revealCurrentPassword"
          >
            {{ revealCurrentPassword ? t('settings.hidePassword') : t('settings.showPassword') }}
          </button>
        </div>
      </label>

      <label class="field">
        <span class="field-label">{{ t('settings.newMasterPassword') }}</span>
        <div class="password-row">
          <input
            class="field-input"
            :type="revealNewPassword ? 'text' : 'password'"
            :disabled="props.saving"
            :value="newPassword"
            @input="newPassword = ($event.target as HTMLInputElement).value"
          />
          <button
            class="action-btn"
            type="button"
            :disabled="props.saving"
            @click="revealNewPassword = !revealNewPassword"
          >
            {{ revealNewPassword ? t('settings.hidePassword') : t('settings.showPassword') }}
          </button>
        </div>
      </label>

      <label class="field">
        <span class="field-label">{{ t('settings.confirmMasterPassword') }}</span>
        <div class="password-row">
          <input
            class="field-input"
            :type="revealConfirmPassword ? 'text' : 'password'"
            :disabled="props.saving"
            :value="confirmPassword"
            @input="confirmPassword = ($event.target as HTMLInputElement).value"
          />
          <button
            class="action-btn"
            type="button"
            :disabled="props.saving"
            @click="revealConfirmPassword = !revealConfirmPassword"
          >
            {{ revealConfirmPassword ? t('settings.hidePassword') : t('settings.showPassword') }}
          </button>
        </div>
      </label>

      <p v-if="passwordError" class="password-error">{{ passwordError }}</p>
      <div class="confirm-actions">
        <button
          class="action-btn primary"
          type="button"
          :disabled="props.saving"
          @click="handleSubmitMasterPassword"
        >
          {{ t('settings.saveMasterPassword') }}
        </button>
      </div>
    </section>

    <section class="group about-group">
      <h3 class="group-title">{{ t('settings.aboutTitle') }}</h3>
      <button
        class="about-link"
        type="button"
        :disabled="props.saving"
        @click="handleOpenRepository"
      >
        {{ t('settings.aboutRepo') }}
      </button>
      <button
        class="action-btn primary"
        type="button"
        :disabled="props.saving"
        @click="handleOpenReleases"
      >
        {{ t('settings.checkVersion') }} v{{ props.appVersion }}
      </button>
      <button class="action-btn" type="button" :disabled="props.saving" @click="handleOpenIssues">
        {{ t('settings.feedback') }}
      </button>
    </section>
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid #2f426f;
  background: linear-gradient(180deg, #111b33 0%, #0b1327 100%);
  border-radius: 16px;
  padding: 20px;
  max-width: 920px;
}

.panel-title {
  margin: 0;
  font-size: 20px;
  color: #dbeafe;
}

.panel-hint {
  margin: 8px 0 14px;
  color: #9fb3d9;
  font-size: 14px;
  line-height: 1.55;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 0;
}

.group {
  margin: 12px 0 0;
  padding: 14px;
  border: 1px solid rgba(62, 95, 164, 0.55);
  border-radius: 12px;
  background: rgba(18, 33, 67, 0.45);
}

.about-group {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.security-hint {
  margin: 0 0 10px;
  padding: 8px 10px;
  border: 1px solid rgba(85, 122, 196, 0.45);
  border-radius: 10px;
  background: rgba(18, 37, 77, 0.4);
}

.group-title {
  margin: 0 0 10px;
  color: #d7e7ff;
  font-size: 16px;
  letter-spacing: 0.2px;
}

.floating-ball-card {
  margin-top: 8px;
  border: 1px solid #314b80;
  border-radius: 12px;
  background: rgba(15, 28, 58, 0.78);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.field-label {
  color: #c8dafd;
  font-size: 13px;
  line-height: 1.4;
}

.floating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.floating-meta {
  display: grid;
  gap: 4px;
}

.dirty-tip {
  color: #facc15;
  font-size: 12px;
}

.field-select {
  min-height: 44px;
  border: 1px solid #3b568e;
  border-radius: 10px;
  background: #132247;
  color: #e4eeff;
  padding: 0 10px;
}

.field-input {
  min-height: 44px;
  border: 1px solid #3b568e;
  border-radius: 10px;
  background: #132247;
  color: #e4eeff;
  padding: 0 10px;
}

.field-range {
  accent-color: #60a5fa;
  width: 100%;
}

.field-color {
  width: 64px;
  height: 44px;
  border: 1px solid #3b568e;
  border-radius: 10px;
  background: #132247;
  padding: 4px;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.checkbox-field {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #bfd3ff;
  border: 1px solid rgba(60, 89, 149, 0.7);
  background: rgba(19, 34, 71, 0.7);
  border-radius: 10px;
  padding: 0 12px;
  margin-top: 10px;
  transition:
    border-color 180ms ease,
    background-color 180ms ease;
}

.checkbox-field:hover {
  border-color: #5d84d0;
  background: rgba(24, 45, 88, 0.84);
}

.field-checkbox {
  width: 18px;
  height: 18px;
}

.image-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  min-height: 44px;
  border: 1px solid #3b568e;
  border-radius: 10px;
  background: #162a57;
  color: #e4eeff;
  padding: 0 12px;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    transform 180ms ease;
}

.action-btn:hover:enabled {
  border-color: #5f87d5;
  background: #1c3670;
}

.action-btn:active:enabled {
  transform: translateY(1px);
}

.action-btn.danger {
  border-color: #844f63;
  background: #3d2030;
}

.action-btn.primary {
  border-color: #3a6fd6;
  background: #1b3f8f;
}

.about-link {
  min-height: 44px;
  border: 1px solid #3b568e;
  border-radius: 10px;
  background: #132247;
  color: #d8e8ff;
  padding: 0 12px;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    border-color 180ms ease;
}

.about-link:hover:enabled {
  border-color: #5f87d5;
  background: #1a315f;
}

.password-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.password-error {
  margin: 4px 0 0;
  color: #ffd5dc;
  font-size: 13px;
  padding: 8px 10px;
  border: 1px solid rgba(239, 68, 68, 0.45);
  border-radius: 10px;
  background: rgba(127, 29, 29, 0.22);
}

.action-btn:focus-visible,
.about-link:focus-visible,
.field-select:focus-visible,
.field-input:focus-visible,
.field-color:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.3);
}

.action-btn:disabled,
.about-link:disabled,
.field-select:disabled,
.field-input:disabled,
.field-color:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  padding-top: 4px;
  border-top: 1px solid rgba(97, 138, 219, 0.24);
}

.floating-preview {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  color: #ffffff;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
  background-size: cover;
  background-position: center;
}

@media (max-width: 760px) {
  .panel {
    padding: 16px;
  }

  .group {
    padding: 12px;
  }

  .controls-grid {
    grid-template-columns: 1fr;
  }

  .floating-header {
    align-items: flex-start;
  }
}

.hotkey-row {
  display: grid;
  gap: 8px;
  max-width: 420px;
  margin-bottom: 2px;
}

.hotkey-box {
  min-height: 44px;
  border: 1px solid #3b568e;
  border-radius: 10px;
  background: #132247;
  color: #e4eeff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  letter-spacing: 0.2px;
}

.hotkey-hint {
  margin: 0 0 8px;
  color: #8fb0f1;
  font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
  .action-btn,
  .about-link,
  .checkbox-field {
    transition: none;
  }
}
</style>
