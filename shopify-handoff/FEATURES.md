# FEATURES.md — Page Inventory & 3D Customizer Specification

## Storefront Page Inventory
1. **Home (`index.liquid`)**:
   - `Opening Stage Section`: 500vh–600vh sticky container housing Hero, Manifesto, and Ritual. Dissolves text layers and coordinates 3D bottle choreography.
   - `Hero Section`: Oversized watermark fragrance name, ambient accent glow, persistent product bar (size pills 30ml/50ml, price, Add to Bag).
   - `Manifesto Section`: Left-aligned editorial text block ("Made to last") as bottle drifts right.
   - `Ritual Section`: 3 application steps (Prime, Apply, Layer) revealed in sync with the cap uncap & mist spray sequence.
   - `Gallery Section`: 4-fragrance teaser grid linking to `/collections/all`.
   - `CTA Section`: Centered headline ("Find the one that becomes yours") scrolling back to Hero.
   - `Contact Section`: Atelier appointment details and contact form.
   - `Footer`: Wordmark, anchor navigation, audio mute notice.
2. **Collection (`collection.liquid`)**:
   - Full product grid with category filter tabs: All, Male, Female, Unisex.
   - Self-contained product cards: color-floored header, bottle image, size selector, price, and Add to Bag.
3. **Global Navigation & Overlays**:
   - `MegaMenu`: Full-width dropdown grouped by category with a 2D vector bottle preview (`BottlePreview`) re-tinting dynamically.
   - `Cart Drawer`: Sliding drawer with line items, swatch indicator, directional rolling quantity steppers, subtotal, and checkout link.
   - `Sound Toggle`: Global audio mute icon persisted in browser `localStorage`.

---

## 3D Bottle Customizer & Stage Specification (Plain Three.js)

### Scene & Camera
- **Camera**: PerspectiveCamera, FOV 24° (long telephoto to preserve straight flacon walls), position `[0, 0, 7.2]`, near 0.1, far 40.
- **Renderer Settings**: Alpha enabled (transparent background), antialias, `powerPreference: "high-performance"`, tone mapping `ACESFilmicToneMapping`, exposure `1.0`, `outputColorSpace: SRGBColorSpace`.
- **DPR Scaling**: Desktop `min(window.devicePixelRatio, 2.0)`, Mobile `min(window.devicePixelRatio, 1.5)`.

### Lighting Setup
- Ambient Light: `intensity: 0.4`, color `#ffffff`.
- Key Light: Directional `[3.2, 2.4, 4.2]`, `intensity: 0.6`, color `#fffaf2`.
- Fill Light: Directional `[-3.2, 1.4, 4.0]`, `intensity: 0.35`, color `#f4f8ff`.
- Rim Light: Directional `[-3.2, 2.4, -3.0]`, `intensity: 0.65`, color `#eef6ff`.
- Top Bevel Light: Directional `[0, 4.5, 1.0]`, `intensity: 0.45`, color `#ffffff`.
- Ground Bounce: Directional `[0, -2.2, 3.2]`, `intensity: 0.3`, color `#fff5ea`.

### GLTF Mesh Contract (`perfume_bottle.glb`)
- `bottle`: Outer glass flacon (`renderOrder: 2`). `MeshPhysicalMaterial`: `roughness: 0.02`, `clearcoat: 0.85`, `ior: 1.5`, `opacity: 0.06`, `transparent: true`. Custom shader injects grazing rim Fresnel, inner dark refraction band, and heavy solid base culot.
- `capOutside`: Clear outer cap sleeve (`renderOrder: 2`). Same glass material with `opacity: 0.18`.
- `liquid`: Interior fluid body (`renderOrder: 1`). `MeshPhysicalMaterial`: `roughness: 0.02`, `clearcoat: 0.75`, `ior: 1.333`, `transparent: true`. Uniform `opacity: 0.25` across all fragrances. Custom vertex shader applies real-time slosh and tornado vortex depression; fragment shader adds razor-sharp meniscus line at `normY ~0.98` and curved bottom bowl caustic rings.
- `pipe`: Dip tube (`renderOrder: 0`). `opacity: 0.65`, `roughness: 0.35`, desaturated tint matching liquid.
- `cap`: Overcap group for vertical uncap translation.
- `automizerButton`: Pump button for spray depression.
- `nozzle`: Orifice attachment point for particle mist origin.

### Motion Choreography
- **Variant Switch**: 360° spin (`2 * Math.PI`, 0.9s ease `power2.inOut`). Liquid color cross-fades behind bottle back at mid-turn (0.4s).
- **Opening Stage Scroll Tilts**:
  - `0.0 -> 1.0`: Lean into Manifesto pose (`y: -0.14, z: -0.16`).
  - `2.0 -> 2.9`: Yaw three-quarter profile (`y: 0.55`) so spray trajectory projects horizontally.
  - `3.0 -> 4.5`: Uncap lift (1.25x cap height), pump depression (0.08x), mist plume emission.
  - `4.5 -> 5.0`: Showcase tilt (`x: 0.1, y: 0.5, z: 0.28`) as cap glides shut.
- **Particle Mist Plume**: 1,100 GPU particle points (`BottleMist.tsx`). Viscous drag 2.2, gravity 1.6, cone angle ~30°, warm luminous tone (`mix(uColor * 0.82, vec3(0.56, 0.50, 0.46), 0.22)`).

### Web Audio Synthesis
- Procedural liquid spritz synthesis via Web Audio API: dual high-pass filter at 2700Hz, liquid nozzle resonance at 5400Hz, shimmer at 8800Hz, micro pump click at 2800Hz (duration 0.38s). Preload fallback files from `assets/mist.wav` and `assets/click.mp3`.

### Shopify Cart Bridge & Inputs
- **Inputs**: Liquid color hex, bottle size (30ml, 50ml), custom engraving text.
- **Line Item Properties**: When adding custom bottle configurations to the Shopify cart, attach properties:
  - `_color_hex`: Selected hex value (prefixed with `_` to remain hidden if desired, or exposed for order fulfillment).
  - `Bottle Size`: e.g. `50ml`.
  - `Engraving`: Custom text engraving string (if enabled).

### Performance & Fallback Strategy
- **Frameloop**: Switch to `demand` rendering via `IntersectionObserver` when stage scrolls out of viewport.
- **WebGL Fallback**: If WebGL 2 / WebGL is unavailable, hide canvas and render static high-resolution transparent PNG/WebP bottle renders or vector SVG (`BottlePreview.tsx`).

