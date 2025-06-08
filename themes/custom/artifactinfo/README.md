# Artifact Info Theme

A modern, accessible, and responsive Drupal 10 theme designed for artifact information and documentation systems.

## Features

- **Modern Design**: Clean, professional interface with modern CSS Grid and Flexbox layouts
- **Responsive**: Mobile-first responsive design that works on all devices
- **Accessible**: WCAG 2.1 AA compliant with proper semantic markup and ARIA attributes
- **Performance**: Optimized CSS and JavaScript with minimal dependencies
- **Customizable**: Extensive CSS custom properties for easy theming
- **Print-Friendly**: Dedicated print styles for documentation

## Technical Specifications

- **Drupal Version**: 10.x, 11.x compatible
- **Base Theme**: Stable9
- **PHP Version**: 8.1+
- **Modern Features**: CSS Grid, Flexbox, CSS Custom Properties, ES6+ JavaScript

## Installation

1. Download or clone this theme to your Drupal themes directory:
   ```bash
   cd themes/
   git clone [repository-url] artifactinfo
   ```

2. Enable the theme in the Drupal admin interface:
   - Go to **Appearance** → **Install and set as default**
   - Or use Drush: `drush theme:enable artifactinfo`

3. Set as the default theme:
   - **Appearance** → **Set as default** for Artifact Info theme

## Configuration

### Regions

The theme provides the following regions:

- **Header**: Site branding and main navigation
- **Primary Menu**: Main site navigation
- **Secondary Menu**: Secondary navigation items
- **Breadcrumb**: Breadcrumb navigation
- **Highlighted**: Highlighted content area
- **Content**: Main content area
- **Sidebar First**: Left sidebar
- **Sidebar Second**: Right sidebar
- **Footer First-Fourth**: Four footer columns
- **Page Top/Bottom**: System regions

### Customization

#### CSS Custom Properties

The theme uses CSS custom properties for easy customization. Key variables include:

```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --color-accent: #f59e0b;
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
  --spacing-md: 1rem;
  --border-radius: 0.375rem;
}
```

#### Layout Classes

The theme automatically applies layout classes based on sidebar presence:

- `.has-sidebar-first`
- `.has-sidebar-second`
- `.has-both-sidebars`

### JavaScript Features

- **Mobile Menu**: Responsive navigation with keyboard support
- **Smooth Scrolling**: Enhanced anchor link navigation
- **Form Enhancement**: Improved form accessibility and UX
- **Card Interactions**: Keyboard-navigable card components
- **Lazy Loading**: Intersection Observer-based image loading

## File Structure

```
artifactinfo/
├── css/
│   ├── style.css           # Main stylesheet
│   ├── layout.css          # Layout and grid systems
│   ├── components.css      # UI components
│   ├── responsive.css      # Responsive design
│   ├── user-forms.css      # User form styles
│   └── print.css           # Print styles
├── js/
│   └── artifactinfo.js     # Theme JavaScript
├── templates/
│   ├── layout/
│   │   ├── html.html.twig  # HTML document template
│   │   └── page.html.twig  # Page layout template
│   ├── content/            # Content templates
│   ├── form/               # Form templates
│   ├── navigation/         # Navigation templates
│   ├── views/              # Views templates
│   └── misc/               # Miscellaneous templates
├── images/                 # Theme images
├── config/                 # Configuration files
├── src/                    # PHP classes
├── artifactinfo.info.yml  # Theme definition
├── artifactinfo.libraries.yml # Asset libraries
├── artifactinfo.theme     # Theme functions
└── README.md              # This file
```

## CSS Architecture

The CSS is organized into multiple files for maintainability:

1. **style.css**: Base styles, typography, and utilities
2. **layout.css**: Grid systems, containers, and layout utilities
3. **components.css**: UI components (cards, buttons, forms)
4. **responsive.css**: Media queries and responsive adjustments
5. **user-forms.css**: User authentication forms
6. **print.css**: Print-specific styles

## JavaScript Behaviors

The theme uses Drupal's behavior system for progressive enhancement:

- `artifactInfoMobileMenu`: Mobile navigation toggle
- `artifactInfoSmoothScroll`: Smooth scrolling for anchor links
- `artifactInfoForms`: Enhanced form interactions
- `artifactInfoCards`: Card component behaviors
- `artifactInfoLazyLoad`: Image lazy loading

## Browser Support

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Accessibility**: Screen reader and keyboard navigation support

## Performance Features

- **Minimal Dependencies**: Only essential libraries loaded
- **Critical CSS**: Above-the-fold styles prioritized
- **Lazy Loading**: Images loaded on demand
- **Optimized Assets**: Compressed and minified resources

## Accessibility Features

- **WCAG 2.1 AA**: Meets accessibility guidelines
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Visible focus indicators
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: Meets contrast ratio requirements

## Development

### Prerequisites

- Node.js and npm (for development tools)
- Sass (if using Sass compilation)
- Drupal development environment

### Build Process

If using Sass or other build tools:

```bash
# Install dependencies
npm install

# Compile Sass
npm run build:css

# Watch for changes
npm run watch
```

## Customization Examples

### Changing Colors

```css
:root {
  --color-primary: #your-color;
  --color-secondary: #your-secondary-color;
}
```

### Adding Custom Fonts

```css
:root {
  --font-family-base: 'Your Font', sans-serif;
}
```

### Custom Layout Widths

```css
.container {
  max-width: 1400px; /* Default is 1200px */
}
```

## Contributing

1. Follow Drupal coding standards
2. Use semantic commit messages
3. Test accessibility compliance
4. Ensure responsive design works on all devices
5. Update documentation for new features

## License

This theme is licensed under the GPL v2 or later.

## Support

For support and bug reports, please use the project's issue queue or contact the maintainer.

## Changelog

### Version 1.0.0
- Initial release
- Modern responsive design
- Full Drupal 10 compatibility
- Accessibility compliance
- Performance optimizations
