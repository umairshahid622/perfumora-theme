# CATALOG.md — Brand Copy, Product Data & Shopify Metafields

## Brand Voice & Key Copy

### Brand Tone
Minimalist luxury, understated elegance, sensorial craftsmanship. Copy is poetic yet direct, confident without hyperbole.

### Core Editorial Copy
- **Brand Tagline**: *"One sculpted vessel. Four expressions. Endlessly refillable."* (Historical base tag; scalable to entire catalog).
- **Manifesto Headline**: `MADE TO LAST.`
- **Manifesto Body**:
  > *"A good fragrance is the easiest way to feel confident and put together. It's the final detail you put on before heading out, and the one people remember most.*
  > *We focus on quality ingredients and long-lasting formulas made for everyday wear — simple, clean, and designed to stay with you from morning to night."*
- **The Ritual Steps**:
  - `01 · Prime`: *"A single press to warm pulse points — wrist, throat, the nape of the neck."*
  - `02 · Apply`: *"Hold the vessel a hand's width away and let the mist settle, never rub."*
  - `03 · Layer`: *"Return through the day as the scent softens; the refill is always close."*
- **Closing Call to Action (CTA)**:
  - Eyebrow: `Begin`
  - Heading: *"Find the one that becomes yours"*
  - Button: `Explore the collection`
- **Atelier Contact**:
  - Eyebrow: `Contact`
  - Heading: *"Speak with the atelier"*
  - Subtitle: *"Questions on layering, refills, or a bespoke commission — leave a note and we'll respond in kind."*
  - Location Details: *"hello@perfumora.example · By appointment · Pakistan"*

---

## Fragrance Catalog (Core Verified SKUs)

The codebase defines fragrances with specific visual and olfactive attributes. Prices in the Next.js project are in PKR (Pakistani Rupees):

| Name | Color Hex | Concentration | Category | Offered Sizes | Sample Pricing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Boom Shell** | `#e5aab2` (Blush Pink) | Extrait de Parfum | Female | 30ml, 50ml | Rs. 2,900 (30ml) / Rs. 4,100 (50ml) |
| **Parada** | `#b7bb81` (Sage Olive) | Eau de Parfum | Unisex | 30ml, 50ml | Rs. 2,400 (30ml) / Rs. 3,600 (50ml) |
| **Midnight Oud** | `#bb7528` (Amber Gold) | Eau de Parfum | Male / Unisex | 30ml, 50ml | Rs. 3,200 (30ml) / Rs. 4,800 (50ml) |
| **Midnight Sapphire**| `#323b8f` (Navy Royal) | Extrait de Parfum | Male / Unisex | 30ml, 50ml | Rs. 3,500 (30ml) / Rs. 5,200 (50ml) |
| **Cobalt Elixir** | `#e5e5e5` (Clear Crystal) | Eau de Cologne | Unisex | 30ml, 50ml | Rs. 2,600 (30ml) / Rs. 3,900 (50ml) |
| *Vetiver Green* | `#4f7942` (Forest Earth)| Eau de Parfum | Male | 30ml, 50ml | Archive SKU / Expansion |

*(Note: Pricing and stock numbers vary in database; sizes sold are sparse per SKU — absent row means size not sold).*

---

## Shopify Metafield Definitions (`perfumora` namespace)

To support the 3D customizer and card styling in native Liquid, configure these product metafield definitions in Shopify Admin:

1. **`perfumora.color_hex`**:
   - Type: `single_line_text_field` or `color`
   - Purpose: Direct hex color fed into Three.js liquid material and card background arch.
2. **`perfumora.concentration`**:
   - Type: `single_line_text_field`
   - Choices: `Eau de Cologne`, `Eau de Toilette`, `Eau de Parfum`, `Extrait de Parfum`.
3. **`perfumora.gender_category`**:
   - Type: `single_line_text_field`
   - Choices: `Male`, `Female`, `Unisex`. Used for collection filtering tabs.
4. **`perfumora.flacon_image`**:
   - Type: `file_reference` (Image)
   - Purpose: Transparent PNG/WebP bottle shot used in 2D gallery cards and search results.
5. **`perfumora.olfactive_pyramid`** *(Optional / Recommended)*:
   - Type: `json` or multiple `single_line_text_field` (Top, Heart, Base notes) for fragrance storytelling.

---

## Product Modeling Architecture Decision

### Current Architecture in Code
- Supabase stores each fragrance as a distinct entity in `fragrances`, with size variants in `fragrance_sizes`.
- The Next.js storefront displays them in two ways:
  1. **Home 3D Stage**: Cycles through all fragrances as if they were variants of one physical flacon.
  2. **Collection Grid (`/collection`)**: Renders them as distinct products with individual cards, size selectors, and Add to Bag buttons.

### Trade-offs for Shopify Target
- **Structure A: 1 Core Product with Fragrance & Size Variants**
  - *Pros*: Natural fit for the single-page 3D stage; unified variant selector.
  - *Cons*: Shopify limits a single product to 100 variants (e.g. 25 fragrances x 2 sizes = 50 variants is within limits, but 4 sizes would hit the ceiling); complicates individual PDP SEO and distinct image galleries.
- **Structure B: 25 Separate Products in a "Fragrances" Collection**
  - *Pros*: Standard Shopify e-commerce flow, independent inventory, individual URLs (`/products/boom-shell`), clean collection filtering. The 3D customizer can query collection products via Liquid or Section Rendering API.
- **TODO**: Confirm with owner whether Perfumora should be built as **1 product with fragrance variants** or **25 separate products**.

