(function() {
  "use strict";
  const cacheKey = "ieeextreme.public.v2:" + SiteAPI.url;
  const preview = new URLSearchParams(location.search).get("preview") === "1" && window.parent !== window;
  let current = SiteData.fresh();
  let refreshing = false;
  let lastLoadedAt = 0;
  const number = new Intl.NumberFormat("en-US");
  const text = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
  const node = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value != null) element.textContent = value;
    return element;
  };
  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "icons.svg#" + name);
    svg.appendChild(use);
    return svg;
  }
  function hour(value) {
    const [hours, minutes] = value.split(":").map(Number);
    const label = hours < 5 ? "فجراً" : hours < 12 ? "صباحاً" : hours < 17 ? "ظهراً" : "مساءً";
    return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${label}`;
  }
  function render(data) {
    current = SiteData.merge(data);
    window.eventContent = current;
    document.querySelectorAll("[data-content]").forEach(element => {
      element.textContent = current.text[element.dataset.content] || "";
    });
    document.title = current.text.eventName + " غزة | " + current.text.venueHost;
    const stats = current.stats;
    ["registeredTeams", "femaleStudents", "maleStudents", "teamCapacity"].forEach(key => text(key, stats[key] === null ? "—" : number.format(stats[key])));
    const remaining = stats.registeredTeams === null ? null : Math.max(0, stats.teamCapacity - stats.registeredTeams);
    text("remainingTeams", remaining === null ? "—" : number.format(remaining));
    text("formCapacity", stats.teamCapacity);
    text("participantCapacity", stats.teamCapacity * 3);
    const progress = document.getElementById("capacityProgress");
    progress.setAttribute("aria-valuemax", stats.teamCapacity);
    if (stats.registeredTeams !== null) progress.setAttribute("aria-valuenow", stats.registeredTeams);
    else progress.removeAttribute("aria-valuenow");
    document.getElementById("capacityFill").style.width = stats.registeredTeams === null ? "0%" : Math.min(100, stats.registeredTeams / stats.teamCapacity * 100) + "%";
    const stamp = current.updatedAt && new Date(current.updatedAt);
    const published = stats.registeredTeams !== null && stats.femaleStudents !== null && stats.maleStudents !== null;
    text("statsUpdated", preview ? "معاينة أعداد غير منشورة" : !published ? "بانتظار نشر الإحصائيات" : `آخر تحديث: ${stamp && !isNaN(stamp) ? new Intl.DateTimeFormat("ar-PS", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Gaza" }).format(stamp) : "من اللجنة المنظمة"}`);
    text("registrationState", current.registrationOpen ? "طلبات المشاركة مفتوحة" : "طلبات المشاركة مغلقة حالياً");
    const submit = document.getElementById("submitBtn");
    if (submit && !submit.dataset.sending) {
      submit.disabled = !current.registrationOpen || preview;
      submit.textContent = preview ? "التسجيل غير متاح في المعاينة" : current.registrationOpen ? "إرسال طلب التسجيل" : "التسجيل مغلق حالياً";
    }
    const benefits = document.getElementById("benefits");
    benefits.replaceChildren(...current.benefits.map((item, index) => {
      const article = node("article", "benefit");
      article.append(icon(["code-2", "users", "sparkles"][index]), node("h3", null, item.title), node("p", null, item.body));
      return article;
    }));
    const podium = document.getElementById("prizePodium");
    if (podium) podium.replaceChildren(...current.prizes.global.slice(0, 3).map((item, index) => {
      const card = node("article", "prize-card " + ["gold", "silver", "bronze"][index]);
      const heading = node("div", "prize-card-heading");
      heading.append(icon(index === 0 ? "trophy" : "medal"), node("span", "prize-rank", item.rank), node("span", "prize-position", String(index + 1).padStart(2, "0")));
      card.append(heading, node("h3", null, item.title), node("strong", "prize-highlight", item.highlight), node("p", null, item.details));
      return card;
    }));
    const ranges = document.getElementById("prizeRanges");
    if (ranges) ranges.replaceChildren(...current.prizes.global.slice(3).map((item, index) => {
      const article = node("article", "prize-range");
      article.append(icon(index === 2 ? "globe" : "gift"), node("span", "prize-rank", item.rank), node("h3", null, item.title), node("strong", null, item.highlight), node("p", null, item.details));
      return article;
    }));
    const local = document.getElementById("localPrizes");
    if (local) local.replaceChildren(...current.prizes.local.map((item, index) => {
      const article = node("article", "local-prize");
      article.append(icon(index === 0 ? "banknote" : "graduation-cap"));
      const body = node("div");
      body.append(node("h3", null, item.title), node("strong", null, item.highlight), node("p", null, item.details));
      article.append(body); return article;
    }));
    const timeline = document.getElementById("timeline");
    const groups = new Map();
    current.timeline.forEach(item => {
      if (!groups.has(item.date)) groups.set(item.date, []);
      groups.get(item.date).push(item);
    });
    timeline.replaceChildren(...Array.from(groups, ([date, items], index) => {
      const group = node("section", "timeline-day");
      const heading = node("div", "day-heading");
      const parsedDate = new Date(date + "T12:00:00Z");
      const label = isNaN(parsedDate) ? "تاريخ الفعالية غير مكتمل" : new Intl.DateTimeFormat("ar-PS", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(parsedDate);
      heading.append(node("span", "day-number", String(index + 1).padStart(2, "0")), node("h3", null, label));
      const events = node("ol", "day-events");
      items.forEach(item => {
        const event = node("li", "timeline-event " + item.kind);
        const time = node("time", "event-time", hour(item.time) + (item.endTime ? " – " + hour(item.endTime) : ""));
        time.dateTime = date + "T" + item.time;
        const body = node("div", "event-body");
        if (item.kind !== "event") body.append(node("span", "event-label", item.kind === "start" ? "الانطلاق العالمي" : "اكتمال 24 ساعة"));
        body.append(node("h4", null, item.title), node("p", null, item.description));
        event.append(time, body);
        events.appendChild(event);
      });
      group.append(heading, events);
      return group;
    }));
    const faqs = document.getElementById("faqList");
    const openQuestions = new Set(Array.from(faqs.querySelectorAll("details[open] summary"), element => element.textContent));
    faqs.replaceChildren(...current.faqs.map(item => {
      const details = node("details");
      const summary = node("summary", null, item.question);
      summary.append(icon("plus"));
      details.append(summary, node("p", null, item.answer));
      details.open = openQuestions.has(item.question);
      return details;
    }));
  }
  async function refresh(force = false) {
    if (preview || refreshing || document.hidden || !SiteAPI.ready() || navigator.onLine === false || (!force && Date.now() - lastLoadedAt < 60000)) return;
    refreshing = true;
    try {
      const response = await SiteAPI.jsonp("public", {}, 8000);
      if (!response.ok || !Object.prototype.hasOwnProperty.call(response, "config")) throw new Error("update-service-required");
      lastLoadedAt = Date.now();
      if (response.config) {
        render(response.config);
        try { localStorage.setItem(cacheKey, JSON.stringify(response.config)); } catch (_) { /* Content still works when browser storage is unavailable. */ }
      }
    } catch (_) {
      if (current.updatedAt) text("statsUpdated", "آخر أعداد محفوظة · تعذر تحديثها الآن");
    } finally { refreshing = false; }
  }
  try { current = SiteData.merge(JSON.parse(localStorage.getItem(cacheKey))); } catch (_) { /* Use the bundled content on first visit. */ }
  render(current);
  if (preview) {
    document.getElementById("previewBanner").hidden = false;
    window.addEventListener("message", event => {
      if (event.source === window.parent && event.origin === location.origin && event.data?.type === "ieeextreme-preview") render(event.data.config);
    });
    window.parent.postMessage({ type: "ieeextreme-preview-ready" }, location.origin === "null" ? "*" : location.origin);
  } else {
    refresh(true);
    setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
    window.addEventListener("online", () => refresh(true));
  }
  window.refreshEventContent = () => refresh(true);
})();
