/**
 * Perfumora Hero Stage Custom Element
 * Coordinates fragrance carousel state, watermark transitions, price & size updates,
 * keyboard navigation, and scrollytelling transitions across all 3 Opening Stage beats:
 * - Beat 1: Hero (watermark, navigation arrows, counter, centered bottle)
 * - Beat 2: Manifesto (watermark/arrows fade, copy slides in flush-left, bottle drifts 34vw right)
 * - Beat 3: Ritual (Manifesto fades, bottle returns to center, Ritual header + 3 steps flank bottle)
 * Leaves the bottle slot ready for the 3D bottle in Step 8.
 */

function relativeLuminance(hex) {
  const n = hex.replace('#', '');
  if (n.length < 6) return 0.5;
  const channels = [0, 1, 2].map((i) => {
    const c = parseInt(n.slice(i * 2, i * 2 + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function capLuminance(hex, maxLum = 0.2) {
  if (!hex || !hex.startsWith('#')) return hex || '#9a7177';
  const lum = relativeLuminance(hex);
  if (lum <= maxLum) return hex;

  const k = maxLum / lum;
  const n = hex.replace('#', '');
  const clamp = (c) => Math.min(1, Math.max(0, c));
  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
  const channel = (i) => {
    const srgb = parseInt(n.slice(i * 2, i * 2 + 2), 16) / 255;
    return Math.round(toSrgb(clamp(toLinear(srgb) * k)) * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

function resolveAccent(rawHex) {
  if (!rawHex) return '#9a7177';
  const clean = String(rawHex).toLowerCase().trim();
  if (clean === '#e5aab2') return '#9a7177';
  if (clean === '#b7bb81') return '#7c7f56';
  if (clean === '#bb7528') return '#ae6d25';
  if (clean === '#323b8f') return '#323b8f';
  if (clean === '#e5e5e5') return '#7c7c7c';
  return capLuminance(clean, 0.2);
}

function hexToRgba(hex, alpha = 0.22) {
  if (!hex || !hex.startsWith('#')) return `rgba(154, 113, 119, ${alpha})`;
  const n = hex.replace('#', '');
  if (n.length < 6) return `rgba(154, 113, 119, ${alpha})`;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export class HeroStage extends HTMLElement {
  #products = [];
  #currentIndex = 0;
  #selectedSize = '50';
  #scrollTicking = false;

  connectedCallback() {
    this.#loadData();
    if (this.#products.length === 0) return;

    this.#bindElements();
    this.#setupEvents();
    this.#setupScroll();
    this.#render(0);
  }

  #loadData() {
    const dataScript = this.querySelector('.hero-stage__data');
    if (dataScript) {
      try {
        this.#products = JSON.parse(dataScript.textContent);
      } catch (e) {
        console.error('[HeroStage] Could not parse products JSON:', e);
      }
    }
  }

  #bindElements() {
    this.watermarkWrap = this.querySelector('[ref="watermarkWrap"]');
    this.watermark = this.querySelector('[ref="watermark"]');
    this.prevBtn = this.querySelector('[ref="prevButton"]');
    this.nextBtn = this.querySelector('[ref="nextButton"]');
    this.manifestoPanel = this.querySelector('[ref="manifestoPanel"]');
    this.ritualPanel = this.querySelector('[ref="ritualPanel"]');
    this.bottleMountWrap = this.querySelector('[ref="bottleMountWrap"]');
    this.counter = this.querySelector('[ref="counter"]');
    this.counterCurrent = this.querySelector('[ref="counterCurrent"]');
    this.counterTotal = this.querySelector('[ref="counterTotal"]');
    this.subtitle = this.querySelector('[ref="subtitle"]');
    this.priceEl = this.querySelector('[ref="price"]');
    this.sizesEl = this.querySelector('[ref="sizes"]');
    this.addBtn = this.querySelector('[ref="addButton"]');
    this.productBar = this.querySelector('[ref="productBar"]');
  }

  #setupEvents() {
    this.prevBtn?.addEventListener('click', () => {
      const prevIdx = (this.#currentIndex - 1 + this.#products.length) % this.#products.length;
      this.goTo(prevIdx);
      if (window.PerfumoraAudio?.playClick) window.PerfumoraAudio.playClick();
    });

    this.nextBtn?.addEventListener('click', () => {
      const nextIdx = (this.#currentIndex + 1) % this.#products.length;
      this.goTo(nextIdx);
      if (window.PerfumoraAudio?.playClick) window.PerfumoraAudio.playClick();
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        const prevIdx = (this.#currentIndex - 1 + this.#products.length) % this.#products.length;
        this.goTo(prevIdx);
        if (window.PerfumoraAudio?.playClick) window.PerfumoraAudio.playClick();
      } else if (e.key === 'ArrowRight') {
        const nextIdx = (this.#currentIndex + 1) % this.#products.length;
        this.goTo(nextIdx);
        if (window.PerfumoraAudio?.playClick) window.PerfumoraAudio.playClick();
      }
    });

    this.addBtn?.addEventListener('click', async () => {
      const variantId = this.addBtn.dataset.variantId;
      if (!variantId || this.addBtn.disabled || this.addBtn.classList.contains('is-loading')) return;

      this.addBtn.classList.add('is-loading');
      const prevText = this.addBtn.textContent;
      this.addBtn.textContent = 'Adding...';

      try {
        const res = await fetch((window.Shopify?.routes?.root || '/') + 'cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            items: [
              {
                id: Number(variantId),
                quantity: 1,
              },
            ],
          }),
        });

        if (!res.ok) throw new Error(`Cart add failed: ${res.status}`);

        if (window.PerfumoraAudio?.playMist) window.PerfumoraAudio.playMist();

        this.addBtn.textContent = 'Added ✓';
        setTimeout(() => {
          this.addBtn.textContent = prevText || 'Add to Bag';
          this.addBtn.classList.remove('is-loading');
        }, 1200);

        this.#openCartDrawer();
      } catch (err) {
        console.error('[HeroStage] Cart add error:', err);
        this.addBtn.textContent = prevText || 'Add to Bag';
        this.addBtn.classList.remove('is-loading');
      }
    });
  }

  #setupScroll() {
    const onScroll = () => {
      if (!this.#scrollTicking) {
        requestAnimationFrame(() => {
          this.#handleScroll();
          this.#scrollTicking = false;
        });
        this.#scrollTicking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Also attach directly to .page-wrapper when present
    const pageWrapper = document.querySelector('.page-wrapper');
    if (pageWrapper) {
      pageWrapper.addEventListener('scroll', onScroll, { passive: true });
    }

    // Initial evaluation
    this.#handleScroll();
  }

  #handleScroll() {
    const pageWrapper = document.querySelector('.page-wrapper');
    const scrollContainer = pageWrapper && window.innerWidth >= 990 ? pageWrapper : null;

    const windowH = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;
    const stageH = this.offsetHeight;
    const scrollDist = stageH - windowH;

    if (scrollDist <= 0) return;

    let currentScroll = 0;
    if (scrollContainer) {
      currentScroll = scrollContainer.scrollTop;
    } else {
      const rect = this.getBoundingClientRect();
      currentScroll = -rect.top;
    }

    const rawProgress = currentScroll / scrollDist;
    const progress = Math.max(0, Math.min(1, rawProgress));

    const isMobile = window.innerWidth <= 767;

    // Choreography across 3 beats:
    // Beat 1 (Hero): 0.00 -> 0.08 hold
    // Beat 1 -> 2 (Hero -> Manifesto): 0.08 -> 0.28 transition
    // Beat 2 (Manifesto): 0.28 -> 0.50 hold
    // Beat 2 -> 3 (Manifesto -> Ritual): 0.50 -> 0.68 transition
    // Beat 3 (Ritual): 0.68 -> 0.95 hold
    // Release: 0.95 -> 1.00 unpins to normal document scroll

    let heroPresence = 0;
    let manifestoPresence = 0;
    let ritualPresence = 0;
    let bottleX = 0; // in vw
    let bottleY = 0; // in vh

    if (progress < 0.08) {
      // Beat 1: Pure Hero
      heroPresence = 1;
      manifestoPresence = 0;
      ritualPresence = 0;
      bottleX = 0;
      bottleY = 0;
    } else if (progress < 0.28) {
      // Transition Hero -> Manifesto
      const t = (progress - 0.08) / 0.20;
      const easeT = t * t * (3 - 2 * t);
      heroPresence = 1 - easeT;
      manifestoPresence = easeT;
      ritualPresence = 0;
      bottleX = easeT * 34;
      bottleY = isMobile ? easeT * -16 : 0;
    } else if (progress < 0.50) {
      // Beat 2: Pure Manifesto Hold
      heroPresence = 0;
      manifestoPresence = 1;
      ritualPresence = 0;
      bottleX = 34;
      bottleY = isMobile ? -16 : 0;
    } else if (progress < 0.68) {
      // Transition Manifesto -> Ritual
      const t = (progress - 0.50) / 0.18;
      const easeT = t * t * (3 - 2 * t);
      heroPresence = 0;
      manifestoPresence = 1 - easeT;
      ritualPresence = easeT;
      // Bottle glides back from 34vw to 0 (center)
      bottleX = (1 - easeT) * 34;
      bottleY = isMobile ? (1 - easeT) * -16 : 0;
    } else {
      // Beat 3: Pure Ritual Hold (0.68 -> 0.95)
      heroPresence = 0;
      manifestoPresence = 0;
      ritualPresence = 1;
      bottleX = 0;
      bottleY = 0;
    }

    // 1. Watermark, Navigation Arrows & Counter (Hero Beat)
    if (this.watermarkWrap) {
      this.watermarkWrap.style.opacity = heroPresence.toFixed(3);
    }
    if (this.prevBtn) {
      this.prevBtn.style.opacity = heroPresence.toFixed(3);
      this.prevBtn.style.pointerEvents = heroPresence > 0.3 ? 'auto' : 'none';
    }
    if (this.nextBtn) {
      this.nextBtn.style.opacity = heroPresence.toFixed(3);
      this.nextBtn.style.pointerEvents = heroPresence > 0.3 ? 'auto' : 'none';
    }
    if (this.counter) {
      this.counter.style.opacity = heroPresence.toFixed(3);
    }

    // 2. Manifesto Beat Overlay
    if (this.manifestoPanel) {
      this.manifestoPanel.style.opacity = manifestoPresence.toFixed(3);
      const slideX = (1 - manifestoPresence) * -50;
      this.manifestoPanel.style.transform = `translateX(${slideX.toFixed(1)}px)`;
      this.manifestoPanel.style.pointerEvents = manifestoPresence > 0.5 ? 'auto' : 'none';
      this.manifestoPanel.setAttribute('aria-hidden', manifestoPresence < 0.3 ? 'true' : 'false');
    }

    // 3. Ritual Beat Overlay
    if (this.ritualPanel) {
      this.ritualPanel.style.opacity = ritualPresence.toFixed(3);
      const slideY = (1 - ritualPresence) * 20;
      this.ritualPanel.style.transform = `translateY(${slideY.toFixed(1)}px)`;
      this.ritualPanel.style.pointerEvents = ritualPresence > 0.5 ? 'auto' : 'none';
      this.ritualPanel.setAttribute('aria-hidden', ritualPresence < 0.3 ? 'true' : 'false');
    }

    // 4. Bottle Position (0 -> 34vw -> 0)
    if (this.bottleMountWrap) {
      if (isMobile) {
        this.bottleMountWrap.style.transform = `translate3d(0, ${bottleY.toFixed(1)}vh, 0)`;
      } else {
        this.bottleMountWrap.style.transform = `translate3d(${bottleX.toFixed(2)}vw, 0, 0)`;
      }
    }
  }

  goTo(index) {
    if (index === this.#currentIndex) return;
    this.#render(index);
  }

  #render(index) {
    this.#currentIndex = index;
    const product = this.#products[index];
    if (!product) return;

    // Accent calculation
    const accent = resolveAccent(product.rawHex);
    const glow = hexToRgba(product.rawHex, 0.24);
    this.style.setProperty('--hero-accent', accent);
    this.style.setProperty('--hero-accent-glow', glow);

    // Watermark
    if (this.watermark) {
      this.watermark.style.opacity = '0';
      this.watermark.style.transform = 'translateY(12px)';
      setTimeout(() => {
        this.watermark.textContent = product.title;
        this.watermark.style.opacity = '1';
        this.watermark.style.transform = 'translateY(0)';
      }, 180);
    }

    // Counter
    if (this.counterCurrent) {
      this.counterCurrent.textContent = String(index + 1).padStart(2, '0');
    }
    if (this.counterTotal) {
      this.counterTotal.textContent = String(this.#products.length).padStart(2, '0');
    }

    // Subtitle
    if (this.subtitle) {
      const gender = product.gender ? `${product.gender.toUpperCase()} · ` : '';
      const conc = (product.concentration || 'EXTRAIT DE PARFUM').toUpperCase();
      this.subtitle.textContent = `${product.title.toUpperCase()} · ${gender}${conc}`;
    }

    // Variants & Size selection
    const variants = product.variants || [];
    let chosenVariant = null;

    if (this.#selectedSize) {
      chosenVariant = variants.find((v) => v.title.toLowerCase().includes(this.#selectedSize) && v.available);
    }
    if (!chosenVariant) {
      chosenVariant =
        variants.find((v) => v.title.toLowerCase().includes('50') && v.available) ||
        variants.find((v) => v.title.toLowerCase().includes('30') && v.available) ||
        variants.find((v) => v.available) ||
        variants[0];
    }

    // Render Size pills
    if (this.sizesEl) {
      this.sizesEl.innerHTML = '';
      if (variants.length > 0) {
        variants.forEach((v) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.role = 'radio';
          btn.className = 'hero-stage__size-btn';
          const isActive = chosenVariant && v.id === chosenVariant.id;
          if (isActive) {
            btn.classList.add('is-active');
            btn.setAttribute('aria-checked', 'true');
          } else {
            btn.setAttribute('aria-checked', 'false');
          }

          btn.textContent = v.title.toUpperCase();
          if (!v.available) {
            btn.disabled = true;
            btn.classList.add('is-sold-out');
          }

          btn.addEventListener('click', () => {
            this.sizesEl.querySelectorAll('.hero-stage__size-btn').forEach((b) => {
              b.classList.remove('is-active');
              b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('is-active');
            btn.setAttribute('aria-checked', 'true');

            const sizeMatch = v.title.toLowerCase().includes('30') ? '30' : '50';
            this.#selectedSize = sizeMatch;

            this.#updateVariant(v);
            if (window.PerfumoraAudio?.playClick) window.PerfumoraAudio.playClick();
          });

          this.sizesEl.appendChild(btn);
        });
      } else {
        // Fallback size pills
        ['30ML', '50ML'].forEach((sizeText) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.role = 'radio';
          btn.className = 'hero-stage__size-btn';
          const isActive = sizeText.startsWith(this.#selectedSize);
          if (isActive) {
            btn.classList.add('is-active');
            btn.setAttribute('aria-checked', 'true');
          } else {
            btn.setAttribute('aria-checked', 'false');
          }
          btn.textContent = sizeText;
          btn.addEventListener('click', () => {
            this.sizesEl.querySelectorAll('.hero-stage__size-btn').forEach((b) => {
              b.classList.remove('is-active');
              b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('is-active');
            btn.setAttribute('aria-checked', 'true');
            this.#selectedSize = sizeText.slice(0, 2);
            if (window.PerfumoraAudio?.playClick) window.PerfumoraAudio.playClick();
          });
          this.sizesEl.appendChild(btn);
        });
      }
    }

    if (chosenVariant) {
      this.#updateVariant(chosenVariant);
    }
  }

  #updateVariant(variant) {
    if (this.priceEl) {
      let formatted = variant.formattedPrice || '';
      if (formatted) {
        formatted = formatted.replace(/^Rs\.([0-9])/, 'Rs. $1');
      } else if (variant.price) {
        formatted = `Rs. ${(variant.price / 100).toLocaleString()}`;
      } else {
        formatted = 'Rs. 4,100';
      }
      this.priceEl.textContent = formatted;
    }
    if (this.addBtn) {
      this.addBtn.dataset.variantId = variant.id || '';
      this.addBtn.disabled = variant.available === false;
      this.addBtn.textContent = variant.available !== false ? 'Add to Bag' : 'Sold Out';
    }
  }

  async #openCartDrawer() {
    if (window.Shopify?.actions?.openCart) {
      try {
        await window.Shopify.actions.openCart();
        return;
      } catch (_) {}
    }

    const cartDrawer = document.querySelector('theme-drawer#cart-drawer');
    if (cartDrawer && typeof cartDrawer.open === 'function') {
      const cartItems = document.querySelector('cart-items-component');
      if (cartItems && typeof cartItems.render === 'function') {
        cartItems.render();
      }
      cartDrawer.open();
      return;
    }

    const cartTrigger = document.querySelector('[data-testid="cart-drawer-trigger"]');
    if (cartTrigger) {
      cartTrigger.click();
    }
  }
}

if (!customElements.get('hero-stage')) {
  customElements.define('hero-stage', HeroStage);
}