---
name: Modern Educator
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#855300'
  on-tertiary: '#ffffff'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  label-lg:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 32px
  gutter: 24px
  section-gap: 64px
  stack-sm: 12px
  stack-md: 24px
---

## Brand & Style
The design system is built for the next generation of Indonesian educators, specifically targeting SMP (Junior High) teachers who require a tool that balances professional reliability with an energetic, student-centric spirit. The brand personality is **Professional yet Playful**, moving away from the dry, administrative aesthetic of traditional LMS platforms toward a vibrant, creative environment.

The design style is a blend of **High-End Minimalism** and **Modern Softness**. It prioritizes high whitespace and "breathable" layouts to reduce cognitive load during complex content authoring. By utilizing a "Soft UI" approach—characterized by large corner radii, organic shapes, and subtle micro-interactions—the interface feels approachable and less intimidating, encouraging experimentation in lesson design.

## Colors
The palette is rooted in an **Emerald Green** primary, symbolizing growth, success, and the core educational materials. This is supported by a dynamic duo of **Royal Blue** (for cognitive tasks and learning objectives) and **Amber** (for quizzes, highlights, and urgent interactions).

The background strategy avoids stark whites, instead utilizing a layered system of **Off-whites and Cool Greys** (#F8FAFC to #F1F5F9) to define different functional zones without the need for heavy shadows. Text should maintain high contrast for accessibility, primarily using deep slate tones rather than pure black to keep the interface feeling "soft."

## Typography
The typographic hierarchy utilizes **Plus Jakarta Sans** for headings to achieve a rounded, modern, and friendly character that mimics the approachable nature of modern educational brands. For the primary user interface and learning content, **Nunito Sans** provides exceptional legibility and a soft geometric touch that remains professional at all scales.

To ensure materials are accessible for both teachers and students, the base body size is set to **18px**, scaling up to **20px** for core instructional text. Headings use a tight letter-spacing and heavy weights (Bold/ExtraBold) to create a clear visual anchor on the page.

## Layout & Spacing
This design system employs a **Fluid-Fixed Hybrid** layout. The central authoring "canvas" is fluid, expanding to maximize the creative workspace, while utility sidebars (tools and properties) are fixed-width to ensure consistent ergonomics.

A generous **8px grid** governs all spacing. The layout philosophy leans into "Extreme Whitespace," using large gaps (**64px**) between major sections to prevent the UI from feeling cluttered. For mobile and PWA contexts, margins compress to **16px**, but the touch targets maintain a minimum height of **48px** to ensure high usability for teachers on the move.

## Elevation & Depth
In alignment with 2026 modern standards, depth is communicated through **Tonal Layering and Soft Blurs** rather than traditional dropshadows. 

- **Surface Level 0:** The main workspace background (#F8FAFC).
- **Surface Level 1:** Primary cards and containers use a crisp white background with a subtle 1px border in a slightly darker grey (#E2E8F0).
- **Surface Level 2:** Floating elements (modals, dropdowns) utilize a "Glassmorphism" effect: a backdrop blur (20px) combined with 90% opacity white, giving a sense of lightness and transparency.
- **Active States:** Instead of deep shadows, active items use a subtle inner glow or a 2px solid bottom-border in the primary brand color to simulate depth.

## Shapes
The shape language is defined by **High Radius Geometry**. The "Rounded" setting (0.5rem base) is used for small UI components like inputs and tags, while `rounded-lg` (1rem) and `rounded-xl` (1.5rem) are the standards for content cards and authoring modules.

Buttons and progress indicators should feel tactile and "organic." Avoid sharp 90-degree angles entirely to maintain the friendly, student-focused vibe of the SILSE tool.

## Components
- **Buttons:** Use "Flat Depth" styling. Primary buttons are Emerald Green with a subtle, slightly darker bottom border (2px) to provide a tactile "pressable" feel without using heavy gradients.
- **Cards:** Content blocks use a 1.5rem (24px) corner radius. Hover states should trigger a slight upward shift (2px) and a subtle increase in border-contrast rather than a heavy shadow.
- **Progress Indicators:** Sleek, rounded bars with a "liquid" animation style. Use Emerald Green for completion and Amber for "in-progress" quiz states.
- **Input Fields:** Schema-driven forms feature large labels (Label-LG) and generous internal padding (16px). Focus states should be indicated by a 2px Royal Blue border and a soft blue outer glow.
- **Chips & Tags:** Use pill-shaped (full-round) backgrounds with high-contrast text for categories like "Math," "Science," or "Quiz."
- **Authoring Modules:** Drag-and-drop components should feature "dashed" borders when in a placeholder state to invite interaction, turning solid once content is populated.