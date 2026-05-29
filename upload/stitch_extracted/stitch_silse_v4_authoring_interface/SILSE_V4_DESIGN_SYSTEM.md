# SILSE v4 — Complete Design System Specification

> Extracted from 6 reference implementations: Dashboard Guru (x2), Workspace/CanvasBuilder (x2), Modern Educator DESIGN.md, Preview Kuis Interaktif.

---

## 1. COLOR PALETTE

The palette follows **Material Design 3 tonal system** with three seed colors: Emerald Green (primary), Royal Blue (secondary), Amber (tertiary).

### 1.1 Primary — Emerald Green (Growth / Core Materials)

| Token                    | Hex        | Usage                                       |
|--------------------------|------------|---------------------------------------------|
| `primary`                | `#006c49`  | Primary buttons, active states, brand text  |
| `on-primary`             | `#ffffff`  | Text on primary-colored backgrounds         |
| `primary-container`      | `#10b981`  | Card highlights, progress bars, CTA fills   |
| `on-primary-container`   | `#00422b`  | Text on primary-container backgrounds       |
| `primary-fixed`          | `#6ffbbe`  | Light variant (fixed palette)               |
| `primary-fixed-dim`      | `#4edea3`  | Dimmed fixed variant, trend indicators      |
| `on-primary-fixed`       | `#002113`  | Text on primary-fixed                       |
| `on-primary-fixed-variant` | `#005236` | Text on primary-fixed variant               |
| `inverse-primary`        | `#4edea3`  | Primary on inverse surfaces                 |
| `surface-tint`           | `#006c49`  | Tint applied to elevated surfaces           |

### 1.2 Secondary — Royal Blue (Cognitive / Learning Objectives)

| Token                        | Hex        | Usage                                       |
|------------------------------|------------|---------------------------------------------|
| `secondary`                  | `#0058be`  | Links, focus rings, active selections       |
| `on-secondary`               | `#ffffff`  | Text on secondary backgrounds               |
| `secondary-container`        | `#2170e4`  | Stat cards, accent panels                   |
| `on-secondary-container`     | `#fefcff`  | Text on secondary-container                 |
| `secondary-fixed`            | `#d8e2ff`  | Light variant (fixed palette)               |
| `secondary-fixed-dim`        | `#adc6ff`  | Dimmed fixed variant                        |
| `on-secondary-fixed`         | `#001a42`  | Text on secondary-fixed                     |
| `on-secondary-fixed-variant` | `#004395`  | Text on secondary-fixed variant             |

### 1.3 Tertiary — Amber (Quizzes / Highlights / Urgency)

| Token                        | Hex        | Usage                                       |
|------------------------------|------------|---------------------------------------------|
| `tertiary`                   | `#855300`  | Tertiary text accents                       |
| `on-tertiary`                | `#ffffff`  | Text on tertiary backgrounds                |
| `tertiary-container`         | `#e29100`  | In-progress progress bars, quiz states      |
| `on-tertiary-container`      | `#523200`  | Text on tertiary-container                  |
| `tertiary-fixed`             | `#ffddb8`  | Warm card backgrounds (active block fill)   |
| `tertiary-fixed-dim`         | `#ffb95f`  | Dimmed warm variant                         |
| `on-tertiary-fixed`          | `#2a1700`  | Text on tertiary-fixed                      |
| `on-tertiary-fixed-variant`  | `#653e00`  | Text on tertiary-fixed variant              |

### 1.4 Error

| Token               | Hex        | Usage                                  |
|---------------------|------------|----------------------------------------|
| `error`             | `#ba1a1a`  | Error text, wrong-answer indicators    |
| `on-error`          | `#ffffff`  | Text on error backgrounds              |
| `error-container`   | `#ffdad6`  | Error card backgrounds                 |
| `on-error-container`| `#93000a`  | Text on error-container                |

### 1.5 Surface / Background

| Token                      | Hex        | Usage                                    |
|----------------------------|------------|------------------------------------------|
| `background`               | `#f7f9fb`  | Page background                          |
| `on-background`            | `#191c1e`  | Default body text on background          |
| `surface`                  | `#f7f9fb`  | Default surface                          |
| `surface-bright`           | `#f7f9fb`  | Sidebar bg, bright panels                |
| `surface-dim`              | `#d8dadc`  | Canvas/workspace background              |
| `surface-variant`          | `#e0e3e5`  | Variant surface                          |
| `surface-container-lowest` | `#ffffff`  | Headers, top bars, input bg              |
| `surface-container-low`    | `#f2f4f6`  | Left sidebar panels, secondary panels    |
| `surface-container`        | `#eceef0`  | Mid-level container fills                |
| `surface-container-high`   | `#e6e8ea`  | Hover states, tag backgrounds            |
| `surface-container-highest`| `#e0e3e5`  | Progress bar tracks, inactive elements   |
| `on-surface`               | `#191c1e`  | Primary text on surfaces                 |
| `on-surface-variant`       | `#3c4a42`  | Secondary/muted text                     |
| `inverse-surface`          | `#2d3133`  | Dark inverted surface                    |
| `inverse-on-surface`       | `#eff1f3`  | Text on inverse surface                  |

### 1.6 Outline / Border

| Token            | Hex        | Usage                                |
|------------------|------------|--------------------------------------|
| `outline`        | `#6c7a71`  | Strong borders, section labels       |
| `outline-variant`| `#bbcabf`  | Subtle borders, dividers, card edges |

### 1.7 Special Composite Colors (used inline)

| Purpose                        | Value                                   |
|--------------------------------|-----------------------------------------|
| Glass-card background          | `rgba(255, 255, 255, 0.9)`              |
| Glass-card border              | `#E2E8F0`                               |
| Canvas dot grid                | `#bbcabf` (1px dots, 24px spacing)      |
| Active block outline           | `2px solid #0058be`                     |
| Active block glow              | `0 0 0 4px rgba(0, 88, 190, 0.1)`      |
| Atmosphere blob green          | `rgba(0, 108, 73, 0.10)` — blur 100px  |
| Atmosphere blob blue           | `rgba(0, 88, 190, 0.10)` — blur 120px  |
| Correct pulse shadow           | `0 0 0 0 rgba(16, 185, 129, 0.4)`      |
| Nav bar bg                     | `rgba(255, 255, 255, 0.80)` + blur-md  |

---

## 2. TYPOGRAPHY

### 2.1 Font Families

| Token               | Font Stack                        | Usage                       |
|---------------------|-----------------------------------|-----------------------------|
| Display / Headlines | **Plus Jakarta Sans**             | H1, H2, H3, brand titles   |
| Body / UI           | **Nunito Sans**                   | Body text, labels, inputs   |
| Decorative / Play   | **Fredoka** (wght 600,700)        | Welcome greeting, quiz text |
| Icons               | **Material Symbols Outlined**     | All iconography             |

**Google Fonts import:**
```
https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito+Sans:wght@300;400;600;700&family=Fredoka:wght@600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap
```

### 2.2 Type Scale

| Token              | Font         | Size   | Weight | Line-Height | Letter-Spacing | Usage                           |
|--------------------|--------------|--------|--------|-------------|----------------|---------------------------------|
| `display-lg`       | Plus Jakarta | 40px   | 800    | 1.2         | -0.02em        | Hero titles, branding           |
| `display-lg-mobile`| Plus Jakarta | 32px   | 800    | 1.2         | —              | Hero on mobile                  |
| `headline-lg`      | Plus Jakarta | 32px   | 700    | 1.3         | —              | Section headings                |
| `headline-md`      | Plus Jakarta | 24px   | 700    | 1.4         | —              | Card titles, panel headers      |
| `body-lg`          | Nunito Sans  | 20px   | 400    | 1.6         | —              | Core instructional text         |
| `body-md`          | Nunito Sans  | 18px   | 400    | 1.6         | —              | Default body text, descriptions |
| `label-lg`         | Nunito Sans  | 16px   | 700    | 1.4         | 0.01em         | Buttons, nav items, labels      |
| `text-xs`          | (inherited)  | 12px   | —      | —           | —              | Timestamps, meta text           |
| `text-sm`          | (inherited)  | 14px   | —      | —           | —              | Secondary info, dates           |

### 2.3 Icon Style

- **Icon font:** Material Symbols Outlined
- **Default variation:** `FILL 0, wght 400, GRAD 0, opsz 24`
- **Active/selected state:** `FILL 1` (filled icon)
- **Typical sizes:** 20px (inline), 24px (default), 36px (feature), 48px (hero)
- **CSS:**
  ```css
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
  ```

---

## 3. SPACING SYSTEM

Built on an **8px base grid**.

| Token               | Value  | Usage                                    |
|---------------------|--------|------------------------------------------|
| `base`              | 8px    | Minimum unit                             |
| `stack-sm`          | 12px   | Tight vertical gaps                      |
| `gutter`            | 24px   | Horizontal page gutters, nav spacing     |
| `stack-md`          | 24px   | Card grid gaps, standard vertical rhythm |
| `container-padding` | 32px   | Main content area padding                |
| `section-gap`       | 64px   | Major section separation                 |

**Common inline spacings observed:**

| Context                | Value                               |
|------------------------|-------------------------------------|
| Sidebar padding        | 16px (p-4)                          |
| Sidebar nav item gap   | 12px (gap-3)                        |
| Sidebar nav item py    | 12px (py-3)                         |
| Sidebar nav item px    | 16px (px-4)                         |
| Card padding           | 24px (p-6)                          |
| Card image height      | 192px (h-48)                        |
| Button py (large)      | 20px (py-5)                         |
| Button px (large)      | 32px (px-8)                         |
| Button py (standard)   | 8px (py-2)                          |
| Button px (standard)   | 24px (px-6)                         |
| Input px               | 16px (px-4)                         |
| Input py               | 12px (py-3)                         |
| Icon rail gap          | 24px (gap-6)                        |
| Section heading mb     | 24px (mb-stack-md)                  |
| Header mb              | 64px (mb-section-gap)               |

---

## 4. BORDER RADIUS

| Token / Usage            | Value      | CSS                    |
|--------------------------|------------|------------------------|
| Default (small)          | 0.25rem    | `rounded` (4px)        |
| lg (medium)              | 0.5rem     | `rounded-lg` (8px)     |
| xl (large)               | 0.75rem    | `rounded-xl` (12px)    |
| 2xl (cards/blocks)       | 1rem       | `rounded-2xl` (16px)   |
| Cards, major containers  | 24px       | `rounded-[24px]`       |
| Feedback modal           | 40px       | `rounded-[40px]`       |
| Full round (pills, avatars) | 9999px  | `rounded-full`         |

**Design rule:** No 90-degree angles. All interactive elements use pill/capsule or high-radius shapes.

---

## 5. SHADOWS & ELEVATION

The system favors **tonal layering** over heavy drop shadows.

### 5.1 Elevation Levels

| Level | Method                          | Usage                               |
|-------|---------------------------------|--------------------------------------|
| 0     | Flat on background              | Page body                            |
| 1     | White bg + `1px solid #E2E8F0`  | Cards (glass-card), input containers |
| 2     | Glassmorphism                   | Modals, dropdowns, floating toolbars |
| 3     | Active selection outline        | Selected canvas blocks               |

### 5.2 Specific Shadow Values

| Context                    | CSS Value                                                    |
|----------------------------|--------------------------------------------------------------|
| Glass-card                 | No shadow; `border: 1px solid #E2E8F0`                     |
| Canvas frame               | `shadow-2xl` (Tailwind: large layered shadow)               |
| Floating toolbar           | `shadow-lg`                                                  |
| Button subtle              | `shadow-sm`                                                  |
| Stat card (secondary)      | `shadow-lg` + `hover:scale-[1.02]`                          |
| Correct-answer pulse       | `0 0 0 0 rgba(16, 185, 129, 0.4)` → `0 0 0 15px rgba(16,185,129,0)` |
| Active block               | `outline: 2px solid #0058be; box-shadow: 0 0 0 4px rgba(0,88,190,0.1)` |
| Atmosphere blobs           | `blur-[100px]` to `blur-[120px]`, opacity 0.10              |

### 5.3 Glassmorphism (Surface Level 2)

```css
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid #E2E8F0;
}
```

Floating toolbar variant:
```css
/* bg-white/90 backdrop-blur-md */
background: rgba(255, 255, 255, 0.90);
backdrop-filter: blur(12px);
```

Nav bar variant:
```css
/* bg-white/80 backdrop-blur-md */
background: rgba(255, 255, 255, 0.80);
backdrop-filter: blur(12px);
```

---

## 6. LAYOUT STRUCTURE

### 6.1 Dashboard Layout (Dashboard Guru)

```
┌──────────────────────────────────────────────────┐
│ Sidebar (w-64, fixed)  │  Main Content (ml-64)   │
│                         │  ┌───────────────────┐  │
│ Logo + Subtitle         │  │ Welcome Header    │  │
│ New Project Button      │  └───────────────────┘  │
│ Nav Items               │  ┌───────────────────┐  │
│  • Dashboard (active)   │  │ Stats Bento Grid  │  │
│  • Workspace            │  │ (3-col)           │  │
│  • Assets               │  └───────────────────┘  │
│  • Analytics            │  ┌───────────────────┐  │
│ ─────────────────       │  │ Project Cards     │  │
│ Settings                │  │ (3-col grid)      │  │
│ Support                 │  └───────────────────┘  │
│ Avatar + Name           │                         │
└──────────────────────────────────────────────────┘
```

- **Sidebar:** `w-64` (256px), `fixed left-0`, full height, `p-4`, `border-r border-outline-variant`, `bg-surface-bright`
- **Main content:** `ml-64`, `p-container-padding` (32px), `min-h-screen`
- **Content max-width:** `max-w-5xl` (1024px) for header

### 6.2 Workspace/Editor Layout (CanvasBuilder)

```
┌──────────────────────────────────────────────────────────────┐
│ TopAppBar (h-16, fixed, z-40)                                │
│ Logo | Project Title | Nav Tabs | [Preview] [Publish] Avatar │
├────────┬──────────────────────────────────────┬──────────────┤
│ Slim   │ Content Panel  │                     │ Properties   │
│ Rail   │ (w-[256px])    │     Canvas          │ Panel        │
│ (w-16) │ • Scenes       │     (flex-1)        │ (w-80)       │
│        │ • Library      │     aspect-video    │ • Fields     │
│ Icons  │                │     max-w-5xl       │ • Styles     │
│        │                │     • Blocks        │ • Animation  │
│        │                │     • Floating      │ • Actions    │
│        │                │       Toolbar       │              │
└────────┴────────────────┴──────────────────────┴──────────────┘
```

- **TopAppBar:** `h-16` (64px), `fixed top-0`, `px-gutter`, `bg-surface-container-lowest`, `border-b border-outline-variant`
- **Icon Rail:** `w-16` (64px), `bg-surface-bright`, `border-r border-outline-variant`, `py-6 gap-6`
- **Content Panel:** Remaining from `w-72` (288px) minus 64px = ~224px, `bg-surface-container-low`, `border-r`
- **Canvas:** `flex-1`, `bg-surface-dim`, `canvas-bg` (dot grid), `p-8`
- **Properties Panel:** `w-80` (320px), `bg-white`, `border-l border-outline-variant`

### 6.3 Quiz Preview Layout

```
┌──────────────────────────────────────────────────┐
│ Top Nav (h-20, fixed, glassmorphic)              │
│ Logo | Progress Bar | Score                       │
├──────────────────────────────────────────────────┤
│                                                   │
│              Question (centered)                   │
│              ┌──────┐  ┌──────┐                   │
│              │  A   │  │  B   │                   │
│              └──────┘  └──────┘                   │
│              ┌──────┐  ┌──────┐                   │
│              │  C   │  │  D   │                   │
│              └──────┘  └──────┘                   │
│                                                   │
├──────────────────────────────────────────────────┤
│ Scene Navigator (h-24, fixed bottom, pill)        │
└──────────────────────────────────────────────────┘
```

- **Top nav:** `h-20` (80px), `bg-white/80 backdrop-blur-md`, `px-gutter`
- **Main content:** `pt-24 pb-32 px-gutter`, centered, `max-w-5xl`
- **Scene navigator:** `h-24` (96px), fixed bottom, pill-shaped, `bg-white/90 backdrop-blur-xl`

### 6.4 Grid Patterns

| Context            | Pattern                                          |
|--------------------|--------------------------------------------------|
| Stats Bento Grid   | `grid grid-cols-1 md:grid-cols-3 gap-stack-md`   |
| Project Cards      | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| Library Blocks     | `grid grid-cols-2 gap-2`                         |
| Answer Options     | `grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8` |
| Property Fields    | `grid grid-cols-2 gap-3`                         |

---

## 7. COMPONENT SPECIFICATIONS

### 7.1 Buttons

#### Primary CTA (Large)
```css
/* "Buat Konten Baru dengan AI" */
background-color: #10b981;        /* primary-container */
color: #00422b;                   /* on-primary-container */
padding: 20px 32px;               /* py-5 px-8 */
border-radius: 9999px;            /* rounded-full */
font: 700 16px/1.4 'Nunito Sans'; /* font-label-lg */
letter-spacing: 0.01em;
border-bottom: 3px solid #006c49; /* border-b-[3px] border-primary */
box-shadow: 0 1px 2px rgba(0,0,0,0.05); /* shadow-sm */
transition: all;
hover: translate-y-[-2px];
```

#### Primary Action (Standard)
```css
/* "Publish" button */
background-color: #10b981;        /* primary-container */
color: #00422b;                   /* on-primary-container */
padding: 8px 24px;                /* py-2 px-6 */
border-radius: 9999px;            /* rounded-full */
font: 700 16px/1.4 'Nunito Sans';
hover: opacity-90;
active: scale-95;
```

#### Outline Button
```css
/* "Preview" button */
background: transparent;
border: 1px solid #6c7a71;       /* border-outline */
color: #006c49;                   /* text-primary */
padding: 8px 24px;
border-radius: 9999px;
font: 700 16px/1.4 'Nunito Sans';
hover: background-color: #e6e8ea; /* bg-surface-container-high */
```

#### New Project Button (Sidebar)
```css
background-color: #10b981;        /* primary-container */
color: #00422b;                   /* on-primary-container */
padding: 16px 24px;               /* py-4 px-6 */
border-radius: 12px;              /* rounded-xl */
font: 700 16px/1.4 'Nunito Sans';
border-bottom: 2px solid #006c49; /* border-b-2 border-primary */
hover: scale-95;
transition: transform;
```

#### Icon Button (Rail)
```css
padding: 8px;                     /* p-2 */
border-radius: 12px;              /* rounded-xl */
/* Active: bg-primary-container text-on-primary-container */
/* Default: text-on-surface-variant hover:bg-surface-container-high */
```

#### Danger Button (Remove Block)
```css
background-color: #191c1e;        /* bg-on-background */
color: #ffffff;
padding: 12px 0;                  /* py-3 */
border-radius: 9999px;            /* rounded-full */
width: 100%;
font: 700 16px/1.4 'Nunito Sans';
hover: opacity-90;
active: scale-95;
```

### 7.2 Cards

#### Glass Card (Standard)
```css
background: rgba(255, 255, 255, 0.9);
backdrop-filter: blur(20px);
border: 1px solid #E2E8F0;
border-radius: 24px;              /* rounded-[24px] */
overflow: hidden;
hover: translate-y-[-4px];
transition: all;
```

#### Stat Card (Secondary Container)
```css
background-color: #2170e4;        /* bg-secondary-container */
color: #fefcff;                   /* text-on-secondary-container */
padding: 24px;                    /* p-6 */
border-radius: 24px;              /* rounded-[24px] */
box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); /* shadow-lg */
hover: scale-[1.02];
transition: transform;
```

#### Template/Add Card
```css
border: 2px dashed #bbcabf;      /* border-2 border-dashed border-outline-variant */
border-radius: 24px;
padding: 32px;                    /* p-8 */
hover: background-color: #f2f4f6; /* bg-surface-container-low */
hover: border-color: #10b981;     /* border-primary-container */
```

#### Canvas Block (Inactive)
```css
background-color: #f2f4f6;        /* bg-surface-container-low */
padding: 16px;                    /* p-4 */
border-radius: 16px;              /* rounded-2xl */
border: 1px solid #bbcabf;       /* border-outline-variant */
opacity: 0.60;
transform: scale(0.95);
cursor: move;
```

#### Canvas Block (Active/Selected)
```css
background-color: #ffddb8;        /* bg-tertiary-fixed */
padding: 24px;                    /* p-6 */
border-radius: 24px;              /* rounded-[24px] */
border: 2px solid #855300;       /* border-2 border-tertiary */
outline: 2px solid #0058be;      /* secondary outline */
box-shadow: 0 0 0 4px rgba(0, 88, 190, 0.1);
hover: scale-[1.02];
cursor: move;
```

### 7.3 Progress Bars

#### Standard Progress
```css
/* Track */
background-color: #e0e3e5;        /* bg-surface-container-highest */
height: 16px;                     /* h-4 */
border-radius: 9999px;
overflow: hidden;

/* Fill (primary) */
background-color: #10b981;        /* bg-primary-container */
height: 100%;
border-radius: 9999px;
transition: width 1000ms ease-out; /* "liquid" animation */

/* Fill (tertiary/in-progress) */
background-color: #e29100;        /* bg-tertiary-container */
```

#### Small Progress (Card inline)
```css
/* Track */
height: 8px;                      /* h-2 */
/* Same colors as above */
```

#### Scene Progress (Quiz)
```css
/* Track */
background-color: #eceef0;        /* bg-surface-container */
height: 12px;                     /* h-3 */
border-radius: 9999px;
/* Fill */
background-color: #10b981;        /* bg-primary-container */
transition: all 700ms ease-out;
```

### 7.4 Input Fields

```css
width: 100%;
padding: 12px 16px;               /* py-3 px-4 */
border-radius: 12px;              /* rounded-xl */
border: 1px solid #bbcabf;       /* border-outline-variant */
background-color: #f7f9fb;        /* bg-surface-bright */
font: 400 14px/1.6 'Nunito Sans';
focus: border-color: #0058be;     /* border-secondary */
focus: box-shadow: 0 0 0 2px rgba(0, 88, 190, 0.2); /* ring-secondary/20 */
transition: all;
```

### 7.5 Rich Text Editor

```css
/* Container */
border: 1px solid #bbcabf;
border-radius: 12px;              /* rounded-xl */
overflow: hidden;
background-color: #f7f9fb;

/* Toolbar */
display: flex;
gap: 4px;                         /* gap-1 */
padding: 8px;                     /* p-2 */
border-bottom: 1px solid #bbcabf;
background-color: #f2f4f6;        /* bg-surface-container-low */

/* Toolbar button */
padding: 4px;
hover: background-color: white;
border-radius: 4px;

/* Textarea */
padding: 12px 16px;
border: none;
background: transparent;
font: 400 14px/1.625 'Nunito Sans';
```

### 7.6 Category Tags / Chips

```css
/* Pill shape */
padding: 4px 12px;                /* px-3 py-1 */
border-radius: 9999px;            /* rounded-full */
font-size: 12px;                  /* text-xs */
font-weight: 700;

/* Category: Sains (Primary) */
background-color: #006c49;        /* bg-primary */
color: #ffffff;                   /* text-on-primary */

/* Category: Matematika (Secondary) */
background-color: #0058be;        /* bg-secondary */
color: #ffffff;                   /* text-on-secondary */
```

### 7.7 Sidebar Navigation Items

```css
/* Default */
display: flex;
align-items: center;
gap: 12px;                        /* gap-3 */
color: #3c4a42;                   /* text-on-surface-variant */
padding: 12px 16px;               /* px-4 py-3 */
border-radius: 12px;              /* rounded-xl */
font: 700 16px/1.4 'Nunito Sans';
hover: background-color: #e6e8ea; /* bg-surface-container-high */
hover: translate-x-1;             /* sidebar-hover */
transition: all 200ms;

/* Active */
background-color: #10b981;        /* bg-primary-container */
color: #00422b;                   /* text-on-primary-container */
icon-fill: 1;                     /* filled icon */
```

### 7.8 Scene Navigation Items

```css
/* Default */
display: flex;
align-items: center;
gap: 12px;
padding: 8px 12px;                /* px-3 py-2 */
border-radius: 12px;              /* rounded-xl */
hover: background-color: #e6e8ea;
transition: background-color;

/* Thumbnail */
width: 48px; height: 32px;        /* w-12 h-8 */
background-color: #e0e3e5;        /* bg-surface-container-highest */
border-radius: 4px;
font-size: 10px;

/* Active */
background-color: #10b981;        /* bg-primary-container */
color: #00422b;                   /* text-on-primary-container */
border: 1px solid rgba(0,108,73,0.2); /* border-primary/20 */
thumbnail: background rgba(0,0,0,0.1); /* bg-black/10 */
```

### 7.9 Library Block Buttons

```css
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
padding: 12px;                    /* p-3 */
border-radius: 12px;              /* rounded-xl */
border: 1px dashed #bbcabf;      /* border-dashed border-outline-variant */
hover: background-color: white;
hover: border-color: #006c49;     /* border-primary */
transition: all;
icon-size: 24px;
label: 11px, bold;
```

### 7.10 Floating Toolbar

```css
position: absolute;
bottom: 24px;
left: 50%;
transform: translateX(-50%);
display: flex;
align-items: center;
gap: 4px;                         /* gap-1 */
background: rgba(255,255,255,0.9);
backdrop-filter: blur(12px);      /* backdrop-blur-md */
padding: 8px 16px;                /* px-4 py-2 */
border-radius: 9999px;            /* rounded-full */
border: 1px solid #bbcabf;       /* border-outline-variant */
box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); /* shadow-lg */
z-index: 30;

/* Toolbar button */
padding: 8px;                     /* p-2 */
hover: background-color: #e6e8ea;
border-radius: 9999px;            /* rounded-full */

/* Play button (active) */
background-color: #006c49;        /* bg-primary */
color: white;
border-radius: 9999px;

/* Divider in toolbar */
width: 1px;
height: 16px;                     /* h-4 */
background-color: #bbcabf;       /* bg-outline-variant */
margin: 0 4px;                    /* mx-1 */

/* Zoom label */
font-size: 12px;
font-weight: 700;
padding: 0 8px;                   /* px-2 */
```

### 7.11 Selection Handles (Canvas)

```css
position: absolute;
width: 12px; height: 12px;        /* w-3 h-3 */
background-color: #0058be;        /* bg-secondary */
border-radius: 9999px;            /* rounded-full */
/* Positioned at corners: -top-1.5 -left-1.5, etc. */
```

### 7.12 Feedback Modal (Quiz)

```css
/* Overlay */
position: fixed;
inset: 0;
z-index: 50;
background: rgba(255,255,255,0.40); /* bg-white/40 */
backdrop-filter: blur(4px);       /* backdrop-blur-sm */

/* Card */
background: rgba(255,255,255,0.9);
backdrop-filter: blur(20px);
border: 1px solid #E2E8F0;
padding: 48px;                    /* p-12 */
border-radius: 40px;              /* rounded-[40px] */
text-align: center;
transition: transform 500ms, opacity 300ms;

/* Icon container */
width: 96px; height: 96px;        /* w-24 h-24 */
border-radius: 9999px;

/* Correct state */
icon-bg: #10b981;                 /* bg-primary-container */
text-color: #006c49;              /* text-primary */

/* Error state */
icon-bg: #ba1a1a;                 /* bg-error */
text-color: #ba1a1a;              /* text-error */
```

### 7.13 Scene Navigator (Bottom Pill)

```css
/* Container */
position: fixed;
bottom: 0;
width: 100%;
height: 96px;                     /* h-24 */
display: flex;
align-items: center;
justify-content: center;
background: transparent;
pointer-events: none;

/* Pill */
display: flex;
align-items: center;
gap: 16px;                        /* gap-4 */
background: rgba(255,255,255,0.9);
backdrop-filter: blur(24px);      /* backdrop-blur-xl */
padding: 16px 32px;               /* px-8 py-4 */
border-radius: 9999px;
border: 1px solid rgba(187,202,191,0.3); /* border-outline-variant/30 */
box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
pointer-events: auto;

/* Dot indicators */
/* Inactive: w-3 h-3 rounded-full bg-primary/20 */
/* Active: w-8 h-3 rounded-full bg-primary */
/* Future: w-3 h-3 rounded-full bg-surface-container-highest */
```

---

## 8. ANIMATION & TRANSITION PATTERNS

### 8.1 Transition Durations

| Context                    | Duration | Easing                          |
|----------------------------|----------|---------------------------------|
| Progress bar fill          | 1000ms   | ease-out (cubic-bezier(0.4,0,0.2,1)) |
| Card hover lift            | —        | `transition-all` (default 150ms) |
| Button press               | 150ms    | default                         |
| Sidebar item hover         | 200ms    | `transition-all duration-200`   |
| Image scale on hover       | 500ms    | `transition-transform duration-500` |
| Feedback modal appear      | 500ms    | scale transform                 |
| Feedback overlay fade      | 300ms    | opacity transition              |
| Page entrance animations   | 700ms    | fade-in + slide-in-from-bottom  |
| Progress bar initial load  | 300ms delay then animate | —                    |
| Correct answer pulse       | 600ms    | infinite, cubic-bezier(0.4,0,0.6,1) |
| Wrong answer shake         | 400ms    | cubic-bezier(0.36,0.07,0.19,0.97) |

### 8.2 Key Animations

#### Liquid Progress Fill
```css
.liquid-progress {
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}
/* JS: Start at width:0, set target width after 300ms delay */
```

#### Correct Answer Pulse
```css
@keyframes pulse-emerald {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
}
.correct-pulse {
  animation: pulse-emerald 0.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

#### Wrong Answer Shake
```css
@keyframes shake-error {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
.shake {
  animation: shake-error 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
```

#### Sidebar Hover Shift
```css
.sidebar-hover:hover {
  transform: translateX(4px);
}
/* React version: hover:translate-x-1 (4px) */
```

#### Button Micro-press
```css
/* All buttons: on click add scale-95 for 150ms */
button:active { transform: scale(0.95); }
```

#### Card Hover Lift
```css
/* Project cards */
hover: translate-y-[-4px];
/* Stat cards */
hover: scale-[1.02];
```

#### Image Zoom on Hover
```css
/* Card cover images */
group-hover: scale(1.10);
transition: transform 500ms;
```

#### Entrance Animations (Quiz)
```css
/* fade-in + slide-in-from-bottom-4, duration-700 */
/* fade-in + slide-in-from-bottom-8, duration-700 */
```

### 8.3 Hover States Summary

| Component           | Hover Effect                                    |
|---------------------|--------------------------------------------------|
| Primary CTA button  | `translate-y-[-2px]`                             |
| Sidebar nav item    | `translate-x-1` + bg change                      |
| Project card        | `translate-y-[-4px]`                             |
| Stat card           | `scale-[1.02]`                                   |
| Cover image         | `scale-110` (500ms)                              |
| Answer option card  | `translate-y-[-2px]` + border-primary/50 + white bg |
| Icon button         | bg-surface-container-high                        |
| Outline button      | bg-surface-container-high                        |
| New project icon    | `rotate-90`                                      |
| Arrow link          | `translate-x-1`                                  |
| Add template circle | bg-primary-container + text change               |

---

## 9. CSS CUSTOM PROPERTIES / DESIGN TOKENS (Tailwind Config)

The complete Tailwind config used across all pages:

```javascript
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-variant": "#e0e3e5",
        "primary-fixed-dim": "#4edea3",
        "surface-bright": "#f7f9fb",
        "on-error": "#ffffff",
        "on-background": "#191c1e",
        "surface-container-low": "#f2f4f6",
        "secondary": "#0058be",
        "on-primary-container": "#00422b",
        "error": "#ba1a1a",
        "background": "#f7f9fb",
        "tertiary-fixed": "#ffddb8",
        "tertiary-container": "#e29100",
        "surface-dim": "#d8dadc",
        "on-error-container": "#93000a",
        "surface-container-highest": "#e0e3e5",
        "on-primary": "#ffffff",
        "on-secondary-fixed-variant": "#004395",
        "primary": "#006c49",
        "surface-container-lowest": "#ffffff",
        "on-secondary-container": "#fefcff",
        "tertiary": "#855300",
        "inverse-on-surface": "#eff1f3",
        "surface-container": "#eceef0",
        "on-secondary-fixed": "#001a42",
        "secondary-fixed-dim": "#adc6ff",
        "error-container": "#ffdad6",
        "surface-container-high": "#e6e8ea",
        "outline": "#6c7a71",
        "on-primary-fixed": "#002113",
        "on-surface-variant": "#3c4a42",
        "on-secondary": "#ffffff",
        "on-tertiary-container": "#523200",
        "inverse-surface": "#2d3133",
        "primary-container": "#10b981",
        "surface-tint": "#006c49",
        "on-tertiary": "#ffffff",
        "on-surface": "#191c1e",
        "primary-fixed": "#6ffbbe",
        "outline-variant": "#bbcabf",
        "tertiary-fixed-dim": "#ffb95f",
        "inverse-primary": "#4edea3",
        "on-tertiary-fixed-variant": "#653e00",
        "secondary-fixed": "#d8e2ff",
        "on-tertiary-fixed": "#2a1700",
        "secondary-container": "#2170e4",
        "surface": "#f7f9fb",
        "on-primary-fixed-variant": "#005236"
      },
      borderRadius: {
        DEFAULT: "0.25rem",    // 4px
        lg: "0.5rem",          // 8px
        xl: "0.75rem",         // 12px
        full: "9999px"
      },
      spacing: {
        gutter: "24px",
        "stack-md": "24px",
        "section-gap": "64px",
        base: "8px",
        "stack-sm": "12px",
        "container-padding": "32px"
      },
      fontFamily: {
        fredoka: ["Fredoka", "sans-serif"],
        "display-lg-mobile": ["Plus Jakarta Sans"],
        "body-md": ["Nunito Sans"],
        "headline-md": ["Plus Jakarta Sans"],
        "body-lg": ["Nunito Sans"],
        "label-lg": ["Nunito Sans"],
        "display-lg": ["Plus Jakarta Sans"],
        "headline-lg": ["Plus Jakarta Sans"]
      },
      fontSize: {
        "display-lg-mobile": ["32px", { lineHeight: "1.2", fontWeight: "800" }],
        "body-md": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-md": ["24px", { lineHeight: "1.4", fontWeight: "700" }],
        "body-lg": ["20px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-lg": ["16px", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "700" }],
        "display-lg": ["40px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "800" }],
        "headline-lg": ["32px", { lineHeight: "1.3", fontWeight: "700" }]
      }
    }
  }
};
```

---

## 10. CANVAS BACKGROUND (Dot Grid)

```css
.canvas-bg {
  background-image: radial-gradient(#bbcabf 1px, transparent 1px);
  background-size: 24px 24px;
}
```

Used as the workspace/canvas background behind the white frame. Color matches `outline-variant` token.

---

## 11. ATMOSPHERE / DECORATIVE BLOBS

Background blobs used in the quiz preview for a modern, ambient feel:

```html
<div class="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-40">
  <!-- Green blob, top-left -->
  <div class="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]"></div>
  <!-- Blue blob, bottom-right -->
  <div class="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]"></div>
</div>
```

---

## 12. DESIGN PRINCIPLES (from DESIGN.md)

1. **Professional yet Playful** — Not a dry LMS; vibrant, creative environment
2. **High-End Minimalism + Modern Softness** — Generous whitespace, soft UI
3. **Tonal Layering over Shadows** — Surface hierarchy via color, not drop-shadows
4. **High Radius Geometry** — No 90-degree angles; organic, tactile shapes
5. **Flat Depth Buttons** — Primary buttons with subtle darker bottom border for tactile feel
6. **Dashed → Solid Placeholder Pattern** — Dashed borders invite interaction; solid when populated
7. **8px Grid System** — All spacing multiples of 8px
8. **Minimum touch target:** 48px (mobile/PWA contexts)
9. **Mobile margins compress to 16px**, but touch targets stay large
10. **Body text base 18px** — Accessible for both teachers and students

---

## 13. QUICK REFERENCE: MOST-USED VALUES

| Property              | Value                        |
|-----------------------|------------------------------|
| Page background       | `#f7f9fb`                    |
| Card background       | `rgba(255,255,255,0.9)` + blur 20px |
| Card border           | `1px solid #E2E8F0`         |
| Card border-radius    | `24px`                       |
| Sidebar width         | `256px` (w-64)               |
| Properties panel width| `320px` (w-80)               |
| Icon rail width       | `64px` (w-16)                |
| Top bar height        | `64px` (h-16)                |
| Quiz nav height       | `80px` (h-20)                |
| Primary button bg     | `#10b981`                    |
| Primary button text   | `#00422b`                    |
| Focus ring            | `2px #0058be` + `ring-secondary/20` |
| Default text color    | `#191c1e`                    |
| Muted text color      | `#3c4a42`                    |
| Body font             | Nunito Sans 18px/1.6        |
| Heading font          | Plus Jakarta Sans            |
| Icon font             | Material Symbols Outlined    |
| Section gap           | `64px`                       |
| Card grid gap         | `24px`                       |
| Container padding     | `32px`                       |
