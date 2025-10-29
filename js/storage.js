// Storage Management Module
class StorageManager {
    constructor(app) {
        this.app = app;
        this.storageKey = 'roadmap-app-data';
        this.autoSaveInterval = null;
        this.autoSaveDelay = 2000; // 2 seconds
    }
    
    init() {
        this.startAutoSave();
        this.loadFromStorage();
    }
    
    destroy() {
        this.stopAutoSave();
    }
    
    // Save current state to localStorage
    save() {
        try {
            const data = {
                version: '1.0',
                timestamp: Date.now(),
                title: document.getElementById('roadmap-title').textContent,
                milestones: this.app.milestones,
                isReversed: this.app.isReversed,
                currentId: this.app.currentId,
                settings: {
                    theme: 'default',
                    autoSave: true
                }
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            
            // Update last saved indicator
            this.updateLastSavedIndicator();
            
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showError('Failed to save data. Storage might be full.');
            return false;
        }
    }
    
    // Load state from localStorage
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            
            if (!data) {
                return false;
            }
            
            const parsed = JSON.parse(data);
            
            // Validate data structure
            if (!this.validateData(parsed)) {
                console.warn('Invalid data structure, using defaults');
                return false;
            }
            
            // Load data
            this.app.milestones = parsed.milestones || [];
            this.app.isReversed = parsed.isReversed || false;
            this.app.currentId = parsed.currentId || 0;
            
            if (parsed.title) {
                document.getElementById('roadmap-title').textContent = parsed.title;
                document.getElementById('title-input').value = parsed.title;
            }
            
            return true;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.showError('Failed to load saved data.');
            return false;
        }
    }
    
    // Validate data structure
    validateData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        if (!Array.isArray(data.milestones)) {
            return false;
        }
        
        // Validate each milestone
        for (const milestone of data.milestones) {
            if (!milestone.id || typeof milestone.title !== 'string') {
                return false;
            }
        }
        
        return true;
    }
    
    // Export data as JSON file
    exportToFile(filename = null) {
        try {
            const data = {
                version: '1.0',
                timestamp: Date.now(),
                title: document.getElementById('roadmap-title').textContent,
                milestones: this.app.milestones,
                isReversed: this.app.isReversed,
                currentId: this.app.currentId,
                settings: {
                    theme: 'default',
                    autoSave: true
                }
            };
            
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `roadmap-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.app.showNotification('Roadmap exported successfully!');
            return true;
        } catch (error) {
            console.error('Error exporting file:', error);
            this.showError('Failed to export file.');
            return false;
        }
    }
    
    // Import data from JSON file
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('No file provided'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (!this.validateData(data)) {
                        reject(new Error('Invalid file format'));
                        return;
                    }
                    
                    // Import data
                    this.app.milestones = data.milestones || [];
                    this.app.isReversed = data.isReversed || false;
                    this.app.currentId = data.currentId || 0;
                    
                    if (data.title) {
                        document.getElementById('roadmap-title').textContent = data.title;
                        document.getElementById('title-input').value = data.title;
                    }
                    
                    this.app.renderMilestones();
                    this.save();
                    
                    this.app.showNotification('Roadmap imported successfully!');
                    resolve(true);
                } catch (error) {
                    reject(new Error('Failed to parse file'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    // Clear all data
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            this.app.milestones = [];
            this.app.currentId = 0;
            this.app.isReversed = false;
            
            document.getElementById('roadmap-title').textContent = 'My Roadmap';
            document.getElementById('title-input').value = 'My Roadmap';
            
            this.app.renderMilestones();
            
            this.app.showNotification('All data cleared');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showError('Failed to clear data.');
            return false;
        }
    }
    
    // Get storage usage info
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.storageKey);
            const size = data ? new Blob([data]).size : 0;
            const maxSize = 5 * 1024 * 1024; // 5MB (typical localStorage limit)
            
            return {
                used: size,
                max: maxSize,
                percentage: (size / maxSize) * 100,
                milestones: this.app.milestones.length
            };
        } catch (error) {
            return {
                used: 0,
                max: 0,
                percentage: 0,
                milestones: 0
            };
        }
    }
    
    // Start auto-save
    startAutoSave() {
        this.stopAutoSave();
        
        this.autoSaveInterval = setInterval(() => {
            if (this.hasChanges()) {
                this.save();
            }
        }, this.autoSaveDelay);
    }
    
    // Stop auto-save
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
    
    // Check if there are unsaved changes
    hasChanges() {
        // This is a simple implementation - in a real app you'd track dirty state
        return this.app.milestones.length > 0;
    }
    
    // Update last saved indicator
    updateLastSavedIndicator() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        
        // You could add a visual indicator here
        console.log(`Last saved: ${timeString}`);
    }
    
    // Show error message
    showError(message) {
        console.error(message);
        // You could show a toast notification here
        alert(message);
    }
    
    // Backup data (multiple versions)
    createBackup() {
        try {
            const data = {
                version: '1.0',
                timestamp: Date.now(),
                title: document.getElementById('roadmap-title').textContent,
                milestones: this.app.milestones,
                isReversed: this.app.isReversed,
                currentId: this.app.currentId
            };
            
            const backupKey = `${this.storageKey}-backup-${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(data));
            
            // Keep only last 5 backups
            this.cleanupBackups();
            
            return true;
        } catch (error) {
            console.error('Error creating backup:', error);
            return false;
        }
    }
    
    // Cleanup old backups
    cleanupBackups() {
        try {
            const keys = Object.keys(localStorage);
            const backupKeys = keys.filter(key => key.startsWith(`${this.storageKey}-backup-`));
            
            if (backupKeys.length > 5) {
                // Sort by timestamp and remove oldest
                backupKeys.sort();
                const keysToRemove = backupKeys.slice(0, backupKeys.length - 5);
                
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
            }
        } catch (error) {
            console.error('Error cleaning up backups:', error);
        }
    }
    
    // Restore from backup
    restoreFromBackup(timestamp) {
        try {
            const backupKey = `${this.storageKey}-backup-${timestamp}`;
            const data = localStorage.getItem(backupKey);
            
            if (!data) {
                return false;
            }
            
            const parsed = JSON.parse(data);
            
            if (!this.validateData(parsed)) {
                return false;
            }
            
            // Restore data
            this.app.milestones = parsed.milestones || [];
            this.app.isReversed = parsed.isReversed || false;
            this.app.currentId = parsed.currentId || 0;
            
            if (parsed.title) {
                document.getElementById('roadmap-title').textContent = parsed.title;
                document.getElementById('title-input').value = parsed.title;
            }
            
            this.app.renderMilestones();
            this.save();
            
            return true;
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return false;
        }
    }
}

// Make StorageManager available globally
window.StorageManager = StorageManager;
