---
name: Studio Scholar
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#684000'
  on-tertiary: '#ffffff'
  tertiary-container: '#885500'
  on-tertiary-container: '#ffd4a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  space-xs: 4px
  space-sm: 8px
  space-md: 16px
  space-lg: 24px
  space-xl: 32px
  space-2xl: 48px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style

The brand personality of the design system is that of a "Silent Facilitator." It is designed to recede into the background, allowing the educational content—the primary focus—to shine. The target audience includes instructional designers, educators, and content creators who require a high-focus environment that reduces cognitive load while providing powerful authoring capabilities.

The aesthetic follows a **Modern Minimalist** movement with a "Studio" ethos. This means maximizing whitespace (the "canvas"), using precise structural lines to define workspace zones, and employing subtle depth to indicate interactivity. The emotional response should be one of professional competence, clarity, and creative freedom. It avoids the cluttered complexity of traditional LMS tools in favor of a streamlined, modular interface that feels both expansive and organized.

## Colors

The color palette is architected to balance structural neutrality with functional vibrance. 

- **Primary Indigo (#4F46E5):** Used for primary actions, active states, and progress indicators. It represents the "intelligence" of the tool.
- **Slate Grays:** Used exclusively for the UI "scaffolding." **#F8FAFC** is the workspace background, while **#64748B** handles secondary text and icons. This creates a calm, low-contrast environment for long-form authoring.
- **Functional Accents:** 
    - **Emerald (#10B981):** Reserved for "Success" states and Quiz/Assessment content types.
    - **Amber (#F59E0B):** Used for "Warnings" and Note/Callout content types.
- **Surface Strategy:** The UI uses a "White on Off-White" approach. The main workspace (Canvas) is pure white (#FFFFFF) to signify its importance, while the surrounding navigation and utility panels sit on #F8FAFC.

## Typography

The typography system utilizes **Inter** for its exceptional legibility and neutral, systematic character. The scale is designed to create a clear hierarchy between the "Tooling" (labels and UI) and the "Content" (headlines and body).

- **Headlines:** Use a slightly tighter letter spacing and heavier weights to feel grounded and authoritative.
- **Body:** Set at 16px (MD) or 18px (LG) to ensure reading comfort during long editing sessions. Line heights are generous (1.5x - 1.55x) to maintain the "spacious" studio feel.
- **Labels:** Use Medium (500) or Semi-Bold (600) weights to differentiate interactive UI elements from static content. Small labels may use uppercase tracking for categorized metadata.

## Layout & Spacing

This design system employs a **Fixed-Fluid Hybrid** layout. The central authoring canvas is fluid but constrained by a max-width of 1440px to prevent excessive line lengths. Sidebars (Asset Library and Properties Panel) are fixed at 280px-320px widths to ensure consistent tool density.

- **Rhythm:** A 4px baseline grid is used. Most common spacing tokens scale by 8px (8, 16, 24, 32, 48).
- **Canvas Margins:** Use `space-2xl` (48px) to create a "breathe" zone around the content, reinforcing the creative studio aesthetic.
- **Responsive Behavior:** 
    - **Desktop:** 12-column grid for complex layouts.
    - **Tablet:** Sidebars collapse into drawers; 8-column grid.
    - **Mobile:** Single column; margins reduce to `space-md` (16px).

## Elevation & Depth

Elevation in the design system is communicated through **Ambient Shadows** and **Tonal Layering**. We avoid heavy blacks in favor of tinted shadows that use the Slate gray palette to maintain a clean look.

- **Level 0 (Floor):** #F8FAFC background. Used for the application shell.
- **Level 1 (Card/Surface):** White (#FFFFFF) with a 1px border (#E2E8F0). No shadow. Used for most static layout blocks.
- **Level 2 (Interactive):** White (#FFFFFF) with a soft shadow: `0 4px 6px -1px rgba(100, 116, 139, 0.1), 0 2px 4px -2px rgba(100, 116, 139, 0.05)`. Used for buttons and clickable assets.
- **Level 3 (Overlay):** Draggable items and Modals. Significant blur: `0 20px 25px -5px rgba(100, 116, 139, 0.1)`.

Depth is also indicated by subtle 1px borders between panels, ensuring clarity without the visual noise of high-contrast shadows.

## Shapes

The shape language is defined by a consistent **Rounded** aesthetic. This softens the "technical" nature of an authoring tool and makes the creative process feel more approachable.

- **Standard Elements (Buttons, Inputs):** 8px (0.5rem) corner radius.
- **Containers (Cards, Panels):** 16px (1rem) corner radius for large structural elements.
- **Specialty Components:** Progress bars and specific tags may use `rounded-full` (pill-shaped) to distinguish them from structural content containers.

## Components

- **Buttons:** Primary buttons use Indigo (#4F46E5) with white text. Secondary buttons use a Slate-50 background with Slate-700 text. All buttons feature 8px corners and a transition on hover that slightly deepens the shadow.
- **Input Fields:** Minimalist design with a 1px Slate-200 border. On focus, the border transitions to Indigo with a 2px outer glow (ring).
- **Cards (Learning Objects):** White background, 16px radius, and a subtle border. When an object is selected in the authoring tool, it gains a 2px Indigo border.
- **Chips/Badges:** Small, pill-shaped markers. Quiz assets use Emerald tints; Note assets use Amber.
- **The "Canvas":** A specialized component with a dotted background pattern (Slate-200 dots every 24px) to provide a sense of scale and alignment for "drag and drop" operations.
- **Breadcrumbs & Steps:** Highly visible at the top of the workspace to show the hierarchy of the educational module (e.g., Course > Module > Lesson).