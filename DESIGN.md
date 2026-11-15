---
name: Nocturne Luminary
colors:
  surface: '#121316'
  surface-dim: '#121316'
  surface-bright: '#38393c'
  surface-container-lowest: '#0d0e11'
  surface-container-low: '#1b1b1f'
  surface-container: '#1f1f23'
  surface-container-high: '#292a2d'
  surface-container-highest: '#343538'
  on-surface: '#e3e2e6'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e3e2e6'
  inverse-on-surface: '#2f3034'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#ffb95f'
  on-secondary: '#472a00'
  secondary-container: '#ee9800'
  on-secondary-container: '#5b3800'
  tertiary: '#ddb8ff'
  on-tertiary: '#490081'
  tertiary-container: '#b175ec'
  on-tertiary-container: '#400071'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#f0dbff'
  tertiary-fixed-dim: '#ddb8ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#62259b'
  background: '#121316'
  on-background: '#e3e2e6'
  surface-variant: '#343538'
typography:
  display:
    fontFamily: Syne
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Syne
    fontSize: 38px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Syne
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Syne
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0em
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an atmospheric, hyper-refined architectural presence for luxury real estate consulting. The identity converges modern minimalism with speculative nocturnal luxury: expansive dark canvas fields, luminous violet accents, and precise frosted glass surfaces that mimic polished architectural materials such as tinted float glass, polished granite, and blackened steel.

### Brand Personality & Target Audience
- **Target Audience:** Ultra-high-net-worth individuals (UHNWI), institutional property investors, architectural connoisseurs, and international developers looking for bespoke consulting, acquisition strategy, and exclusive off-market representation.
- **Personality:** Authoritative, enigmatic, cinematic, and meticulously crafted.
- **Emotional Response:** Inspires high confidence, exclusivity, calm focus, and elevated prestige.

### Design Aesthetic: Nocturnal Architectural Glassmorphism
The aesthetic combines deep dark-mode minimalism with precision-milled glass elements. It avoids kitsch neon overload in favor of controlled, focused radiant violet emissions, frosted glass panels with specular micro-borders, and disciplined typography.

## Colors

The palette is engineered specifically for deep nocturnal backgrounds, drawing eyes inward through focused luminance hierarchies and controlled specular light.

### Palette Hierarchy
- **Canvas & Backgrounds:** The base dark foundation is anchored by `#121316` (Deep Obsidian) and complemented by `#1A1C23` (Charcoal Slate) for elevated surfaces. Surface fills are applied with varying degrees of transparency to allow structural backdrop blurs.
- **Primary Accent (Electric Violet):** `#8B5CF6` functions as the primary visual hook, interactive state trigger, and identity marker. Secondary state variants like `#7C3AED` (deep press) and `#A855F7` (luminous highlight) produce depth across buttons and badges.
- **Secondary Accent (Architectural Gold):** `#F59E0B` introduces a warm, metallic precision accent. Used sparingly for valuation figures, trophy asset tags, verified seal markers, and elite VIP consultation badges.
- **Tertiary Accent (Violet Glow / Highlight):** `#C084FC` is reserved for specular reflections, inner borders, and high-energy typographic emphases.
- **Neutrals & Text:** Pure White (`#FFFFFF`) is used for primary editorial typography, while off-whites (`#E4E4E7`) and slate muteds (`#71717A`) manage body text and architectural metadata.

### Atmospheric Rules
Never use solid stark borders. Always favor semi-transparent white-alpha borders (`rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.16)`) coupled with soft violet drop-shadow light cones to emulate custom architectural lighting.

## Typography

The typographic hierarchy pairs the avant-garde geometric power of **Syne** with the pristine modern ergonomics of **Plus Jakarta Sans**.

### Font Roles
- **Syne (Display & Headlines):** Imparts sculptural gravitas reminiscent of high-end architectural monographs. Wide proportions and structural character cuts give estate names, pricing figures, and narrative headers immediate visual authority.
- **Plus Jakarta Sans (Body & Labels):** Delivers clean readability on dark translucent backgrounds. Its geometric shapes harmonize with architectural blueprints while remaining legible at small scale.

### Usage Directives
- **Micro-Labels & Meta:** Always set property metrics (square footage, room configurations, coordinate data) in uppercase `label-sm` or `label-md` with extended letter spacing (`0.06em` to `0.08em`) to mirror luxury editorial layout design.
- **Editorial Contrast:** Restrict `display` to hero statements and penthouse property titles. Keep body paragraph width between 50–65 characters for optimal legibility.

## Layout & Spacing

The layout is built upon an adaptive 12-column grid for desktop/tablet and a flexible single/dual-column flow for mobile. Layouts are constructed mobile-first to ensure rapid touch interaction and immediate visual impact for on-the-go investors.

### Rhythm & Structure
- **Mobile (< 768px):** 4 columns, `margin-mobile` of 1.25rem (20px), and `gutter-mobile` of 1rem (16px). Single-column card stacking with horizontal edge-to-edge listing carousels.
- **Tablet (768px – 1024px):** 8 columns, 2rem (32px) margins, 1.25rem (20px) gutters. Two-column property card layouts with split-screen consultation modules.
- **Desktop (> 1024px):** 12 columns, max-width bounded at 1360px with automatic center alignment, 3rem (48px) margins, and 1.5rem (24px) gutters. Allows rich 3-column asset portfolios and asymmetric editorial spreads.

### Spatial Spacing Policy
Whitespace is treated as a structural material. High-value property listings require generous internal padding (`space-xl` or `space-lg`) within frosted cards to communicate roominess and exclusivity.

## Elevation & Depth

Visual depth is achieved through layered frosted glass planes, specular gradient boundaries, and controlled radiant atmospheric glows rather than traditional opaque shadows.

### Glassmorphic Layers
- **Surface Level 0 (Ground Canvas):** `#121316` flat dark charcoal obsidian.
- **Surface Level 1 (Glass Backplane):** `background: rgba(26, 28, 35, 0.65)` layered over high-resolution architectural photography, coupled with `backdrop-filter: blur(16px)` and `-webkit-backdrop-filter: blur(16px)`.
- **Surface Level 2 (Interactive Floating Surfaces / Overlays):** `background: rgba(35, 38, 48, 0.75)` with `backdrop-filter: blur(24px)`.

### Borders & Specular Edges
All card edges feature a fine 1px hairline boundary: `border: 1px solid rgba(255, 255, 255, 0.08)`. For premium tiers and hovered states, the top border utilizes a subtle linear gradient:
`border-top: 1px solid rgba(255, 255, 255, 0.22)`.

### Luminous Violet Atmosphere
Interactive objects, primary call-to-actions, and featured luxury properties emit soft, diffused back-glows:
- **Card Ambient Glow:** `box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 25px -5px rgba(139, 92, 246, 0.12)`.
- **Active / Focused Glow:** `box-shadow: 0 0 35px 2px rgba(139, 92, 246, 0.28)`.

## Shapes

The system uses a balanced geometric radius profile (Level 2: Rounded). This softens architectural photography and deep charcoal panels while retaining crisp, structural professionalism.

### Radius System
- **Micro Elements (Tags, Indicators, Badges):** 0.25rem (4px) to 0.375rem (6px).
- **Core Controls (Buttons, Inputs, Selectors):** 0.5rem (8px).
- **Listing Cards, Modals, Glass Panels:** 1rem (16px) matching `rounded-lg`.
- **Hero Display Frames & Media Viewports:** 1.5rem (24px) matching `rounded-xl`.
- **Avatars & Pill Tags:** Full circular geometry (`rounded-full` / 9999px).

## Components

### Buttons
- **Primary (Consultation / Exclusive Access):** Solid Electric Violet (`#8B5CF6`) background with white bold text, transitioning to `#7C3AED` on hover. Accompanied by a continuous subtle ambient glow: `box-shadow: 0 4px 20px rgba(139, 92, 246, 0.35)`. Height: 48px (mobile), 52px (desktop). Radius: 8px.
- **Secondary (Portfolio Browse / Floorplan Download):** Frosted charcoal glass (`rgba(255, 255, 255, 0.05)`), border `1px solid rgba(255, 255, 255, 0.15)`, text in Pure White. On hover, border shifts to `#8B5CF6` and background shifts to `rgba(139, 92, 246, 0.1)`.
- **Tertiary (Text Actions):** Syne or Plus Jakarta Sans with bottom micro-line hover, rendered in `#A855F7`.

### Cards (Property Portfolio & Case Studies)
- **Base Structure:** `background: rgba(26, 28, 35, 0.6)`, `backdrop-filter: blur(16px)`, `border: 1px solid rgba(255, 255, 255, 0.08)`, border-radius 16px.
- **Image Treatment:** Aspect ratios 16:10 or 4:3. Inner zoom on hover (`scale-105` over 500ms easing) inside an `overflow-hidden` container.
- **Badge Integration:** Glass pill badge anchored to the top-left with `background: rgba(18, 19, 22, 0.7)` and Gold (`#F59E0B`) or Violet (`#8B5CF6`) accent typography.

### Input Fields & Search Bars
- **Surface:** `rgba(26, 28, 35, 0.8)` with `border: 1px solid rgba(255, 255, 255, 0.1)`.
- **Typographic Size:** 15px with placeholder styled in muted slate `#71717A`.
- **Focus State:** Hairline transition to `border-color: #8B5CF6` accompanied by `box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.18)`.

### Chips & Filter Pills
- Compact components for price ranges, architectural styles, and locations (e.g., "Addis Ababa", "Penthouse", "Off-Market").
- Background: `rgba(255, 255, 255, 0.04)`, `border: 1px solid rgba(255, 255, 255, 0.08)`. Selected state uses Electric Violet fill (`#8B5CF6`) with white text.

### Checkboxes & Radios
- Size: 20x20px with 4px border-radius (checkbox) or circular (radio).
- Inactive: `border: 1.5px solid rgba(255, 255, 255, 0.2)` with transparent fill.
- Active: Background `#8B5CF6` with a crisp white checkmark or inner dot.

### Specialized Architectural Components
- **VIP Valuation Metric Tile:** Deep glass card displaying asset valuation figures with `#F59E0B` (Amber Gold) headline typography and clean divider rules.
- **Consultant Bio Spec Card:** Elevated showcase for Leul Dereje featuring circular portraiture framed in an Electric Violet gradient ring (`background: linear-gradient(135deg, #8B5CF6, #F59E0B)`), accompanied by signature typography and client trust badges.