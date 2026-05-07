import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

type Mode = 'preflight' | 'dry-run' | 'reset-baseline' | 'verify' | 'import';
type DbKind = 'mysql' | 'postgresql';
type CellValue = string | number | boolean | null;
type Row = Record<string, CellValue>;

type TableSpec = {
  name: string;
  columns: string[];
  orderBy: string[];
  required: string[];
  enums?: Record<string, string[]>;
  varchar?: Record<string, number>;
  booleans?: string[];
  datetimes?: string[];
};

type ParsedArgs = {
  mode: Mode;
  executeImport: boolean;
  confirmDisposableTarget: boolean;
  resetTarget: boolean;
  json: boolean;
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const BASELINE_SQL_PATH = 'prisma/postgres-validation/migrations/00000000000000_clean_baseline/migration.sql';
const POSTGRES_SCHEMA_PATH = 'prisma/postgres-validation/schema.prisma';
const POSTGRES_CONTAINER = process.env.POSTGRES_VALIDATION_CONTAINER || 'connect-postgres-validation';
const MYSQL_ENV_NAME = 'MYSQL_REHEARSAL_SOURCE_DATABASE_URL';
const POSTGRES_ENV_NAME = 'POSTGRES_VALIDATION_DATABASE_URL';

const TABLES: TableSpec[] = [
  {
    name: 'profile',
    columns: ['id', 'userId', 'name', 'imageUrl', 'email', 'createdAt', 'updatedAt'],
    orderBy: ['id'],
    required: ['id', 'userId', 'name', 'imageUrl', 'email', 'createdAt', 'updatedAt'],
    datetimes: ['createdAt', 'updatedAt'],
  },
  {
    name: 'authidentity',
    columns: [
      'id',
      'provider',
      'subject',
      'profileId',
      'email',
      'emailNormalized',
      'lastAuthenticatedAt',
      'createdAt',
      'updatedAt',
    ],
    orderBy: ['id'],
    required: ['id', 'provider', 'subject', 'profileId', 'createdAt', 'updatedAt'],
    enums: { provider: ['PASSWORD'] },
    varchar: { subject: 191, emailNormalized: 191 },
    datetimes: ['lastAuthenticatedAt', 'createdAt', 'updatedAt'],
  },
  {
    name: 'authpasswordcredential',
    columns: ['identityId', 'passwordHash', 'createdAt', 'updatedAt'],
    orderBy: ['identityId'],
    required: ['identityId', 'passwordHash', 'createdAt', 'updatedAt'],
    datetimes: ['createdAt', 'updatedAt'],
  },
  {
    name: 'authsession',
    columns: [
      'id',
      'profileId',
      'userId',
      'status',
      'refreshTokenHash',
      'refreshTokenExpiresAt',
      'userAgent',
      'ipAddress',
      'lastAccessedAt',
      'revokedAt',
      'createdAt',
      'updatedAt',
    ],
    orderBy: ['id'],
    required: ['id', 'profileId', 'userId', 'status', 'refreshTokenHash', 'refreshTokenExpiresAt', 'createdAt', 'updatedAt'],
    enums: { status: ['ACTIVE', 'REVOKED'] },
    varchar: { refreshTokenHash: 191, ipAddress: 191 },
    datetimes: ['refreshTokenExpiresAt', 'lastAccessedAt', 'revokedAt', 'createdAt', 'updatedAt'],
  },
  {
    name: 'server',
    columns: ['id', 'name', 'imageUrl', 'inviteCode', 'profileId', 'createdAt', 'updatedAt'],
    orderBy: ['id'],
    required: ['id', 'name', 'imageUrl', 'inviteCode', 'profileId', 'createdAt', 'updatedAt'],
    datetimes: ['createdAt', 'updatedAt'],
  },
  {
    name: 'member',
    columns: ['id', 'role', 'profileId', 'serverId', 'createdAt', 'updatedAt'],
    orderBy: ['id'],
    required: ['id', 'role', 'profileId', 'serverId', 'createdAt', 'updatedAt'],
    enums: { role: ['ADMIN', 'MODERATOR', 'GUEST'] },
    datetimes: ['createdAt', 'updatedAt'],
  },
  {
    name: 'channel',
    columns: ['id', 'name', 'type', 'profileId', 'serverId', 'createdAt', 'updatedAt'],
    orderBy: ['id'],
    required: ['id', 'name', 'type', 'profileId', 'serverId', 'createdAt', 'updatedAt'],
    enums: { type: ['TEXT', 'AUDIO', 'VIDEO'] },
    datetimes: ['createdAt', 'updatedAt'],
  },
  {
    name: 'message',
    columns: ['id', 'content', 'fileUrl', 'memberId', 'channelId', 'deleted', 'createdAt', 'updatedAt'],
    orderBy: ['id'],
    required: ['id', 'content', 'memberId', 'channelId', 'deleted', 'createdAt', 'updatedAt'],
    booleans: ['deleted'],
    datetimes: ['createdAt', 'updatedAt'],
  },
  {
    name: 'conversation',
    columns: ['id', 'memberOneId', 'memberTwoId'],
    orderBy: ['id'],
    required: ['id', 'memberOneId', 'memberTwoId'],
  },
  {
    name: 'directmessage',
    columns: ['id', 'content', 'fileUrl', 'memberId', 'conversationId', 'deleted', 'createdAt', 'updatedAt'],
    orderBy: ['id'],
    required: ['id', 'content', 'memberId', 'conversationId', 'deleted', 'createdAt', 'updatedAt'],
    booleans: ['deleted'],
    datetimes: ['createdAt', 'updatedAt'],
  },
];

const MYSQL_ORPHAN_CHECKS = [
  ['authidentity.profileId -> profile.id', 'select count(*) as issue_count from authidentity a left join profile p on p.id = a.profileId where p.id is null'],
  [
    'authpasswordcredential.identityId -> authidentity.id',
    'select count(*) as issue_count from authpasswordcredential c left join authidentity a on a.id = c.identityId where a.id is null',
  ],
  ['authsession.profileId -> profile.id', 'select count(*) as issue_count from authsession s left join profile p on p.id = s.profileId where p.id is null'],
  ['server.profileId -> profile.id', 'select count(*) as issue_count from server s left join profile p on p.id = s.profileId where p.id is null'],
  ['member.profileId -> profile.id', 'select count(*) as issue_count from member m left join profile p on p.id = m.profileId where p.id is null'],
  ['member.serverId -> server.id', 'select count(*) as issue_count from member m left join server s on s.id = m.serverId where s.id is null'],
  ['channel.profileId -> profile.id', 'select count(*) as issue_count from channel c left join profile p on p.id = c.profileId where p.id is null'],
  ['channel.serverId -> server.id', 'select count(*) as issue_count from channel c left join server s on s.id = c.serverId where s.id is null'],
  ['message.memberId -> member.id', 'select count(*) as issue_count from message m left join member mb on mb.id = m.memberId where mb.id is null'],
  ['message.channelId -> channel.id', 'select count(*) as issue_count from message m left join channel c on c.id = m.channelId where c.id is null'],
  [
    'conversation.memberOneId -> member.id',
    'select count(*) as issue_count from conversation c left join member m on m.id = c.memberOneId where m.id is null',
  ],
  [
    'conversation.memberTwoId -> member.id',
    'select count(*) as issue_count from conversation c left join member m on m.id = c.memberTwoId where m.id is null',
  ],
  [
    'directmessage.memberId -> member.id',
    'select count(*) as issue_count from directmessage d left join member m on m.id = d.memberId where m.id is null',
  ],
  [
    'directmessage.conversationId -> conversation.id',
    'select count(*) as issue_count from directmessage d left join conversation c on c.id = d.conversationId where c.id is null',
  ],
] as const;

const POSTGRES_ORPHAN_CHECKS = [
  [
    'authidentity.profileId -> profile.id',
    'select count(*) as issue_count from "authidentity" a left join "profile" p on p.id = a."profileId" where p.id is null',
  ],
  [
    'authpasswordcredential.identityId -> authidentity.id',
    'select count(*) as issue_count from "authpasswordcredential" c left join "authidentity" a on a.id = c."identityId" where a.id is null',
  ],
  [
    'authsession.profileId -> profile.id',
    'select count(*) as issue_count from "authsession" s left join "profile" p on p.id = s."profileId" where p.id is null',
  ],
  [
    'server.profileId -> profile.id',
    'select count(*) as issue_count from "server" s left join "profile" p on p.id = s."profileId" where p.id is null',
  ],
  [
    'member.profileId -> profile.id',
    'select count(*) as issue_count from "member" m left join "profile" p on p.id = m."profileId" where p.id is null',
  ],
  [
    'member.serverId -> server.id',
    'select count(*) as issue_count from "member" m left join "server" s on s.id = m."serverId" where s.id is null',
  ],
  [
    'channel.profileId -> profile.id',
    'select count(*) as issue_count from "channel" c left join "profile" p on p.id = c."profileId" where p.id is null',
  ],
  [
    'channel.serverId -> server.id',
    'select count(*) as issue_count from "channel" c left join "server" s on s.id = c."serverId" where s.id is null',
  ],
  [
    'message.memberId -> member.id',
    'select count(*) as issue_count from "message" m left join "member" mb on mb.id = m."memberId" where mb.id is null',
  ],
  [
    'message.channelId -> channel.id',
    'select count(*) as issue_count from "message" m left join "channel" c on c.id = m."channelId" where c.id is null',
  ],
  [
    'conversation.memberOneId -> member.id',
    'select count(*) as issue_count from "conversation" c left join "member" m on m.id = c."memberOneId" where m.id is null',
  ],
  [
    'conversation.memberTwoId -> member.id',
    'select count(*) as issue_count from "conversation" c left join "member" m on m.id = c."memberTwoId" where m.id is null',
  ],
  [
    'directmessage.memberId -> member.id',
    'select count(*) as issue_count from "directmessage" d left join "member" m on m.id = d."memberId" where m.id is null',
  ],
  [
    'directmessage.conversationId -> conversation.id',
    'select count(*) as issue_count from "directmessage" d left join "conversation" c on c.id = d."conversationId" where c.id is null',
  ],
] as const;

function parseArgs(argv: string[]): ParsedArgs {
  const modeArg = valueAfter(argv, '--mode') || 'preflight';
  if (!['preflight', 'dry-run', 'reset-baseline', 'verify', 'import'].includes(modeArg)) {
    throw new Error(`Unsupported --mode: ${modeArg}`);
  }

  return {
    mode: modeArg as Mode,
    executeImport: argv.includes('--execute-import'),
    confirmDisposableTarget: argv.includes('--confirm-disposable-target'),
    resetTarget: argv.includes('--reset-target'),
    json: argv.includes('--json'),
  };
}

function valueAfter(argv: string[], flag: string) {
  const index = argv.indexOf(flag);
  return index === -1 ? undefined : argv[index + 1];
}

function parseDatabaseUrl(raw: string | undefined, envName: string, expectedKind: DbKind) {
  if (!raw) {
    throw new Error(`${envName} is required`);
  }

  const parsed = new URL(raw);
  const protocol = parsed.protocol.replace(':', '');
  if (protocol !== expectedKind) {
    throw new Error(`${envName} must use ${expectedKind}; received ${protocol}`);
  }

  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error(`${envName} must target localhost/127.0.0.1 only; received ${parsed.hostname}`);
  }

  const database = parsed.pathname.replace(/^\//, '');
  if (!database) {
    throw new Error(`${envName} must include a database name`);
  }

  return {
    raw,
    protocol,
    host: parsed.hostname,
    port: parsed.port,
    database,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

function sourceUrl() {
  return process.env[MYSQL_ENV_NAME] || process.env.DATABASE_URL;
}

function run(command: string, args: string[], options?: { input?: string; env?: NodeJS.ProcessEnv }) {
  const result = spawnSync(command, args, {
    input: options?.input,
    env: options?.env || process.env,
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      [`Command failed: ${command} ${args.join(' ')}`, result.stdout.trim(), result.stderr.trim()]
        .filter(Boolean)
        .join('\n'),
    );
  }

  return result.stdout;
}

function mysqlBin() {
  const configured = process.env.MYSQL_REHEARSAL_MYSQL_BIN;
  if (configured) {
    return configured;
  }

  const commonWindowsPath = 'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe';
  return existsSync(commonWindowsPath) ? commonWindowsPath : 'mysql';
}

function runMysql(source: ReturnType<typeof parseDatabaseUrl>, sql: string) {
  const env = { ...process.env, MYSQL_PWD: source.password };
  const portArgs = source.port ? ['--port', source.port] : [];
  return run(mysqlBin(), [
    '--batch',
    '--raw',
    '--skip-column-names',
    '--default-character-set=utf8mb4',
    '--host',
    source.host,
    ...portArgs,
    '--user',
    source.user,
    source.database,
    '--execute',
    sql,
  ], { env });
}

function runPostgres(target: ReturnType<typeof parseDatabaseUrl>, sql: string) {
  const user = target.user || 'connect_validation';
  return run('docker', ['exec', '-i', POSTGRES_CONTAINER, 'psql', '-U', user, '-d', target.database, '-v', 'ON_ERROR_STOP=1', '-f', '-'], {
    input: sql,
  });
}

function prismaDiff(targetUrl: string) {
  const env = {
    ...process.env,
    POSTGRES_VALIDATION_DATABASE_URL: targetUrl,
    POSTGRES_VALIDATION_SHADOW_DATABASE_URL:
      process.env.POSTGRES_VALIDATION_SHADOW_DATABASE_URL ||
      'postgresql://connect_validation:connect_validation_password@localhost:5433/connect_validation_shadow?schema=public',
  };

  return run('bun.cmd', [
    'x',
    'prisma',
    'migrate',
    'diff',
    '--from-url',
    targetUrl,
    '--to-schema-datamodel',
    POSTGRES_SCHEMA_PATH,
    '--exit-code',
  ], { env });
}

function mysqlJsonRows(source: ReturnType<typeof parseDatabaseUrl>, table: TableSpec) {
  const jsonPairs = table.columns.map((column) => `'${column}', \`${column}\``).join(', ');
  const orderBy = table.orderBy.map((column) => `\`${column}\``).join(', ');
  const output = runMysql(source, `select json_object(${jsonPairs}) from \`${table.name}\` order by ${orderBy};`);
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Row);
}

function validateRows(table: TableSpec, rows: Row[]) {
  const issues: string[] = [];

  for (const [index, row] of rows.entries()) {
    for (const column of table.required) {
      if (row[column] === null || row[column] === undefined) {
        issues.push(`${table.name}[${index}].${column} is required`);
      }
    }

    for (const [column, allowed] of Object.entries(table.enums || {})) {
      const value = row[column];
      if (value !== null && value !== undefined && !allowed.includes(String(value))) {
        issues.push(`${table.name}[${index}].${column} has invalid enum value ${String(value)}`);
      }
    }

    for (const [column, max] of Object.entries(table.varchar || {})) {
      const value = row[column];
      if (typeof value === 'string' && value.length > max) {
        issues.push(`${table.name}[${index}].${column} length ${value.length} exceeds ${max}`);
      }
    }

    for (const column of table.datetimes || []) {
      const value = row[column];
      if (value !== null && value !== undefined && Number.isNaN(Date.parse(String(value)))) {
        issues.push(`${table.name}[${index}].${column} is not parseable as DateTime`);
      }
    }
  }

  return issues;
}

function sqlLiteral(value: CellValue, booleanColumn = false) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (booleanColumn) {
    return value === true || value === 1 || value === '1' ? 'true' : 'false';
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function insertSql(table: TableSpec, rows: Row[]) {
  if (rows.length === 0) {
    return '';
  }

  const booleanColumns = new Set(table.booleans || []);
  const columns = table.columns.map((column) => `"${column}"`).join(', ');
  const values = rows
    .map((row) => `(${table.columns.map((column) => sqlLiteral(row[column], booleanColumns.has(column))).join(', ')})`)
    .join(',\n');

  return `insert into "${table.name}" (${columns}) values\n${values};\n`;
}

function scalarMysql(source: ReturnType<typeof parseDatabaseUrl>, sql: string) {
  const output = runMysql(source, sql).trim();
  return Number(output || '0');
}

function scalarPostgres(target: ReturnType<typeof parseDatabaseUrl>, sql: string) {
  const output = runPostgres(target, `\\t on\n${sql};\n`).trim();
  return Number(output || '0');
}

function collectCounts(kind: DbKind, db: ReturnType<typeof parseDatabaseUrl>) {
  const rows: Record<string, number> = {};
  for (const table of TABLES) {
    const sql = kind === 'mysql' ? `select count(*) from \`${table.name}\`` : `select count(*) from "${table.name}"`;
    rows[table.name] = kind === 'mysql' ? scalarMysql(db, sql) : scalarPostgres(db, sql);
  }
  return rows;
}

function collectChecks(kind: DbKind, db: ReturnType<typeof parseDatabaseUrl>) {
  const isMysql = kind === 'mysql';
  const checks = isMysql ? MYSQL_ORPHAN_CHECKS : POSTGRES_ORPHAN_CHECKS;
  const orphanCounts: Record<string, number> = {};
  for (const [name, sql] of checks) {
    orphanCounts[name] = isMysql ? scalarMysql(db, sql) : scalarPostgres(db, sql);
  }

  const enumChecks: Record<string, number> = {
    authidentityProvider: isMysql
      ? scalarMysql(db, "select count(*) from authidentity where provider not in ('PASSWORD')")
      : scalarPostgres(db, 'select count(*) from "authidentity" where "provider"::text not in (\'PASSWORD\')'),
    authsessionStatus: isMysql
      ? scalarMysql(db, "select count(*) from authsession where status not in ('ACTIVE', 'REVOKED')")
      : scalarPostgres(db, 'select count(*) from "authsession" where "status"::text not in (\'ACTIVE\', \'REVOKED\')'),
    memberRole: isMysql
      ? scalarMysql(db, "select count(*) from member where role not in ('ADMIN', 'MODERATOR', 'GUEST')")
      : scalarPostgres(db, 'select count(*) from "member" where "role"::text not in (\'ADMIN\', \'MODERATOR\', \'GUEST\')'),
    channelType: isMysql
      ? scalarMysql(db, "select count(*) from channel where type not in ('TEXT', 'AUDIO', 'VIDEO')")
      : scalarPostgres(db, 'select count(*) from "channel" where "type"::text not in (\'TEXT\', \'AUDIO\', \'VIDEO\')'),
  };

  const dateTimeChecks: Record<string, number> = {};
  for (const table of TABLES.filter((candidate) => candidate.columns.includes('createdAt') && candidate.columns.includes('updatedAt'))) {
    const sql = isMysql
      ? `select count(*) from \`${table.name}\` where updatedAt < createdAt`
      : `select count(*) from "${table.name}" where "updatedAt" < "createdAt"`;
    dateTimeChecks[`${table.name}.updatedBeforeCreated`] = isMysql ? scalarMysql(db, sql) : scalarPostgres(db, sql);
  }

  const selfConversationSql = isMysql
    ? 'select count(*) from conversation where memberOneId = memberTwoId'
    : 'select count(*) from "conversation" where "memberOneId" = "memberTwoId"';

  return {
    orphanCounts,
    enumChecks,
    dateTimeChecks,
    selfConversationCount: isMysql ? scalarMysql(db, selfConversationSql) : scalarPostgres(db, selfConversationSql),
  };
}

function collectAggregateCounts(kind: DbKind, db: ReturnType<typeof parseDatabaseUrl>) {
  const isMysql = kind === 'mysql';
  const queries = {
    membersPerServer: isMysql
      ? 'select coalesce(sum(member_count),0) from (select count(m.id) as member_count from server s left join member m on m.serverId = s.id group by s.id) x'
      : 'select coalesce(sum(member_count),0) from (select count(m.id) as member_count from "server" s left join "member" m on m."serverId" = s.id group by s.id) x',
    channelsPerServer: isMysql
      ? 'select coalesce(sum(channel_count),0) from (select count(c.id) as channel_count from server s left join channel c on c.serverId = s.id group by s.id) x'
      : 'select coalesce(sum(channel_count),0) from (select count(c.id) as channel_count from "server" s left join "channel" c on c."serverId" = s.id group by s.id) x',
    messagesPerChannel: isMysql
      ? 'select coalesce(sum(message_count),0) from (select count(m.id) as message_count from channel c left join message m on m.channelId = c.id group by c.id) x'
      : 'select coalesce(sum(message_count),0) from (select count(m.id) as message_count from "channel" c left join "message" m on m."channelId" = c.id group by c.id) x',
    directMessagesPerConversation: isMysql
      ? 'select coalesce(sum(direct_message_count),0) from (select count(d.id) as direct_message_count from conversation c left join directmessage d on d.conversationId = c.id group by c.id) x'
      : 'select coalesce(sum(direct_message_count),0) from (select count(d.id) as direct_message_count from "conversation" c left join "directmessage" d on d."conversationId" = c.id group by c.id) x',
    identitiesPerProfile: isMysql
      ? 'select coalesce(sum(identity_count),0) from (select count(a.id) as identity_count from profile p left join authidentity a on a.profileId = p.id group by p.id) x'
      : 'select coalesce(sum(identity_count),0) from (select count(a.id) as identity_count from "profile" p left join "authidentity" a on a."profileId" = p.id group by p.id) x',
  };

  return Object.fromEntries(
    Object.entries(queries).map(([key, sql]) => [key, isMysql ? scalarMysql(db, sql) : scalarPostgres(db, sql)]),
  );
}

function preflight(source: ReturnType<typeof parseDatabaseUrl>, target: ReturnType<typeof parseDatabaseUrl>) {
  const baselinePath = resolve(BASELINE_SQL_PATH);
  const schemaPath = resolve(POSTGRES_SCHEMA_PATH);
  if (!existsSync(baselinePath)) {
    throw new Error(`Baseline SQL not found: ${baselinePath}`);
  }
  if (!existsSync(schemaPath)) {
    throw new Error(`Validation schema not found: ${schemaPath}`);
  }

  return {
    source: { scheme: source.protocol, host: source.host, port: source.port, database: source.database, env: process.env[MYSQL_ENV_NAME] ? MYSQL_ENV_NAME : 'DATABASE_URL' },
    target: { scheme: target.protocol, host: target.host, port: target.port, database: target.database, env: POSTGRES_ENV_NAME },
    tableOrder: TABLES.map((table) => table.name),
    baselineSql: BASELINE_SQL_PATH,
    validationSchema: POSTGRES_SCHEMA_PATH,
  };
}

function resetBaseline(target: ReturnType<typeof parseDatabaseUrl>) {
  const baselineSql = readFileSync(BASELINE_SQL_PATH, 'utf8');
  const resetSql = ['drop schema if exists public cascade;', 'create schema public;', baselineSql].join('\n');
  runPostgres(target, resetSql);
}

function runImport(source: ReturnType<typeof parseDatabaseUrl>, target: ReturnType<typeof parseDatabaseUrl>) {
  const importReport: Record<string, { rows: number; validationIssues: string[] }> = {};
  for (const table of TABLES) {
    const rows = mysqlJsonRows(source, table);
    const validationIssues = validateRows(table, rows);
    importReport[table.name] = { rows: rows.length, validationIssues };

    if (validationIssues.length > 0) {
      throw new Error(`Validation failed for ${table.name}: ${validationIssues.join('; ')}`);
    }

    const sql = insertSql(table, rows);
    if (sql) {
      runPostgres(target, sql);
    }
  }
  return importReport;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = parseDatabaseUrl(sourceUrl(), process.env[MYSQL_ENV_NAME] ? MYSQL_ENV_NAME : 'DATABASE_URL', 'mysql');
  const target = parseDatabaseUrl(process.env[POSTGRES_ENV_NAME], POSTGRES_ENV_NAME, 'postgresql');
  const output: Record<string, unknown> = {
    mode: args.mode,
    preflight: preflight(source, target),
    actualImportExecuted: false,
  };

  if (args.mode === 'preflight') {
    printOutput(output, args.json);
    return;
  }

  if (args.mode === 'reset-baseline') {
    if (!args.confirmDisposableTarget) {
      throw new Error('--confirm-disposable-target is required for reset-baseline');
    }
    resetBaseline(target);
    output.resetBaseline = 'complete';
    output.targetCounts = collectCounts('postgresql', target);
    printOutput(output, args.json);
    return;
  }

  if (args.mode === 'import') {
    if (!args.executeImport || !args.confirmDisposableTarget) {
      throw new Error('Actual import requires --execute-import and --confirm-disposable-target');
    }
    if (!args.resetTarget) {
      throw new Error('Actual import requires --reset-target so the disposable target starts from a clean baseline');
    }
  }

  if (args.mode === 'dry-run' || args.mode === 'verify' || args.mode === 'import') {
    output.sourceCounts = collectCounts('mysql', source);
    output.sourceChecks = collectChecks('mysql', source);
    output.sourceAggregates = collectAggregateCounts('mysql', source);
    output.targetCounts = collectCounts('postgresql', target);
    output.targetChecks = collectChecks('postgresql', target);
    output.targetAggregates = collectAggregateCounts('postgresql', target);
    output.drift = prismaDiff(target.raw).trim();
  }

  if (args.mode === 'import') {
    resetBaseline(target);
    output.import = runImport(source, target);
    output.actualImportExecuted = true;
    output.postImportTargetCounts = collectCounts('postgresql', target);
    output.postImportTargetChecks = collectChecks('postgresql', target);
    output.postImportTargetAggregates = collectAggregateCounts('postgresql', target);
  }

  printOutput(output, args.json);
}

function printOutput(output: Record<string, unknown>, asJson: boolean) {
  if (asJson) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(JSON.stringify(output, null, 2));
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
