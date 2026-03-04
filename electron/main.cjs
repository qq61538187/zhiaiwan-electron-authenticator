const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  Tray,
  nativeImage,
  globalShortcut,
  screen,
  shell
} = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { authenticator } = require('otplib');
const { APP_NAME, REPOSITORY_URL, RELEASES_URL, ISSUES_URL } = require('./project-meta.cjs');

const DEV_URL = 'http://localhost:5173';
const STORE_FILE_NAME = 'auth-accounts.json';
const SUMMON_SHORTCUT = 'Alt+Space';
const FLOATING_BALL_SNAP_THRESHOLD = 32;
const DEFAULT_FLOATING_BALL_OPACITY = 0.9;
const DEFAULT_FLOATING_BALL_TEXT = 'OTP';
const DEFAULT_FLOATING_BALL_BACKGROUND_COLOR = '#6aa4ff';
const MASTER_PASSWORD_MIN_LENGTH = 6;
const MASTER_PASSWORD_SCRYPT_BYTES = 64;
const MASTER_PASSWORD_MAX_RETRY = 5;
const MASTER_PASSWORD_COOLDOWN_MS = 30 * 1000;
const SUPPORTED_FLOATING_BALL_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
const MAIN_MESSAGES = {
  'zh-CN': {
    exportTitle: '导出认证账号',
    importTitle: '导入认证账号',
    exportCancelled: '已取消导出',
    exportSuccess: '导出成功',
    importCancelled: '已取消导入',
    importSummary: '导入完成，新增 {imported} 条，回收站新增 {importedTrash} 条，跳过 {skipped} 条',
    invalidOtpauthProtocol: 'otpauth URI 协议错误',
    onlyTotpSupported: '当前仅支持 TOTP',
    otpauthMissingSecret: 'otpauth URI 缺少 secret',
    labelAndSecretRequired: 'label 和 secret 不能为空',
    masterPasswordRequired: '请输入主密码',
    masterPasswordInvalid: '主密码错误',
    masterPasswordTooShort: '主密码至少 6 位',
    appLocked: '应用已锁定，请先输入主密码解锁',
    trayTooltip: APP_NAME,
    trayShow: '显示主窗口',
    trayQuit: '退出'
  },
  'en-US': {
    exportTitle: 'Export Auth Accounts',
    importTitle: 'Import Auth Accounts',
    exportCancelled: 'Export cancelled',
    exportSuccess: 'Export successful',
    importCancelled: 'Import cancelled',
    importSummary:
      'Import completed: {imported} added, {importedTrash} added to trash, {skipped} skipped',
    invalidOtpauthProtocol: 'Invalid otpauth URI protocol',
    onlyTotpSupported: 'Only TOTP is supported',
    otpauthMissingSecret: 'otpauth URI is missing secret',
    labelAndSecretRequired: 'label and secret are required',
    masterPasswordRequired: 'Master password is required',
    masterPasswordInvalid: 'Invalid master password',
    masterPasswordTooShort: 'Master password must be at least 6 characters',
    appLocked: 'App is locked. Unlock with master password first',
    trayTooltip: APP_NAME,
    trayShow: 'Show main window',
    trayQuit: 'Quit'
  }
};

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {Tray | null} */
let tray = null;
/** @type {BrowserWindow | null} */
let floatingBallWindow = null;
let masterPasswordFailedAttempts = 0;
let masterPasswordLockedUntil = 0;
let appUnlocked = false;

function getStorePath() {
  return path.join(app.getPath('userData'), STORE_FILE_NAME);
}

function createEmptyStore() {
  return {
    schemaVersion: 2,
    accounts: [],
    trash: [],
    settings: {
      language: 'zh-CN',
      hideTrayIcon: false,
      launchAtLogin: false,
      enableFloatingBall: false,
      floatingBallPosition: null,
      floatingBallOpacity: DEFAULT_FLOATING_BALL_OPACITY,
      floatingBallText: DEFAULT_FLOATING_BALL_TEXT,
      floatingBallBackgroundImage: null,
      floatingBallBackgroundColor: DEFAULT_FLOATING_BALL_BACKGROUND_COLOR,
      masterPasswordHash: null,
      masterPasswordSalt: null
    }
  };
}

function readStore() {
  const storePath = getStorePath();
  if (!fs.existsSync(storePath)) {
    return createEmptyStore();
  }

  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const parsed = JSON.parse(raw);

    // Backward compatibility: old format was just an array of accounts.
    if (Array.isArray(parsed)) {
      return {
        schemaVersion: 2,
        accounts: parsed,
        trash: [],
        settings: {
          language: 'zh-CN',
          hideTrayIcon: false,
          launchAtLogin: false,
          enableFloatingBall: false,
          floatingBallPosition: null,
          floatingBallOpacity: DEFAULT_FLOATING_BALL_OPACITY,
          floatingBallText: DEFAULT_FLOATING_BALL_TEXT,
          floatingBallBackgroundImage: null,
          floatingBallBackgroundColor: DEFAULT_FLOATING_BALL_BACKGROUND_COLOR,
          masterPasswordHash: null,
          masterPasswordSalt: null
        }
      };
    }

    return {
      schemaVersion: 2,
      accounts: Array.isArray(parsed?.accounts) ? parsed.accounts : [],
      trash: Array.isArray(parsed?.trash) ? parsed.trash : [],
      settings: {
        language: parsed?.settings?.language === 'en-US' ? 'en-US' : 'zh-CN',
        hideTrayIcon: Boolean(parsed?.settings?.hideTrayIcon),
        launchAtLogin: Boolean(parsed?.settings?.launchAtLogin),
        enableFloatingBall: Boolean(parsed?.settings?.enableFloatingBall),
        floatingBallPosition:
          parsed?.settings?.floatingBallPosition &&
          Number.isFinite(Number(parsed.settings.floatingBallPosition.x)) &&
          Number.isFinite(Number(parsed.settings.floatingBallPosition.y))
            ? {
                x: Number(parsed.settings.floatingBallPosition.x),
                y: Number(parsed.settings.floatingBallPosition.y)
              }
            : null,
        floatingBallOpacity: normalizeFloatingBallOpacity(parsed?.settings?.floatingBallOpacity),
        floatingBallText: normalizeFloatingBallText(parsed?.settings?.floatingBallText),
        floatingBallBackgroundImage: normalizeFloatingBallBackgroundImage(
          parsed?.settings?.floatingBallBackgroundImage
        ),
        floatingBallBackgroundColor: normalizeFloatingBallBackgroundColor(
          parsed?.settings?.floatingBallBackgroundColor
        ),
        masterPasswordHash: normalizeMasterPasswordHash(parsed?.settings?.masterPasswordHash),
        masterPasswordSalt: normalizeMasterPasswordSalt(parsed?.settings?.masterPasswordSalt)
      }
    };
  } catch {
    return createEmptyStore();
  }
}

function writeStore(store) {
  fs.writeFileSync(getStorePath(), JSON.stringify(store, null, 2), 'utf8');
}

function readAccounts() {
  return readStore().accounts;
}

function readTrash() {
  return readStore().trash;
}

function writeAccounts(accounts) {
  const store = readStore();
  writeStore({
    ...store,
    accounts
  });
}

function writeTrash(trash) {
  const store = readStore();
  writeStore({
    ...store,
    trash
  });
}

function normalizeFloatingBallOpacity(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_FLOATING_BALL_OPACITY;
  }
  return Math.max(0.2, Math.min(1, numeric));
}

function normalizeFloatingBallText(value) {
  const text = String(value ?? '').trim();
  if (!text) {
    return DEFAULT_FLOATING_BALL_TEXT;
  }
  return text.slice(0, 8);
}

function normalizeFloatingBallBackgroundImage(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  return value;
}

function normalizeFloatingBallBackgroundColor(value) {
  const color = String(value ?? '')
    .trim()
    .toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(color)) {
    return color;
  }
  return DEFAULT_FLOATING_BALL_BACKGROUND_COLOR;
}

function normalizeMasterPasswordHash(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  return value.trim();
}

function normalizeMasterPasswordSalt(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  return value.trim();
}

function hashMasterPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, MASTER_PASSWORD_SCRYPT_BYTES).toString('hex');
}

function createMasterPasswordSecret(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashMasterPassword(plainPassword, salt);
  return { hash, salt };
}

function hexToRgba(hex, alpha) {
  const safeHex = normalizeFloatingBallBackgroundColor(hex);
  const r = Number.parseInt(safeHex.slice(1, 3), 16);
  const g = Number.parseInt(safeHex.slice(3, 5), 16);
  const b = Number.parseInt(safeHex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function readSettings() {
  const store = readStore();
  const masterPasswordHash = normalizeMasterPasswordHash(store.settings?.masterPasswordHash);
  const masterPasswordSalt = normalizeMasterPasswordSalt(store.settings?.masterPasswordSalt);
  return {
    language: store.settings?.language === 'en-US' ? 'en-US' : 'zh-CN',
    hideTrayIcon: Boolean(store.settings?.hideTrayIcon),
    launchAtLogin: Boolean(store.settings?.launchAtLogin),
    enableFloatingBall: Boolean(store.settings?.enableFloatingBall),
    floatingBallPosition:
      store.settings?.floatingBallPosition &&
      Number.isFinite(Number(store.settings.floatingBallPosition.x)) &&
      Number.isFinite(Number(store.settings.floatingBallPosition.y))
        ? {
            x: Number(store.settings.floatingBallPosition.x),
            y: Number(store.settings.floatingBallPosition.y)
          }
        : null,
    floatingBallOpacity: normalizeFloatingBallOpacity(store.settings?.floatingBallOpacity),
    floatingBallText: normalizeFloatingBallText(store.settings?.floatingBallText),
    floatingBallBackgroundImage: normalizeFloatingBallBackgroundImage(
      store.settings?.floatingBallBackgroundImage
    ),
    floatingBallBackgroundColor: normalizeFloatingBallBackgroundColor(
      store.settings?.floatingBallBackgroundColor
    ),
    hasMasterPassword: Boolean(masterPasswordHash && masterPasswordSalt)
  };
}

function writeSettings(settings) {
  const store = readStore();
  const prevHash = normalizeMasterPasswordHash(store.settings?.masterPasswordHash);
  const prevSalt = normalizeMasterPasswordSalt(store.settings?.masterPasswordSalt);
  const nextHash =
    settings?.masterPasswordHash === null
      ? null
      : (normalizeMasterPasswordHash(settings?.masterPasswordHash) ?? prevHash);
  const nextSalt =
    settings?.masterPasswordSalt === null
      ? null
      : (normalizeMasterPasswordSalt(settings?.masterPasswordSalt) ?? prevSalt);
  const next = {
    language: settings?.language === 'en-US' ? 'en-US' : 'zh-CN',
    hideTrayIcon: Boolean(settings?.hideTrayIcon),
    launchAtLogin: Boolean(settings?.launchAtLogin),
    enableFloatingBall: Boolean(settings?.enableFloatingBall),
    floatingBallPosition:
      settings?.floatingBallPosition &&
      Number.isFinite(Number(settings.floatingBallPosition.x)) &&
      Number.isFinite(Number(settings.floatingBallPosition.y))
        ? {
            x: Number(settings.floatingBallPosition.x),
            y: Number(settings.floatingBallPosition.y)
          }
        : null,
    floatingBallOpacity: normalizeFloatingBallOpacity(settings?.floatingBallOpacity),
    floatingBallText: normalizeFloatingBallText(settings?.floatingBallText),
    floatingBallBackgroundImage: normalizeFloatingBallBackgroundImage(
      settings?.floatingBallBackgroundImage
    ),
    floatingBallBackgroundColor: normalizeFloatingBallBackgroundColor(
      settings?.floatingBallBackgroundColor
    ),
    masterPasswordHash: nextHash,
    masterPasswordSalt: nextSalt
  };
  writeStore({
    ...store,
    settings: next
  });
  return next;
}

function getCurrentLanguage() {
  return readSettings().language === 'en-US' ? 'en-US' : 'zh-CN';
}

function tMain(key) {
  return MAIN_MESSAGES[getCurrentLanguage()][key] || key;
}

function formatMain(key, params) {
  let text = tMain(key);
  Object.keys(params || {}).forEach((paramKey) => {
    text = text.replace(`{${paramKey}}`, String(params[paramKey]));
  });
  return text;
}

function getMasterPasswordSecret() {
  const store = readStore();
  const hash = normalizeMasterPasswordHash(store.settings?.masterPasswordHash);
  const salt = normalizeMasterPasswordSalt(store.settings?.masterPasswordSalt);
  if (!hash || !salt) {
    return null;
  }
  return { hash, salt };
}

function verifyMasterPassword(password) {
  const secret = getMasterPasswordSecret();
  if (!secret) {
    return true;
  }
  const hash = hashMasterPassword(String(password || ''), secret.salt);
  return hash === secret.hash;
}

function getMasterPasswordCooldownRemainingMs() {
  const remaining = masterPasswordLockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

function assertAppUnlocked() {
  if (getMasterPasswordSecret() && !appUnlocked) {
    throw new Error(tMain('appLocked'));
  }
}

function toggleMainWindowVisibility() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }

  if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide();
    return;
  }

  showMainWindow();
}

function showMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    return;
  }
  createWindow();
}

function buildTrayIcon() {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">',
    '<rect x="1" y="1" width="14" height="14" rx="3" fill="#4F8DFF"/>',
    '<path d="M4 6h8v2H4zM4 9h8v2H4z" fill="#FFFFFF"/>',
    '</svg>'
  ].join('');
  const icon = nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  );
  return icon.resize({ width: 16, height: 16 });
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: tMain('trayShow'),
      click: () => showMainWindow()
    },
    { type: 'separator' },
    {
      label: tMain('trayQuit'),
      click: () => app.quit()
    }
  ]);
}

function registerSummonShortcut() {
  globalShortcut.unregister(SUMMON_SHORTCUT);
  globalShortcut.register(SUMMON_SHORTCUT, () => {
    toggleMainWindowVisibility();
  });
}

function syncLaunchAtLogin() {
  const settings = readSettings();
  if (process.platform === 'darwin') {
    app.setLoginItemSettings({
      openAtLogin: settings.launchAtLogin,
      openAsHidden: true
    });
    return;
  }

  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: settings.launchAtLogin
    });
  }
}

function persistFloatingBallPosition(x, y) {
  const current = readSettings();
  writeSettings({
    language: current.language,
    hideTrayIcon: current.hideTrayIcon,
    launchAtLogin: current.launchAtLogin,
    enableFloatingBall: current.enableFloatingBall,
    floatingBallPosition: { x, y },
    floatingBallOpacity: current.floatingBallOpacity,
    floatingBallText: current.floatingBallText,
    floatingBallBackgroundImage: current.floatingBallBackgroundImage,
    floatingBallBackgroundColor: current.floatingBallBackgroundColor
  });
}

function snapFloatingBallToEdge() {
  if (!floatingBallWindow || floatingBallWindow.isDestroyed()) {
    return;
  }

  const [x, y] = floatingBallWindow.getPosition();
  const [width, height] = floatingBallWindow.getSize();
  const display = screen.getDisplayMatching({ x, y, width, height });
  const { x: areaX, y: areaY, width: areaW, height: areaH } = display.workArea;

  const minX = areaX;
  const maxX = areaX + areaW - width;
  const minY = areaY;
  const maxY = areaY + areaH - height;

  const clampedX = Math.max(minX, Math.min(x, maxX));
  const clampedY = Math.max(minY, Math.min(y, maxY));
  const distanceToLeft = Math.abs(clampedX - minX);
  const distanceToRight = Math.abs(maxX - clampedX);
  const shouldSnapLeft = distanceToLeft <= FLOATING_BALL_SNAP_THRESHOLD;
  const shouldSnapRight = distanceToRight <= FLOATING_BALL_SNAP_THRESHOLD;

  let targetX = clampedX;
  if (shouldSnapLeft || shouldSnapRight) {
    targetX = distanceToLeft <= distanceToRight ? minX : maxX;
  }

  floatingBallWindow.setPosition(targetX, clampedY);
  persistFloatingBallPosition(targetX, clampedY);
}

function getFloatingBallHtml() {
  const settings = readSettings();
  const opacityPercent = Math.round(settings.floatingBallOpacity * 100) / 100;
  const safeText = settings.floatingBallText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const backgroundStyle = [
    `background-color:${settings.floatingBallBackgroundColor};`,
    settings.floatingBallBackgroundImage
      ? `background-image:linear-gradient(${hexToRgba(settings.floatingBallBackgroundColor, 0.5)}, ${hexToRgba(settings.floatingBallBackgroundColor, 0.5)}),url('${settings.floatingBallBackgroundImage.replace(/'/g, "\\'")}');`
      : 'background-image:none;',
    'background-size:cover;',
    'background-position:center;',
    `background-blend-mode:${settings.floatingBallBackgroundImage ? 'multiply' : 'normal'};`
  ].join('');

  return `<!doctype html><html><body style="margin:0;overflow:hidden;background:transparent;">
  <button id="ball" style="width:56px;height:56px;border:none;border-radius:50%;cursor:grab;
  ${backgroundStyle}opacity:${opacityPercent};color:#fff;font-weight:700;font-size:12px;
  box-shadow:0 6px 16px rgba(0,0,0,.28);user-select:none;-webkit-user-select:none;">${safeText}</button>
  <script>
    const ball = document.getElementById('ball');
    let dragging = false;
    let moved = false;
    let offsetX = 0;
    let offsetY = 0;
    let downAt = 0;

    function onMouseMove(event) {
      if (!dragging) return;
      const nextX = event.screenX - offsetX;
      const nextY = event.screenY - offsetY;
      window.moveTo(nextX, nextY);
      moved = true;
    }

    function onMouseUp() {
      if (!dragging) return;
      dragging = false;
      ball.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (moved) {
        location.href = 'app://snap-floating-ball';
        return;
      }
      if (Date.now() - downAt < 220) {
        location.href = 'app://show-main';
      }
    }

    ball.addEventListener('mousedown', (event) => {
      dragging = true;
      moved = false;
      downAt = Date.now();
      offsetX = event.clientX;
      offsetY = event.clientY;
      ball.style.cursor = 'grabbing';
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  </script>
  </body></html>`;
}

function refreshFloatingBallAppearance() {
  if (!floatingBallWindow || floatingBallWindow.isDestroyed()) {
    return;
  }
  const html = getFloatingBallHtml();
  floatingBallWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function createFloatingBallWindow() {
  if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
    return floatingBallWindow;
  }

  floatingBallWindow = new BrowserWindow({
    width: 56,
    height: 56,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    fullscreenable: false,
    webPreferences: {
      sandbox: true
    }
  });

  floatingBallWindow.setAlwaysOnTop(true, 'screen-saver');
  floatingBallWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  const settings = readSettings();
  if (settings.floatingBallPosition) {
    floatingBallWindow.setPosition(
      settings.floatingBallPosition.x,
      settings.floatingBallPosition.y
    );
  } else {
    floatingBallWindow.setPosition(30, 120);
  }

  const html = getFloatingBallHtml();
  floatingBallWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  floatingBallWindow.webContents.on('will-navigate', (event, url) => {
    if (url === 'app://show-main') {
      event.preventDefault();
      showMainWindow();
      return;
    }

    if (url === 'app://snap-floating-ball') {
      event.preventDefault();
      snapFloatingBallToEdge();
    }
  });

  floatingBallWindow.on('closed', () => {
    floatingBallWindow = null;
  });

  snapFloatingBallToEdge();

  return floatingBallWindow;
}

function syncFloatingBallVisibility() {
  const settings = readSettings();
  if (!settings.enableFloatingBall) {
    if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
      floatingBallWindow.close();
      floatingBallWindow = null;
    }
    return;
  }
  createFloatingBallWindow();
}

function syncTrayVisibility() {
  const settings = readSettings();
  if (settings.hideTrayIcon) {
    if (tray) {
      tray.destroy();
      tray = null;
    }
    return;
  }

  if (!tray) {
    tray = new Tray(buildTrayIcon());
    tray.on('click', () => showMainWindow());
  }
  tray.setToolTip(tMain('trayTooltip'));
  tray.setContextMenu(buildTrayMenu());
}

function sanitizeSecret(secret) {
  return String(secret || '')
    .replace(/[\s-]+/g, '')
    .toUpperCase();
}

function parseOtpauthUri(uri) {
  if (!uri) {
    return null;
  }

  const url = new URL(uri);
  if (url.protocol !== 'otpauth:') {
    throw new Error(tMain('invalidOtpauthProtocol'));
  }

  const type = url.hostname;
  if (type !== 'totp') {
    throw new Error(tMain('onlyTotpSupported'));
  }

  const rawLabel = decodeURIComponent(url.pathname.replace(/^\//, ''));
  const secret = sanitizeSecret(url.searchParams.get('secret'));
  if (!secret) {
    throw new Error(tMain('otpauthMissingSecret'));
  }

  const issuerFromQuery = url.searchParams.get('issuer') || '';
  const [issuerFromLabel, labelValue] = rawLabel.includes(':')
    ? rawLabel.split(':', 2)
    : ['', rawLabel];

  const period = Number(url.searchParams.get('period') || 30);
  const digits = Number(url.searchParams.get('digits') || 6);
  const algorithm = String(url.searchParams.get('algorithm') || 'SHA1').toUpperCase();

  return {
    issuer: issuerFromQuery || issuerFromLabel || 'Google',
    label: labelValue || 'Unnamed',
    secret,
    period: Number.isFinite(period) && period > 0 ? period : 30,
    digits: digits === 8 ? 8 : 6,
    algorithm: ['SHA1', 'SHA256', 'SHA512'].includes(algorithm) ? algorithm : 'SHA1'
  };
}

function normalizeAccountPayload(payload) {
  const parsedFromUri = parseOtpauthUri(payload.otpauthUri || '');
  const source = parsedFromUri || payload;
  const secret = sanitizeSecret(source.secret);

  if (!source.label || !secret) {
    throw new Error(tMain('labelAndSecretRequired'));
  }

  return {
    id: crypto.randomUUID(),
    issuer: String(source.issuer || 'Google'),
    label: String(source.label),
    secret,
    period: Number(source.period) > 0 ? Number(source.period) : 30,
    digits: Number(source.digits) === 8 ? 8 : 6,
    algorithm: ['SHA1', 'SHA256', 'SHA512'].includes(String(source.algorithm || '').toUpperCase())
      ? String(source.algorithm).toUpperCase()
      : 'SHA1',
    createdAt: Date.now()
  };
}

function toPublicAccount(account) {
  return {
    id: account.id,
    issuer: account.issuer,
    label: account.label,
    period: account.period,
    digits: account.digits,
    algorithm: account.algorithm
  };
}

function toPublicTrashAccount(account) {
  return {
    id: account.id,
    issuer: account.issuer,
    label: account.label,
    period: account.period,
    digits: account.digits,
    algorithm: account.algorithm,
    deletedAt: Number(account.deletedAt) || Date.now()
  };
}

function sortTrashByDeletedAtDesc(trash) {
  return [...trash].sort((a, b) => {
    const aTime = Number(a.deletedAt) || 0;
    const bTime = Number(b.deletedAt) || 0;
    return bTime - aTime;
  });
}

function getCodeRows() {
  const accounts = readAccounts();

  return accounts.map((account) => {
    const algorithmMap = {
      SHA1: 'sha1',
      SHA256: 'sha256',
      SHA512: 'sha512'
    };
    const otplibAlgorithm = algorithmMap[account.algorithm] || 'sha1';

    authenticator.options = {
      step: account.period,
      digits: account.digits,
      algorithm: otplibAlgorithm
    };

    const code = authenticator.generate(account.secret);
    const secondsRemaining = account.period - (Math.floor(Date.now() / 1000) % account.period);

    return {
      id: account.id,
      code,
      secondsRemaining
    };
  });
}

function registerIpcHandlers() {
  ipcMain.handle('app:external:open-repository', async () => {
    if (REPOSITORY_URL) {
      await shell.openExternal(REPOSITORY_URL);
    }
  });

  ipcMain.handle('app:external:open-releases', async () => {
    if (RELEASES_URL) {
      await shell.openExternal(RELEASES_URL);
    }
  });

  ipcMain.handle('app:external:open-issues', async () => {
    if (ISSUES_URL) {
      await shell.openExternal(ISSUES_URL);
    }
  });

  ipcMain.handle('app:version:get', async () => {
    return app.getVersion();
  });

  ipcMain.handle('app:security:set-master-password', async (_event, payload) => {
    const currentPassword = String(payload?.currentPassword || '');
    const newPassword = String(payload?.newPassword || '');
    const hasExisting = Boolean(getMasterPasswordSecret());

    if (hasExisting && !currentPassword) {
      throw new Error(tMain('masterPasswordRequired'));
    }
    if (hasExisting && !verifyMasterPassword(currentPassword)) {
      throw new Error(tMain('masterPasswordInvalid'));
    }
    if (newPassword.trim().length < MASTER_PASSWORD_MIN_LENGTH) {
      throw new Error(tMain('masterPasswordTooShort'));
    }

    const nextSecret = createMasterPasswordSecret(newPassword);
    const current = readSettings();
    writeSettings({
      language: current.language,
      hideTrayIcon: current.hideTrayIcon,
      launchAtLogin: current.launchAtLogin,
      enableFloatingBall: current.enableFloatingBall,
      floatingBallPosition: current.floatingBallPosition,
      floatingBallOpacity: current.floatingBallOpacity,
      floatingBallText: current.floatingBallText,
      floatingBallBackgroundImage: current.floatingBallBackgroundImage,
      floatingBallBackgroundColor: current.floatingBallBackgroundColor,
      masterPasswordHash: nextSecret.hash,
      masterPasswordSalt: nextSecret.salt
    });
    appUnlocked = true;
    masterPasswordFailedAttempts = 0;
    masterPasswordLockedUntil = 0;
    return readSettings();
  });

  ipcMain.handle('app:security:get-lock-status', async () => {
    return {
      required: Boolean(getMasterPasswordSecret()),
      unlocked: appUnlocked || !getMasterPasswordSecret(),
      cooldownRemainingMs: getMasterPasswordCooldownRemainingMs()
    };
  });

  ipcMain.handle('app:security:verify-master-password', async (_event, password) => {
    const required = Boolean(getMasterPasswordSecret());
    if (!required) {
      return {
        success: true,
        errorMessage: '',
        cooldownRemainingMs: 0
      };
    }

    const cooldownRemainingMs = getMasterPasswordCooldownRemainingMs();
    if (cooldownRemainingMs > 0) {
      return {
        success: false,
        errorMessage: tMain('masterPasswordInvalid'),
        cooldownRemainingMs
      };
    }

    if (verifyMasterPassword(password)) {
      appUnlocked = true;
      masterPasswordFailedAttempts = 0;
      masterPasswordLockedUntil = 0;
      return {
        success: true,
        errorMessage: '',
        cooldownRemainingMs: 0
      };
    }

    masterPasswordFailedAttempts += 1;
    if (masterPasswordFailedAttempts >= MASTER_PASSWORD_MAX_RETRY) {
      masterPasswordFailedAttempts = 0;
      masterPasswordLockedUntil = Date.now() + MASTER_PASSWORD_COOLDOWN_MS;
    }

    return {
      success: false,
      errorMessage: tMain('masterPasswordInvalid'),
      cooldownRemainingMs: getMasterPasswordCooldownRemainingMs()
    };
  });

  ipcMain.handle('app:settings:get', async () => {
    return readSettings();
  });

  ipcMain.handle('app:settings:set-language', async (_event, language) => {
    const current = readSettings();
    writeSettings({
      language: language === 'en-US' ? 'en-US' : 'zh-CN',
      hideTrayIcon: current.hideTrayIcon,
      launchAtLogin: current.launchAtLogin,
      enableFloatingBall: current.enableFloatingBall,
      floatingBallPosition: current.floatingBallPosition,
      floatingBallOpacity: current.floatingBallOpacity,
      floatingBallText: current.floatingBallText,
      floatingBallBackgroundImage: current.floatingBallBackgroundImage,
      floatingBallBackgroundColor: current.floatingBallBackgroundColor
    });
    syncTrayVisibility();
    return readSettings();
  });

  ipcMain.handle('app:settings:set-hide-tray-icon', async (_event, hideTrayIcon) => {
    const current = readSettings();
    writeSettings({
      language: current.language,
      hideTrayIcon: Boolean(hideTrayIcon),
      launchAtLogin: current.launchAtLogin,
      enableFloatingBall: current.enableFloatingBall,
      floatingBallPosition: current.floatingBallPosition,
      floatingBallOpacity: current.floatingBallOpacity,
      floatingBallText: current.floatingBallText,
      floatingBallBackgroundImage: current.floatingBallBackgroundImage,
      floatingBallBackgroundColor: current.floatingBallBackgroundColor
    });
    syncTrayVisibility();
    return readSettings();
  });

  ipcMain.handle('app:settings:set-launch-at-login', async (_event, launchAtLogin) => {
    const current = readSettings();
    writeSettings({
      language: current.language,
      hideTrayIcon: current.hideTrayIcon,
      launchAtLogin: Boolean(launchAtLogin),
      enableFloatingBall: current.enableFloatingBall,
      floatingBallPosition: current.floatingBallPosition,
      floatingBallOpacity: current.floatingBallOpacity,
      floatingBallText: current.floatingBallText,
      floatingBallBackgroundImage: current.floatingBallBackgroundImage,
      floatingBallBackgroundColor: current.floatingBallBackgroundColor
    });
    syncLaunchAtLogin();
    return readSettings();
  });

  ipcMain.handle('app:settings:set-enable-floating-ball', async (_event, enableFloatingBall) => {
    const current = readSettings();
    writeSettings({
      language: current.language,
      hideTrayIcon: current.hideTrayIcon,
      launchAtLogin: current.launchAtLogin,
      enableFloatingBall: Boolean(enableFloatingBall),
      floatingBallPosition: current.floatingBallPosition,
      floatingBallOpacity: current.floatingBallOpacity,
      floatingBallText: current.floatingBallText,
      floatingBallBackgroundImage: current.floatingBallBackgroundImage,
      floatingBallBackgroundColor: current.floatingBallBackgroundColor
    });
    syncFloatingBallVisibility();
    return readSettings();
  });

  ipcMain.handle('app:settings:pick-floating-ball-background-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        {
          name: 'Images',
          extensions: SUPPORTED_FLOATING_BALL_IMAGE_EXTENSIONS
        }
      ]
    });

    if (result.canceled || !result.filePaths.length) {
      return null;
    }

    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).replace('.', '').toLowerCase();
    const mimeMap = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif'
    };
    const mime = mimeMap[ext];
    if (!mime) {
      return null;
    }

    const fileBuffer = fs.readFileSync(filePath);
    return `data:${mime};base64,${fileBuffer.toString('base64')}`;
  });

  ipcMain.handle('app:settings:save-floating-ball-appearance', async (_event, payload) => {
    const current = readSettings();
    writeSettings({
      language: current.language,
      hideTrayIcon: current.hideTrayIcon,
      launchAtLogin: current.launchAtLogin,
      enableFloatingBall: current.enableFloatingBall,
      floatingBallPosition: current.floatingBallPosition,
      floatingBallOpacity: normalizeFloatingBallOpacity(payload?.opacity),
      floatingBallText: normalizeFloatingBallText(payload?.text),
      floatingBallBackgroundImage: normalizeFloatingBallBackgroundImage(payload?.backgroundImage),
      floatingBallBackgroundColor: normalizeFloatingBallBackgroundColor(payload?.backgroundColor)
    });
    refreshFloatingBallAppearance();
    return readSettings();
  });

  ipcMain.handle('auth:list', async () => {
    assertAppUnlocked();
    return readAccounts().map(toPublicAccount);
  });

  ipcMain.handle('auth:add', async (_event, payload) => {
    assertAppUnlocked();
    const accounts = readAccounts();
    const normalized = normalizeAccountPayload(payload || {});
    accounts.push(normalized);
    writeAccounts(accounts);
    return toPublicAccount(normalized);
  });

  ipcMain.handle('auth:remove', async (_event, id) => {
    assertAppUnlocked();
    const accounts = readAccounts();
    const removed = accounts.find((account) => account.id === id);
    const next = accounts.filter((account) => account.id !== id);
    writeAccounts(next);
    if (removed) {
      const trash = readTrash();
      trash.unshift({
        ...removed,
        deletedAt: Date.now()
      });
      writeTrash(sortTrashByDeletedAtDesc(trash));
    }
    return next.map(toPublicAccount);
  });

  ipcMain.handle('auth:trash:list', async () => {
    assertAppUnlocked();
    return sortTrashByDeletedAtDesc(readTrash()).map(toPublicTrashAccount);
  });

  ipcMain.handle('auth:trash:restore', async (_event, id) => {
    assertAppUnlocked();
    const trash = sortTrashByDeletedAtDesc(readTrash());
    const accounts = readAccounts();
    const trashItem = trash.find((item) => item.id === id);
    if (!trashItem) {
      return {
        restored: false,
        accounts: accounts.map(toPublicAccount),
        trash: sortTrashByDeletedAtDesc(trash).map(toPublicTrashAccount)
      };
    }

    const dedupeKey = `${trashItem.issuer}::${trashItem.label}::${trashItem.secret}`;
    const existsInActive = accounts.some(
      (item) => `${item.issuer}::${item.label}::${item.secret}` === dedupeKey
    );

    const nextTrash = sortTrashByDeletedAtDesc(trash.filter((item) => item.id !== id));
    let restored = false;

    if (!existsInActive) {
      accounts.unshift({
        id: trashItem.id,
        issuer: trashItem.issuer,
        label: trashItem.label,
        secret: trashItem.secret,
        period: trashItem.period,
        digits: trashItem.digits,
        algorithm: trashItem.algorithm,
        createdAt: Number(trashItem.createdAt) || Date.now()
      });
      restored = true;
    }

    writeStore({
      schemaVersion: 2,
      accounts,
      trash: nextTrash,
      settings: readStore().settings
    });

    return {
      restored,
      accounts: accounts.map(toPublicAccount),
      trash: sortTrashByDeletedAtDesc(nextTrash).map(toPublicTrashAccount)
    };
  });

  ipcMain.handle('auth:trash:clear-item', async (_event, id) => {
    assertAppUnlocked();
    const trash = sortTrashByDeletedAtDesc(readTrash());
    const nextTrash = sortTrashByDeletedAtDesc(trash.filter((item) => item.id !== id));
    writeTrash(nextTrash);
    return sortTrashByDeletedAtDesc(nextTrash).map(toPublicTrashAccount);
  });

  ipcMain.handle('auth:trash:clear-all', async (_event, masterPassword) => {
    assertAppUnlocked();
    if (getMasterPasswordSecret()) {
      if (!String(masterPassword || '').trim()) {
        throw new Error(tMain('masterPasswordRequired'));
      }
      if (!verifyMasterPassword(masterPassword)) {
        throw new Error(tMain('masterPasswordInvalid'));
      }
    }
    writeTrash([]);
    return [];
  });

  ipcMain.handle('auth:codes', async () => {
    assertAppUnlocked();
    return getCodeRows();
  });

  ipcMain.handle('auth:export', async () => {
    assertAppUnlocked();
    const defaultPath = path.join(
      app.getPath('documents'),
      `zhiaiwan-auth-backup-${Date.now()}.json`
    );
    const result = await dialog.showSaveDialog(mainWindow, {
      title: tMain('exportTitle'),
      defaultPath,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (result.canceled || !result.filePath) {
      return {
        cancelled: true,
        message: tMain('exportCancelled')
      };
    }

    const payload = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      accounts: readAccounts(),
      trash: readTrash(),
      settings: readSettings()
    };

    fs.writeFileSync(result.filePath, JSON.stringify(payload, null, 2), 'utf8');

    return {
      cancelled: false,
      message: tMain('exportSuccess'),
      filePath: result.filePath
    };
  });

  ipcMain.handle('auth:import', async () => {
    assertAppUnlocked();
    const result = await dialog.showOpenDialog(mainWindow, {
      title: tMain('importTitle'),
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }]
    });

    if (result.canceled || !result.filePaths.length) {
      return {
        cancelled: true,
        message: tMain('importCancelled')
      };
    }

    const importPath = result.filePaths[0];
    const raw = fs.readFileSync(importPath, 'utf8');
    const parsed = JSON.parse(raw);
    const sourceAccounts = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.accounts)
        ? parsed.accounts
        : [];
    const sourceTrash = Array.isArray(parsed?.trash) ? parsed.trash : [];

    const currentAccounts = readAccounts();
    const currentTrash = sortTrashByDeletedAtDesc(readTrash());
    const dedupeSet = new Set(
      [...currentAccounts, ...currentTrash].map(
        (account) => `${account.issuer}::${account.label}::${account.secret}`
      )
    );

    let imported = 0;
    let skipped = 0;
    let importedTrash = 0;

    sourceAccounts.forEach((item) => {
      try {
        const normalized = normalizeAccountPayload(item || {});
        const dedupeKey = `${normalized.issuer}::${normalized.label}::${normalized.secret}`;
        if (dedupeSet.has(dedupeKey)) {
          skipped += 1;
          return;
        }

        dedupeSet.add(dedupeKey);
        currentAccounts.push(normalized);
        imported += 1;
      } catch {
        skipped += 1;
      }
    });

    sourceTrash.forEach((item) => {
      try {
        const normalized = normalizeAccountPayload(item || {});
        const dedupeKey = `${normalized.issuer}::${normalized.label}::${normalized.secret}`;
        if (dedupeSet.has(dedupeKey)) {
          skipped += 1;
          return;
        }

        dedupeSet.add(dedupeKey);
        currentTrash.push({
          ...normalized,
          deletedAt: Number(item?.deletedAt) || Date.now()
        });
        importedTrash += 1;
      } catch {
        skipped += 1;
      }
    });

    writeStore({
      schemaVersion: 2,
      accounts: currentAccounts,
      trash: sortTrashByDeletedAtDesc(currentTrash),
      settings: {
        language: parsed?.settings?.language === 'en-US' ? 'en-US' : readSettings().language,
        hideTrayIcon: parsed?.settings?.hideTrayIcon === true ? true : readSettings().hideTrayIcon,
        launchAtLogin:
          parsed?.settings?.launchAtLogin === true ? true : readSettings().launchAtLogin,
        enableFloatingBall:
          parsed?.settings?.enableFloatingBall === true ? true : readSettings().enableFloatingBall,
        floatingBallPosition:
          parsed?.settings?.floatingBallPosition &&
          Number.isFinite(Number(parsed.settings.floatingBallPosition.x)) &&
          Number.isFinite(Number(parsed.settings.floatingBallPosition.y))
            ? {
                x: Number(parsed.settings.floatingBallPosition.x),
                y: Number(parsed.settings.floatingBallPosition.y)
              }
            : readSettings().floatingBallPosition,
        floatingBallOpacity: normalizeFloatingBallOpacity(
          parsed?.settings?.floatingBallOpacity ?? readSettings().floatingBallOpacity
        ),
        floatingBallText: normalizeFloatingBallText(
          parsed?.settings?.floatingBallText ?? readSettings().floatingBallText
        ),
        floatingBallBackgroundImage: normalizeFloatingBallBackgroundImage(
          parsed?.settings?.floatingBallBackgroundImage ??
            readSettings().floatingBallBackgroundImage
        ),
        floatingBallBackgroundColor: normalizeFloatingBallBackgroundColor(
          parsed?.settings?.floatingBallBackgroundColor ??
            readSettings().floatingBallBackgroundColor
        ),
        masterPasswordHash: normalizeMasterPasswordHash(
          parsed?.settings?.masterPasswordHash ?? readStore().settings?.masterPasswordHash
        ),
        masterPasswordSalt: normalizeMasterPasswordSalt(
          parsed?.settings?.masterPasswordSalt ?? readStore().settings?.masterPasswordSalt
        )
      }
    });

    syncLaunchAtLogin();
    syncFloatingBallVisibility();

    return {
      cancelled: false,
      message: formatMain('importSummary', { imported, importedTrash, skipped }),
      imported,
      skipped
    };
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 920,
    minHeight: 640,
    backgroundColor: '#0b1120',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  appUnlocked = !Boolean(getMasterPasswordSecret());
  registerIpcHandlers();
  createWindow();
  syncTrayVisibility();
  syncLaunchAtLogin();
  syncFloatingBallVisibility();
  registerSummonShortcut();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
