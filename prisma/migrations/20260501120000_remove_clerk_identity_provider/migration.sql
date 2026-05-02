-- Destructive cleanup: remove legacy Clerk auth identity rows before the enum is narrowed.
-- Password auth is the only active auth identity provider after provider cleanup.
DELETE FROM `authpasswordcredential`
WHERE `identityId` IN (
  SELECT `id`
  FROM `authidentity`
  WHERE `provider` = 'CLERK'
);

DELETE FROM `authidentity`
WHERE `provider` = 'CLERK';

ALTER TABLE `authidentity`
MODIFY `provider` ENUM('PASSWORD') NOT NULL;
