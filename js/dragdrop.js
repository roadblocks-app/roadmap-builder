// Drag and Drop Module
class DragDropManager {
    constructor(app) {
        this.app = app;
        this.sortable = null;
        this.isInitialized = false;
    }
    
    init() {
        if (this.isInitialized) {
            this.destroy();
        }
        
        const container = document.getElementById('milestones-list');
        if (!container || !window.Sortable) {
            console.warn('Sortable.js not loaded or container not found');
            return;
        }
        
        this.sortable = new Sortable(container, {
            animation: 150,
            ghostClass: 'dragging',
            chosenClass: 'chosen',
            dragClass: 'drag',
            handle: '.milestone-card',
            
            onStart: (evt) => {
                this.onDragStart(evt);
            },
            
            onEnd: (evt) => {
                this.onDragEnd(evt);
            },
            
            onMove: (evt) => {
                return this.onMove(evt);
            },
            
            onUpdate: (evt) => {
                this.onUpdate(evt);
            }
        });
        
        this.isInitialized = true;
    }
    
    destroy() {
        if (this.sortable) {
            this.sortable.destroy();
            this.sortable = null;
        }
        this.isInitialized = false;
    }
    
    onDragStart(evt) {
        const element = evt.item;
        element.classList.add('dragging');
        
        // Add visual feedback
        this.addDragFeedback(element);
        
        // Store original position
        element.dataset.originalIndex = evt.oldIndex;
    }
    
    onDragEnd(evt) {
        const element = evt.item;
        element.classList.remove('dragging');
        
        // Remove visual feedback
        this.removeDragFeedback(element);
        
        // Clean up
        delete element.dataset.originalIndex;
    }
    
    onMove(evt) {
        // Allow dropping between milestones
        return true;
    }
    
    onUpdate(evt) {
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;
        
        if (oldIndex !== newIndex) {
            // Reorder milestones array
            const movedMilestone = this.app.milestones.splice(oldIndex, 1)[0];
            this.app.milestones.splice(newIndex, 0, movedMilestone);
            
            // Save to storage
            this.app.saveToStorage();
            
            // Show feedback
            this.showReorderFeedback(oldIndex, newIndex);
        }
    }
    
    addDragFeedback(element) {
        // Add drop zones between milestones
        const container = document.getElementById('milestones-list');
        const milestones = container.querySelectorAll('.milestone-card');
        
        milestones.forEach((milestone, index) => {
            if (milestone !== element) {
                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone';
                dropZone.dataset.index = index;
                
                // Insert drop zone before milestone
                container.insertBefore(dropZone, milestone);
            }
        });
        
        // Add drop zone at the end
        const endDropZone = document.createElement('div');
        endDropZone.className = 'drop-zone';
        endDropZone.dataset.index = milestones.length;
        container.appendChild(endDropZone);
    }
    
    removeDragFeedback(element) {
        // Remove all drop zones
        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => zone.remove());
    }
    
    showReorderFeedback(oldIndex, newIndex) {
        const direction = newIndex > oldIndex ? 'down' : 'up';
        const message = `Moved milestone ${direction} from position ${oldIndex + 1} to ${newIndex + 1}`;
        
        this.app.showNotification(message);
    }
    
    // Add milestone at specific position
    addMilestoneAtPosition(milestoneData, position) {
        const milestone = this.app.addMilestone(milestoneData);
        
        // Insert at specific position
        if (position >= 0 && position < this.app.milestones.length) {
            const currentIndex = this.app.milestones.length - 1;
            if (position !== currentIndex) {
                const movedMilestone = this.app.milestones.splice(currentIndex, 1)[0];
                this.app.milestones.splice(position, 0, movedMilestone);
            }
        }
        
        this.app.renderMilestones();
        this.app.saveToStorage();
        
        return milestone;
    }
    
    // Move milestone to specific position
    moveMilestoneToPosition(milestoneId, newPosition) {
        const currentIndex = this.app.milestones.findIndex(m => m.id === milestoneId);
        
        if (currentIndex === -1) return false;
        
        if (newPosition >= 0 && newPosition < this.app.milestones.length) {
            const movedMilestone = this.app.milestones.splice(currentIndex, 1)[0];
            this.app.milestones.splice(newPosition, 0, movedMilestone);
            
            this.app.renderMilestones();
            this.app.saveToStorage();
            
            return true;
        }
        
        return false;
    }
    
    // Get current order
    getCurrentOrder() {
        return this.app.milestones.map(m => m.id);
    }
    
    // Set order programmatically
    setOrder(milestoneIds) {
        const orderedMilestones = [];
        
        milestoneIds.forEach(id => {
            const milestone = this.app.milestones.find(m => m.id === id);
            if (milestone) {
                orderedMilestones.push(milestone);
            }
        });
        
        // Add any remaining milestones
        this.app.milestones.forEach(milestone => {
            if (!milestoneIds.includes(milestone.id)) {
                orderedMilestones.push(milestone);
            }
        });
        
        this.app.milestones = orderedMilestones;
        this.app.renderMilestones();
        this.app.saveToStorage();
    }
}

// CSS for drop zones (injected dynamically)
const dropZoneStyles = `
.drop-zone {
    height: 4px;
    background: #3b82f6;
    margin: 8px 0;
    border-radius: 2px;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.drop-zone.active {
    opacity: 1;
    height: 8px;
    background: #1d4ed8;
}

.milestone-card.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.milestone-card.chosen {
    transform: scale(1.02);
}

.milestone-card.drag {
    opacity: 0.8;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = dropZoneStyles;
document.head.appendChild(styleSheet);

// Make DragDropManager available globally
window.DragDropManager = DragDropManager;
