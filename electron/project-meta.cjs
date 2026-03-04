const packageJson = require('../package.json');

function normalizeRepositoryUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return '';
  }

  return raw
    .replace(/^git\+/, '')
    .replace(/\.git$/i, '')
    .trim();
}

const repositoryUrl = normalizeRepositoryUrl(
  typeof packageJson.repository === 'string' ? packageJson.repository : packageJson.repository?.url
);

const appName = String(
  packageJson.build?.productName ||
    packageJson.productName ||
    packageJson.name ||
    'Zhiaiwan Authenticator'
);

module.exports = {
  APP_ID: String(packageJson.build?.appId || ''),
  APP_NAME: appName,
  REPOSITORY_URL: repositoryUrl,
  RELEASES_URL: repositoryUrl ? `${repositoryUrl}/releases` : '',
  ISSUES_URL: String(packageJson.bugs?.url || (repositoryUrl ? `${repositoryUrl}/issues` : ''))
};
