/**
 * In-Memory Timeshift Buffer Mechanism for TV Viewer Console
 * Captures live stream playback segments in browser memory (RAM) using MediaSource / Blob chunks.
 * Enables zero-lag Pause, Rewind, Scrubbing, and Resume while strictly respecting content permission metadata.
 * Ephemeral: Zero persistent disk storage. Purges completely on channel change or tab close.
 */

export interface TimeshiftBufferChunk {
  id: string;
  timestamp: number; // Date.now()
  duration: number;  // Chunk duration in seconds
  blob?: Blob;
  sizeBytes: number;
}

export interface TimeshiftBufferState {
  isCapturing: boolean;
  isTimeshiftActive: boolean; // True if watching buffered/timeshifted past instead of live
  bufferDurationSec: number;  // Total seconds currently held in memory
  bufferSizeBytes: number;    // Total memory bytes used
  timeshiftOffsetSec: number; // How many seconds behind live the user is currently playing
  maxBufferSec: number;       // Max allowed buffer seconds by rights policy
  isAllowed: boolean;
  rightsAttribution: string;
}

export class InMemoryTimeshiftDvr {
  private chunks: TimeshiftBufferChunk[] = [];
  private maxBufferSeconds: number = 3600; // Default 60 min
  private isAllowed: boolean = true;
  private rightsAttribution: string = 'Standard Community Broadcast License';
  private currentOffsetSec: number = 0;
  private isTimeshiftPaused: boolean = false;
  private listeners: Array<(state: TimeshiftBufferState) => void> = [];
  private captureIntervalId: any = null;
  private memoryLimitBytes: number = 80 * 1024 * 1024; // 80 MB safety limit in browser RAM

  constructor(maxBufferMinutes: number = 60, isAllowed: boolean = true, rightsAttribution: string = '') {
    this.maxBufferSeconds = Math.max(60, maxBufferMinutes * 60);
    this.isAllowed = isAllowed;
    this.rightsAttribution = rightsAttribution || 'Standard Community Broadcast License';
  }

  public updatePolicy(maxBufferMinutes: number, allowed: boolean, rightsAttribution?: string) {
    this.maxBufferSeconds = Math.max(60, maxBufferMinutes * 60);
    this.isAllowed = allowed;
    if (rightsAttribution) this.rightsAttribution = rightsAttribution;
    if (!this.isAllowed) {
      this.clear();
      this.currentOffsetSec = 0;
    }
    this.notify();
  }

  public startCapture(mockChunkBytesPerSec: number = 48000) {
    if (!this.isAllowed || this.captureIntervalId) return;

    // Periodic in-memory chunk capture simulator (records 1s segments into RAM buffer)
    this.captureIntervalId = setInterval(() => {
      if (!this.isAllowed) return;

      const chunkSize = Math.floor(mockChunkBytesPerSec * (0.9 + Math.random() * 0.2));
      const chunk: TimeshiftBufferChunk = {
        id: `chunk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: Date.now(),
        duration: 1,
        sizeBytes: chunkSize,
      };

      this.chunks.push(chunk);

      // Enforce ring-buffer limits: remove oldest chunks when maxBufferSeconds or memoryLimitBytes exceeded
      this.pruneBuffer();

      this.notify();
    }, 1000);
  }

  public stopCapture() {
    if (this.captureIntervalId) {
      clearInterval(this.captureIntervalId);
      this.captureIntervalId = null;
    }
  }

  private pruneBuffer() {
    let totalSec = this.getTotalDurationSeconds();
    let totalBytes = this.getTotalSizeBytes();

    while (this.chunks.length > 10 && (totalSec > this.maxBufferSeconds || totalBytes > this.memoryLimitBytes)) {
      const removed = this.chunks.shift();
      if (removed) {
        totalSec -= removed.duration;
        totalBytes -= removed.sizeBytes;
      }
    }

    // Keep currentOffsetSec within bounds
    if (this.currentOffsetSec > totalSec) {
      this.currentOffsetSec = totalSec;
    }
  }

  public seekOffset(offsetSeconds: number) {
    if (!this.isAllowed) return;
    const maxSeek = Math.min(this.maxBufferSeconds, this.getTotalDurationSeconds());
    this.currentOffsetSec = Math.max(0, Math.min(maxSeek, offsetSeconds));
    this.notify();
  }

  public rewind(seconds: number) {
    this.seekOffset(this.currentOffsetSec + seconds);
  }

  public forward(seconds: number) {
    this.seekOffset(this.currentOffsetSec - seconds);
  }

  public jumpToLive() {
    this.currentOffsetSec = 0;
    this.isTimeshiftPaused = false;
    this.notify();
  }

  public togglePause(): boolean {
    if (!this.isAllowed) return false;
    this.isTimeshiftPaused = !this.isTimeshiftPaused;
    this.notify();
    return this.isTimeshiftPaused;
  }

  public setPaused(paused: boolean) {
    if (!this.isAllowed) return;
    this.isTimeshiftPaused = paused;
    this.notify();
  }

  public isPaused(): boolean {
    return this.isTimeshiftPaused;
  }

  public getTotalDurationSeconds(): number {
    return this.chunks.length;
  }

  public getTotalSizeBytes(): number {
    return this.chunks.reduce((acc, c) => acc + c.sizeBytes, 0);
  }

  public getFormattedMemorySize(): string {
    const bytes = this.getTotalSizeBytes();
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  public clear() {
    this.chunks = [];
    this.currentOffsetSec = 0;
    this.isTimeshiftPaused = false;
    this.notify();
  }

  public getState(): TimeshiftBufferState {
    const totalSec = this.getTotalDurationSeconds();
    return {
      isCapturing: Boolean(this.captureIntervalId),
      isTimeshiftActive: this.currentOffsetSec > 0 || this.isTimeshiftPaused,
      bufferDurationSec: totalSec,
      bufferSizeBytes: this.getTotalSizeBytes(),
      timeshiftOffsetSec: this.currentOffsetSec,
      maxBufferSec: this.maxBufferSeconds,
      isAllowed: this.isAllowed,
      rightsAttribution: this.rightsAttribution,
    };
  }

  public subscribe(listener: (state: TimeshiftBufferState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public destroy() {
    this.stopCapture();
    this.clear();
    this.listeners = [];
  }
}
