# AGENTS.md — Target Storefront Developer Guide

## Project Summary
Perfumora is an artisanal haute-parfumerie digital storefront being rebuilt as a native **Shopify Liquid Theme** (using Shopify's Horizon theme as the base).
- **In Scope**: Storefront UI/UX, Liquid sections/snippets, design tokens, asset-bundled plain-Three.js 3D bottle customizer, Web Audio spritz cue, cart drawer, and collection browsing.
- **Out of Scope**: Headless architectures (no Next.js, Storefront API, Supabase, or Vercel). Native Shopify features handle checkout, payment gateways, tax, shipping, customer authentication, order management, and inventory decrements.

## Target Architecture & Conventions
- **Base Theme**: Shopify Horizon.
- **Tooling**: Shopify CLI (`shopify theme dev`, `shopify theme pull`, `shopify theme push`, `shopify theme check`).
- **Storefront Scope**: Only storefront files in `assets/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`, `config/`.
- **Custom Product Data**: Managed in Shopify Admin and exposed to Liquid via `metafields` (namespace: `perfumora`).
- **3D Customizer**: Plain Three.js bundled script in `assets/` mounted via a dedicated Liquid section. Passes custom selections (e.g. bottle color, engraving) to the cart as **line item properties**.
- **Local Dev Discipline**:
  - Always work in local branch / dev theme; never push directly to the live/published theme.
  - Run `shopify theme check` before concluding any task.
  - Make small, focused changes; implement one feature/section at a time.
  - Prefer lightweight, vanilla solutions. Do not add NPM dependencies or external build pipelines without owner confirmation.
  - Never commit secrets or API tokens. Never run `git push` unless explicitly commanded. Ask before large refactors.

## Open Architecture Decision: Product Modeling
- **Current Next.js Setup**: In the database, each fragrance is an independent SKU/record (`fragrances` table) with individual size pricing and stock (`fragrance_sizes` table: 30ml, 50ml). However, the homepage 3D Hero treats them visually as selectable variants of one shared bottle geometry.
- **Target Trade-off**:
  - *Option A (1 Product, ~25 Variants)*: Best matches the 3D customizer single-bottle paradigm; simple cart logic. Limited by Shopify's 100-variant limit if multiple sizes (e.g., 25 fragrances x 2 sizes = 50 variants, within limit).
  - *Option B (25 Individual Products with Size Variants)*: Better for collection filtering, SEO, individual product detail pages (PDPs), and inventory reporting.
- **TODO**: Confirm with owner whether Perfumora should be structured as one core product with fragrance variants or a collection of distinct products.

## Handoff Documentation Index
- `DESIGN.md`: Complete design system (colors, typography, spacing, shadows, motion tokens, and Liquid mappings).
- `FEATURES.md`: Page inventory, component specs, and portable plain Three.js 3D customizer / Web Audio specification.
- `CATALOG.md`: Brand voice, editorial copy, product data attributes, and Shopify metafield schema.

## Definition of Done (DoD)
1. Liquid code adheres to Shopify Horizon architectural patterns and passes `shopify theme check` without lint errors.
2. Design tokens faithfully match `DESIGN.md` values across desktop and mobile viewports.
3. 3D bottle and particle mist render at 60fps with graceful fallbacks for devices without WebGL.
4. Add-to-bag operations correctly populate standard variant IDs and any custom line item properties.
5. All interactive UI supports keyboard navigation, accessibility attributes, and reduced-motion user preferences.


The snowboard products in the store are sample data and will be deleted. Never
reference them or hardcode any product handle. Use real Perfumora products and
the metafields in CATALOG.md.