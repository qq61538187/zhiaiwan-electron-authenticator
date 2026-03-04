<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { useI18n } from '../../composables/useI18n';

interface Props {
  unlocking: boolean;
  cooldownRemainingMs: number;
  errorMessage: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  unlock: [password: string];
}>();

const { t } = useI18n();
const password = shallowRef('');
const revealPassword = shallowRef(false);
const cooldownText = computed(() => {
  const seconds = Math.ceil(props.cooldownRemainingMs / 1000);
  return t('lock.cooldown').replace('{seconds}', String(seconds));
});

function handleSubmit() {
  if (!password.value.trim() || props.cooldownRemainingMs > 0 || props.unlocking) {
    return;
  }
  emit('unlock', password.value);
}
</script>

<template>
  <main class="lock-shell">
    <section class="lock-card">
      <p class="lock-brand">{{ t('app.title') }}</p>
      <h1 class="lock-title">{{ t('lock.title') }}</h1>
      <p class="lock-hint">{{ t('lock.hint') }}</p>
      <p v-if="props.cooldownRemainingMs > 0" class="lock-cooldown">
        {{ cooldownText }}
      </p>
      <p v-if="props.errorMessage" class="lock-error">{{ props.errorMessage }}</p>

      <label class="lock-label" for="master-password-input">{{ t('lock.passwordLabel') }}</label>
      <div class="lock-input-row">
        <input
          id="master-password-input"
          class="lock-input"
          :type="revealPassword ? 'text' : 'password'"
          :disabled="props.unlocking || props.cooldownRemainingMs > 0"
          :value="password"
          @input="password = ($event.target as HTMLInputElement).value"
          @keydown.enter="handleSubmit"
        />
        <button
          class="toggle-btn"
          type="button"
          :disabled="props.unlocking || props.cooldownRemainingMs > 0"
          @click="revealPassword = !revealPassword"
        >
          {{ revealPassword ? t('settings.hidePassword') : t('settings.showPassword') }}
        </button>
      </div>

      <button
        class="unlock-btn"
        type="button"
        :disabled="props.unlocking || props.cooldownRemainingMs > 0 || !password.trim()"
        @click="handleSubmit"
      >
        {{ props.unlocking ? t('lock.verifying') : t('lock.unlock') }}
      </button>
      <p class="lock-enter-hint">Enter</p>
    </section>
  </main>
</template>

<style scoped>
.lock-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top, #203a77 0%, #0f1933 42%, #070d1f 100%);
  padding: 16px;
}

.lock-card {
  width: min(460px, 100%);
  border: 1px solid #4868ab;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(16, 30, 62, 0.92) 0%, rgba(9, 18, 38, 0.92) 100%);
  box-shadow: 0 18px 48px rgba(2, 8, 23, 0.52);
  padding: 22px;
  display: grid;
  gap: 12px;
}

.lock-brand {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.35px;
  color: #8fb4ff;
}

.lock-title {
  margin: 0;
  color: #edf4ff;
  font-size: 24px;
}

.lock-hint {
  margin: 0;
  color: #b6c9ea;
  line-height: 1.6;
}

.lock-cooldown {
  margin: 0;
  color: #fde68a;
  background: rgba(120, 53, 15, 0.2);
  border: 1px solid rgba(217, 119, 6, 0.45);
  border-radius: 10px;
  padding: 8px 10px;
}

.lock-error {
  margin: 0;
  color: #ffd6dc;
  background: rgba(127, 29, 29, 0.22);
  border: 1px solid rgba(248, 113, 113, 0.48);
  border-radius: 10px;
  padding: 8px 10px;
}

.lock-label {
  color: #d4e4ff;
  font-size: 13px;
}

.lock-input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.lock-input {
  min-height: 44px;
  border: 1px solid #4b70b5;
  border-radius: 10px;
  background: #10244f;
  color: #e8f1ff;
  padding: 0 10px;
}

.toggle-btn,
.unlock-btn {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid #4670ba;
  background: #1a3a7e;
  color: #e8f1ff;
  padding: 0 12px;
  cursor: pointer;
}

.unlock-btn {
  margin-top: 4px;
  font-weight: 600;
}

.toggle-btn:disabled,
.unlock-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.lock-enter-hint {
  margin: 0;
  text-align: right;
  color: #88a5d8;
  font-size: 12px;
}
</style>
