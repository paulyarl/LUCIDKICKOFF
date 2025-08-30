import { Progress, Attempt, ParentType } from '../stores/progressStore';

// Abstract adapter interface for progress storage
export interface ProgressAdapter {
  // Progress operations
  saveProgress(progress: Progress): Promise<void>;
  getProgress(parentType: ParentType, parentId: string): Promise<Progress | null>;
  getAllProgress(): Promise<Progress[]>;
  deleteProgress(parentType: ParentType, parentId: string): Promise<void>;
  
  // Attempt operations
  saveAttempt(attempt: Attempt): Promise<void>;
  getAttempts(stepId: string): Promise<Attempt[]>;
  getLatestAttempt(stepId: string): Promise<Attempt | null>;
  deleteAttempts(stepId: string): Promise<void>;
  
  // Bulk operations
  exportData(): Promise<{ progress: Progress[]; attempts: Record<string, Attempt[]> }>;
  importData(data: { progress: Progress[]; attempts: Record<string, Attempt[]> }): Promise<void>;
  clearAll(): Promise<void>;
  
  // Sync operations (for future cloud sync)
  sync?(): Promise<void>;
  getLastSyncTime?(): Promise<number | null>;
}

// Local storage adapter implementation
export class LocalStorageAdapter implements ProgressAdapter {
  private readonly storageKey = 'lc_progress_v1';

  private getData(): { progress: Record<string, Progress>; attempts: Record<string, Attempt[]> } {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : { progress: {}, attempts: {} };
    } catch {
      return { progress: {}, attempts: {} };
    }
  }

  private setData(data: { progress: Record<string, Progress>; attempts: Record<string, Attempt[]> }): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private createProgressKey(parentType: ParentType, parentId: string): string {
    return `${parentType}:${parentId}`;
  }

  async saveProgress(progress: Progress): Promise<void> {
    const data = this.getData();
    const key = this.createProgressKey(progress.parentType, progress.parentId);
    data.progress[key] = { ...progress, updatedAt: Date.now() };
    this.setData(data);
  }

  async getProgress(parentType: ParentType, parentId: string): Promise<Progress | null> {
    const data = this.getData();
    const key = this.createProgressKey(parentType, parentId);
    return data.progress[key] || null;
  }

  async getAllProgress(): Promise<Progress[]> {
    const data = this.getData();
    return Object.values(data.progress);
  }

  async deleteProgress(parentType: ParentType, parentId: string): Promise<void> {
    const data = this.getData();
    const key = this.createProgressKey(parentType, parentId);
    delete data.progress[key];
    this.setData(data);
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    const data = this.getData();
    if (!data.attempts[attempt.stepId]) {
      data.attempts[attempt.stepId] = [];
    }
    data.attempts[attempt.stepId].push({ ...attempt, ts: Date.now() });
    this.setData(data);
  }

  async getAttempts(stepId: string): Promise<Attempt[]> {
    const data = this.getData();
    return data.attempts[stepId] || [];
  }

  async getLatestAttempt(stepId: string): Promise<Attempt | null> {
    const attempts = await this.getAttempts(stepId);
    return attempts.length > 0 ? attempts[attempts.length - 1] : null;
  }

  async deleteAttempts(stepId: string): Promise<void> {
    const data = this.getData();
    delete data.attempts[stepId];
    this.setData(data);
  }

  async exportData(): Promise<{ progress: Progress[]; attempts: Record<string, Attempt[]> }> {
    const data = this.getData();
    return {
      progress: Object.values(data.progress),
      attempts: data.attempts
    };
  }

  async importData(importData: { progress: Progress[]; attempts: Record<string, Attempt[]> }): Promise<void> {
    const progressRecord: Record<string, Progress> = {};
    importData.progress.forEach(progress => {
      const key = this.createProgressKey(progress.parentType, progress.parentId);
      progressRecord[key] = progress;
    });
    
    this.setData({
      progress: progressRecord,
      attempts: importData.attempts
    });
  }

  async clearAll(): Promise<void> {
    this.setData({ progress: {}, attempts: {} });
  }
}

// Future Supabase adapter implementation
export class SupabaseAdapter implements ProgressAdapter {
  // This will be implemented when we integrate with Supabase
  // For now, we'll provide a stub implementation
  
  async saveProgress(progress: Progress): Promise<void> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async getProgress(parentType: ParentType, parentId: string): Promise<Progress | null> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async getAllProgress(): Promise<Progress[]> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async deleteProgress(parentType: ParentType, parentId: string): Promise<void> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async getAttempts(stepId: string): Promise<Attempt[]> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async getLatestAttempt(stepId: string): Promise<Attempt | null> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async deleteAttempts(stepId: string): Promise<void> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async exportData(): Promise<{ progress: Progress[]; attempts: Record<string, Attempt[]> }> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async importData(data: { progress: Progress[]; attempts: Record<string, Attempt[]> }): Promise<void> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async clearAll(): Promise<void> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async sync(): Promise<void> {
    throw new Error('SupabaseAdapter not yet implemented');
  }

  async getLastSyncTime(): Promise<number | null> {
    throw new Error('SupabaseAdapter not yet implemented');
  }
}

// Adapter factory
export class AdapterFactory {
  private static instance: ProgressAdapter | null = null;

  static getInstance(): ProgressAdapter {
    if (!this.instance) {
      // For now, always use LocalStorage adapter
      // In the future, this can be configured based on environment or user preferences
      this.instance = new LocalStorageAdapter();
    }
    return this.instance;
  }

  static setAdapter(adapter: ProgressAdapter): void {
    this.instance = adapter;
  }

  static createLocalStorageAdapter(): ProgressAdapter {
    return new LocalStorageAdapter();
  }

  static createSupabaseAdapter(): ProgressAdapter {
    return new SupabaseAdapter();
  }
}
