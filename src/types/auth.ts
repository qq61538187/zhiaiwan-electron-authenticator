export interface AuthAccount {
  id: string;
  issuer: string;
  label: string;
  period: number;
  digits: 6 | 8;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
}

export interface TrashedAuthAccount extends AuthAccount {
  deletedAt: number;
}

export type AppLanguage = 'zh-CN' | 'en-US';

export interface AuthCode {
  id: string;
  code: string;
  secondsRemaining: number;
}

export interface AddAccountPayload {
  issuer: string;
  label: string;
  secret: string;
  period: number;
  digits: 6 | 8;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  otpauthUri?: string;
}

export interface ImportExportResult {
  cancelled: boolean;
  message: string;
  imported?: number;
  skipped?: number;
  filePath?: string;
}

export interface AppSettings {
  language: AppLanguage;
  hideTrayIcon: boolean;
  launchAtLogin: boolean;
  enableFloatingBall: boolean;
  floatingBallOpacity: number;
  floatingBallText: string;
  floatingBallBackgroundImage: string | null;
  floatingBallBackgroundColor: string;
  hasMasterPassword: boolean;
}
