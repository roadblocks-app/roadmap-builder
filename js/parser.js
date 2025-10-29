// Text Parser Module
class TextParser {
    constructor() {
        this.patterns = [
            // Numbered lists (1., 2., etc.)
            {
                regex: /^(\d+)\.\s*(.+)$/,
                extract: (match) => ({
                    title: match[2].trim(),
                    description: '',
                    date: '',
                    category: 'planning',
                    completed: false
                })
            },
            
            // Bullet points (-, *, •)
            {
                regex: /^[-•*]\s*(.+)$/,
                extract: (match) => ({
                    title: match[1].trim(),
                    description: '',
                    date: '',
                    category: 'planning',
                    completed: false
                })
            },
            
            // Dates with various formats
            {
                regex: /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s*(.+)$/,
                extract: (match) => ({
                    title: match[2].trim(),
                    description: '',
                    date: match[1].trim(),
                    category: 'planning',
                    completed: false
                })
            },
            
            // Priority indicators ([HIGH], [LOW], etc.)
            {
                regex: /^\[(HIGH|MEDIUM|LOW|URGENT|CRITICAL)\]\s*(.+)$/i,
                extract: (match) => ({
                    title: match[2].trim(),
                    description: `Priority: ${match[1].toUpperCase()}`,
                    date: '',
                    category: this.getPriorityCategory(match[1].toUpperCase()),
                    completed: false
                })
            },
            
            // Time-based patterns (Week 1, Month 2, etc.)
            {
                regex: /^(Week\s+\d+|Month\s+\d+|Q[1-4]|Quarter\s+[1-4])\s*[:-]\s*(.+)$/i,
                extract: (match) => ({
                    title: match[2].trim(),
                    description: `Timeline: ${match[1]}`,
                    date: '',
                    category: 'planning',
                    completed: false
                })
            },
            
            // Phase indicators (Phase 1, Stage 2, etc.)
            {
                regex: /^(Phase\s+\d+|Stage\s+\d+|Step\s+\d+)\s*[:-]\s*(.+)$/i,
                extract: (match) => ({
                    title: match[2].trim(),
                    description: `${match[1]}`,
                    date: '',
                    category: this.getPhaseCategory(match[1]),
                    completed: false
                })
            }
        ];
    }
    
    parseText(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }
        
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        const milestones = [];
        
        lines.forEach((line, index) => {
            const milestone = this.parseLine(line);
            if (milestone) {
                milestones.push(milestone);
            } else {
                // If no pattern matches, treat as a milestone title
                milestones.push({
                    title: line,
                    description: '',
                    date: '',
                    category: 'planning',
                    completed: false
                });
            }
        });
        
        return milestones;
    }
    
    parseLine(line) {
        for (const pattern of this.patterns) {
            const match = line.match(pattern.regex);
            if (match) {
                return pattern.extract(match);
            }
        }
        return null;
    }
    
    getPriorityCategory(priority) {
        const priorityMap = {
            'HIGH': 'development',
            'URGENT': 'development',
            'CRITICAL': 'development',
            'MEDIUM': 'testing',
            'LOW': 'maintenance'
        };
        return priorityMap[priority] || 'planning';
    }
    
    getPhaseCategory(phase) {
        const phaseLower = phase.toLowerCase();
        if (phaseLower.includes('phase 1') || phaseLower.includes('stage 1') || phaseLower.includes('step 1')) {
            return 'planning';
        } else if (phaseLower.includes('phase 2') || phaseLower.includes('stage 2') || phaseLower.includes('step 2')) {
            return 'development';
        } else if (phaseLower.includes('phase 3') || phaseLower.includes('stage 3') || phaseLower.includes('step 3')) {
            return 'testing';
        } else if (phaseLower.includes('phase 4') || phaseLower.includes('stage 4') || phaseLower.includes('step 4')) {
            return 'launch';
        }
        return 'planning';
    }
    
    // Enhanced parsing for AI-generated content
    parseAIContent(text) {
        const milestones = this.parseText(text);
        
        // Post-process to improve AI-generated content
        return milestones.map(milestone => {
            // Extract dates from title if not already in date field
            if (!milestone.date) {
                const dateMatch = milestone.title.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
                if (dateMatch) {
                    milestone.date = dateMatch[1];
                    milestone.title = milestone.title.replace(dateMatch[0], '').trim();
                }
            }
            
            // Auto-categorize based on keywords
            milestone.category = this.autoCategorize(milestone.title, milestone.description);
            
            // Clean up title
            milestone.title = this.cleanTitle(milestone.title);
            
            return milestone;
        });
    }
    
    autoCategorize(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        
        const categoryKeywords = {
            'planning': ['research', 'analyze', 'plan', 'design', 'wireframe', 'prototype', 'strategy', 'roadmap'],
            'development': ['develop', 'build', 'create', 'implement', 'code', 'program', 'construct', 'make'],
            'testing': ['test', 'debug', 'validate', 'verify', 'check', 'review', 'qa', 'quality'],
            'launch': ['launch', 'release', 'deploy', 'publish', 'go live', 'rollout', 'ship']
        };
        
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }
        
        return 'planning';
    }
    
    cleanTitle(title) {
        // Remove common prefixes
        return title
            .replace(/^(Step\s+\d+[:.]?\s*|Phase\s+\d+[:.]?\s*|Stage\s+\d+[:.]?\s*)/i, '')
            .replace(/^[-•*]\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .trim();
    }
    
    // Export milestones to text format
    exportToText(milestones) {
        return milestones.map((milestone, index) => {
            let line = `${index + 1}. ${milestone.title}`;
            
            if (milestone.date) {
                line += ` (${milestone.date})`;
            }
            
            if (milestone.description) {
                line += `\n   ${milestone.description}`;
            }
            
            return line;
        }).join('\n\n');
    }
}

// Make TextParser available globally
window.TextParser = TextParser;
