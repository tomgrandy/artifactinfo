# Hero Banner Paragraph Implementation - Artifact Info Theme

## Overview
The homepage banner component has been successfully implemented using Drupal paragraphs. This creates a reusable, dynamic hero banner that integrates with your existing CSS and JS while providing full admin control.

## Files Created/Modified

### 1. Paragraph Templates Created
- `templates/paragraphs/paragraph--hero-banner.html.twig` - Main hero banner template
- `templates/paragraphs/paragraph--buttons.html.twig` - Button component template

### 2. Theme Functions Updated
- `artifactinfo.theme` - Added paragraph preprocessing and theme suggestions

## Paragraph Structure

### Hero Banner Paragraph (`hero_banner`)
**Fields Required:**
- `field_banner_background` (Media Image) → Background image
- `field_banner_title` (Text Plain) → Hero title (`<h1>`)
- `field_banner_descriptions` (Text Formatted Long) → Hero description

**Note:** Buttons are now static and hardcoded in the template (AUCTION SCHEDULE & CURRENT AUCTIONS)

## Generated HTML Structure

```html
<section class="paragraph paragraph--type--hero-banner hero-section" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('[uploaded-image-url]');">
  <div class="hero-container">
    <div class="hero-content">
      <h1>[field_banner_title]</h1>
      <div class="hero-description">
        [field_banner_descriptions]
      </div>
             <div class="hero-buttons">
         <a href="#" class="btn">AUCTION SCHEDULE</a>
         <a href="#" class="btn">CURRENT AUCTIONS</a>
       </div>
    </div>
  </div>
</section>
```

## Key Features Implemented

### ✅ Dynamic Background Image
- Automatically extracts image URL from media field
- Applies CSS gradient overlay: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7))`
- Generates inline style for proper background rendering
- Handles responsive image URLs

### ✅ Static Button System
- Two hardcoded buttons: "AUCTION SCHEDULE" and "CURRENT AUCTIONS"
- Renders with existing `.btn` CSS class
- No dynamic configuration needed

### ✅ Content Management
- **Title**: Plain text field with WYSIWYG-free editing
- **Description**: Rich text field with full WYSIWYG editor
- **Background**: Media browser with image selection
- **Buttons**: Static buttons hardcoded in template

### ✅ CSS Integration
- Uses existing `.hero-section` class
- Maintains `.hero-container` and `.hero-content` structure
- Preserves `.hero-buttons` and `.btn` styling
- No CSS changes required

## Setup Instructions

### 1. Create Paragraph Types

**Hero Banner Paragraph Type:**
1. Go to **Structure > Paragraph types**
2. Add paragraph type with machine name: `hero_banner`
3. Add fields:
   - `field_banner_background` (Media reference)
   - `field_banner_title` (Text plain)
   - `field_banner_descriptions` (Text formatted, long)
   - `field_link_button` (Entity reference revisions → Paragraph)

**Button Paragraph Type:**
1. Add paragraph type with machine name: `buttons`
2. Add field:
   - `field_button_item` (Link)

### 2. Configure Basic Page Content Type
1. Go to **Structure > Content types > Basic page**
2. Add field for paragraphs (if not already present)
3. Configure to allow "Hero Banner" paragraph type

### 3. Create Homepage Content
1. Go to **Content > Add content > Basic page**
2. Add "Hero Banner" paragraph
3. Fill in:
   - Upload background image
   - Enter title (e.g., "Premium Artifact Auctions")
   - Enter description with full text
   - Add 2 button paragraphs with your links
4. Set as front page if needed

## Field Configuration Details

### Background Image Field
- **Field Type**: Media reference
- **Media Type**: Image
- **Required**: No (fallback to CSS default)
- **File Extensions**: jpg, jpeg, png, webp
- **Recommended Size**: 1920x1080 or larger

### Title Field
- **Field Type**: Text (plain)
- **Max Length**: 255 characters
- **Required**: No
- **Help Text**: "Main hero title (e.g., Premium Artifact Auctions)"

### Description Field
- **Field Type**: Text (formatted, long)
- **Text Format**: Full HTML or Filtered HTML
- **Required**: No
- **Help Text**: "Detailed description with formatting support"

### Button Reference Field
- **Field Type**: Entity reference revisions
- **Target Type**: Paragraph
- **Reference Method**: Default
- **Target Bundles**: Buttons only
- **Allowed Number**: 2 (or unlimited)

### Button Link Field
- **Field Type**: Link
- **Link Type**: Both internal and external
- **Allow Link Text**: Yes
- **Required**: Yes
- **Help Text**: "Button URL and display text"

## Template Functionality

### Background Image Processing
```php
// Extracts image from media field
$media_entity = $paragraph->get('field_banner_background')->entity;
$file_entity = $media_entity->get('field_media_image')->entity;
$file_uri = $file_entity->getFileUri();
$background_url = file_url_generator->generateAbsoluteString($file_uri);
```

### Button Processing
```php
// Processes button paragraphs for clean template rendering
$button_paragraphs = $paragraph->get('field_link_button')->referencedEntities();
foreach ($button_paragraphs as $button_paragraph) {
  $link_field = $button_paragraph->get('field_button_item')->first();
  $hero_buttons[] = [
    'url' => $link_field->getUrl()->toString(),
    'title' => $link_field->title,
  ];
}
```

## Usage on Multiple Pages

### Reusable Component
- Can be used on any content type that has a paragraph field
- Appears in paragraph selection dropdown
- Maintains consistent styling across pages

### Different View Modes
- Template supports different view modes
- Can create view mode specific templates:
  - `paragraph--hero-banner--preview.html.twig`
  - `paragraph--hero-banner--teaser.html.twig`

## Troubleshooting

### Background Image Not Showing
1. **Check Media Field**: Ensure media reference field exists and has image
2. **Media Bundle**: Verify media entity has `field_media_image` field
3. **File Permissions**: Check file system permissions
4. **CSS**: Verify `.hero-section` CSS is loading

### Buttons Not Rendering
1. **Field Names**: Verify field machine names match exactly
2. **Paragraph Reference**: Check button paragraphs are properly referenced
3. **Link Field**: Ensure link field has both URL and title
4. **Template Debug**: Enable Twig debugging to see variable values

### Styling Issues
1. **Cache**: Clear Drupal cache (`drush cr`)
2. **CSS Classes**: Verify existing CSS classes are being applied
3. **Template Override**: Check template hierarchy with Twig debugging
4. **Inline Styles**: Verify background image inline style is being generated

## Advanced Customization

### Additional Fields
Add more fields to hero banner:
- Subtitle field
- Video background option
- Call-to-action secondary text
- Background overlay opacity control

### Multiple Templates
Create variant templates:
- `paragraph--hero-banner--full-width.html.twig`
- `paragraph--hero-banner--minimal.html.twig`
- `paragraph--hero-banner--video.html.twig`

### Custom Preprocessing
Extend preprocessing for additional functionality:
- Image style generation
- Dynamic CSS class application
- A/B testing integration
- Analytics tracking

## Integration with Existing Code

### CSS Classes Maintained
- `.hero-section` → Main container
- `.hero-container` → Content wrapper
- `.hero-content` → Content area
- `.hero-buttons` → Button container
- `.btn` → Individual buttons

### JavaScript Compatibility
- Mobile menu functionality preserved
- Smooth scrolling for anchor links maintained
- All existing JS behaviors continue working

The implementation provides a fully functional, admin-manageable hero banner component that integrates seamlessly with your existing theme while maintaining all CSS and JavaScript functionality.
