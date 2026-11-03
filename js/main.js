/* Yo limpio tu aire — interacciones de la página */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const preloader = document.querySelector("#preloader");
  const header = document.querySelector(".site-header");
  const homeView = document.querySelector("#home-view");
  const contactView = document.querySelector("#contacto");
  const menuToggle = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const themeToggle = document.querySelector(".theme-toggle");
  const closeMenu = () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Abrir menú");
    navMenu?.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };
  const mobileNavItems = [...document.querySelectorAll(".mnav-item")];
  const mobileSections = ["servicios", "proceso", "planes", "preguntas"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const setActiveMobileNav = (targetId) => {
    mobileNavItems.forEach((item) => {
      const active = item.dataset.target === targetId;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "location");
      else item.removeAttribute("aria-current");
    });
  };
  const setActiveMainNav = (targetId) => {
    document.querySelectorAll(".nav-link").forEach((link) => {
      const active = link.getAttribute("href") === `#${targetId}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  const showContactView = (updateHistory = true) => {
    if (!contactView || !homeView) return;
    document.body.classList.add("show-contacto");
    homeView.setAttribute("aria-hidden", "true");
    contactView.setAttribute("aria-hidden", "false");
    contactView.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
    document.querySelector(".site-footer")?.setAttribute("aria-hidden", "true");
    closeMenu();
    setActiveMobileNav("contacto");
    setActiveMainNav("contacto");
    window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" });
    if (updateHistory) contactView.querySelector("#contact-title")?.focus({ preventScroll: true });
    if (updateHistory && window.location.hash !== "#contacto") {
      window.history.pushState({ view: "contacto" }, "", "#contacto");
    }
  };
  const showHomeView = (targetId = "inicio", updateHistory = true) => {
    if (!contactView || !homeView) return;
    document.body.classList.remove("show-contacto");
    homeView.removeAttribute("aria-hidden");
    contactView.setAttribute("aria-hidden", "true");
    document.querySelector(".site-footer")?.removeAttribute("aria-hidden");
    setActiveMobileNav(targetId);
    setActiveMainNav(targetId);
    if (updateHistory && window.location.hash !== `#${targetId}`) {
      window.history.pushState({ view: "home", target: targetId }, "", `#${targetId}`);
    }
    if (targetId === "inicio") {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" });
      return;
    }
    document.getElementById(targetId)?.scrollIntoView({
      behavior: reduceMotion ? "instant" : "smooth",
      block: "start",
    });
  };
  const restoreViewFromLocation = () => {
    if (window.location.hash === "#contacto") {
      showContactView(false);
      return;
    }
    const targetId = window.location.hash.slice(1);
    showHomeView(document.getElementById(targetId) ? targetId : "inicio", false);
  };
  mobileNavItems.forEach((item) => item.addEventListener("click", (event) => {
    event.preventDefault();
    const targetId = item.dataset.target || "inicio";
    if (targetId === "contacto") showContactView();
    else showHomeView(targetId);
  }));
  window.addEventListener("popstate", restoreViewFromLocation);
  // Oculta la precarga incluso si la página permanece abierta desde caché.
  const hidePreloader = () => window.setTimeout(() => {
    preloader?.classList.add("is-hidden");
    window.setTimeout(() => {
      if (!preloader) return;
      preloader.hidden = true;
      preloader.setAttribute("aria-hidden", "true");
    }, reduceMotion ? 0 : 560);
  }, 450);
  if (document.readyState === "complete") hidePreloader();
  else window.addEventListener("load", hidePreloader, { once: true });

  // Menú móvil accesible.
  if (window.location.hash === "#contacto") showContactView(false);

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    navMenu?.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
  });
  navMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1000) closeMenu();
  });

  // Tema inicial: preferencia guardada, después preferencia del sistema.
  const savedTheme = localStorage.getItem("ylt-theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    const dark = theme === "dark";
    themeToggle?.setAttribute("aria-label", dark ? "Activar modo claro" : "Activar modo oscuro");
    themeToggle?.setAttribute("title", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    const icon = themeToggle?.querySelector("span");
    if (icon) icon.textContent = dark ? "☀" : "☾";
  };
  applyTheme(savedTheme || (systemPrefersDark.matches ? "dark" : "light"));
  themeToggle?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("ylt-theme", next);
  });

  // Efectos globales de desplazamiento y navegación activa.
  const backToTop = document.querySelector(".back-to-top");
  let scrollQueued = false;
  const updateScrollState = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
    backToTop?.classList.toggle("is-visible", window.scrollY > 520);
    if (!document.body.classList.contains("show-contacto")) {
      let activeTarget = "inicio";
      const activationLine = window.innerHeight * 0.42;
      mobileSections.forEach((section) => {
        if (section.getBoundingClientRect().top <= activationLine) activeTarget = section.id;
      });
      setActiveMobileNav(activeTarget);
    }
    scrollQueued = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScrollState);
    }
  }, { passive: true });
  updateScrollState();
  backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" }));

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.classList.contains("mnav-item")) return;
      const targetId = link.getAttribute("href").slice(1);
      if (targetId === "contacto") {
        event.preventDefault();
        showContactView();
        return;
      }
      const target = document.getElementById(targetId);
      if (!target) return;
      event.preventDefault();
      if (document.body.classList.contains("show-contacto")) {
        showHomeView(targetId);
      } else {
        setActiveMobileNav(targetId);
        setActiveMainNav(targetId);
        if (window.location.hash !== `#${targetId}`) {
          window.history.pushState({ view: "home", target: targetId }, "", `#${targetId}`);
        }
        if (targetId === "inicio") window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" });
        else target.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
      }
    });
  });

  const navLinks = [...document.querySelectorAll(".nav-link")];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const activeObserver = new IntersectionObserver((entries) => {
      if (document.body.classList.contains("show-contacto")) return;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    sections.forEach((section) => activeObserver.observe(section));
  }

  // Revelado de contenido: sin observador, el contenido permanece visible.
  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // Inclinación ligera de tarjetas solo con puntero fino.
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        card.style.transform = `perspective(850px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 5}deg) translateY(-3px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  // Parallax decorativo limitado a escritorio y movimiento normal.
  if (finePointer && !reduceMotion) {
    const hero = document.querySelector(".hero");
    let pointerQueued = false;
    hero?.addEventListener("pointermove", (event) => {
      if (pointerQueued) return;
      pointerQueued = true;
      window.requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const art = hero.querySelector(".hero-art");
        if (art) art.style.transform = `translate3d(${x * 7}px,${y * 6}px,0)`;
        pointerQueued = false;
      });
    });
    hero?.addEventListener("pointerleave", () => {
      const art = hero.querySelector(".hero-art");
      if (art) art.style.transform = "";
    });
  }

  // Comparador con control nativo accesible para mouse, teclado y táctil.
  const comparisonRange = document.querySelector(".comparison__range");
  const dirtyImage = document.querySelector(".comparison__dirty");
  const comparisonHandle = document.querySelector(".comparison__handle");
  const updateComparison = () => {
    if (!comparisonRange || !dirtyImage || !comparisonHandle) return;
    const value = `${comparisonRange.value}%`;
    dirtyImage.style.width = value;
    comparisonHandle.style.left = value;
  };
  comparisonRange?.addEventListener("input", updateComparison);
  updateComparison();

  // Acordeón: mantener una única respuesta abierta a la vez.
  document.querySelectorAll(".faq-item").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      document.querySelectorAll(".faq-item").forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  // Validación del formulario y preparación de la solicitud en WhatsApp.
  const form = document.querySelector("#contact-form");
  const feedback = document.querySelector("#form-feedback");
  const formStatus = document.querySelector("#form-status");
  const whatsappLink = document.querySelector("#form-whatsapp-link");
  const validationRules = [
    { name: "name", error: "name-error", message: "Escribe tu nombre completo (mínimo 3 caracteres).", valid: (value) => value.trim().length >= 3 },
    { name: "email", error: "email-error", message: "Ingresa un correo electrónico válido.", valid: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) },
    { name: "service", error: "service-error", message: "Selecciona el servicio que necesitas.", valid: (value) => value.trim().length > 0 },
    { name: "units", error: "units-error", message: "Indica cuántos equipos necesitas atender.", valid: (value) => value.trim().length > 0 },
    { name: "message", error: "message-error", message: "Cuéntanos un poco más (mínimo 10 caracteres).", valid: (value) => value.trim().length >= 10 },
  ];
  validationRules.forEach((rule) => {
    const field = form?.elements.namedItem(rule.name);
    field?.addEventListener("input", () => {
      field.removeAttribute("aria-invalid");
      field.closest(".form-group")?.classList.remove("has-error");
      if (feedback) feedback.textContent = "";
    });
    field?.addEventListener("change", () => {
      field.removeAttribute("aria-invalid");
      field.closest(".form-group")?.classList.remove("has-error");
      if (feedback) feedback.textContent = "";
    });
  });
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form || !feedback || !formStatus || !whatsappLink) return;
    feedback.textContent = "";
    feedback.classList.remove("is-error");
    formStatus.hidden = true;
    let firstInvalid;
    validationRules.forEach((rule) => {
      const field = form.elements.namedItem(rule.name);
      const isValid = field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement
        ? rule.valid(field.value)
        : false;
      if (field instanceof HTMLElement) {
        const group = field.closest(".form-group");
        if (isValid) {
          field.removeAttribute("aria-invalid");
          group?.classList.remove("has-error");
        }
        else {
          field.setAttribute("aria-invalid", "true");
          group?.classList.add("has-error");
          firstInvalid ||= field;
        }
      }
    });
    if (firstInvalid) {
      firstInvalid.focus();
      feedback.textContent = "Revisa los campos marcados para continuar.";
      feedback.classList.add("is-error");
      return;
    }
    const whatsappNumber = form.dataset.whatsappNumber?.replace(/\D/g, "");
    if (!whatsappNumber || !/^[1-9]\d{7,14}$/.test(whatsappNumber)) {
      feedback.textContent = "No se puede preparar la solicitud: falta configurar el número de WhatsApp del negocio.";
      feedback.classList.add("is-error");
      return;
    }
    const formData = new FormData(form);
    const company = String(formData.get("company") || "").trim();
    const message = [
      "Hola, quiero solicitar una cotización para mi aire acondicionado.",
      `Nombre: ${String(formData.get("name")).trim()}`,
      `Correo: ${String(formData.get("email")).trim()}`,
      ...(company ? [`Empresa: ${company}`] : []),
      `Servicio: ${String(formData.get("service"))}`,
      `Cantidad de equipos: ${String(formData.get("units"))}`,
      `Mensaje: ${String(formData.get("message")).trim()}`,
    ].join("\n");
    whatsappLink.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    formStatus.hidden = false;
    window.open(whatsappLink.href, "_blank", "noopener,noreferrer");
  });

  // Brillo ripple de botones sin mantener nodos innecesarios.
  document.querySelectorAll(".ripple").forEach((button) => {
    button.addEventListener("click", (event) => {
      const bounds = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "ripple-effect";
      ripple.style.left = `${event.clientX - bounds.left}px`;
      ripple.style.top = `${event.clientY - bounds.top}px`;
      button.append(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    });
  });

  const year = document.querySelector("#current-year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
