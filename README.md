# Life Trails

A professional, self-hosted web application for documenting life events chronologically and maintaining a structured family tree.

## Features

- 📅 **Life Timeline**: Chronologically document all your life events with dates, descriptions, and photos
- 👨‍👩‍👧‍👦 **Family Tree**: Build and visualize your family tree across generations
- 🔒 **Private & Secure**: Data stored locally in your browser (localStorage)
- 📱 **Fully Responsive**: Works beautifully on desktop, tablet, and mobile
- 🌓 **Dark/Light Mode**: Toggle between themes with a single click
- 🔍 **Smart Search**: Quickly find events by searching through years, dates, titles, or descriptions
- 🎨 **Modern UI**: Clean, professional design with smooth animations

## Project Structure

```
life-trails/
├── index.html          # Landing page
├── signin.html         # Sign in / Sign up page
├── dashboard.html      # Main timeline dashboard
├── add-event.html      # Add new life event
├── add-family.html     # Add family member
├── css/
│   ├── main.css        # Main stylesheet
│   └── theme.css       # Theme-specific styles
├── js/
│   ├── app.js          # Main application logic
│   ├── auth.js         # Authentication management
│   ├── events.js       # Events management
│   ├── family.js       # Family tree management
│   └── theme.js        # Theme management
├── images/             # User-uploaded images
│   └── user123/        # User-specific image folders
├── data/               # Data storage (optional)
└── README.md           # This file
```

## Getting Started

### Running Locally

1. **Clone or download** this repository
   ```bash
   git clone <repository-url>
   cd life-trails
   ```

2. **Start a local web server** (required for proper functionality):
   
   **Option 1: Using Python 3**
   ```bash
   python3 -m http.server 8080
   ```
   
   **Option 2: Using Python 2**
   ```bash
   python -m SimpleHTTPServer 8080
   ```
   
   **Option 3: Using Node.js (http-server)**
   ```bash
   npx http-server -p 8080
   ```
   
   **Option 4: Using PHP**
   ```bash
   php -S localhost:8080
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:8080
   ```

4. **Sign in** with the demo account:
    - Email: `demo@life.trails.click`
    - Password: `demo123`
   
   **Or create a new account** by clicking "Create Account" on the sign-in page

> **Note:** Opening `index.html` directly in a browser may not work properly due to CORS restrictions and relative path issues. Using a local web server is recommended.

## Usage

### Adding Events

1. Click **"Add Event"** from the dashboard
2. Fill in the event details:
    - Title (required)
    - Description
    - Date (required)
    - Time (optional)
    - Images (up to 2)
3. Click **"Save Event"**

### Adding Family Members

1. Click **"Add Family"** from the dashboard
2. Fill in the member details:
    - Name (required)
    - Relation (e.g., Father, Mother, Brother)
    - Generation Level (required):
        - `-2`: Grand Parents
        - `-1`: Parents
        - `0`: Self / Siblings
        - `1`: Children
        - `2`: Grand Children
    - Profile Image (optional)
3. Click **"Add Family Member"**

### Viewing Family Tree

1. Click **"View Family"** from the dashboard
2. Family members are organized by generation levels
3. Click outside the modal or the close button to dismiss

### Searching Events

Use the search bar in the dashboard to filter events by:
- Year
- Date
- Title
- Description

### Theme Toggle

Click the theme toggle button (🌙/☀️) in the header to switch between light and dark modes. Your preference is saved automatically.

## Technical Details

### Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables
- **Vanilla JavaScript**: No frameworks or dependencies
- **localStorage**: Client-side data persistence

### Data Storage

All data is stored in the browser's localStorage:
- User authentication
- Life events
- Family tree data
- User preferences (theme)

### Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

### Deployment

This application can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

Simply upload all files and ensure the directory structure is maintained.

## Customization

### Changing Colors

Edit CSS variables in `css/main.css`:

```css
:root {
    --primary: #3b82f6;
    --secondary: #6366f1;
    /* ... */
}
```

### Adding Features

The codebase is modular and well-organized:
- `js/auth.js`: Authentication logic
- `js/events.js`: Event management
- `js/family.js`: Family tree management
- `js/theme.js`: Theme switching

## Security Notes

⚠️ **Important**: This is a client-side only application. For production use with sensitive data:

1. Consider implementing a backend API
2. Use proper authentication (OAuth, JWT, etc.)
3. Encrypt sensitive data
4. Implement proper image storage (not localStorage)
5. Add data export/import functionality

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

---

**Life Trails** - Document your journey, preserve your legacy. 🌲
