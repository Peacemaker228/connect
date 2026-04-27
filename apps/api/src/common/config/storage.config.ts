import { registerAs } from '@nestjs/config';

const DEFAULT_STORAGE_TARGET_PROVIDER = 's3-compatible';
const DEFAULT_STORAGE_ACTIVE_PROVIDER = DEFAULT_STORAGE_TARGET_PROVIDER;

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) {
    return fallback;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === 'true') {
    return true;
  }

  if (normalizedValue === 'false') {
    return false;
  }

  return fallback;
};

const normalizeOptionalString = (value: string | undefined) => {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
};

const normalizeKeyPrefix = (value: string | undefined) => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return '';
  }

  return trimmedValue.replace(/^\/+|\/+$/g, '');
};

const normalizePublicBaseUrl = (value: string | undefined) => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.replace(/\/+$/g, '');
};

export default registerAs('storage', () => ({
  activeProvider: process.env.STORAGE_ACTIVE_PROVIDER?.trim() ?? DEFAULT_STORAGE_ACTIVE_PROVIDER,
  targetProvider: process.env.STORAGE_TARGET_PROVIDER?.trim() ?? DEFAULT_STORAGE_TARGET_PROVIDER,
  managedCloud: parseBoolean(process.env.STORAGE_MANAGED_CLOUD, true),
  bucket: normalizeOptionalString(process.env.STORAGE_BUCKET),
  publicBaseUrl: normalizePublicBaseUrl(process.env.STORAGE_PUBLIC_BASE_URL),
  s3Endpoint: normalizeOptionalString(process.env.STORAGE_S3_ENDPOINT),
  s3Region: normalizeOptionalString(process.env.STORAGE_S3_REGION),
  s3AccessKeyId: normalizeOptionalString(process.env.STORAGE_S3_ACCESS_KEY_ID),
  s3SecretAccessKey: normalizeOptionalString(process.env.STORAGE_S3_SECRET_ACCESS_KEY),
  s3ForcePathStyle: parseBoolean(process.env.STORAGE_S3_FORCE_PATH_STYLE, false),
  keyPrefix: normalizeKeyPrefix(process.env.STORAGE_KEY_PREFIX),
}));
