# DESIGN.md — Perfumora Design System

## Brand Tone & Feel
Artisanal haute-parfumerie luxury, quiet confidence, mineral warmth. Tactile textures evoke warm cashmere stone, crystal glass refraction, and obsidian ink typography, punctuated by dynamic fragrance juice accents.

## Design Tokens

### Color Palette (Hex & HSL Tokens)
- **Surfaces & Backgrounds**:
  - `--background`: `#c9c2b8` (Warm cashmere stone, page background)
  - `--surface`: `#d8d2c8` (Cards, drawers, elevated surfaces)
  - `--surface-raised`: `#e5e0d7` (Popovers, active menu items)
  - `--surface-sunken`: `#b8b1a6` (Recessed bars, inputs)
  - `--backdrop`: `rgba(30, 27, 24, 0.45)` (Modal/drawer scrim blur)
  - `--bg-dark`: `#0b0b0c` (Obsidian black for curtain loader, mega-menu, and footer)
  - `--paper`: `#faf8f5` (Light cream text for dark surfaces)
- **Brand Foregrounds & Ink**:
  - `--foreground` / `--ink`: `#1a1816` (Obsidian charcoal body text)
  - `--foreground-muted`: `rgba(26, 24, 22, 0.68)` (Subtitles, body prose)
  - `--foreground-subtle`: `rgba(26, 24, 22, 0.44)` (Captions, micro labels)
  - `--border`: `rgba(26, 24, 22, 0.14)` (Hairline dividers on light)
  - `--hairline-on-dark`: `rgba(250, 248, 245, 0.14)` (Dividers on dark)
- **Primary & Dynamic Accent**:
  - `--primary` / `--accent`: `#9e5b22` (Default bronze, dynamically overridden per fragrance)
  - `--primary-hover`: `#884d1c`
  - `--primary-glow`: `rgba(158, 91, 34, 0.28)` (Hero radial backdrop glow)
  - Dynamic Color Math:
    - *Light surface text*: Cap relative luminance at `0.20` (`readableAccent`) to guarantee ≥3.5:1 contrast against `#c9c2b8`.
    - *Dark surface text*: Cap luminance at `0.45` (`readableAccentOnDark`) for legibility against `#0b0b0c`.
    - *Button text contrast*: Relative luminance > 0.18 -> `#1a1816` (ink), otherwise `#faf8f5` (paper).

### Typography
- **Display Font**: `Khand` (Variable 400–700, uppercase, weight 600) — reserved for H1, H2, and price tags.
- **Body Font**: `Switzer` (Variable 400–700, weights 400/500) — body prose, navigation, inputs, and micro-labels.
- **Fluid Type Scale**:
  - `Display (H1)`: `clamp(3rem, 10vw, 9rem)` | Line height: 0.9 | Letter spacing: -0.03em
  - `Section (H2)`: `clamp(2rem, 5vw, 4rem)` | Line height: 1.0 | Letter spacing: -0.02em
  - `Price`: `clamp(2rem, 4vw, 3.25rem)` | Line height: 1.0 | Letter spacing: -0.02em
  - `Body`: `clamp(0.95rem, 1vw, 1.05rem)` | Line height: 1.7 | Letter spacing: 0.01em
  - `Micro`: `0.75rem` (12px) | Line height: 1.2 | Letter spacing: 0.14em (uppercase)

### Geometry, Elevation & Radii
- **Border Radii**:
  - Product Card: `1.75rem` (28px)
  - Mega Menu / Modal panels: `1.5rem` to `1.75rem`
  - Buttons & Selector Pills: `rounded-full` (9999px)
- **Shadows**:
  - Product Card: `0 18px 44px -26px rgba(0, 0, 0, 0.85)`
  - Elevated Drawer: `-12px 0 36px -12px rgba(0, 0, 0, 0.35)`

### Motion & Timing
- **Easing Profiles**:
  - Transitions / Navigation: `cubic-bezier(0.16, 1, 0.3, 1)` or GSAP `power3.inOut`
  - Scrubbed Scroll Dissolves: `power1.inOut` (scrub: 0.5s)
  - Number Rolls / Card Arc: `power2.out`
  - Fast Dismissals: `power4.inOut` (duration: 0.4s – 0.55s)
- **Reduced Motion**: All continuous drift, 3D rotations, and position offsets collapse to static zero transforms.

## Layout & Component Patterns
- **Opening Stage Stack**: Multi-screen sticky viewport container. Dissolves Hero -> Manifesto -> Ritual while maintaining stationary 3D bottle in center/right.
- **Directional Rolling Counter**: Stepper quantities (+ / −) roll dynamically. Increments enter from bottom (+100% -> 0%); decrements enter from top (-100% -> 0%).
- **Interactive Ripple Button**: Cursor-origin circular expansion ripple on click/hover with dynamic foreground contrast swap.
- **Scrollbar**: Retains natural scroll mechanics, but visual scrollbars are hidden across browsers (`scrollbar-width: none; ::-webkit-scrollbar { display: none }`).

## Shopify Theme Settings Mapping
- In `config/settings_schema.json`, expose color pickers for `color_background` (`#c9c2b8`), `color_surface` (`#d8d2c8`), `color_text` (`#1a1816`), and `color_accent` (`#9e5b22`).
- Bind these in Horizon's root layout to CSS Custom Properties on `:root`.
- Self-host Khand and Switzer WOFF2 assets in `assets/` and declare `@font-face` rules in `base.css`.

