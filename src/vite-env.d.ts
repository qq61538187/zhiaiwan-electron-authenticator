/// <reference types="vite/client" />

import type {
  AddAccountPayload,
  AuthAccount,
  AuthCode,
  AppLanguage,
  AppSettings,
  ImportExportResult,
  TrashedAuthAccount
} from './types/auth';

declare global {
  interface Window {
    authenticatorApi: {
      listAccounts: () => Promise<AuthAccount[]>;
      addAccount: (payload: AddAccountPayload) => Promise<AuthAccount>;
      removeAccount: (id: string) => Promise<AuthAccount[]>;
      listTrash: () => Promise<TrashedAuthAccount[]>;
      restoreFromTrash: (id: string) => Promise<{
        restored: boolean;
        accounts: AuthAccount[];
        trash: TrashedAuthAccount[];
      }>;
      clearTrashItem: (id: string) => Promise<TrashedAuthAccount[]>;
      clearTrashAll: (masterPassword?: string) => Promise<TrashedAuthAccount[]>;
      getCodes: () => Promise<AuthCode[]>;
      exportAccounts: () => Promise<ImportExportResult>;
      importAccounts: () => Promise<ImportExportResult>;
      getSettings: () => Promise<AppSettings>;
      setLanguage: (language: AppLanguage) => Promise<AppSettings>;
      setHideTrayIcon: (hideTrayIcon: boolean) => Promise<AppSettings>;
      setLaunchAtLogin: (launchAtLogin: boolean) => Promise<AppSettings>;
      setEnableFloatingBall: (enableFloatingBall: boolean) => Promise<AppSettings>;
      pickFloatingBallBackgroundImage: () => Promise<string | null>;
      saveFloatingBallAppearance: (payload: {
        opacity: number;
        text: string;
        backgroundImage: string | null;
        backgroundColor: string;
      }) => Promise<AppSettings>;
      openRepository: () => Promise<void>;
      openReleases: () => Promise<void>;
      openIssues: () => Promise<void>;
      getAppVersion: () => Promise<string>;
      setMasterPassword: (payload: {
        currentPassword?: string;
        newPassword: string;
      }) => Promise<AppSettings>;
      verifyMasterPassword: (password: string) => Promise<{
        success: boolean;
        errorMessage: string;
        cooldownRemainingMs: number;
      }>;
      getMasterPasswordLockStatus: () => Promise<{
        required: boolean;
        unlocked: boolean;
        cooldownRemainingMs: number;
      }>;
    };
  }
}
