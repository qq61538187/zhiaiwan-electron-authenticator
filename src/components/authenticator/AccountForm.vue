<script setup lang="ts">
import { computed, reactive } from 'vue';
import type { AddAccountPayload } from '../../types/auth';
import { useI18n } from '../../composables/useI18n';

interface Props {
  submitting: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  add: [payload: AddAccountPayload];
}>();

const { t } = useI18n();

const form = reactive({
  issuer: 'Google',
  label: '',
  secret: '',
  period: 30,
  digits: 6 as 6 | 8,
  algorithm: 'SHA1' as 'SHA1' | 'SHA256' | 'SHA512',
  otpauthUri: ''
});

const canSubmit = computed(() => {
  if (form.otpauthUri.trim()) {
    return true;
  }
  return Boolean(form.label.trim() && form.secret.trim());
});

function submitForm() {
  if (!canSubmit.value || props.submitting) {
    return;
  }

  emit('add', {
    issuer: form.issuer.trim() || 'Google',
    label: form.label.trim(),
    secret: form.secret.trim(),
    period: Number(form.period) || 30,
    digits: form.digits,
    algorithm: form.algorithm,
    otpauthUri: form.otpauthUri.trim() || undefined
  });

  form.label = '';
  form.secret = '';
  form.otpauthUri = '';
}
</script>

<template>
  <section class="panel">
    <h2 class="panel-title">{{ t('add.title') }}</h2>
    <p class="panel-hint">{{ t('add.hint') }}</p>

    <div class="form-grid">
      <label class="field">
        <span class="field-label">otpauth URI</span>
        <textarea
          v-model="form.otpauthUri"
          class="field-input field-textarea"
          placeholder="otpauth://totp/Issuer:label?secret=XXXX&issuer=Issuer"
        />
      </label>

      <label class="field">
        <span class="field-label">{{ t('add.issuer') }}</span>
        <input v-model="form.issuer" class="field-input" type="text" placeholder="Google" />
      </label>

      <label class="field">
        <span class="field-label">{{ t('add.label') }}</span>
        <input
          v-model="form.label"
          class="field-input"
          type="text"
          placeholder="name@example.com"
        />
      </label>

      <label class="field">
        <span class="field-label">{{ t('add.secret') }}</span>
        <input
          v-model="form.secret"
          class="field-input"
          type="text"
          placeholder="JBSWY3DPEHPK3PXP"
        />
      </label>

      <label class="field">
        <span class="field-label">{{ t('add.digits') }}</span>
        <select v-model="form.digits" class="field-input">
          <option :value="6">6</option>
          <option :value="8">8</option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">{{ t('add.period') }}</span>
        <input v-model.number="form.period" class="field-input" type="number" min="10" max="120" />
      </label>

      <label class="field">
        <span class="field-label">{{ t('add.algorithm') }}</span>
        <select v-model="form.algorithm" class="field-input">
          <option value="SHA1">SHA1</option>
          <option value="SHA256">SHA256</option>
          <option value="SHA512">SHA512</option>
        </select>
      </label>
    </div>

    <button class="submit-btn" :disabled="!canSubmit || props.submitting" @click="submitForm">
      {{ props.submitting ? t('add.submitting') : t('add.submit') }}
    </button>
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid #203055;
  background: linear-gradient(180deg, #111b33 0%, #0b1327 100%);
  border-radius: 14px;
  padding: 18px;
}

.panel-title {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
  color: #dbeafe;
}

.panel-hint {
  margin: 8px 0 14px;
  color: #9fb3d9;
  font-size: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  color: #bfd3ff;
  font-size: 13px;
}

.field-input {
  border: 1px solid #2d4171;
  border-radius: 10px;
  background: #0f1730;
  color: #e3eeff;
  min-height: 44px;
  padding: 10px 12px;
  outline: none;
}

.field-input:focus {
  border-color: #4c8dff;
  box-shadow: 0 0 0 3px rgba(76, 141, 255, 0.22);
}

.field-textarea {
  min-height: 94px;
  resize: vertical;
}

.submit-btn {
  margin-top: 14px;
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #031326;
  background: linear-gradient(90deg, #67d6ff 0%, #66e3a7 100%);
  cursor: pointer;
  transition:
    filter 180ms ease,
    transform 180ms ease;
}

.submit-btn:hover {
  filter: brightness(1.08);
}

.submit-btn:active {
  transform: translateY(1px);
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 920px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
