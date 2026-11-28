/* Page behaviours shared by every page: reveal, filters, case modals, lightbox, estimator, lead form and booking. */
  (function () {
    "use strict";
    var d = document, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }

    /* Scroll lock only while a dialog is open: clear any leftover lock on load and on every close */
    var unlock = function () {
      if ($$("dialog[open]").length) return;
      d.documentElement.classList.remove("x-lock");
      d.documentElement.style.overflow = ""; d.body.style.overflow = "";
      d.body.style.position = ""; d.body.style.top = ""; d.body.style.touchAction = "";
    };
    $$("dialog").forEach(function (dl) {
      dl.addEventListener("close", function () { setTimeout(unlock, 0); });
    });
    unlock();
    window.addEventListener("pageshow", unlock);

    /* Subtle fade-up on scroll */
    var reveals = $$(".x-reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
      }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
      reveals.forEach(function (el) { io.observe(el); });
    }

    /* Case filters, counts computed from the cards */
    var cards = $$("#projects .x-case"), cats = $$(".x-filter"), empty = d.getElementById("empty");
    function inCat(card, c) { return c === "all" || (card.dataset.cats || "").split(" ").indexOf(c) > -1; }
    cats.forEach(function (b) {
      var c = b.dataset.filter, n = cards.filter(function (k) { return inCat(k, c); }).length;
      var lab = b.querySelector(".x-filter__n");
      if (lab) lab.textContent = n;
      b.addEventListener("click", function () {
        cats.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        var shown = 0;
        cards.forEach(function (k) { var on = inCat(k, c); k.hidden = !on; if (on) { shown++; k.classList.add("is-in"); } });
        if (empty) empty.hidden = shown > 0;
      });
    });

    /* Estimator: spend / CPC = clicks; × conversion rate = leads; × close rate = customers; × value = revenue */
    var est = d.getElementById("est");
    if (est) {
      var $id = function (i) { return d.getElementById(i); };
      var spend = $id("est-spend"), aov = $id("est-aov"), cpc = $id("est-cpc"), cr = $id("est-cr"), close = $id("est-close");
      var money = function (v) { return "$" + Math.round(v).toLocaleString("en-US"); };
      var num = function (el, def) { var v = parseFloat(el.value); return isFinite(v) && v >= 0 ? v : def; };
      var fill = function (r) { r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min) * 100) + "%"); };
      var calc = function () {
        var s = +spend.value, o = +aov.value, c = num(cpc, 2), rate = num(cr, 6) / 100, cl = num(close, 25) / 100;
        var clicks = c > 0 ? s / c : 0, leads = clicks * rate, cust = leads * cl, rev = cust * o, roas = s > 0 ? rev / s : 0;
        $id("est-spend-out").textContent = money(s); spend.setAttribute("aria-valuetext", money(s));
        $id("est-aov-out").textContent = money(o); aov.setAttribute("aria-valuetext", money(o));
        $id("est-clicks").textContent = Math.round(clicks).toLocaleString("en-US");
        $id("est-leads").textContent = Math.round(leads).toLocaleString("en-US");
        $id("est-cust").textContent = Math.round(cust).toLocaleString("en-US");
        $id("est-rev").textContent = money(rev);
        $id("est-roas").textContent = (roas < 10 ? roas.toFixed(1) : Math.round(roas).toLocaleString("en-US")) + "x";
        fill(spend); fill(aov);
      };
      [spend, aov, cpc, cr, close].forEach(function (el) { el.addEventListener("input", calc); });
      calc();
    }

    /* Sticky nav: a hairline once the page scrolls */
    var nav = d.getElementById("nav");

    /* Project detail dialogs */
    $$("[data-open]").forEach(function (k) {
      k.addEventListener("click", function () {
        var dlg = d.getElementById(k.dataset.open);
        if (!dlg) return;
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
        dlg.querySelector(".x-modal__body").scrollTop = 0;
      });
    });
    $$(".x-modal").forEach(function (dlg) {
      var close = function () { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); };
      $$("[data-close]", dlg).forEach(function (b) { b.addEventListener("click", close); });
      dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
    });

    /* Lightbox: any proof screenshot, full size, then actual pixels on a tap */
    var lb = d.getElementById("lightbox");
    if (lb) {
    var lbImg = d.getElementById("lightbox-img"), lbCap = d.getElementById("lightbox-cap");
    var lbClose = function () { lb.classList.remove("is-actual"); if (lb.close) lb.close(); else lb.removeAttribute("open"); };
    $$(".x-shot > button.x-win").forEach(function (b) {
      b.addEventListener("click", function () {
        var img = b.querySelector("img"), cap = b.parentNode.querySelector("figcaption");
        if (!img) return;
        lbImg.removeAttribute("width"); lbImg.removeAttribute("height");
        lbImg.src = img.currentSrc || img.getAttribute("src");
        lbImg.alt = img.alt;
        lbCap.textContent = cap ? cap.textContent : "";
        lb.classList.remove("is-actual");
        if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
      });
    });
    lbImg.addEventListener("click", function () { lb.classList.toggle("is-actual"); });
    $$("[data-lb-close]", lb).forEach(function (b) { b.addEventListener("click", lbClose); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("x-lightbox__stage")) lbClose(); });
    lb.addEventListener("close", function () { lb.classList.remove("is-actual"); });
    }

    /* Nav: a hairline once the page scrolls (the current page is marked in the HTML) */
    var spy = function () { if (nav) nav.classList.toggle("is-stuck", window.scrollY > 8); };
    var tick = false;
    window.addEventListener("scroll", function () { if (tick) return; tick = true; requestAnimationFrame(function () { spy(); tick = false; }); }, { passive: true });
    spy();

    /* Lead CTAs: smooth scroll to the form, then focus its heading */
    var leadBox = d.getElementById("lead-form"), leadH = d.getElementById("lead-h");
    $$('a[href="#lead-form"]').forEach(function (a) {
      if (a.id === "lead-email") return;
      a.addEventListener("click", function (e) {
        if (!leadBox) return;
        e.preventDefault();
        leadBox.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        if (history.replaceState) history.replaceState(null, "", "#lead-form");
        setTimeout(function () { if (leadH) leadH.focus({ preventScroll: true }); }, reduce ? 0 : 450);
      });
    });

    /* Sticky mobile bar: tucks away while the form is on screen */
    var mbar = d.getElementById("mbar");
    if (mbar && leadBox && "IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { mbar.classList.toggle("is-hidden", en[0].isIntersecting); }, { threshold: 0.05 }).observe(leadBox);
    }

    /* Lead form: validate, then prefill WhatsApp or email (static page, nothing is posted) */
    var form = d.getElementById("lead");
    if (form) {
      var WA = "8801315551508", EMAIL = "nomad.nahid001@gmail.com";
      var thanks = d.getElementById("lead-thanks"), thanksMsg = d.getElementById("lead-thanks-msg");
      var waAgain = d.getElementById("lead-wa-again"), mailLink = d.getElementById("lead-email");
      var f = function (n) { return form.elements[n]; };
      var val = function (n) { return (f(n).value || "").trim(); };
      var rules = {
        name: function (v) { return v ? "" : "Please enter your name."; },
        email: function (v) { return !v ? "Please enter your email." : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Please enter a valid email, like name@business.com."); },
        need: function (v) { return v ? "" : "Please choose what you need."; }
      };
      var tried = false;
      var check = function (n) {
        var msg = rules[n](val(n)), el = f(n);
        d.getElementById("lf-" + n + "-err").textContent = msg;
        if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
        return !msg;
      };
      var validate = function () {
        tried = true;
        var first = null;
        Object.keys(rules).forEach(function (n) { if (!check(n) && !first) first = f(n); });
        if (first) first.focus();
        return !first;
      };
      Object.keys(rules).forEach(function (n) {
        var ev = f(n).tagName === "SELECT" ? "change" : "input";
        f(n).addEventListener(ev, function () { if (tried || f(n).getAttribute("aria-invalid")) check(n); });
        f(n).addEventListener("blur", function () { if (tried) check(n); });
      });
      var message = function () {
        var lines = ["Hi Nahid, I'd like a free Google Ads plan.", ""];
        var add = function (label, n) { var v = val(n); if (v) lines.push(label + ": " + v); };
        add("Name", "name"); add("Email", "email"); add("WhatsApp / phone", "phone"); add("Website", "website");
        add("What I need", "need"); add("Monthly ad budget", "budget");
        var about = val("about");
        if (about) { lines.push("", "About my business:", about); }
        return lines.join("\n");
      };
      var waUrl = function () { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(message()); };
      var mailUrl = function () { return "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Free Google Ads plan request") + "&body=" + encodeURIComponent(message()); };
      var done = function (text) {
        waAgain.href = waUrl();
        thanksMsg.textContent = text;
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus({ preventScroll: true });
        thanks.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
      };
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validate()) return;
        var url = waUrl(), win = window.open(url, "_blank");
        if (win) { try { win.opener = null; } catch (err) {} }
        done("Thanks! WhatsApp is opening with your details. I'll reply soon.");
        if (!win) setTimeout(function () { window.location.href = url; }, 600);
      });
      mailLink.addEventListener("click", function (e) {
        if (!validate()) { e.preventDefault(); return; }
        mailLink.href = mailUrl();
        setTimeout(function () { done("Thanks! Your email app is opening with your details. I'll reply soon."); }, 0);
      });
      d.getElementById("lead-edit").addEventListener("click", function () {
        thanks.hidden = true;
        form.hidden = false;
        f("name").focus();
      });
    }

    /* Book a 30-minute call: modal form, Dhaka time helper, then WhatsApp or email */
    var book = d.getElementById("book"), bform = d.getElementById("book-form");
    if (book && bform) {
      var BWA = "8801315551508", BMAIL = "nomad.nahid001@gmail.com";
      var bThanks = d.getElementById("book-thanks"), bMail = d.getElementById("book-email"), bWaAgain = d.getElementById("book-wa-again");
      var bDhaka = d.getElementById("bk-dhaka"), tzSel = d.getElementById("bk-tz"), opener = null;
      var bf = function (n) { return bform.elements[n]; };
      var bval = function (n) { return (bf(n).value || "").trim(); };
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };

      /* Time zone: preselect the visitor's own, adding it if it is not listed */
      var detected = "";
      try { detected = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (err) {}
      if (detected) {
        var has = [].some.call(tzSel.options, function (o) { return o.value === detected; });
        if (!has) { var o = d.createElement("option"); o.value = detected; o.textContent = detected.replace(/_/g, " ").replace(/\//g, " / "); tzSel.insertBefore(o, tzSel.options[1]); }
        tzSel.value = detected;
      }

      var todayStr = function () { var t = new Date(); return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate()); };
      var offsetAt = function (ts, tz) {
        var p = {};
        new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
          .formatToParts(new Date(ts)).forEach(function (x) { p[x.type] = x.value; });
        return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ts;
      };
      /* The chosen wall-clock date and time in the chosen zone, as a UTC timestamp */
      var chosenUtc = function () {
        var dv = bval("date"), tv = bval("time"), tz = bval("tz");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dv) || !/^\d{2}:\d{2}/.test(tv) || !tz) return null;
        var a = dv.split("-"), b = tv.split(":");
        var guess = Date.UTC(+a[0], +a[1] - 1, +a[2], +b[0], +b[1]);
        try {
          var ts = guess - offsetAt(guess, tz);
          return guess - offsetAt(ts, tz);
        } catch (err) { return null; }
      };
      var fmt = function (ts, tz) {
        return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(ts));
      };
      var dhakaText = function () { var u = chosenUtc(); return u === null ? "" : fmt(u, "Asia/Dhaka"); };
      var updateDhaka = function () { var t = dhakaText(); bDhaka.textContent = t ? "That's " + t + " in Dhaka (GMT+6)." : ""; };
      ["date", "time", "tz"].forEach(function (n) { bf(n).addEventListener("input", updateDhaka); bf(n).addEventListener("change", updateDhaka); });

      var brules = {
        name: function (v) { return v ? "" : "Please enter your name."; },
        email: function (v) { return !v ? "Please enter your email." : (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Please enter a valid email, like name@business.com."); },
        date: function (v) { return !v ? "Please choose a date." : (v < todayStr() ? "Please choose today or a later date." : ""); },
        time: function (v) { return v ? "" : "Please choose a time."; },
        tz: function (v) { return v ? "" : "Please choose your time zone."; }
      };
      var btried = false;
      var bcheck = function (n) {
        var msg = brules[n](bval(n)), el = bf(n);
        d.getElementById("bk-" + n + "-err").textContent = msg;
        if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
        return !msg;
      };
      var bvalidate = function () {
        btried = true;
        var first = null;
        Object.keys(brules).forEach(function (n) { if (!bcheck(n) && !first) first = bf(n); });
        if (first) first.focus();
        return !first;
      };
      Object.keys(brules).forEach(function (n) {
        var ev = bf(n).tagName === "SELECT" ? "change" : "input";
        bf(n).addEventListener(ev, function () { if (btried || bf(n).getAttribute("aria-invalid")) bcheck(n); });
        bf(n).addEventListener("change", function () { if (btried) bcheck(n); });
      });

      var bmessage = function () {
        var lines = ["Hi Nahid, I'd like to book a 30-minute call.", ""];
        var add = function (label, v) { if (v) lines.push(label + ": " + v); };
        var u = chosenUtc(), tz = bval("tz");
        add("Name", bval("name")); add("Email", bval("email")); add("WhatsApp / phone", bval("phone")); add("Website", bval("website"));
        add("Preferred date", bval("date")); add("Preferred time", bval("time"));
        add("My time zone", tz);
        if (u !== null) { add("My time", fmt(u, tz)); add("Dhaka time", fmt(u, "Asia/Dhaka") + " (GMT+6)"); }
        add("Call via", bval("via"));
        var topic = bval("topic");
        if (topic) lines.push("", "What I'd like to discuss:", topic);
        return lines.join("\n");
      };
      var bWaUrl = function () { return "https://wa.me/" + BWA + "?text=" + encodeURIComponent(bmessage()); };
      var bMailUrl = function () { return "mailto:" + BMAIL + "?subject=" + encodeURIComponent("30-minute call request") + "&body=" + encodeURIComponent(bmessage()); };
      var bShowForm = function () { bThanks.hidden = true; bform.hidden = false; };
      var bDone = function () {
        bWaAgain.href = bWaUrl();
        bform.hidden = true;
        bThanks.hidden = false;
        book.querySelector(".x-modal__body").scrollTop = 0;
        bThanks.focus({ preventScroll: true });
      };

      var focusables = function () {
        return $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', book)
          .filter(function (el) { return el.offsetParent !== null || el.getClientRects().length; });
      };
      var openBook = function (trigger) {
        opener = trigger || d.activeElement;
        bShowForm();
        bf("date").min = todayStr();
        updateDhaka();
        if (book.showModal) { if (!book.open) book.showModal(); } else book.setAttribute("open", "");
        d.documentElement.classList.add("x-lock");
        book.querySelector(".x-modal__body").scrollTop = 0;
        setTimeout(function () { bf("name").focus(); }, 30);
      };
      var closeBook = function () { if (book.close && book.open) book.close(); else { book.removeAttribute("open"); onClosed(); } };
      var onClosed = function () {
        d.documentElement.classList.remove("x-lock");
        if (opener && opener.focus) opener.focus({ preventScroll: true });
      };
      book.addEventListener("close", onClosed);
      book.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.preventDefault(); closeBook(); return; }
        if (e.key !== "Tab") return;
        var list = focusables();
        if (!list.length) return;
        var first = list[0], last = list[list.length - 1];
        if (e.shiftKey && (d.activeElement === first || !book.contains(d.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (d.activeElement === last || !book.contains(d.activeElement))) { e.preventDefault(); first.focus(); }
      });
      $$("[data-book]").forEach(function (b) {
        b.addEventListener("click", function (e) { e.preventDefault(); openBook(b); });
      });

      bform.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!bvalidate()) return;
        var url = bWaUrl(), win = window.open(url, "_blank");
        if (win) { try { win.opener = null; } catch (err) {} }
        bDone();
        if (!win) setTimeout(function () { window.location.href = url; }, 600);
      });
      bMail.addEventListener("click", function (e) {
        if (!bvalidate()) { e.preventDefault(); return; }
        bMail.href = bMailUrl();
        setTimeout(bDone, 0);
      });
      d.getElementById("book-edit").addEventListener("click", function () { bShowForm(); bf("name").focus(); });
      if (location.hash === "#book") openBook(null);
    }
    /* Deep links: /case-studies/#p-xxx opens that case study */
    var hash = location.hash.slice(1);
    if (hash && hash !== "book" && /^[a-z0-9-]+$/i.test(hash)) {
      var dl = d.getElementById(hash);
      if (dl && dl.tagName === "DIALOG" && dl.classList.contains("x-modal")) {
        if (dl.showModal) dl.showModal(); else dl.setAttribute("open", "");
        var body = dl.querySelector(".x-modal__body"); if (body) body.scrollTop = 0;
      }
    }
  })();

  (function () {
    var n = document.querySelector(".x-nav__links");
    if (!n) return;
    function u() {
      var max = n.scrollWidth - n.clientWidth;
      n.classList.toggle("is-ovf", max > 2);
      n.classList.toggle("is-start", n.scrollLeft <= 2);
      n.classList.toggle("is-end", n.scrollLeft >= max - 2);
    }
    n.addEventListener("scroll", u, { passive: true });
    window.addEventListener("resize", u);
    window.addEventListener("load", u);
    u();
    var _cur = n.querySelector('[aria-current="page"]');
    if (_cur && n.scrollWidth > n.clientWidth) n.scrollLeft = Math.max(0, _cur.offsetLeft - 24);
    /* Keep the highlighted section's link in view on narrow screens */
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        var a = m.target;
        if ((a.getAttribute("aria-current") !== "true" && a.getAttribute("aria-current") !== "page") || n.scrollWidth <= n.clientWidth) return;
        var nr = n.getBoundingClientRect(), ar = a.getBoundingClientRect();
        if (ar.left < nr.left + 24 || ar.right > nr.right - 24) n.scrollBy({ left: ar.left - nr.left - 24, behavior: "smooth" });
      });
    }).observe(n, { attributes: true, subtree: true, attributeFilter: ["aria-current"] });
  })();

  /* Auto-scrolling strips: run continuously, follow drags, never pause */
  (function () {
    var slow = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function strip(view, track, seconds) {
      if (!view || !track) return;
      var first = track.querySelector("li"), dup = track.querySelector(".x-dup");
      if (!first || !dup) return;
      view.classList.add("x-strip-js");
      var period = 0, pos = 0, last = 0, drag = null;
      function measure() { period = dup.offsetLeft - first.offsetLeft; }
      function wrap() { if (period > 0) { pos = pos % period; if (pos > 0) pos -= period; } }
      function frame(t) {
        var dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
        last = t;
        if (!period) measure();
        if (!drag || !drag.active) pos -= (period / seconds) * (slow ? 0.25 : 1) * dt;
        wrap();
        track.style.transform = "translate3d(" + pos.toFixed(2) + "px,0,0)";
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      window.addEventListener("resize", measure);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
      window.addEventListener("load", measure);

      view.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, start: pos, active: false };
      });
      view.addEventListener("pointermove", function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.active) {
          if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
          if (Math.abs(dx) < 6) return;
          drag.active = true; drag.x = e.clientX; drag.start = pos; dx = 0;
          view.classList.add("is-dragging");
          try { view.setPointerCapture(e.pointerId); } catch (err) {}
        }
        if (e.cancelable) e.preventDefault();
        pos = drag.start + dx;
        wrap();
        if (pos !== drag.start + dx) { drag.start = pos - dx; }
      });
      function end(e) {
        if (!drag || (e && e.pointerId !== drag.id)) return;
        drag = null;
        view.classList.remove("is-dragging");
        last = 0;
      }
      view.addEventListener("pointerup", end);
      view.addEventListener("pointercancel", end);
      view.addEventListener("lostpointercapture", end);
      view.addEventListener("dragstart", function (e) { e.preventDefault(); });
    }
    strip(document.querySelector(".x-marquee"), document.querySelector(".x-marquee__track"), 48);
    strip(document.querySelector(".x-logos__view"), document.querySelector(".x-logos__track"), 60);
  })();

  (function () {
    var track = document.getElementById("rv-track");
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    var prev = document.getElementById("rv-prev"), next = document.getElementById("rv-next"), dotsBox = document.getElementById("rv-dots");
    var dots = [], raf = 0;
    function step() {
      if (slides.length < 2) return track.clientWidth || 1;
      return (slides[1].offsetLeft - slides[0].offsetLeft) || 1;
    }
    function maxScroll() { return Math.max(0, track.scrollWidth - track.clientWidth); }
    function stops() { return Math.max(1, Math.min(slides.length, Math.ceil(maxScroll() / step() - 0.05) + 1)); }
    function current() {
      if (track.scrollLeft >= maxScroll() - 4) return stops() - 1;
      return Math.min(stops() - 1, Math.max(0, Math.round(track.scrollLeft / step())));
    }
    function go(i) {
      i = Math.max(0, Math.min(stops() - 1, i));
      track.scrollTo({ left: Math.min(maxScroll(), slides[i].offsetLeft - slides[0].offsetLeft), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    var narrowMq = window.matchMedia("(max-width: 599px)"), dotMode = "";
    function buildDots() {
      var n = stops(), mode = narrowMq.matches ? "span" : "button";
      if (dots.length === n && dotMode === mode) return;
      dotMode = mode;
      dotsBox.innerHTML = "";
      dots = [];
      if (mode === "span") { dotsBox.removeAttribute("role"); dotsBox.setAttribute("aria-hidden", "true"); }
      else { dotsBox.setAttribute("role", "group"); dotsBox.removeAttribute("aria-hidden"); }
      for (var i = 0; i < n; i++) {
        var b = document.createElement(mode);
        b.className = "x-rv__dot";
        if (mode === "button") {
          b.type = "button";
          b.setAttribute("aria-label", "Go to review " + (i + 1) + " of " + n);
          b.setAttribute("aria-controls", "rv-track");
          (function (k) { b.addEventListener("click", function () { go(k); }); })(i);
        }
        dotsBox.appendChild(b);
        dots.push(b);
      }
    }
    function update() {
      raf = 0;
      var c = current();
      dots.forEach(function (d, i) { d.setAttribute("aria-current", i === c ? "true" : "false"); });
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= maxScroll() - 4;
    }
    function queue() { if (!raf) raf = requestAnimationFrame(update); }
    prev.addEventListener("click", function () { go(current() - 1); });
    next.addEventListener("click", function () { go(current() + 1); });
    track.addEventListener("scroll", queue, { passive: true });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
    });
    window.addEventListener("resize", function () { buildDots(); queue(); });
    buildDots();
    update();
  })();
