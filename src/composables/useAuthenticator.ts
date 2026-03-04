import { computed, onUnmounted, shallowRef } from 'vue';
import type { AddAccountPayload, AuthAccount, AuthCode, TrashedAuthAccount } from '../types/auth';
import { useI18n } from './useI18n';

export function useAuthenticator() {
  const { t } = useI18n();
  const accounts = shallowRef<AuthAccount[]>([]);
  const codes = shallowRef<AuthCode[]>([]);
  const trash = shallowRef<TrashedAuthAccount[]>([]);
  const loading = shallowRef(false);
  const submitting = shallowRef(false);
  const transferring = shallowRef(false);
  const errorMessage = shallowRef('');
  const noticeMessage = shallowRef('');
  const NOTICE_TIMEOUT_MS = 3000;

  let refreshTimer: ReturnType<typeof setInterval> | null = null;
  let noticeTimer: ReturnType<typeof setTimeout> | null = null;

  function clearNoticeTimer() {
    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
  }

  function clearNotice() {
    clearNoticeTimer();
    noticeMessage.value = '';
  }

  function setNotice(message: string) {
    clearNoticeTimer();
    noticeMessage.value = message;
    noticeTimer = setTimeout(() => {
      noticeMessage.value = '';
      noticeTimer = null;
    }, NOTICE_TIMEOUT_MS);
  }

  const codeMap = computed(() => {
    return new Map(codes.value.map((row) => [row.id, row]));
  });

  const mergedRows = computed(() => {
    return accounts.value.map((account) => {
      const codeRow = codeMap.value.get(account.id);
      return {
        ...account,
        code: codeRow?.code ?? '------',
        secondsRemaining: codeRow?.secondsRemaining ?? account.period
      };
    });
  });

  async function loadAccounts() {
    loading.value = true;
    errorMessage.value = '';
    clearNotice();
    try {
      accounts.value = await window.authenticatorApi.listAccounts();
      trash.value = await window.authenticatorApi.listTrash();
      await refreshCodes();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('error.loadAccounts');
    } finally {
      loading.value = false;
    }
  }

  async function refreshCodes() {
    try {
      codes.value = await window.authenticatorApi.getCodes();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('error.refreshCode');
    }
  }

  async function addAccount(payload: AddAccountPayload) {
    submitting.value = true;
    errorMessage.value = '';
    clearNotice();
    try {
      await window.authenticatorApi.addAccount(payload);
      await loadAccounts();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('error.addAccount');
      throw error;
    } finally {
      submitting.value = false;
    }
  }

  async function removeAccount(accountId: string) {
    errorMessage.value = '';
    clearNotice();
    try {
      const nextAccounts = await window.authenticatorApi.removeAccount(accountId);
      accounts.value = nextAccounts;
      trash.value = await window.authenticatorApi.listTrash();
      setNotice(t('notice.movedToTrash'));
      await refreshCodes();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('error.removeAccount');
    }
  }

  async function exportAccounts() {
    transferring.value = true;
    errorMessage.value = '';
    clearNotice();
    try {
      const result = await window.authenticatorApi.exportAccounts();
      if (!result.cancelled) {
        const message = result.filePath ? `${result.message}：${result.filePath}` : result.message;
        setNotice(message);
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('error.export');
    } finally {
      transferring.value = false;
    }
  }

  async function importAccounts() {
    transferring.value = true;
    errorMessage.value = '';
    clearNotice();
    try {
      const result = await window.authenticatorApi.importAccounts();
      if (!result.cancelled) {
        setNotice(result.message);
        await loadAccounts();
      }
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('error.import');
    } finally {
      transferring.value = false;
    }
  }

  async function restoreFromTrash(accountId: string) {
    transferring.value = true;
    errorMessage.value = '';
    clearNotice();
    try {
      const result = await window.authenticatorApi.restoreFromTrash(accountId);
      accounts.value = result.accounts;
      trash.value = result.trash;
      setNotice(result.restored ? t('notice.restored') : t('notice.duplicateRemoved'));
      await refreshCodes();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('error.restore');
    } finally {
      transferring.value = false;
    }
  }

  async function clearTrashItem(accountId: string) {
    transferring.value = true;
    errorMessage.value = '';
    clearNotice();
    try {
      trash.value = await window.authenticatorApi.clearTrashItem(accountId);
      setNotice(t('notice.trashItemCleared'));
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('error.clearTrash');
    } finally {
      transferring.value = false;
    }
  }

  async function clearTrashAll(masterPassword?: string) {
    transferring.value = true;
    errorMessage.value = '';
    clearNotice();
    try {
      trash.value = await window.authenticatorApi.clearTrashAll(masterPassword);
      setNotice(t('notice.trashCleared'));
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : t('error.clearTrash');
    } finally {
      transferring.value = false;
    }
  }

  function startAutoRefresh() {
    if (refreshTimer) {
      return;
    }
    refreshTimer = setInterval(() => {
      void refreshCodes();
    }, 1000);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  async function initialize() {
    await loadAccounts();
    startAutoRefresh();
  }

  onUnmounted(() => {
    stopAutoRefresh();
    clearNoticeTimer();
  });

  return {
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
  };
}
