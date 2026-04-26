import { registerAs } from '@nestjs/config';

const DEFAULT_STORAGE_ACTIVE_PROVIDER = 'uploadthing';
const DEFAULT_STORAGE_TARGET_PROVIDER = 's3-compatible';

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

export default registerAs('storage', () => ({
  activeProvider: process.env.STORAGE_ACTIVE_PROVIDER?.trim() ?? DEFAULT_STORAGE_ACTIVE_PROVIDER,
  targetProvider: process.env.STORAGE_TARGET_PROVIDER?.trim() ?? DEFAULT_STORAGE_TARGET_PROVIDER,
  managedCloud: process.env.STORAGE_MANAGED_CLOUD !== 'false',
  bucket: normalizeOptionalString(process.env.STORAGE_BUCKET),
  publicBaseUrl: normalizeOptionalString(process.env.STORAGE_PUBLIC_BASE_URL),
  s3Endpoint: normalizeOptionalString(process.env.STORAGE_S3_ENDPOINT),
  s3Region: normalizeOptionalString(process.env.STORAGE_S3_REGION),
  keyPrefix: normalizeKeyPrefix(process.env.STORAGE_KEY_PREFIX),
}));
