<script setup lang="ts">
import { shallowRef } from 'vue';
import type { TrashedAuthAccount } from '../../types/auth';
import { useI18n } from '../../composables/useI18n';

interface Props {
  transferring: boolean;
  items: TrashedAuthAccount[];
  requiresMasterPassword: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  restore: [id: string];
  clearItem: [id: string];
  clearAll: [masterPassword?: string];
}>();

const { t, language } = useI18n();
const showPasswordPrompt = shallowRef(false);
const masterPassword = shallowRef('');
const revealPassword = shallowRef(false);

function formatTime(ts: number) {
  const date = new Date(ts);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString(language.value);
}

function handleRequestClearAll() {
  if (!props.requiresMasterPassword) {
    emit('clearAll');
    return;
  }
  showPasswordPrompt.value = true;
  masterPassword.value = '';
  revealPassword.value = false;
}

function handleCancelPrompt() {
  showPasswordPrompt.value = false;
  masterPassword.value = '';
}

function handleConfirmPrompt() {
  emit('clearAll', masterPassword.value);
  showPasswordPrompt.value = false;
  masterPassword.value = '';
}
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">{{ t('trash.title') }}</h2>
      <button
        class="danger-btn"
        :disabled="!props.items.length || props.transferring"
        @click="handleRequestClearAll"
      >
        {{ t('trash.clearAll') }}
      </button>
    </div>

    <div v-if="!props.items.length" class="empty-state">{{ t('trash.empty') }}</div>

    <ul v-else class="list">
      <li v-for="item in props.items" :key="item.id" class="row">
        <div class="meta">
          <div class="title">{{ item.issuer }}</div>
          <div class="label">{{ item.label }}</div>
          <div class="time">{{ t('trash.deletedAt') }} {{ formatTime(item.deletedAt) }}</div>
        </div>

        <div class="actions">
          <button
            class="restore-btn"
            :disabled="props.transferring"
            @click="emit('restore', item.id)"
          >
            {{ t('trash.restore') }}
          </button>
          <button
            class="danger-btn"
            :disabled="props.transferring"
            @click="emit('clearItem', item.id)"
          >
            {{ t('trash.clearItem') }}
          </button>
        </div>
      </li>
    </ul>

    <section v-if="showPasswordPrompt" class="password-prompt">
      <h3 class="prompt-title">{{ t('trash.verifyMasterPasswordTitle') }}</h3>
      <p class="prompt-hint">{{ t('trash.verifyMasterPasswordHint') }}</p>
      <label class="prompt-label" for="trash-master-password">
        {{ t('settings.masterPassword') }}
      </label>
      <div class="prompt-input-row">
        <input
          id="trash-master-password"
          class="prompt-input"
          :type="revealPassword ? 'text' : 'password'"
          :disabled="props.transferring"
          :value="masterPassword"
          @input="masterPassword = ($event.target as HTMLInputElement).value"
        />
        <button
          class="restore-btn"
          type="button"
          :disabled="props.transferring"
          @click="revealPassword = !revealPassword"
        >
          {{ revealPassword ? t('settings.hidePassword') : t('settings.showPassword') }}
        </button>
      </div>
      <div class="prompt-actions">
        <button
          class="restore-btn"
          type="button"
          :disabled="props.transferring"
          @click="handleCancelPrompt"
        >
          {{ t('settings.cancel') }}
        </button>
        <button
          class="danger-btn"
          type="button"
          :disabled="props.transferring || !masterPassword.trim()"
          @click="handleConfirmPrompt"
        >
          {{ t('settings.confirm') }}
        </button>
      </div>
    </section>
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid #3f2a38;
  background: linear-gradient(180deg, #1a1321 0%, #120c1a 100%);
  border-radius: 14px;
  padding: 18px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-title {
  margin: 0;
  color: #f7dceb;
  font-size: 20px;
}

.empty-state {
  min-height: 88px;
  border: 1px dashed #5a3a4e;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c7a7ba;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

.row {
  border: 1px solid #4f3647;
  border-radius: 10px;
  background: rgba(42, 22, 36, 0.6);
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.title {
  color: #ffdfef;
  font-size: 14px;
}

.label {
  margin-top: 2px;
  color: #e6bfd2;
}

.time {
  margin-top: 4px;
  color: #b58fa3;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 8px;
}

.restore-btn,
.danger-btn {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid transparent;
  padding: 0 12px;
  cursor: pointer;
}

.restore-btn {
  border-color: #2f8f64;
  color: #d6f8e7;
  background: #15442f;
}

.danger-btn {
  border-color: #a24b72;
  color: #ffd7ea;
  background: #4b1f35;
}

.restore-btn:disabled,
.danger-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.password-prompt {
  margin-top: 14px;
  border: 1px solid #7d4a63;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(70, 27, 48, 0.58) 0%, rgba(45, 18, 33, 0.58) 100%);
  padding: 14px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.prompt-title {
  margin: 0;
  color: #ffe1ef;
  font-size: 15px;
}

.prompt-hint {
  margin: 6px 0 10px;
  color: #e4c1d1;
  font-size: 13px;
  line-height: 1.5;
}

.prompt-label {
  color: #f0cfe0;
  font-size: 13px;
}

.prompt-input-row {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.prompt-input {
  min-height: 44px;
  border: 1px solid #93617f;
  border-radius: 10px;
  background: #311a37;
  color: #ffe6f3;
  padding: 0 10px;
}

.prompt-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.prompt-input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(244, 114, 182, 0.25);
}

@media (max-width: 780px) {
  .row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
