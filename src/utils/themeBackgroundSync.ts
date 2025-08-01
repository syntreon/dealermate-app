/**
 * Background synchronization for theme preferences
 * Reduces perceived latency by using local storage as immediate fallback
 */

import { supabase } from '@/integrations/supabase/client';
import { ThemeType } from '@/services/themeService';

interface ThemePreference {
    userId: string;
    theme: ThemeType;
    timestamp: number;
    synced: boolean;
}

class ThemeBackgroundSync {
    private static instance: ThemeBackgroundSync;
    private syncQueue: ThemePreference[] = [];
    private isProcessing = false;
    private readonly STORAGE_KEY = 'theme-preferences';
    private readonly SYNC_INTERVAL = 5000; // 5 seconds
    private syncTimer?: NodeJS.Timeout;

    static getInstance(): ThemeBackgroundSync {
        if (!ThemeBackgroundSync.instance) {
            ThemeBackgroundSync.instance = new ThemeBackgroundSync();
        }
        return ThemeBackgroundSync.instance;
    }

    constructor() {
        this.startBackgroundSync();
        this.loadPendingFromStorage();
    }

    /**
     * Save theme preference locally and queue for background sync
     */
    saveThemePreference(userId: string, theme: ThemeType): void {
        const preference: ThemePreference = {
            userId,
            theme,
            timestamp: Date.now(),
            synced: false
        };

        // Save immediately to local storage
        this.saveToLocalStorage(preference);

        // Add to sync queue
        this.addToSyncQueue(preference);
    }

    /**
     * Get theme preference from local storage (fast)
     */
    getThemePreference(userId: string): ThemeType | null {
        try {
            const stored = localStorage.getItem(`${this.STORAGE_KEY}-${userId}`);
            if (stored) {
                const preference: ThemePreference = JSON.parse(stored);
                return preference.theme;
            }
        } catch (error) {
            console.error('Error reading theme from local storage:', error);
        }
        return null;
    }

    /**
     * Save to local storage for immediate access
     */
    private saveToLocalStorage(preference: ThemePreference): void {
        try {
            localStorage.setItem(
                `${this.STORAGE_KEY}-${preference.userId}`,
                JSON.stringify(preference)
            );
        } catch (error) {
            console.error('Error saving theme to local storage:', error);
        }
    }

    /**
     * Add preference to sync queue
     */
    private addToSyncQueue(preference: ThemePreference): void {
        // Remove any existing preference for this user
        this.syncQueue = this.syncQueue.filter(p => p.userId !== preference.userId);

        // Add new preference
        this.syncQueue.push(preference);

        // Save queue to storage
        this.saveQueueToStorage();

        // Trigger immediate sync if not already processing
        if (!this.isProcessing) {
            this.processSyncQueue();
        }
    }

    /**
     * Process the sync queue
     */
    private async processSyncQueue(): Promise<void> {
        if (this.isProcessing || this.syncQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            const batch = this.syncQueue.splice(0, 5); // Process up to 5 at a time

            await Promise.allSettled(
                batch.map(preference => this.syncToDatabase(preference))
            );

            this.saveQueueToStorage();
        } catch (error) {
            console.error('Error processing sync queue:', error);
        } finally {
            this.isProcessing = false;

            // Continue processing if there are more items
            if (this.syncQueue.length > 0) {
                setTimeout(() => this.processSyncQueue(), 1000);
            }
        }
    }

    /**
     * Sync individual preference to database
     */
    private async syncToDatabase(preference: ThemePreference): Promise<void> {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    preferences: {
                        displaySettings: {
                            theme: preference.theme
                        }
                    }
                })
                .eq('id', preference.userId);

            if (error) {
                throw error;
            }

            // Mark as synced in local storage
            preference.synced = true;
            this.saveToLocalStorage(preference);

            console.log(`Theme preference synced for user ${preference.userId}: ${preference.theme}`);
        } catch (error) {
            console.error(`Failed to sync theme preference for user ${preference.userId}:`, error);

            // Re-add to queue for retry (with exponential backoff)
            setTimeout(() => {
                if (!preference.synced) {
                    this.addToSyncQueue(preference);
                }
            }, 5000 * Math.random()); // Random delay to prevent thundering herd
        }
    }

    /**
     * Save sync queue to storage
     */
    private saveQueueToStorage(): void {
        try {
            localStorage.setItem(`${this.STORAGE_KEY}-queue`, JSON.stringify(this.syncQueue));
        } catch (error) {
            console.error('Error saving sync queue to storage:', error);
        }
    }

    /**
     * Load pending sync items from storage
     */
    private loadPendingFromStorage(): void {
        try {
            const stored = localStorage.getItem(`${this.STORAGE_KEY}-queue`);
            if (stored) {
                this.syncQueue = JSON.parse(stored);
                // Filter out old items (older than 1 hour)
                const oneHourAgo = Date.now() - 60 * 60 * 1000;
                this.syncQueue = this.syncQueue.filter(p => p.timestamp > oneHourAgo);
            }
        } catch (error) {
            console.error('Error loading sync queue from storage:', error);
            this.syncQueue = [];
        }
    }

    /**
     * DISABLED: Start background sync timer to reduce overhead
     */
    private startBackgroundSync(): void {
        // DISABLED: Background sync to reduce database egress costs
        // this.syncTimer = setInterval(() => {
        //     this.processSyncQueue();
        // }, this.SYNC_INTERVAL);
    }

    /**
     * Stop background sync
     */
    stopBackgroundSync(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = undefined;
        }
    }

    /**
     * Get sync status
     */
    getSyncStatus(): {
        queueLength: number;
        isProcessing: boolean;
        pendingUsers: string[];
    } {
        return {
            queueLength: this.syncQueue.length,
            isProcessing: this.isProcessing,
            pendingUsers: this.syncQueue.map(p => p.userId)
        };
    }

    /**
     * Force sync all pending items
     */
    async forceSyncAll(): Promise<void> {
        await this.processSyncQueue();
    }
}

// Export singleton instance
export const themeBackgroundSync = ThemeBackgroundSync.getInstance();