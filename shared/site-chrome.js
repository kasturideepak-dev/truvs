/* TruVs sitewide chrome: sticky header + offcanvas + CTA enhance */
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    /* ---------- Sticky header + section-nav offset ---------- */
    var sticky = document.querySelector('.sticky-header');
    function syncSiteHeaderOffset() {
      var h = 0;
      if (sticky && sticky.classList.contains('is-sticky')) {
        h = Math.round(sticky.getBoundingClientRect().height) || 72;
      }
      document.documentElement.style.setProperty('--truvs-site-header-h', h + 'px');

      /* Measure section nav height for scroll-padding if present */
      var pageNav = document.querySelector(
        '.bpm-service-landing-section-nav, .section-nav, #section-nav, #bpm-service-landing-section-nav'
      );
      if (pageNav) {
        var nh = Math.round(pageNav.getBoundingClientRect().height) || 56;
        document.documentElement.style.setProperty('--truvs-section-nav-h', nh + 'px');
      }
    }

    if (sticky) {
      function syncSticky() {
        if (window.scrollY > 60) sticky.classList.add('is-sticky');
        else sticky.classList.remove('is-sticky');
        syncSiteHeaderOffset();
      }
      syncSticky();
      window.addEventListener('scroll', syncSticky, { passive: true });
      window.addEventListener('resize', syncSiteHeaderOffset, { passive: true });
    } else {
      syncSiteHeaderOffset();
      window.addEventListener('resize', syncSiteHeaderOffset, { passive: true });
    }

    /* ---------- Offcanvas ---------- */
    var LOCK = false;

    function ensureBackdrop(oc) {
      if (!oc) return null;
      var bd = oc.querySelector(':scope > .brx-offcanvas-backdrop, .brx-offcanvas-backdrop');
      if (!bd) {
        bd = document.createElement('div');
        bd.className = 'brx-offcanvas-backdrop';
        oc.insertBefore(bd, oc.firstChild);
      }
      bd.style.zIndex = '200001';
      bd.style.position = 'fixed';
      var inner = oc.querySelector('.brx-offcanvas-inner');
      if (inner) {
        inner.style.zIndex = '200010';
        inner.style.pointerEvents = 'auto';
        inner.style.position = 'fixed';
      }
      return bd;
    }

    function findOffcanvas(toggle) {
      if (!toggle) return document.querySelector('.brxe-offcanvas.brx-open') || document.querySelector('.brxe-offcanvas');
      var inside = toggle.closest('.brxe-offcanvas');
      if (inside) return inside;
      /* Prefer data-selector — offcanvas may be reparented onto <body> while open */
      var sel = toggle.getAttribute('data-selector');
      if (sel) {
        try {
          var bySel = document.querySelector(sel);
          if (bySel) return bySel;
        } catch (err) {}
      }
      var n = toggle.nextElementSibling;
      while (n) {
        if (n.classList && n.classList.contains('brxe-offcanvas')) return n;
        n = n.nextElementSibling;
      }
      /* Comment placeholder sits where the panel used to be */
      var sib = toggle.nextSibling;
      while (sib) {
        if (sib.nodeType === 1 && sib.classList && sib.classList.contains('brxe-offcanvas')) return sib;
        sib = sib.nextSibling;
      }
      var p = toggle.parentElement;
      for (var i = 0; i < 8 && p; i++) {
        var found = p.querySelector('.brxe-offcanvas');
        if (found) return found;
        p = p.parentElement;
      }
      return document.querySelector('.brxe-offcanvas.brx-open') || document.querySelector('.brxe-offcanvas');
    }

    /* Sticky header uses transform (is-sticky), which traps position:fixed
       descendants so the drawer/backdrop only cover the header bar.
       Reparent open offcanvas to <body> so fixed covers the full viewport. */
    function parkOffcanvasOnBody(oc) {
      if (!oc || oc.parentNode === document.body) return;
      if (!oc._truvsPlaceholder) {
        oc._truvsPlaceholder = document.createComment('truvs-offcanvas-home');
        oc.parentNode.insertBefore(oc._truvsPlaceholder, oc);
      }
      document.body.appendChild(oc);
    }

    function restoreOffcanvas(oc) {
      if (!oc || !oc._truvsPlaceholder || !oc._truvsPlaceholder.parentNode) return;
      oc._truvsPlaceholder.parentNode.insertBefore(oc, oc._truvsPlaceholder);
    }

    function openNav(toggle) {
      var oc = findOffcanvas(toggle);
      if (!oc) return;
      document.querySelectorAll('.brxe-offcanvas.brx-open').forEach(function (el) {
        if (el !== oc) {
          el.classList.remove('brx-open');
          restoreOffcanvas(el);
        }
      });
      parkOffcanvasOnBody(oc);
      ensureBackdrop(oc);
      oc.classList.add('brx-open');
      document.body.classList.add('truvs-nav-open');
      document.querySelectorAll('button.brxe-toggle[aria-label="Open"]').forEach(function (t) {
        var pair = findOffcanvas(t);
        /* After reparent, pair via data-selector if set */
        var sel = t.getAttribute('data-selector');
        if (sel) {
          try {
            pair = document.querySelector(sel) || pair;
          } catch (err) {}
        }
        var on = pair === oc;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
      var closeBtn = oc.querySelector('button.brxe-toggle[aria-label="Close"]');
      if (closeBtn) closeBtn.setAttribute('aria-expanded', 'true');
    }

    function closeNav(oc) {
      var panels = oc
        ? [oc]
        : Array.prototype.slice.call(document.querySelectorAll('.brxe-offcanvas.brx-open'));
      panels.forEach(function (el) {
        el.classList.remove('brx-open');
        el.querySelectorAll('.menu-item-has-children.is-open, .menu-item-has-children.open').forEach(function (li) {
          li.classList.remove('is-open');
          li.classList.remove('open');
          var b = li.querySelector('button[aria-expanded]');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        restoreOffcanvas(el);
      });
      document.body.classList.remove('truvs-nav-open');
      document.querySelectorAll('button.brxe-toggle').forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-expanded', 'false');
      });
    }

    function setSubOpen(li, on) {
      if (!li) return;
      /* Bricks frontend CSS uses .open; our styles use .is-open — set both */
      li.classList.toggle('is-open', on);
      li.classList.toggle('open', on);
      var btn = li.querySelector('button[aria-expanded]');
      if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    }

    function toggleSubmenu(li) {
      if (!li) return;
      var parentUl = li.parentElement;
      if (parentUl) {
        parentUl.querySelectorAll(':scope > .menu-item-has-children.is-open, :scope > .menu-item-has-children.open').forEach(function (sib) {
          if (sib !== li) setSubOpen(sib, false);
        });
      }
      var willOpen = !li.classList.contains('is-open') && !li.classList.contains('open');
      setSubOpen(li, willOpen);
    }

    document.addEventListener(
      'click',
      function (e) {
        /* 1) Open / close hamburger toggles only */
        var toggle = e.target.closest && e.target.closest('button.brxe-toggle');
        if (toggle) {
          if (LOCK) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          LOCK = true;
          setTimeout(function () {
            LOCK = false;
          }, 120);

          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();

          var label = (toggle.getAttribute('aria-label') || '').toLowerCase();
          var oc = findOffcanvas(toggle);
          if (label === 'close') {
            closeNav(oc);
            return;
          }
          if (oc && oc.classList.contains('brx-open')) closeNav(oc);
          else openNav(toggle);
          return;
        }

        /* 2) Backdrop close */
        if (e.target && e.target.classList && e.target.classList.contains('brx-offcanvas-backdrop')) {
          e.preventDefault();
          closeNav(e.target.closest('.brxe-offcanvas'));
          return;
        }

        /* 2b) Click outside the drawer panel while open → close
           (covers sticky-header cases where backdrop hit-target fails).
           Do NOT preventDefault on real links — that blocked case-study navigation. */
        var openPanel = document.querySelector('.brxe-offcanvas.brx-open');
        if (openPanel) {
          var inner = openPanel.querySelector('.brx-offcanvas-inner');
          var inDrawer = inner && inner.contains(e.target);
          var onBackdrop =
            e.target.classList && e.target.classList.contains('brx-offcanvas-backdrop');
          var onToggle = e.target.closest && e.target.closest('button.brxe-toggle');
          var realLink = e.target.closest && e.target.closest('a[href]');
          var href = realLink ? (realLink.getAttribute('href') || '') : '';
          var isRealNav = href && href !== '#' && href.indexOf('javascript:') !== 0;

          if (onBackdrop) {
            e.preventDefault();
            closeNav(openPanel);
            return;
          }
          if (!inDrawer && !onToggle) {
            closeNav(openPanel);
            if (isRealNav) {
              /* allow the browser (or later handlers) to follow the link */
              return;
            }
            e.preventDefault();
            return;
          }
        }

        /* 3) Offcanvas submenus — click/tap toggles (also works when hover doesn't) */
        var subToggle = e.target.closest && e.target.closest('.brxe-offcanvas .brx-submenu-toggle');
        if (subToggle) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          toggleSubmenu(subToggle.closest('.menu-item-has-children'));
          return;
        }

        var parentItemLink = e.target.closest && e.target.closest(
          '.brxe-offcanvas .menu-item-has-children > a, .brxe-offcanvas .menu-item-has-children > .brx-submenu-toggle > a'
        );
        if (parentItemLink && parentItemLink.closest('.menu-item-has-children') && !parentItemLink.closest('.sub-menu')) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          toggleSubmenu(parentItemLink.closest('.menu-item-has-children'));
          return;
        }
      },
      true
    );

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    document.querySelectorAll('.brxe-offcanvas').forEach(ensureBackdrop);

    document.querySelectorAll('button.brxe-toggle[aria-label="Open"]').forEach(function (btn) {
      var oc = findOffcanvas(btn);
      if (oc && oc.id) btn.setAttribute('data-selector', '#' + oc.id);
      btn.type = 'button';
    });
    document.querySelectorAll('button.brxe-toggle[aria-label="Close"]').forEach(function (btn) {
      btn.type = 'button';
    });

    /* Bricks data-toggle=hover can stick open until leaving the panel — force click mode */
    document.querySelectorAll('.brxe-offcanvas .menu-item').forEach(function (li) {
      li.setAttribute('data-toggle', 'click');
    });

    /* ---------- Offcanvas submenu HOVER (per parent item) ----------
       Opens on mouseenter of that <li>, closes on mouseleave of that <li>
       (includes nested submenu — no need to leave the whole drawer). */
    (function () {
      function bindOffcanvasHover() {
        document.querySelectorAll('.brxe-offcanvas .bricks-nav-menu > .menu-item-has-children').forEach(function (li) {
          if (li.getAttribute('data-truvs-hover')) return;
          li.setAttribute('data-truvs-hover', '1');
          var leaveTimer = null;

          li.addEventListener('mouseenter', function () {
            if (!li.closest('.brxe-offcanvas.brx-open')) return;
            if (leaveTimer) {
              clearTimeout(leaveTimer);
              leaveTimer = null;
            }
            var parentUl = li.parentElement;
            if (parentUl) {
              parentUl.querySelectorAll(':scope > .menu-item-has-children').forEach(function (sib) {
                if (sib !== li) setSubOpen(sib, false);
              });
            }
            setSubOpen(li, true);
          });

          li.addEventListener('mouseleave', function () {
            leaveTimer = setTimeout(function () {
              setSubOpen(li, false);
            }, 80);
          });
        });
      }
      bindOffcanvasHover();
      setTimeout(bindOffcanvasHover, 400);
      setTimeout(bindOffcanvasHover, 1200);
    })();

  });
})();

/* Enhance plain CTAs into nb-arrow-button-v4 structure sitewide */
(function () {
  var ARROW_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M11.293 4.707 17.586 11H4v2h13.586l-6.293 6.293 1.414 1.414L21.414 12l-8.707-8.707-1.414 1.414z"/>' +
    '</svg>';

  function isAlreadyArrow(el) {
    return el.classList.contains('nb-arrow-button-v4') || el.querySelector('.nb-arrow-button-v4__text');
  }

  function labelOf(el) {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function shouldSkip(el) {
    if (!el || el.closest('#brx-footer')) return true;
    if (el.closest('.brxe-offcanvas')) return true;
    if (el.closest('.truvs-site-nav')) return true;
    if (el.closest('.filter-row')) return true;
    if (el.getAttribute('role') === 'tab') return true;
    if (el.classList.contains('filter-btn')) return true;
    if (el.closest('nav, .bricks-nav-menu, .menu, .breadcrumb, .section-nav')) return true;
    if (el.classList.contains('text-link') || el.closest('.form-alt, .check-list')) return true;
    var href = el.getAttribute('href') || '';
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return true;
    var label = labelOf(el);
    if (!label || label.length > 48) return true;
    return false;
  }

  function enhance(el) {
    if (!el || isAlreadyArrow(el) || el.dataset.truvsCta === '1') return;
    if (shouldSkip(el)) return;
    var label = labelOf(el);
    if (!label) return;

    el.dataset.truvsCta = '1';
    el.classList.add('nb-arrow-button-v4', 'brxe-next-arrow-button-v4', 'truvs-cta-enhanced');
    el.style.textDecoration = 'none';
    el.innerHTML =
      '<div class="nb-arrow-button-v4__icon nb-arrow-button-v4__icon--duplicate">' +
      ARROW_SVG +
      '</div>' +
      '<div class="nb-arrow-button-v4__text"><span></span></div>' +
      '<div class="nb-arrow-button-v4__icon">' +
      ARROW_SVG +
      '</div>';
    el.querySelector('.nb-arrow-button-v4__text span').textContent = label;
  }

  function run() {
    document.querySelectorAll('.nb-arrow-button-v4, .brxe-next-arrow-button-v4').forEach(function (el) {
      if (!el.querySelector('.nb-arrow-button-v4__text')) return;
      if (!el.querySelector('.nb-arrow-button-v4__icon--duplicate')) {
        var icon = el.querySelector('.nb-arrow-button-v4__icon');
        if (icon) {
          var dup = icon.cloneNode(true);
          dup.classList.add('nb-arrow-button-v4__icon--duplicate');
          el.insertBefore(dup, el.firstChild);
        }
      }
      el.classList.add('nb-arrow-button-v4');
    });

    var selectors = [
      'a.bricks-button',
      'button.bricks-button',
      'a.truvs-cta',
      'button.truvs-cta',
      'a.btn',
      'button.btn',
      'a.button',
      'a.cta',
      'a.core-btn',
      'a.cs-btn',
      'a.office-card__cta',
      'a.bpm-service-landing-cta-btn',
      'a.bpm-service-landing-btn-finovate',
      'a.bpm-service-landing-case-b2b__link',
    ];
    document.querySelectorAll(selectors.join(',')).forEach(enhance);

    var labels = [
      'View all case studies',
      'See All Offerings',
      'Explore Our Work',
      'Explore Our Story',
      'Partner With Us',
      'Know More',
      'Learn More',
      'View More',
      'View full team',
      'View Industry Solutions',
      'Contact TruVs',
      'Get Started',
      'Book a Conversation',
      'Book 15 min discovery call',
      'Start Your Project',
      'Start with a 30-Min Awareness Meeting',
      'Discuss similar outcomes',
      'Schedule a meeting with TruVs',
    ];
    document.querySelectorAll('a, button').forEach(function (el) {
      if (el.dataset.truvsCta === '1' || isAlreadyArrow(el)) return;
      var t = labelOf(el);
      if (labels.some(function (l) { return t.toLowerCase() === l.toLowerCase(); })) {
        enhance(el);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  window.addEventListener('load', run);
})();
