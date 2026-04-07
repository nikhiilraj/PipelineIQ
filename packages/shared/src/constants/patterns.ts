// CI/CD patterns for deploy detection
export const DEFAULT_DEPLOY_BRANCH_PATTERN = 'main|master|production';
export const DEFAULT_DEPLOY_WORKFLOW_PATTERN = '.*deploy.*|.*release.*|.*prod.*';

// File path patterns for ML feature engineering
export const TEST_FILE_PATTERNS = [
  /^test\//,
  /^spec\//,
  /^__tests__\//,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /\.test\.py$/,
  /\.spec\.py$/,
];

export const CONFIG_FILE_PATTERNS = [
  /^\.github\//,
  /^Dockerfile/,
  /\.(yml|yaml)$/,
  /^package\.json$/,
  /^requirements\.txt$/,
  /^pyproject\.toml$/,
  /^Cargo\.toml$/,
  /^go\.mod$/,
];

export const MIGRATION_FILE_PATTERNS = [
  /^migrations\//,
  /\.migration\.(ts|js|sql)$/,
  /^schema\.sql$/,
  /^db\/migrations\//,
];

// Error signal patterns for log parsing
export const ERROR_SIGNAL_PATTERNS = [
  /ERROR/,
  /FAILED/,
  /error:/i,
  /fatal:/i,
  /exit code [^0]/,
  /npm ERR!/,
  /ModuleNotFoundError/,
  /AssertionError/,
  /ENOENT/,
  /ENOMEM/,
];
