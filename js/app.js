// Main Application Logic
class RoadmapApp {
    constructor() {
        this.milestones = [];
        this.isReversed = false;
        this.currentId = 0;
        this.categories = [
            { name: 'Planning', value: 'planning', color: 'category-planning' },
            { name: 'Development', value: 'development', color: 'category-development' },
            { name: 'Testing', value: 'testing', color: 'category-testing' },
            { name: 'Launch', value: 'launch', color: 'category-launch' }
        ];
        
        // Initialize modules
        this.textParser = new TextParser();
        this.dragDropManager = new DragDropManager(this);
        this.storageManager = new StorageManager(this);
        this.pdfExporter = new PDFExporter(this);
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.storageManager.init();
        this.loadFromStorage();
        this.renderMilestones();
        this.updateDirectionToggle();
        this.registerServiceWorker();
    }
    
    bindEvents() {
        // Parse text button
        document.getElementById('parse-text').addEventListener('click', () => {
            this.parseText();
        });
        
        // Clear all button
        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAll();
        });
        
        // Direction toggle
        document.getElementById('direction-toggle').addEventListener('click', () => {
            this.toggleDirection();
        });
        
        // Save/Load buttons
        document.getElementById('save-roadmap').addEventListener('click', () => {
            this.saveToStorage();
        });
        
        document.getElementById('load-roadmap').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.loadFromFile(e.target.files[0]);
        });
        
        // Export PDF button
        document.getElementById('export-pdf').addEventListener('click', () => {
            this.exportToPDF();
        });
        
        // Title editing
        const titleElement = document.getElementById('roadmap-title');
        const titleInput = document.getElementById('title-input');
        
        titleElement.addEventListener('click', () => {
            titleElement.style.display = 'none';
            titleInput.style.display = 'block';
            titleInput.focus();
            titleInput.select();
        });
        
        titleInput.addEventListener('blur', () => {
            this.updateTitle();
        });
        
        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.updateTitle();
            }
        });
        
        // Auto-save on changes
        document.addEventListener('input', () => {
            this.debounceAutoSave();
        });
        
        // Bulk actions
        this.bindBulkActions();
    }
    
    bindBulkActions() {
        // Select all checkbox
        document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.milestone-select-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
        
        // Individual milestone checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('milestone-select-checkbox')) {
                this.updateSelectAllCheckbox();
            }
        });
        
        // Bulk category change
        document.getElementById('bulk-category-select').addEventListener('change', (e) => {
            const selectedCategory = e.target.value;
            if (selectedCategory) {
                this.bulkChangeCategory(selectedCategory);
                e.target.value = ''; // Reset dropdown
            }
        });
        
        // Mark selected as completed
        document.getElementById('mark-selected-complete').addEventListener('click', () => {
            this.bulkMarkCompleted();
        });
    }
    
    updateSelectAllCheckbox() {
        const checkboxes = document.querySelectorAll('.milestone-select-checkbox');
        const checked = document.querySelectorAll('.milestone-select-checkbox:checked');
        document.getElementById('select-all-checkbox').checked = checkboxes.length > 0 && checkboxes.length === checked.length;
    }
    
    bulkChangeCategory(category) {
        const selectedCheckboxes = document.querySelectorAll('.milestone-select-checkbox:checked');
        
        selectedCheckboxes.forEach(checkbox => {
            const id = parseInt(checkbox.dataset.id);
            this.updateMilestone(id, { category });
        });
        
        this.renderMilestones();
        this.showNotification(`Changed ${selectedCheckboxes.length} milestones to ${category}`);
    }
    
    bulkMarkCompleted() {
        const selectedCheckboxes = document.querySelectorAll('.milestone-select-checkbox:checked');
        let updated = 0;
        
        selectedCheckboxes.forEach(checkbox => {
            const id = parseInt(checkbox.dataset.id);
            const milestone = this.milestones.find(m => m.id === id);
            
            if (milestone) {
                const currentPhase = milestone.category || 'planning';
                if (milestone.phaseCheckboxes && milestone.phaseCheckboxes[currentPhase]) {
                    milestone.phaseCheckboxes[currentPhase].complete = true;
                    updated++;
                }
            }
        });
        
        this.saveToStorage();
        this.renderMilestones();
        this.showNotification(`Marked ${updated} milestones as completed in current phase`);
    }
    
    updateTitle() {
        const titleElement = document.getElementById('roadmap-title');
        const titleInput = document.getElementById('title-input');
        
        const newTitle = titleInput.value.trim() || 'My Roadmap';
        titleElement.textContent = newTitle;
        titleInput.value = newTitle;
        
        titleElement.style.display = 'block';
        titleInput.style.display = 'none';
        
        this.saveToStorage();
    }
    
    parseText() {
        const textInput = document.getElementById('text-input');
        const text = textInput.value.trim();
        
        if (!text) {
            alert('Please enter some text to parse.');
            return;
        }
        
        const parsedMilestones = this.parseTextToMilestones(text);
        
        if (parsedMilestones.length === 0) {
            alert('No milestones found in the text. Please check the format.');
            return;
        }
        
        // Clear existing milestones
        this.milestones = [];
        
        // Add parsed milestones
        parsedMilestones.forEach(milestone => {
            this.addMilestone(milestone);
        });
        
        this.renderMilestones();
        this.saveToStorage();
        this.updateProgressDashboard();
        
        // Clear the input
        textInput.value = '';
        
        // Show success message
        this.showNotification(`Parsed ${parsedMilestones.length} milestones successfully!`);
    }
    
    parseTextToMilestones(text) {
        return this.textParser.parseAIContent(text);
    }
    
    addMilestone(milestoneData = {}) {
        const milestone = {
            id: ++this.currentId,
            title: milestoneData.title || 'New Milestone',
            description: milestoneData.description || '',
            date: milestoneData.date || '',
            category: milestoneData.category || 'planning',
            completed: milestoneData.completed || false,
            ...milestoneData
        };
        
        // Initialize phase checkboxes if not present
        if (!milestone.phaseCheckboxes) {
            milestone.phaseCheckboxes = {
                planning: { complete: false },
                development: { complete: false },
                testing: { complete: false },
                launch: { complete: false }
            };
        }
        
        this.milestones.push(milestone);
        return milestone;
    }
    
    removeMilestone(id) {
        this.milestones = this.milestones.filter(m => m.id !== id);
        this.renderMilestones();
        this.saveToStorage();
        this.updateProgressDashboard();
    }
    
    updateMilestone(id, updates) {
        const milestone = this.milestones.find(m => m.id === id);
        if (milestone) {
            Object.assign(milestone, updates);
            this.saveToStorage();
        }
    }
    
    togglePhaseComplete(id, phase) {
        const milestone = this.milestones.find(m => m.id === id);
        if (milestone && milestone.phaseCheckboxes && milestone.phaseCheckboxes[phase]) {
            milestone.phaseCheckboxes[phase].complete = !milestone.phaseCheckboxes[phase].complete;
            this.saveToStorage();
            this.updateProgressDashboard(); // Update dashboard in real-time
        }
    }
    
    clearAll() {
        if (confirm('Are you sure you want to clear all milestones?')) {
            this.milestones = [];
            this.currentId = 0;
            this.renderMilestones();
            this.saveToStorage();
        }
    }
    
    toggleDirection() {
        this.isReversed = !this.isReversed;
        this.updateDirectionToggle();
        this.renderMilestones();
    }
    
    updateDirectionToggle() {
        const icon = document.querySelector('.direction-icon');
        const text = document.querySelector('.direction-text');
        
        if (this.isReversed) {
            icon.textContent = '↓';
            text.textContent = 'Top to Bottom';
        } else {
            icon.textContent = '↑';
            text.textContent = 'Bottom to Top';
        }
    }
    
    renderMilestones() {
        const container = document.getElementById('milestones-list');
        const roadmapContainer = document.getElementById('roadmap-container');
        
        // Update container class for direction
        if (this.isReversed) {
            roadmapContainer.classList.add('reversed');
        } else {
            roadmapContainer.classList.remove('reversed');
        }
        
        if (this.milestones.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No milestones yet</h3>
                    <p>Paste your roadmap text above and click "Parse into Milestones" to get started.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        // Add progress dashboard
        const dashboard = this.createProgressDashboard();
        container.appendChild(dashboard);
        
        this.milestones.forEach((milestone, index) => {
            const milestoneElement = this.createMilestoneElement(milestone, index);
            container.appendChild(milestoneElement);
        });
        
        // Initialize drag and drop
        this.dragDropManager.init();
    }
    
    // Create progress dashboard
    createProgressDashboard() {
        const dashboard = document.createElement('div');
        dashboard.className = 'progress-dashboard';
        dashboard.id = 'progress-dashboard';
        
        // Calculate progress for each phase
        const progressData = this.calculateProgress();
        
        dashboard.innerHTML = `
            <h3>Progress Dashboard</h3>
            <div class="progress-stats">
                <div class="progress-stat">
                    <div class="progress-label">Overall</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progressData.overall}%"></div>
                    </div>
                    <div class="progress-percentage">${progressData.overall}%</div>
                </div>
                ${this.categories.map(cat => {
                    const phaseProgress = progressData[cat.value] || 0;
                    return `
                        <div class="progress-stat">
                            <div class="progress-label">${cat.name}</div>
                            <div class="progress-bar-container">
                                <div class="progress-bar ${cat.color}" style="width: ${phaseProgress}%"></div>
                            </div>
                            <div class="progress-percentage">${phaseProgress}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        return dashboard;
    }
    
    // Calculate progress for all phases
    calculateProgress() {
        const stats = {
            overall: 0,
            planning: { total: 0, complete: 0 },
            development: { total: 0, complete: 0 },
            testing: { total: 0, complete: 0 },
            launch: { total: 0, complete: 0 }
        };
        
        // Count tasks and completed tasks per phase
        // Each milestone has phase checkboxes, so count all phases
        this.milestones.forEach(milestone => {
            if (!milestone.phaseCheckboxes) return;
            
            // Count each phase checkbox
            this.categories.forEach(cat => {
                const phase = cat.value;
                if (milestone.phaseCheckboxes[phase]) {
                    stats[phase].total++;
                    if (milestone.phaseCheckboxes[phase].complete) {
                        stats[phase].complete++;
                    }
                }
            });
        });
        
        // Calculate percentages
        const percentages = {
            overall: 0,
            planning: 0,
            development: 0,
            testing: 0,
            launch: 0
        };
        
        let totalOverall = 0;
        let completeOverall = 0;
        
        this.categories.forEach(cat => {
            const phase = cat.value;
            const phaseData = stats[phase];
            percentages[phase] = phaseData.total > 0 
                ? Math.round((phaseData.complete / phaseData.total) * 100) 
                : 0;
            
            totalOverall += phaseData.total;
            completeOverall += phaseData.complete;
        });
        
        percentages.overall = totalOverall > 0 
            ? Math.round((completeOverall / totalOverall) * 100) 
            : 0;
        
        return percentages;
    }
    
    // Update progress dashboard
    updateProgressDashboard() {
        const dashboard = document.getElementById('progress-dashboard');
        if (!dashboard) return;
        
        const progressData = this.calculateProgress();
        
        // Update overall progress
        const overallStat = dashboard.querySelector('.progress-stat');
        if (overallStat) {
            overallStat.querySelector('.progress-bar').style.width = `${progressData.overall}%`;
            overallStat.querySelector('.progress-percentage').textContent = `${progressData.overall}%`;
        }
        
        // Update phase progress
        const phaseStats = dashboard.querySelectorAll('.progress-stat');
        phaseStats.forEach((stat, index) => {
            if (index === 0) return; // Skip overall
            const phase = this.categories[index - 1];
            const phaseProgress = progressData[phase.value] || 0;
            stat.querySelector('.progress-bar').style.width = `${phaseProgress}%`;
            stat.querySelector('.progress-percentage').textContent = `${phaseProgress}%`;
        });
    }
    
    createMilestoneElement(milestone, index) {
        const div = document.createElement('div');
        div.className = 'milestone-card';
        div.dataset.id = milestone.id;
        
        const categoryClass = this.categories.find(c => c.value === milestone.category)?.color || 'category-planning';
        
        // Get current phase checkboxes
        const currentPhase = milestone.category || 'planning';
        const phaseCheckboxes = milestone.phaseCheckboxes || {
            planning: { complete: false },
            development: { complete: false },
            testing: { complete: false },
            launch: { complete: false }
        };
        const currentPhaseState = phaseCheckboxes[currentPhase] || { complete: false };
        
        div.innerHTML = `
            <div class="milestone-header">
                <input type="text" class="milestone-title" value="${this.escapeHtml(milestone.title)}" 
                       data-field="title" data-id="${milestone.id}">
                <div class="milestone-controls">
                    <input type="checkbox" class="milestone-select-checkbox" data-id="${milestone.id}">
                    <button class="milestone-delete" data-id="${milestone.id}">×</button>
                </div>
            </div>
            <textarea class="milestone-description" data-field="description" data-id="${milestone.id}"
                      placeholder="Add description...">${this.escapeHtml(milestone.description)}</textarea>
            <div class="milestone-phase-tracker">
                <label class="phase-checkbox-label">
                    <input type="checkbox" class="phase-complete-checkbox" ${currentPhaseState.complete ? 'checked' : ''}
                           data-id="${milestone.id}" data-phase="${currentPhase}">
                    <span>Completed</span>
                </label>
            </div>
            <div class="milestone-footer">
                <input type="text" class="milestone-date" value="${this.escapeHtml(milestone.date)}" 
                       placeholder="Date" data-field="date" data-id="${milestone.id}">
                <select class="milestone-category ${categoryClass}" data-field="category" data-id="${milestone.id}">
                    ${this.categories.map(cat => 
                        `<option value="${cat.value}" ${cat.value === milestone.category ? 'selected' : ''}>${cat.name}</option>`
                    ).join('')}
                </select>
            </div>
        `;
        
        // Bind events
        this.bindMilestoneEvents(div);
        
        return div;
    }
    
    bindMilestoneEvents(element) {
        // Delete button
        element.querySelector('.milestone-delete').addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            this.removeMilestone(id);
        });
        
        // Input fields
        element.querySelectorAll('[data-field]').forEach(input => {
            input.addEventListener('blur', (e) => {
                const id = parseInt(e.target.dataset.id);
                const field = e.target.dataset.field;
                const value = e.target.value;
                
                this.updateMilestone(id, { [field]: value });
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.target.blur();
                }
            });
        });
        
        // Category change
        element.querySelector('.milestone-category').addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id);
            const category = e.target.value;
            const categoryClass = this.categories.find(c => c.value === category)?.color || 'category-planning';
            
            // Update the class
            e.target.className = `milestone-category ${categoryClass}`;
            
            this.updateMilestone(id, { category });
            
            // Re-render to show new phase checkboxes
            this.renderMilestones();
        });
        
        // Phase checkboxes
        element.querySelector('.phase-complete-checkbox')?.addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id);
            const phase = e.target.dataset.phase;
            this.togglePhaseComplete(id, phase);
        });
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('SW registered: ', registration);
                    })
                    .catch((registrationError) => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }
    
    saveToStorage() {
        this.storageManager.save();
    }
    
    loadFromStorage() {
        this.storageManager.load();
    }
    
    loadFromFile(file) {
        this.storageManager.importFromFile(file)
            .then(() => {
                this.renderMilestones();
            })
            .catch(error => {
                alert('Error loading file. Please check the file format.');
            });
    }
    
    exportToPDF() {
        this.pdfExporter.exportToPDF();
    }
    
    debounceAutoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveToStorage();
        }, 1000);
    }
    
    showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.roadmapApp = new RoadmapApp();
});
