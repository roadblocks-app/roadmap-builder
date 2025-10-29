// PDF Export Module
class PDFExporter {
    constructor(app) {
        this.app = app;
        this.isExporting = false;
    }
    
    async exportToPDF() {
        if (this.isExporting) {
            this.app.showNotification('Export already in progress...');
            return;
        }
        
        if (this.app.milestones.length === 0) {
            this.app.showNotification('No milestones to export');
            return;
        }
        
        this.isExporting = true;
        
        try {
            // Show loading state
            this.showExportProgress('Preparing PDF...');
            
            // Create PDF document
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Set up page dimensions
            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            
            // Column widths (three-column layout) with safer margins
            const contentColWidth = contentWidth * 0.45; // 45% (reduced even more for safety)
            const checkboxColWidth = contentWidth * 0.1; // 10%
            const notesColWidth = contentWidth * 0.45; // 45% (increased for safety)
            
            let currentY = margin;
            let pageNumber = 1;
            
            // Add title
            currentY = this.addTitle(doc, currentY, pageWidth, margin);
            
            // Add date
            currentY = this.addDate(doc, currentY, pageWidth, margin);
            
            // Add milestones
            currentY = this.addMilestones(doc, currentY, pageWidth, margin, contentColWidth, checkboxColWidth, notesColWidth, pageHeight);
            
            // Add page numbers if multiple pages
            if (pageNumber > 1) {
                this.addPageNumbers(doc, pageNumber);
            }
            
            // Save PDF
            const filename = `roadmap-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            this.app.showNotification('PDF exported successfully!');
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.app.showNotification('Failed to export PDF. Please try again.');
        } finally {
            this.isExporting = false;
            this.hideExportProgress();
        }
    }
    
    addTitle(doc, y, pageWidth, margin) {
        const title = document.getElementById('roadmap-title').textContent || 'My Roadmap';
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(title, pageWidth / 2, y, { align: 'center' });
        
        return y + 15;
    }
    
    addDate(doc, y, pageWidth, margin) {
        const date = new Date().toLocaleDateString();
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${date}`, pageWidth / 2, y, { align: 'center' });
        
        return y + 10;
    }
    
    addMilestones(doc, startY, pageWidth, margin, contentColWidth, checkboxColWidth, notesColWidth, pageHeight) {
        let currentY = startY;
        const lineHeight = 6;
        const milestoneSpacing = 15;
        
        // Add column headers
        currentY = this.addColumnHeaders(doc, currentY, pageWidth, margin, contentColWidth, checkboxColWidth, notesColWidth);
        currentY += 5;
        
        // Add milestones
        this.app.milestones.forEach((milestone, index) => {
            // Check if we need a new page
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = margin;
                currentY = this.addColumnHeaders(doc, currentY, pageWidth, margin, contentColWidth, checkboxColWidth, notesColWidth);
                currentY += 5;
            }
            
            currentY = this.addMilestone(doc, milestone, index, currentY, pageWidth, margin, contentColWidth, checkboxColWidth, notesColWidth, lineHeight);
            currentY += milestoneSpacing;
        });
        
        return currentY;
    }
    
    addColumnHeaders(doc, y, pageWidth, margin, contentColWidth, checkboxColWidth, notesColWidth) {
        const x = margin;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        // Content header
        doc.text('Milestone', x, y);
        
        // Checkbox header
        doc.text('✓', x + contentColWidth + 5, y);
        
        // Notes header
        doc.text('Deadline & Notes', x + contentColWidth + checkboxColWidth + 10, y);
        
        // Add underline
        doc.line(x, y + 2, pageWidth - margin, y + 2);
        
        return y + 8;
    }
    
    addMilestone(doc, milestone, index, y, pageWidth, margin, contentColWidth, checkboxColWidth, notesColWidth, lineHeight) {
        const x = margin;
        let currentY = y;
        
        // Set font for milestone content
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Milestone content (left column - 45%)
        const contentX = x;
        const contentText = `${index + 1}. ${milestone.title}`;
        
        // Split long text into multiple lines with safer margins (reduced width for better wrapping)
        const contentLines = doc.splitTextToSize(contentText, contentColWidth - 20);
        doc.text(contentLines, contentX, currentY);
        
        // Add description if exists
        if (milestone.description) {
            currentY += (contentLines.length * lineHeight) + 2;
            doc.setFontSize(8);
            const descLines = doc.splitTextToSize(milestone.description, contentColWidth - 20);
            doc.text(descLines, contentX, currentY);
            currentY += (descLines.length * lineHeight) + 2;
        } else {
            currentY += (contentLines.length * lineHeight) + 2;
        }
        
        // Add date if exists
        if (milestone.date) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(`Date: ${milestone.date}`, contentX, currentY);
            currentY += lineHeight;
        }
        
        // Add category
        if (milestone.category) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const categoryName = this.getCategoryName(milestone.category);
            doc.text(`Category: ${categoryName}`, contentX, currentY);
            currentY += lineHeight;
        }
        
        // Checkbox (middle column - 10%)
        const checkboxX = x + contentColWidth + 10;
        const checkboxY = y;
        
        // Draw checkbox
        doc.rect(checkboxX, checkboxY - 3, 4, 4);
        
        // Add checkmark if completed
        if (milestone.completed) {
            doc.setFontSize(8);
            doc.text('✓', checkboxX + 1, checkboxY);
        }
        
        // Notes area (right column - 40%)
        const notesX = x + contentColWidth + checkboxColWidth + 15;
        const notesY = y;
        
        // Draw lines for manual writing
        const linesCount = Math.max(3, Math.ceil((currentY - y) / lineHeight));
        
        for (let i = 0; i < linesCount; i++) {
            const lineY = notesY + (i * lineHeight);
            doc.line(notesX, lineY, notesX + notesColWidth - 10, lineY);
        }
        
        // Add placeholder text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Write deadlines here', notesX, notesY - 2);
        
        return Math.max(currentY, notesY + (linesCount * lineHeight));
    }
    
    addPageNumbers(doc, totalPages) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10);
        }
    }
    
    getCategoryName(category) {
        const categoryMap = {
            'planning': 'Planning',
            'development': 'Development',
            'testing': 'Testing',
            'launch': 'Launch',
            'maintenance': 'Maintenance'
        };
        return categoryMap[category] || 'Planning';
    }
    
    showExportProgress(message) {
        // Create progress overlay
        const overlay = document.createElement('div');
        overlay.id = 'export-progress';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const progressBox = document.createElement('div');
        progressBox.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        progressBox.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <div style="width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
            <p style="margin: 0; font-weight: 500;">${message}</p>
        `;
        
        // Add spinning animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        overlay.appendChild(progressBox);
        document.body.appendChild(overlay);
    }
    
    hideExportProgress() {
        const overlay = document.getElementById('export-progress');
        if (overlay) {
            overlay.remove();
        }
    }
    
    // Alternative export using html2canvas (for more complex layouts)
    async exportToPDFWithCanvas() {
        if (this.isExporting) {
            return;
        }
        
        this.isExporting = true;
        
        try {
            this.showExportProgress('Capturing roadmap...');
            
            // Create a print-friendly version
            const printContainer = this.createPrintContainer();
            document.body.appendChild(printContainer);
            
            // Capture with html2canvas
            const canvas = await html2canvas(printContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });
            
            // Convert to PDF
            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const imgWidth = 210; // A4 width
            const pageHeight = 297; // A4 height
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            // Clean up
            document.body.removeChild(printContainer);
            
            // Save
            const filename = `roadmap-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(filename);
            
            this.app.showNotification('PDF exported successfully!');
            
        } catch (error) {
            console.error('Canvas PDF export error:', error);
            this.app.showNotification('Failed to export PDF. Please try again.');
        } finally {
            this.isExporting = false;
            this.hideExportProgress();
        }
    }
    
    createPrintContainer() {
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 800px;
            background: white;
            padding: 20px;
            font-family: Arial, sans-serif;
        `;
        
        // Add title
        const title = document.createElement('h1');
        title.textContent = document.getElementById('roadmap-title').textContent;
        title.style.cssText = `
            text-align: center;
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: bold;
        `;
        container.appendChild(title);
        
        // Add date
        const date = document.createElement('p');
        date.textContent = `Generated on: ${new Date().toLocaleDateString()}`;
        date.style.cssText = `
            text-align: center;
            margin-bottom: 30px;
            font-size: 12px;
            color: #666;
        `;
        container.appendChild(date);
        
        // Add milestones in print format
        this.app.milestones.forEach((milestone, index) => {
            const milestoneDiv = document.createElement('div');
            milestoneDiv.style.cssText = `
                margin-bottom: 20px;
                padding: 15px;
                border: 1px solid #ddd;
                display: flex;
                align-items: flex-start;
                gap: 15px;
            `;
            
            // Content column
            const contentCol = document.createElement('div');
            contentCol.style.cssText = `
                flex: 0 0 50%;
                width: 50%;
                max-width: 50%;
                padding-right: 20px;
                box-sizing: border-box;
                overflow: hidden;
                word-wrap: break-word;
            `;
            
            const title = document.createElement('h3');
            title.textContent = `${index + 1}. ${milestone.title}`;
            title.style.cssText = `
                margin: 0 0 5px 0;
                font-size: 14px;
                font-weight: bold;
            `;
            contentCol.appendChild(title);
            
            if (milestone.description) {
                const desc = document.createElement('p');
                desc.textContent = milestone.description;
                desc.style.cssText = `
                    margin: 0 0 5px 0;
                    font-size: 12px;
                    color: #666;
                `;
                contentCol.appendChild(desc);
            }
            
            if (milestone.date) {
                const date = document.createElement('p');
                date.textContent = `Date: ${milestone.date}`;
                date.style.cssText = `
                    margin: 0;
                    font-size: 10px;
                    color: #888;
                `;
                contentCol.appendChild(date);
            }
            
            // Checkbox column
            const checkboxCol = document.createElement('div');
            checkboxCol.style.cssText = `
                flex: 0 0 10%;
                width: 10%;
                max-width: 10%;
                display: flex;
                justify-content: center;
                align-items: center;
                padding-top: 5px;
                box-sizing: border-box;
            `;
            
            const checkbox = document.createElement('div');
            checkbox.style.cssText = `
                width: 15px;
                height: 15px;
                border: 2px solid #000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            `;
            
            if (milestone.completed) {
                checkbox.textContent = '✓';
            }
            
            checkboxCol.appendChild(checkbox);
            
            // Notes column
            const notesCol = document.createElement('div');
            notesCol.style.cssText = `
                flex: 0 0 40%;
                width: 40%;
                max-width: 40%;
                border-left: 1px solid #ddd;
                padding-left: 10px;
                min-height: 50px;
                box-sizing: border-box;
            `;
            
            // Add lines for writing
            for (let i = 0; i < 3; i++) {
                const line = document.createElement('div');
                line.style.cssText = `
                    height: 15px;
                    border-bottom: 1px solid #ccc;
                    margin-bottom: 5px;
                `;
                notesCol.appendChild(line);
            }
            
            milestoneDiv.appendChild(contentCol);
            milestoneDiv.appendChild(checkboxCol);
            milestoneDiv.appendChild(notesCol);
            container.appendChild(milestoneDiv);
        });
        
        return container;
    }
}

// Make PDFExporter available globally
window.PDFExporter = PDFExporter;

// Global export function
window.exportToPDF = function() {
    if (window.roadmapApp && window.roadmapApp.pdfExporter) {
        window.roadmapApp.pdfExporter.exportToPDF();
    }
};
