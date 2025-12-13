# 🎨 Theme System Documentation

## Overview

The On Chain Lotto theme system allows you to customize the appearance of lottery draw balls and the entire site with different holiday and seasonal themes. The system supports multiple themes including Christmas, Halloween, Valentine's Day, Easter, Patriotic, and Neon themes.

## Features

- **Multiple Themes**: 7 built-in themes (Default, Christmas, Halloween, Valentine's Day, Easter, Patriotic, Neon)
- **Dynamic Ball Graphics**: Lottery balls change appearance based on the selected theme
- **Site-wide Theming**: Theme applies to colors, backgrounds, and UI elements across the entire site
- **Persistent Storage**: Theme preference is saved in browser localStorage
- **Easy Theme Switching**: Click the theme button in the top-right corner to change themes

## Available Themes

### 🎰 Default
- Classic gold and green theme
- Traditional lottery ball appearance

### 🎄 Christmas
- Festive red, green, and gold colors
- Holiday-themed ball graphics

### 🎃 Halloween
- Spooky orange and black theme
- Pumpkin-inspired ball designs

### 💝 Valentine's Day
- Romantic pink and red colors
- Heart-themed ball graphics

### 🐰 Easter
- Pastel spring colors
- Easter egg-inspired designs

### 🇺🇸 Patriotic
- Red, white, and blue theme
- Star-spangled ball graphics

### 💜 Neon
- Vibrant neon cyberpunk theme
- Glowing, futuristic ball designs

## How to Use

### For Users

1. **Access Theme Selector**: Look for the theme button (🎨 Theme) in the top-right corner of any page
2. **Select a Theme**: Click the button to open the theme selection modal
3. **Choose Your Theme**: Click on any theme card to apply it
4. **Theme Persists**: Your theme choice is saved and will be remembered across sessions

### For Developers

#### Adding a New Theme

To add a new theme, edit `public/themes.js` and add a new entry to the `THEMES` object:

```javascript
myNewTheme: {
    name: 'My New Theme',
    icon: '🎉',
    description: 'Description of my theme',
    colors: {
        primary: '#HEX_COLOR',
        primaryDark: '#HEX_COLOR',
        secondary: '#HEX_COLOR',
        // ... other color properties
    },
    ball: {
        filled: {
            background: 'linear-gradient(...)',
            color: '#HEX_COLOR',
            border: '#HEX_COLOR',
            shadow: 'shadow-properties',
            highlight: 'radial-gradient(...)'
        },
        available: {
            background: '#HEX_COLOR',
            color: '#HEX_COLOR',
            border: '#HEX_COLOR',
            shadow: 'shadow-properties'
        }
    }
}
```

#### Using Theme System in Code

```javascript
// Get current theme
const currentTheme = window.themeManager.getCurrentTheme();

// Apply theme
window.themeManager.applyTheme('christmas');

// Apply ball styles to an element
const ballElement = document.querySelector('.number-ball');
window.themeManager.applyBallStyles(ballElement, 'filled');

// Listen for theme changes
window.addEventListener('themeChanged', (event) => {
    const { theme, themeData } = event.detail;
    console.log('Theme changed to:', theme);
    // Re-render balls or update UI
});
```

## File Structure

- `public/themes.js` - Theme configuration and ThemeManager class
- `public/theme-selector.js` - UI component for theme selection
- `public/styles.css` - CSS with theme support (uses CSS variables)
- `public/draw.js` - Draw page with theme integration
- `public/public-draw.js` - Public draw page with theme integration

## Technical Details

### CSS Variables

Themes use CSS custom properties (variables) that are dynamically updated:

```css
:root {
    --primary: #FFD700;
    --primary-dark: #B8860B;
    --secondary: #14F195;
    /* ... more variables */
}
```

### Ball Styling

Balls are styled using JavaScript to apply theme-specific:
- Background gradients
- Border colors
- Box shadows
- Highlight effects

### Theme Persistence

Themes are stored in `localStorage` with the key `lottoTheme`. The theme is automatically applied when pages load.

## Customization

### Changing Default Theme

Edit `public/themes.js` and modify the `loadTheme()` method in the `ThemeManager` class:

```javascript
loadTheme() {
    const savedTheme = localStorage.getItem('lottoTheme');
    return savedTheme && THEMES[savedTheme] ? savedTheme : 'your-default-theme';
}
```

### Adding Custom Ball Graphics

You can extend the ball styling by:
1. Adding image URLs to theme configuration
2. Using CSS background-image properties
3. Creating custom CSS classes for each theme

## Browser Support

- Modern browsers with CSS custom properties support
- localStorage support required for theme persistence
- JavaScript ES6+ features

## Future Enhancements

Potential improvements:
- Server-side theme storage (per-user themes)
- Custom theme creation UI
- Animated theme transitions
- Theme preview before applying
- Seasonal auto-theme switching



