import type { AppLanguage } from '../types/auth';

export type MessageKey =
  | 'app.title'
  | 'app.subtitle'
  | 'menu.codes'
  | 'menu.add'
  | 'menu.trash'
  | 'menu.settings'
  | 'menu.aria'
  | 'codes.title'
  | 'codes.import'
  | 'codes.export'
  | 'codes.refresh'
  | 'codes.loading'
  | 'codes.empty'
  | 'codes.remaining'
  | 'codes.moveToTrash'
  | 'add.title'
  | 'add.hint'
  | 'add.issuer'
  | 'add.label'
  | 'add.secret'
  | 'add.digits'
  | 'add.period'
  | 'add.algorithm'
  | 'add.submitting'
  | 'add.submit'
  | 'trash.title'
  | 'trash.empty'
  | 'trash.deletedAt'
  | 'trash.restore'
  | 'trash.clearItem'
  | 'trash.clearAll'
  | 'settings.title'
  | 'settings.description'
  | 'settings.language'
  | 'settings.preferenceTitle'
  | 'settings.summonHotkey'
  | 'settings.enableFloatingBall'
  | 'settings.floatingBallOpacity'
  | 'settings.floatingBallText'
  | 'settings.floatingBallBackgroundColor'
  | 'settings.floatingBallChooseImage'
  | 'settings.floatingBallClearImage'
  | 'settings.unsaved'
  | 'settings.restore'
  | 'settings.confirm'
  | 'settings.hideTrayIcon'
  | 'settings.launchAtLogin'
  | 'settings.securityTitle'
  | 'settings.masterPasswordHint'
  | 'settings.masterPassword'
  | 'settings.currentMasterPassword'
  | 'settings.newMasterPassword'
  | 'settings.confirmMasterPassword'
  | 'settings.saveMasterPassword'
  | 'settings.showPassword'
  | 'settings.hidePassword'
  | 'settings.cancel'
  | 'settings.aboutTitle'
  | 'settings.aboutRepo'
  | 'settings.checkVersion'
  | 'settings.feedback'
  | 'settings.option.zh'
  | 'settings.option.en'
  | 'lock.title'
  | 'lock.hint'
  | 'lock.passwordLabel'
  | 'lock.unlock'
  | 'lock.verifying'
  | 'lock.cooldown'
  | 'notice.movedToTrash'
  | 'notice.restored'
  | 'notice.duplicateRemoved'
  | 'notice.trashItemCleared'
  | 'notice.trashCleared'
  | 'error.loadAccounts'
  | 'error.refreshCode'
  | 'error.addAccount'
  | 'error.removeAccount'
  | 'error.export'
  | 'error.import'
  | 'error.restore'
  | 'error.clearTrash'
  | 'error.saveSettings'
  | 'error.invalidOtpauthProtocol'
  | 'error.onlyTotpSupported'
  | 'error.otpauthMissingSecret'
  | 'error.labelAndSecretRequired'
  | 'error.masterPasswordRequired'
  | 'error.masterPasswordInvalid'
  | 'error.masterPasswordTooShort'
  | 'error.masterPasswordConfirmMismatch'
  | 'error.appLocked'
  | 'message.exportCancelled'
  | 'message.exportSuccess'
  | 'message.importCancelled'
  | 'message.importSummary'
  | 'unit.digits'
  | 'unit.seconds'
  | 'trash.verifyMasterPasswordTitle'
  | 'trash.verifyMasterPasswordHint';

type Messages = Record<AppLanguage, Record<MessageKey, string>>;

export const MESSAGES: Messages = {
  'zh-CN': {
    'app.title': 'authenticator',
    'app.subtitle': '离线 TOTP 验证器',
    'menu.codes': '验证码',
    'menu.add': '添加账号',
    'menu.trash': '回收站',
    'menu.settings': '设置',
    'menu.aria': '主菜单',
    'codes.title': '验证码',
    'codes.import': '导入',
    'codes.export': '导出',
    'codes.refresh': '手动刷新',
    'codes.loading': '加载中...',
    'codes.empty': '还没有账号，请先添加。',
    'codes.remaining': '剩余',
    'codes.moveToTrash': '移入回收站',
    'add.title': '添加账号',
    'add.hint': '支持手动输入或直接粘贴 otpauth URI。',
    'add.issuer': '发行方（Issuer）',
    'add.label': '账号标签（Label）',
    'add.secret': '密钥（Secret）',
    'add.digits': '位数',
    'add.period': '周期（秒）',
    'add.algorithm': '算法',
    'add.submitting': '添加中...',
    'add.submit': '添加账号',
    'trash.title': '回收站',
    'trash.empty': '回收站为空',
    'trash.deletedAt': '删除于',
    'trash.restore': '恢复',
    'trash.clearItem': '永久删除',
    'trash.clearAll': '清空回收站',
    'settings.title': '设置',
    'settings.description': '你可以在这里设置应用语言。',
    'settings.language': '界面语言',
    'settings.preferenceTitle': '使用偏好',
    'settings.summonHotkey': '呼出快捷键',
    'settings.enableFloatingBall': '屏幕悬浮球',
    'settings.floatingBallOpacity': '透明度',
    'settings.floatingBallText': '文字',
    'settings.floatingBallBackgroundColor': '背景颜色',
    'settings.floatingBallChooseImage': '选择背景图片',
    'settings.floatingBallClearImage': '清除背景图片',
    'settings.unsaved': '有未保存修改',
    'settings.restore': '恢复',
    'settings.confirm': '确认',
    'settings.hideTrayIcon': '隐藏菜单栏图标',
    'settings.launchAtLogin': '开机启动',
    'settings.securityTitle': '安全',
    'settings.masterPasswordHint': '主密码用于危险操作验证，例如清空回收站。',
    'settings.masterPassword': '主密码',
    'settings.currentMasterPassword': '当前主密码',
    'settings.newMasterPassword': '新主密码',
    'settings.confirmMasterPassword': '确认主密码',
    'settings.saveMasterPassword': '保存主密码',
    'settings.showPassword': '显示',
    'settings.hidePassword': '隐藏',
    'settings.cancel': '取消',
    'settings.aboutTitle': '关于',
    'settings.aboutRepo': '项目主页（GitHub）',
    'settings.checkVersion': '检查版本',
    'settings.feedback': '问题反馈',
    'settings.option.zh': '中文',
    'settings.option.en': 'English',
    'lock.title': '应用已锁定',
    'lock.hint': '请输入主密码以访问账号和验证码。',
    'lock.passwordLabel': '主密码',
    'lock.unlock': '解锁应用',
    'lock.verifying': '验证中...',
    'lock.cooldown': '输入错误次数过多，请 {seconds} 秒后重试。',
    'notice.movedToTrash': '账号已移入回收站',
    'notice.restored': '账号已从回收站恢复',
    'notice.duplicateRemoved': '账号已存在，回收站副本已移除',
    'notice.trashItemCleared': '已永久删除回收站账号',
    'notice.trashCleared': '回收站已清空',
    'error.loadAccounts': '加载账号失败',
    'error.refreshCode': '刷新验证码失败',
    'error.addAccount': '新增账号失败',
    'error.removeAccount': '删除账号失败',
    'error.export': '导出失败',
    'error.import': '导入失败',
    'error.restore': '恢复失败',
    'error.clearTrash': '清理失败',
    'error.saveSettings': '保存设置失败',
    'error.invalidOtpauthProtocol': 'otpauth URI 协议错误',
    'error.onlyTotpSupported': '当前仅支持 TOTP',
    'error.otpauthMissingSecret': 'otpauth URI 缺少 secret',
    'error.labelAndSecretRequired': 'label 和 secret 不能为空',
    'error.masterPasswordRequired': '请输入主密码',
    'error.masterPasswordInvalid': '主密码错误',
    'error.masterPasswordTooShort': '主密码至少 6 位',
    'error.masterPasswordConfirmMismatch': '两次输入的主密码不一致',
    'error.appLocked': '应用已锁定，请先解锁',
    'message.exportCancelled': '已取消导出',
    'message.exportSuccess': '导出成功',
    'message.importCancelled': '已取消导入',
    'message.importSummary':
      '导入完成，新增 {imported} 条，回收站新增 {importedTrash} 条，跳过 {skipped} 条',
    'unit.digits': '位',
    'unit.seconds': '秒',
    'trash.verifyMasterPasswordTitle': '验证主密码',
    'trash.verifyMasterPasswordHint': '清空回收站属于高风险操作，请先输入主密码。'
  },
  'en-US': {
    'app.title': 'authenticator',
    'app.subtitle': 'Offline TOTP authenticator',
    'menu.codes': 'Codes',
    'menu.add': 'Add Account',
    'menu.trash': 'Trash',
    'menu.settings': 'Settings',
    'menu.aria': 'Main menu',
    'codes.title': 'Verification Codes',
    'codes.import': 'Import',
    'codes.export': 'Export',
    'codes.refresh': 'Refresh',
    'codes.loading': 'Loading...',
    'codes.empty': 'No accounts yet. Add one first.',
    'codes.remaining': 'Remaining',
    'codes.moveToTrash': 'Move to Trash',
    'add.title': 'Add Account',
    'add.hint': 'Support manual input or direct otpauth URI paste.',
    'add.issuer': 'Issuer',
    'add.label': 'Label',
    'add.secret': 'Secret',
    'add.digits': 'Digits',
    'add.period': 'Period (sec)',
    'add.algorithm': 'Algorithm',
    'add.submitting': 'Adding...',
    'add.submit': 'Add Account',
    'trash.title': 'Trash',
    'trash.empty': 'Trash is empty',
    'trash.deletedAt': 'Deleted at',
    'trash.restore': 'Restore',
    'trash.clearItem': 'Delete Permanently',
    'trash.clearAll': 'Empty Trash',
    'settings.title': 'Settings',
    'settings.description': 'Set your app language here.',
    'settings.language': 'Language',
    'settings.preferenceTitle': 'Preferences',
    'settings.summonHotkey': 'Summon hotkey',
    'settings.enableFloatingBall': 'Floating ball',
    'settings.floatingBallOpacity': 'Opacity',
    'settings.floatingBallText': 'Text',
    'settings.floatingBallBackgroundColor': 'Background color',
    'settings.floatingBallChooseImage': 'Choose background image',
    'settings.floatingBallClearImage': 'Clear background image',
    'settings.unsaved': 'Unsaved changes',
    'settings.restore': 'Restore',
    'settings.confirm': 'Confirm',
    'settings.hideTrayIcon': 'Hide menu bar icon',
    'settings.launchAtLogin': 'Launch at login',
    'settings.securityTitle': 'Security',
    'settings.masterPasswordHint':
      'Master password is required for dangerous actions, such as emptying trash.',
    'settings.masterPassword': 'Master password',
    'settings.currentMasterPassword': 'Current master password',
    'settings.newMasterPassword': 'New master password',
    'settings.confirmMasterPassword': 'Confirm master password',
    'settings.saveMasterPassword': 'Save master password',
    'settings.showPassword': 'Show',
    'settings.hidePassword': 'Hide',
    'settings.cancel': 'Cancel',
    'settings.aboutTitle': 'About',
    'settings.aboutRepo': 'Project homepage (GitHub)',
    'settings.checkVersion': 'Check version',
    'settings.feedback': 'Feedback',
    'settings.option.zh': '中文',
    'settings.option.en': 'English',
    'lock.title': 'App is locked',
    'lock.hint': 'Enter the master password to access accounts and codes.',
    'lock.passwordLabel': 'Master password',
    'lock.unlock': 'Unlock app',
    'lock.verifying': 'Verifying...',
    'lock.cooldown': 'Too many failed attempts. Try again in {seconds}s.',
    'notice.movedToTrash': 'Account moved to trash',
    'notice.restored': 'Account restored from trash',
    'notice.duplicateRemoved': 'Account already exists, trash copy removed',
    'notice.trashItemCleared': 'Trash item deleted permanently',
    'notice.trashCleared': 'Trash has been emptied',
    'error.loadAccounts': 'Failed to load accounts',
    'error.refreshCode': 'Failed to refresh codes',
    'error.addAccount': 'Failed to add account',
    'error.removeAccount': 'Failed to remove account',
    'error.export': 'Export failed',
    'error.import': 'Import failed',
    'error.restore': 'Restore failed',
    'error.clearTrash': 'Failed to clear trash',
    'error.saveSettings': 'Failed to save settings',
    'error.invalidOtpauthProtocol': 'Invalid otpauth URI protocol',
    'error.onlyTotpSupported': 'Only TOTP is supported',
    'error.otpauthMissingSecret': 'otpauth URI is missing secret',
    'error.labelAndSecretRequired': 'label and secret are required',
    'error.masterPasswordRequired': 'Master password is required',
    'error.masterPasswordInvalid': 'Invalid master password',
    'error.masterPasswordTooShort': 'Master password must be at least 6 characters',
    'error.masterPasswordConfirmMismatch': 'Master passwords do not match',
    'error.appLocked': 'App is locked, unlock first',
    'message.exportCancelled': 'Export cancelled',
    'message.exportSuccess': 'Export successful',
    'message.importCancelled': 'Import cancelled',
    'message.importSummary':
      'Import completed: {imported} added, {importedTrash} added to trash, {skipped} skipped',
    'unit.digits': 'digits',
    'unit.seconds': 'sec',
    'trash.verifyMasterPasswordTitle': 'Verify master password',
    'trash.verifyMasterPasswordHint':
      'Emptying trash is a high-risk action. Enter master password to continue.'
  }
};
