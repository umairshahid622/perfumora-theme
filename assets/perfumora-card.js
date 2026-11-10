/**
 * Perfumora Luxury Gallery Card Custom Element
 * Coordinates floored luminance accents, variant size toggles, and direct cart drawer addition.
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
  if (!hex || !hex.startsWith('#')) return hex;
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

export class PerfumoraCard extends HTMLElement {
  connectedCallback() {
    this.#setupAccent();
    this.#setupEvents();
  }

  #setupAccent() {
    const rawColor = this.dataset.color;
    if (rawColor && rawColor.startsWith('#')) {
      const accent = capLuminance(rawColor, 0.2);
      this.style.setProperty('--card-accent', accent);
    }
  }

  #setupEvents() {
    // Size buttons
    const sizeButtons = this.querySelectorAll('.perfumora-card__size-btn');
    const pricePill = this.querySelector('.perfumora-card__price-pill');
    const addBtn = this.querySelector('.perfumora-card__add-btn');

    sizeButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (btn.disabled) return;

        sizeButtons.forEach((b) => {
          b.classList.remove('is-active');
          b.setAttribute('aria-checked', 'false');
        });

        btn.classList.add('is-active');
        btn.setAttribute('aria-checked', 'true');

        if (pricePill && btn.dataset.price) {
          pricePill.textContent = btn.dataset.price;
        }

        if (addBtn && btn.dataset.variantId) {
          addBtn.dataset.variantId = btn.dataset.variantId;
          addBtn.disabled = btn.dataset.available === 'false';
          addBtn.textContent = btn.dataset.available === 'false' ? 'Sold Out' : 'Add to Bag';
        }

        if (window.PerfumoraAudio && typeof window.PerfumoraAudio.playClick === 'function') {
          window.PerfumoraAudio.playClick();
        }
      });
    });

    // Add to Bag button
    if (addBtn) {
      addBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const variantId = addBtn.dataset.variantId;
        if (!variantId || addBtn.disabled || addBtn.classList.contains('is-loading')) return;

        addBtn.classList.add('is-loading');
        const prevText = addBtn.textContent;
        addBtn.textContent = 'Adding...';

        try {
          const res = await fetch(window.Shopify?.routes?.root + 'cart/add.js', {
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

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          if (window.PerfumoraAudio && typeof window.PerfumoraAudio.playMist === 'function') {
            window.PerfumoraAudio.playMist();
          }

          addBtn.textContent = 'Added ✓';
          setTimeout(() => {
            addBtn.textContent = prevText || 'Add to Bag';
            addBtn.classList.remove('is-loading');
          }, 1200);

          // Trigger cart drawer open and refresh
          this.#openCartDrawer();
        } catch (err) {
          console.error('[PerfumoraCard] Add to cart error:', err);
          addBtn.textContent = prevText || 'Add to Bag';
          addBtn.classList.remove('is-loading');
        }
      });
    }
  }

  async #openCartDrawer() {
    // 1. Notify standard actions override if present
    if (window.Shopify?.actions?.openCart) {
      try {
        await window.Shopify.actions.openCart();
        return;
      } catch (_) {}
    }

    // 2. Open theme-drawer directly
    const cartDrawer = document.querySelector('theme-drawer#cart-drawer');
    if (cartDrawer && typeof cartDrawer.open === 'function') {
      // Re-render cart items section so lines update
      const cartItems = document.querySelector('cart-items-component');
      if (cartItems && typeof cartItems.render === 'function') {
        cartItems.render();
      }
      cartDrawer.open();
      return;
    }

    // 3. Fallback click on header cart button
    const cartTrigger = document.querySelector('[data-testid="cart-drawer-trigger"]');
    if (cartTrigger) {
      cartTrigger.click();
    }
  }
}

if (!customElements.get('perfumora-card')) {
  customElements.define('perfumora-card', PerfumoraCard);
}

