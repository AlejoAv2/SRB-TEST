/* ==========================================================================
   SRB Soluciones de Seguridad - Carrusel, Parallax GPU (60 FPS) & Scroll-Reveal
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --------------------------------------------------------------------------
  // 1. Carrusel de Clientes (Rotación de nodos DOM sin re-decodificar imágenes)
  // --------------------------------------------------------------------------
  var sliderBox = document.querySelector(".slider");
  var trackClientes = document.querySelector(".clientes-track");
  var itemsIniciales = trackClientes ? trackClientes.querySelectorAll(".cliente-item") : [];
  var dotsContainer = document.querySelector("#clientesDots");

  var flecha1 = document.querySelector("#flechaAdelante");
  var flecha2 = document.querySelector("#flechaAtras");
  var indiceActual = 0;
  var totalClientes = itemsIniciales.length;
  var animandoSlider = false;

  function animarCambio(callback) {
    if (!trackClientes || animandoSlider) return;
    animandoSlider = true;
    trackClientes.classList.add("slider-animating");
    setTimeout(function () {
      callback();
      actualizarDots();
      trackClientes.classList.remove("slider-animating");
      animandoSlider = false;
    }, 120);
  }

  function avanzarSlider() {
    animarCambio(function () {
      var primerItem = trackClientes.firstElementChild;
      if (primerItem) {
        trackClientes.appendChild(primerItem);
      }
      indiceActual = (indiceActual + 1) % totalClientes;
    });
  }

  function retrocederSlider() {
    animarCambio(function () {
      var ultimoItem = trackClientes.lastElementChild;
      var primerItem = trackClientes.firstElementChild;
      if (ultimoItem && primerItem) {
        trackClientes.insertBefore(ultimoItem, primerItem);
      }
      indiceActual = (indiceActual - 1 + totalClientes) % totalClientes;
    });
  }

  function inicializarDots() {
    if (!dotsContainer || totalClientes === 0) return;
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < totalClientes; i++) {
      var dot = document.createElement("span");
      dot.className = "carousel-dot" + (i === 0 ? " active" : "");
      fragment.appendChild(dot);
    }
    dotsContainer.innerHTML = "";
    dotsContainer.appendChild(fragment);
  }

  function actualizarDots() {
    if (!dotsContainer) return;
    var dots = dotsContainer.children;
    for (var i = 0; i < dots.length; i++) {
      if (i === indiceActual) {
        dots[i].classList.add("active");
      } else {
        dots[i].classList.remove("active");
      }
    }
  }

  inicializarDots();

  if (flecha1) {
    flecha1.addEventListener("click", avanzarSlider);
  }

  if (flecha2) {
    flecha2.addEventListener("click", retrocederSlider);
  }

  // Auto-rotación continua: activa cuando #clientes es visible en pantalla
  var intervaloClientes = null;
  var seccionVisible = false;

  function actualizarAutoRotacion() {
    if (seccionVisible && !intervaloClientes) {
      intervaloClientes = setInterval(avanzarSlider, 3500);
    } else if (!seccionVisible && intervaloClientes) {
      clearInterval(intervaloClientes);
      intervaloClientes = null;
    }
  }

  var seccionClientes = document.querySelector("#clientes");
  if ("IntersectionObserver" in window && seccionClientes) {
    var observerClientes = new IntersectionObserver(function (entries) {
      seccionVisible = entries[0].isIntersecting;
      actualizarAutoRotacion();
    }, { threshold: 0.15 });
    observerClientes.observe(seccionClientes);
  } else {
    seccionVisible = true;
    actualizarAutoRotacion();
  }

  // --------------------------------------------------------------------------
  // 2. Animación Scroll-Reveal Escalonada (.reveal-up)
  // --------------------------------------------------------------------------
  var revealElements = document.querySelectorAll(".reveal-up");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add("is-visible");
          obs.unobserve(entries[i].target);
        }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });

    for (var r = 0; r < revealElements.length; r++) {
      revealObserver.observe(revealElements[r]);
    }
  } else {
    for (var k = 0; k < revealElements.length; k++) {
      revealElements[k].classList.add("is-visible");
    }
  }

  // --------------------------------------------------------------------------
  // 3. Motor Parallax Acelerado por GPU (translate3d + requestAnimationFrame)
  // --------------------------------------------------------------------------
  var navWrapper = document.querySelector(".nav-wrapper");
  var progressBar = document.querySelector("#scrollProgressBar");
  var navScrolledState = false;

  var parallaxNodes = document.querySelectorAll("[data-parallax-speed]");
  var parallaxItems = [];

  for (var p = 0; p < parallaxNodes.length; p++) {
    var node = parallaxNodes[p];
    var parentSection = node.closest(".parallax-section") || node.parentElement;
    parallaxItems.push({
      el: node,
      container: parentSection,
      speed: parseFloat(node.getAttribute("data-parallax-speed")) || 0.2,
      active: true
    });
  }

  if ("IntersectionObserver" in window && parallaxItems.length > 0) {
    var parallaxObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var target = entries[i].target;
        for (var j = 0; j < parallaxItems.length; j++) {
          if (parallaxItems[j].container === target) {
            parallaxItems[j].active = entries[i].isIntersecting;
          }
        }
      }
    }, { rootMargin: "120px 0px 120px 0px" });

    for (var m = 0; m < parallaxItems.length; m++) {
      if (parallaxItems[m].container) {
        parallaxObserver.observe(parallaxItems[m].container);
      }
    }
  }

  var ticking = false;

  function renderScrollFrame() {
    var scrollY = window.scrollY || window.pageYOffset;

    // Estado compacto del navbar
    if (navWrapper) {
      var debeEstarScrolled = scrollY > 40;
      if (debeEstarScrolled !== navScrolledState) {
        navScrolledState = debeEstarScrolled;
        navWrapper.classList.toggle("nav-scrolled", navScrolledState);
      }
    }

    // Barra de progreso de lectura (compositor GPU via scaleX)
    if (progressBar) {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
      progressBar.style.setProperty("--scroll-progress", progress.toFixed(4));
    }

    // Capas Parallax visibles
    if (!reduceMotion && parallaxItems.length > 0) {
      var viewportHalf = window.innerHeight * 0.5;
      for (var i = 0; i < parallaxItems.length; i++) {
        var item = parallaxItems[i];
        if (!item.active || !item.container) continue;
        var rect = item.container.getBoundingClientRect();
        var centerOffset = (rect.top + rect.height * 0.5) - viewportHalf;
        var translateY = Math.max(Math.min(-centerOffset * item.speed, 75), -75);
        item.el.style.transform = "translate3d(0, " + translateY.toFixed(1) + "px, 0)";
      }
    }

    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(renderScrollFrame);
    }
  }, { passive: true });

  renderScrollFrame();

  // --------------------------------------------------------------------------
  // 4. Micro-Tilt 3D interactivo en la tarjeta principal del Hero (Escritorio)
  // --------------------------------------------------------------------------
  var tiltCard = document.querySelector(".tilt-card");
  if (tiltCard && !reduceMotion && window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
    var tiltRaf = false;
    tiltCard.addEventListener("mousemove", function (e) {
      if (tiltRaf) return;
      tiltRaf = true;
      window.requestAnimationFrame(function () {
        var rect = tiltCard.getBoundingClientRect();
        var relX = (e.clientX - rect.left) / rect.width;
        var relY = (e.clientY - rect.top) / rect.height;
        var rotateY = ((relX - 0.5) * 6).toFixed(2);
        var rotateX = ((0.5 - relY) * 6).toFixed(2);
        tiltCard.style.setProperty("--tilt-x", rotateX + "deg");
        tiltCard.style.setProperty("--tilt-y", rotateY + "deg");
        tiltCard.style.setProperty("--glow-x", (relX * 100).toFixed(1) + "%");
        tiltCard.style.setProperty("--glow-y", (relY * 100).toFixed(1) + "%");
        tiltRaf = false;
      });
    }, { passive: true });

    tiltCard.addEventListener("mouseleave", function () {
      tiltCard.style.setProperty("--tilt-x", "0deg");
      tiltCard.style.setProperty("--tilt-y", "0deg");
    }, { passive: true });
  }

  // --------------------------------------------------------------------------
  // 5. Vitrina Fotográfica Interactiva en el Hero (#heroShowcase)
  // --------------------------------------------------------------------------
  var heroShowcase = document.querySelector("#heroShowcase");
  var heroSlides = document.querySelectorAll("#heroGalleryStage .hero-showcase-img");
  var heroThumbs = document.querySelectorAll("#heroGalleryThumbs .hero-thumb-btn");
  var heroCurrentIndex = 0;
  var heroTimer = null;
  var heroHovered = false;
  var heroVisible = true;

  function activarHeroSlide(idx) {
    if (heroSlides.length === 0) return;
    heroCurrentIndex = (idx + heroSlides.length) % heroSlides.length;
    for (var i = 0; i < heroSlides.length; i++) {
      heroSlides[i].classList.toggle("active", i === heroCurrentIndex);
    }
    for (var j = 0; j < heroThumbs.length; j++) {
      heroThumbs[j].classList.toggle("active", j === heroCurrentIndex);
    }
  }

  function actualizarHeroAutoPlay() {
    if (heroVisible && !heroHovered && heroSlides.length > 1 && !heroTimer) {
      heroTimer = setInterval(function () {
        activarHeroSlide(heroCurrentIndex + 1);
      }, 4200);
    } else if ((!heroVisible || heroHovered) && heroTimer) {
      clearInterval(heroTimer);
      heroTimer = null;
    }
  }

  for (var t = 0; t < heroThumbs.length; t++) {
    (function (idx) {
      heroThumbs[idx].addEventListener("click", function () {
        activarHeroSlide(idx);
      });
    })(t);
  }

  if (heroShowcase) {
    heroShowcase.addEventListener("mouseenter", function () {
      heroHovered = true;
      actualizarHeroAutoPlay();
    }, { passive: true });

    heroShowcase.addEventListener("mouseleave", function () {
      heroHovered = false;
      actualizarHeroAutoPlay();
    }, { passive: true });
  }

  var heroHeader = document.querySelector("#img-principal");
  if ("IntersectionObserver" in window && heroHeader) {
    var heroVisObserver = new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      actualizarHeroAutoPlay();
    }, { threshold: 0.15 });
    heroVisObserver.observe(heroHeader);
  } else {
    actualizarHeroAutoPlay();
  }

  // --------------------------------------------------------------------------
  // 6. Scrollspy para resaltar la sección activa en el menú de navegación
  // --------------------------------------------------------------------------
  var navLinks = document.querySelectorAll('.navbar .nav-link[href^="#"]');
  if ("IntersectionObserver" in window && navLinks.length > 0) {
    var spyObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          var id = "#" + entries[i].target.id;
          for (var n = 0; n < navLinks.length; n++) {
            navLinks[n].classList.toggle("is-current-section", navLinks[n].getAttribute("href") === id);
          }
        }
      }
    }, { rootMargin: "-35% 0px -55% 0px" });

    for (var s = 0; s < navLinks.length; s++) {
      var targetSec = document.querySelector(navLinks[s].getAttribute("href"));
      if (targetSec) spyObserver.observe(targetSec);
    }
  }
})();
