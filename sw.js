// ============================================================
// BUDGET COACH — SERVICE WORKER v2
// MS Consulting Patrimoine
// ============================================================

var CACHE_NAME = "budget-coach-v2";

// ── INSTALLATION ──────────────────────────────────────────
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log("Budget Coach SW v2 — Cache ouvert");
      return cache.addAll(["/", "/index.html", "/manifest.json"]).catch(function(err) {
        console.log("Cache partiel :", err);
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATION ────────────────────────────────────────────
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) {
            console.log("Budget Coach SW — Suppression ancien cache :", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ── FETCH — Stratégie Network First avec fallback cache ───
self.addEventListener("fetch", function(event) {
  var url = event.request.url;

  // Ignorer toutes les requêtes non GET
  if (event.request.method !== "GET") return;

  // Ignorer toutes les APIs et services externes
  if (url.includes("script.google.com"))      return;
  if (url.includes("googleusercontent.com"))  return;
  if (url.includes("googleapis.com"))          return;
  if (url.includes("api.stripe.com"))          return;
  if (url.includes("api.brevo.com"))           return;
  if (url.includes("buy.stripe.com"))          return;
  if (url.includes("fonts.googleapis.com"))    return;
  if (url.includes("fonts.gstatic.com"))       return;
  if (url.includes("cdn.jsdelivr.net"))        return;
  if (url.includes("cdnjs.cloudflare.com"))    return;

  // Pour les ressources locales uniquement
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (response && response.status === 200 && response.type === "basic") {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          return caches.match("/index.html");
        });
      })
  );
});

// ── MESSAGE ────────────────────────────────────────────────
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
