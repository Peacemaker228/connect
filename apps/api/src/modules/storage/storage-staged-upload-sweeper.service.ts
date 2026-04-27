import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { StorageService } from './storage.service';

const MINUTE_IN_MS = 60 * 1000;

@Injectable()
export class StorageStagedUploadSweeperService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StorageStagedUploadSweeperService.name);
  private intervalHandle: NodeJS.Timeout | null = null;
  private isSweepRunning = false;

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    if (!this.configService.get<boolean>('storage.stagedSweeperEnabled')) {
      return;
    }

    const intervalMinutes = this.configService.get<number>('storage.stagedSweeperIntervalMinutes') ?? 60;
    const intervalMs = intervalMinutes * MINUTE_IN_MS;

    void this.runSweep('startup');

    this.intervalHandle = setInterval(() => {
      void this.runSweep('interval');
    }, intervalMs);
    this.intervalHandle.unref?.();
  }

  onModuleDestroy() {
    if (!this.intervalHandle) {
      return;
    }

    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  private async runSweep(trigger: 'startup' | 'interval') {
    if (this.isSweepRunning) {
      return;
    }

    this.isSweepRunning = true;

    try {
      const sweepResult = await this.storageService.sweepStagedUploads();

      if (sweepResult.scannedObjects > 0 || sweepResult.deletedObjects > 0) {
        this.logger.log(
          `Staged upload sweep (${trigger}) scanned=${sweepResult.scannedObjects} deleted=${sweepResult.deletedObjects} kept=${sweepResult.keptObjects}`,
        );
      }
    } catch (error) {
      this.logger.error(`Staged upload sweep (${trigger}) failed`, error instanceof Error ? error.stack : undefined);
    } finally {
      this.isSweepRunning = false;
    }
  }
}
