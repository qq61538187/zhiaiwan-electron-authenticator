<script setup lang="ts">
import type { AuthAccount } from '../../types/auth';
import { useI18n } from '../../composables/useI18n';

interface AccountRow extends AuthAccount {
  code: string;
  secondsRemaining: number;
}

interface Props {
  loading: boolean;
  transferring: boolean;
  rows: AccountRow[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  remove: [id: string];
  refresh: [];
  export: [];
  import: [];
}>();

const { t } = useI18n();

function progressWidth(period: number, secondsRemaining: number) {
  const ratio = Math.max(0, Math.min(1, secondsRemaining / period));
  return `${Math.round(ratio * 100)}%`;
}
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <h2 class="panel-title">{{ t('codes.title') }}</h2>
      <div class="actions">
        <button class="refresh-btn" :disabled="props.transferring" @click="emit('import')">
          {{ t('codes.import') }}
        </button>
        <button class="refresh-btn" :disabled="props.transferring" @click="emit('export')">
          {{ t('codes.export') }}
        </button>
        <button class="refresh-btn" :disabled="props.transferring" @click="emit('refresh')">
          {{ t('codes.refresh') }}
        </button>
      </div>
    </div>

    <div v-if="props.loading" class="empty-state">{{ t('codes.loading') }}</div>
    <div v-else-if="!props.rows.length" class="empty-state">{{ t('codes.empty') }}</div>

    <ul v-else class="list">
      <li v-for="row in props.rows" :key="row.id" class="row">
        <div class="row-meta">
          <div class="row-title">{{ row.issuer }}</div>
          <div class="row-label">{{ row.label }}</div>
          <div class="row-detail">
            {{ row.algorithm }} · {{ row.digits }} {{ t('unit.digits') }} · {{ row.period }}
            {{ t('unit.seconds') }}
          </div>
        </div>

        <div class="row-code-wrap">
          <div class="row-code">{{ row.code }}</div>
          <div class="row-seconds">
            {{ t('codes.remaining') }} {{ row.secondsRemaining }} {{ t('unit.seconds') }}
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: progressWidth(row.period, row.secondsRemaining) }"
            />
          </div>
        </div>

        <button class="remove-btn" @click="emit('remove', row.id)">
          {{ t('codes.moveToTrash') }}
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.panel {
  border: 1px solid #203055;
  background: linear-gradient(180deg, #111b33 0%, #0b1327 100%);
  border-radius: 14px;
  padding: 18px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-title {
  margin: 0;
  font-size: 20px;
  color: #dbeafe;
}

.refresh-btn {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #3f5e9d;
  color: #dbeafe;
  background: #1a2a4b;
  cursor: pointer;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9fb3d9;
  border: 1px dashed #2a3f6d;
  border-radius: 10px;
}

.list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.row {
  display: grid;
  grid-template-columns: minmax(180px, 1.1fr) minmax(210px, 1fr) auto;
  gap: 14px;
  align-items: center;
  border: 1px solid #2c3f6c;
  border-radius: 12px;
  padding: 12px;
  background: rgba(18, 31, 60, 0.65);
}

.row-title {
  font-size: 15px;
  color: #d7e7ff;
}

.row-label {
  margin-top: 2px;
  color: #9fb3d9;
  word-break: break-all;
}

.row-detail {
  margin-top: 6px;
  color: #7f95c3;
  font-size: 12px;
}

.row-code-wrap {
  text-align: center;
}

.row-code {
  letter-spacing: 2px;
  font-size: 30px;
  font-weight: 700;
  color: #9ef6d5;
  font-variant-numeric: tabular-nums;
}

.row-seconds {
  margin-top: 2px;
  color: #a6bde5;
  font-size: 13px;
}

.progress-track {
  height: 6px;
  border-radius: 100px;
  background: #23385f;
  margin-top: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #58c4ff 0%, #51e3a4 100%);
  transition: width 180ms linear;
}

.remove-btn {
  min-height: 44px;
  min-width: 110px;
  border-radius: 10px;
  border: 1px solid #783756;
  color: #ffd8e6;
  background: #3a1730;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .remove-btn {
    width: 100%;
  }
}
</style>
