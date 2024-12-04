# Cursor Design Rules

## Layout System
1. Column-Based Grid
   - Use CSS columns for masonry layouts
   - Base column width: 300px (adjustable per design)
   - Column gap: 20px (consistent across layouts)
   - Allow natural content flow within columns
   - No forced aspect ratios

2. Column Variations
   - Single column: Mobile (< 600px)
   - Two columns: Tablet (600px - 900px)
   - Three columns: Desktop (900px - 1200px)
   - Four columns: Wide Desktop (> 1200px)
   - Maintain consistent column width across breakpoints

3. Spacing Rules
   - Vertical gap between items: 20px
   - Column gap: 20px
   - Edge padding: 20px
   - Consistent spacing across all layouts

## Image Handling
1. Never crop images
   - Use `object-fit: contain` instead of `cover`
   - Maintain original aspect ratio
   - Use letterboxing/pillarboxing when needed
2. Never use rounded corners
   - Keep images rectangular
   - Use clean, sharp edges


## Animation & Interaction
1. Keep transitions smooth and purposeful
2. Maintain visual hierarchy during animations


## Performance
1. Optimize image loading
2. Use efficient animation techniques
3. Implement proper lazy loading
4. Consider column count in performance optimizations


### Variable Masonry 
- Implement CSS columns for natural flow
- Allow content to determine height
- No forced grid or aspect ratios

