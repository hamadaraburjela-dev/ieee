(function() {
  "use strict";
  const url = window.APP_SETTINGS?.serviceUrl || "";
  const ready = () => /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url);
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const requestId = () => {
    if (!window.crypto?.getRandomValues) throw new Error("secure-browser-required");
    const bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
  };

  function jsonp(action, params = {}, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      if (!ready()) return reject(new Error("service-not-ready"));
      const name = "__site_" + requestId();
      const endpoint = new URL(url);
      endpoint.searchParams.set("action", action);
      endpoint.searchParams.set("callback", name);
      endpoint.searchParams.set("_", String(Date.now()));
      Object.entries(params).forEach(([key, value]) => endpoint.searchParams.set(key, value ?? ""));
      const script = document.createElement("script");
      let settled = false;
      const finish = (error, result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.remove();
        window[name] = () => {};
        setTimeout(() => delete window[name], 30000);
        if (error) reject(error); else resolve(result || {});
      };
      const timer = setTimeout(() => finish(new Error("connection-timeout")), timeoutMs);
      window[name] = result => finish(null, result);
      script.onerror = () => finish(new Error("connection-error"));
      script.referrerPolicy = "no-referrer";
      script.src = endpoint.href;
      document.head.appendChild(script);
    });
  }

  async function post(action, payload, timeoutMs = 8000) {
    if (!ready()) throw new Error("service-not-ready");
    const body = new URLSearchParams({ action });
    Object.entries(payload).forEach(([key, value]) => body.set(key, value ?? ""));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      await fetch(url, { method: "POST", mode: "no-cors", body, signal: controller.signal, referrerPolicy: "no-referrer" });
    } finally { clearTimeout(timer); }
  }

  async function adminRequest(action, payload) {
    const id = requestId();
    // A private, random result key lets us confirm POSTs without exposing credentials in a URL.
    const params = { ...payload, requestId: id };
    try { await post(action, params); } catch (_) { /* A timed-out POST may still have reached Apps Script. */ }
    for (let attempt = 0; attempt < 3; attempt++) {
      await pause(attempt ? 1800 : 700);
      try {
        const response = await jsonp("adminResult", { requestId: id }, 10000);
        if (response.pending) continue;
        if (!response.ok) {
          const error = new Error(response.error || "server-error");
          error.details = response.details;
          throw error;
        }
        return response;
      } catch (error) {
        if (!["connection-error", "connection-timeout"].includes(error.message) || attempt === 2) throw error;
      }
    }
    throw new Error("result-timeout");
  }
  window.SiteAPI = { url, ready, jsonp, post, adminRequest };
})();
