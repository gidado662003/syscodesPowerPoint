# PowerPoint Presentation App

A modern, interactive PowerPoint presentation application built with Next.js, React, and TypeScript.

## Features

### Layout Options

The app supports multiple slide layouts to create engaging presentations:

1. **Title + Content + Image** 🖼️📝 (Default)
   - Displays title, subtitle, content, and image in a vertical arrangement
   - Image is positioned below the text content
   - Perfect for slides that need both visual and textual information

2. **Image Left** 🖼️
   - Image on the left, text content on the right
   - Text is left-aligned for better readability
   - Great for comparing visual and textual information

3. **Image Right** 🖼️
   - Image on the right, text content on the left
   - Text is left-aligned for better readability
   - Alternative visual arrangement for different hierarchies

4. **Title + Content** 📝
   - Traditional layout with title and content
   - Centered text alignment
   - Clean and simple design

5. **Title Only** 📋
   - Focus on the main title and subtitle
   - Perfect for section dividers or simple statements

6. **Content Only** 📄
   - Content-focused layout without title
   - Ideal for detailed information slides

### Key Features

- **Interactive Editing**: Click on any text field to edit content inline
- **Rich Text Support**: Use the Jodit editor for formatted content
- **Image Support**: Add images via URL with automatic preview
- **Customizable Backgrounds**: Choose from 10 predefined color schemes
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Navigation**: Use arrow keys to navigate between slides
- **Fullscreen Mode**: Press Ctrl/Cmd + F or use the fullscreen button
- **Auto-advance**: Automatic slide progression in presentation mode
- **Local Storage**: Presentations are automatically saved to your browser
- **Export/Import**: Save and load presentations as JSON files

### Usage

1. **Creating Slides**: Use the editor panel to add new slides with your preferred layout
2. **Editing Content**: Click on any text field to edit it inline
3. **Changing Layouts**: Select from the layout options in the editor panel
4. **Adding Images**: Paste image URLs in the image field
5. **Customizing Colors**: Choose from the predefined background color options
6. **Navigation**: Use the toolbar or keyboard shortcuts to navigate between slides

### Keyboard Shortcuts

- **Arrow Left/Right**: Navigate between slides
- **Escape**: Exit fullscreen or presentation mode
- **Ctrl/Cmd + F**: Toggle fullscreen mode

### Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

The app comes with sample slides to demonstrate all the different layout options. You can edit these slides or create new ones to build your presentation.

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Rich Text Editor**: Jodit Editor
- **State Management**: React Context + useReducer
- **Icons**: SVG icons and emoji
