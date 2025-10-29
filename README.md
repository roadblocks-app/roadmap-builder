# Roadblocks.app - Drag & Drop Roadmap Builder

A progressive web app for creating vertical roadmaps from AI-generated text. Parse, rearrange, and export your roadmaps to PDF with a checklist column.

![Roadblocks.app](https://img.shields.io/badge/Status-Live-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow)

## 🚀 Live Demo

**[roadblocks.app](https://roadblocks.app)** - Try it now!

## ✨ Features

- **AI Text Parser**: Paste AI-generated roadmaps and auto-convert to milestone blocks
- **Drag & Drop**: Rearrange milestones with smooth vertical reordering
- **Phase Tracking**: Track progress across Planning, Development, Testing, and Launch phases
- **Bulk Actions**: Select all milestones and change categories or mark as completed
- **PDF Export**: Export to A4 format with checklist column for deadlines
- **Reversible Order**: View roadmaps bottom-to-top or top-to-bottom
- **Progressive Web App**: Install on desktop and mobile devices
- **No Login Required**: Works entirely in your browser

## 🛠️ Technology Stack

- **Vanilla JavaScript** (ES6+) - No frameworks, maximum simplicity
- **Sortable.js** - Lightweight drag-and-drop (~20KB)
- **jsPDF** - Client-side PDF generation
- **CSS Grid/Flexbox** - Responsive design
- **LocalStorage** - Save/load roadmaps locally

## 📦 Self-Hosting

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/roadblocks-app.git
   cd roadblocks-app
   ```

2. **Serve the files:**
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

### Deploy to Cloudflare Pages

1. **Connect your GitHub repository** to Cloudflare Pages
2. **Build settings:**
   - Build command: (leave empty)
   - Build output directory: `/` (root)
3. **Deploy!** Your app will be live at `your-app.pages.dev`

## 🎯 How to Use

### 1. Parse AI Text
Paste your AI-generated roadmap text:
```
1. Research market trends
2. Create wireframes  
3. Develop MVP
4. Launch beta version
```

### 2. Drag & Drop
- Drag milestones to reorder
- Use bulk actions to change categories
- Mark phases as completed

### 3. Export PDF
- Click "Export PDF" 
- Print A4 pages with checklist column
- Write deadlines manually on paper

## 🏗️ Project Structure

```
roadblocks.app/
├── index.html              # Main app entry point
├── css/
│   ├── style.css           # Main styles
│   └── print.css           # PDF-specific styles
├── js/
│   ├── app.js              # Core application logic
│   ├── parser.js           # Text-to-milestone parser
│   ├── dragdrop.js         # Drag-and-drop handler
│   ├── storage.js          # LocalStorage management
│   └── pdf-export.js       # PDF generation
├── manifest.json           # PWA manifest
└── README.md               # This file
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sortable.js** for drag-and-drop functionality
- **jsPDF** for PDF generation
- **Cloudflare Pages** for free hosting

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/roadblocks-app/issues)
- **Discussions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/roadblocks-app/discussions)

---

**Made with ❤️ for the open source community**