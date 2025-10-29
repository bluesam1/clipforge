// Auto-save utility for project persistence

import { ProjectData } from '../types/project';

export interface AutoSaveOptions {
  enabled: boolean;
  interval: number; // in milliseconds
  maxRetries: number;
  onSave: (projectData: ProjectData) => Promise<boolean>;
  onError: (error: Error) => void;
}

export class AutoSaveManager {
  private timer: NodeJS.Timeout | null = null;
  private lastSaveTime: number = 0;
  private isSaving: boolean = false;
  private retryCount: number = 0;
  private options: AutoSaveOptions;

  constructor(options: AutoSaveOptions) {
    this.options = options;
  }

  /**
   * Start auto-save with the configured interval
   */
  start(): void {
    if (!this.options.enabled) return;
    
    this.stop(); // Clear any existing timer
    this.timer = setInterval(() => {
      this.triggerAutoSave();
    }, this.options.interval);
  }

  /**
   * Stop auto-save
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Update auto-save options
   */
  updateOptions(options: Partial<AutoSaveOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Restart with new options if enabled
    if (this.options.enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * Manually trigger auto-save
   */
  async triggerAutoSave(projectData: ProjectData): Promise<boolean> {
    if (this.isSaving) {
      console.log('Auto-save already in progress, skipping...');
      return false;
    }

    if (!this.options.enabled) {
      console.log('Auto-save disabled, skipping...');
      return false;
    }

    // Check if enough time has passed since last save
    const now = Date.now();
    const timeSinceLastSave = now - this.lastSaveTime;
    if (timeSinceLastSave < this.options.interval) {
      console.log('Not enough time passed since last save, skipping...');
      return false;
    }

    this.isSaving = true;
    this.retryCount = 0;

    try {
      const success = await this.performSave(projectData);
      if (success) {
        this.lastSaveTime = now;
        this.retryCount = 0;
        console.log('Auto-save completed successfully');
      }
      return success;
    } catch (error) {
      console.error('Auto-save error:', error);
      this.options.onError(error as Error);
      return false;
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Perform the actual save operation with retry logic
   */
  private async performSave(projectData: ProjectData): Promise<boolean> {
    try {
      const success = await this.options.onSave(projectData);
      
      if (!success && this.retryCount < this.options.maxRetries) {
        this.retryCount++;
        console.log(`Auto-save failed, retrying... (${this.retryCount}/${this.options.maxRetries})`);
        
        // Wait before retry (exponential backoff)
        const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        return this.performSave(projectData);
      }
      
      return success;
    } catch (error) {
      if (this.retryCount < this.options.maxRetries) {
        this.retryCount++;
        console.log(`Auto-save error, retrying... (${this.retryCount}/${this.options.maxRetries})`);
        
        const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        return this.performSave(projectData);
      }
      
      throw error;
    }
  }

  /**
   * Check if auto-save is currently running
   */
  isRunning(): boolean {
    return this.timer !== null;
  }

  /**
   * Check if a save operation is in progress
   */
  isSavingInProgress(): boolean {
    return this.isSaving;
  }

  /**
   * Get time since last successful save
   */
  getTimeSinceLastSave(): number {
    return this.lastSaveTime > 0 ? Date.now() - this.lastSaveTime : Infinity;
  }

  /**
   * Reset the auto-save state
   */
  reset(): void {
    this.stop();
    this.lastSaveTime = 0;
    this.isSaving = false;
    this.retryCount = 0;
  }
}

// Default auto-save options
export const DEFAULT_AUTO_SAVE_OPTIONS: AutoSaveOptions = {
  enabled: true,
  interval: 30000, // 30 seconds
  maxRetries: 3,
  onSave: async () => {
    console.warn('Auto-save onSave callback not implemented');
    return false;
  },
  onError: (error: Error) => {
    console.error('Auto-save error:', error);
  }
};

// Create a singleton instance
export const autoSaveManager = new AutoSaveManager(DEFAULT_AUTO_SAVE_OPTIONS);
