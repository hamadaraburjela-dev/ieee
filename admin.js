(function() {
  "use strict";
  const $ = id => document.getElementById(id);
  const sessionKey = "ieeextreme.admin.session:" + SiteAPI.url;
  const draftKey = "ieeextreme.admin.draft:" + SiteAPI.url;
  let token = "";
  let config = SiteData.fresh();
  let dirty = false;
  let busy = false;
  let previewOnly = false;
  let contentSchema = 0;
  const groups = [
    ["واجهة الموقع", [["eventName", "اسم المسابقة"], ["heroTagline", "العبارة الرئيسية"], ["heroDescription", "مقدمة المشاركة", true], ["eventDateLabel", "نص تاريخ اللقاء"]]],
    ["التعريف العالمي", [["globalTitle", "العنوان"], ["globalBody", "التعريف بالمسابقة", true], ["globalExtra", "تفاصيل الفرق والتحدّي", true]]],
    ["غزة والمشاركة", [["gazaTitle", "العنوان"], ["gazaBody", "الدعوة للمشاركة", true], ["gazaExtra", "رسالة للطلبة الجدد", true]]],
    ["الاستضافة المحلية", [["localTitle", "العنوان"], ["localBody", "التعريف بالتجربة المحلية", true]]],
    ["الفرع الطلابي", [["branchTitle", "اسم الفرع"], ["branchBody", "التعريف بالفرع", true]]],
    ["التسجيل", [["registrationTitle", "العنوان"], ["registrationBody", "مقدمة التسجيل", true], ["registrationNote", "شروط التسجيل المحلي", true]]]
  ];
  const venueLabels = [["venueHost", "المستضيف"], ["venueBuilding", "المبنى"], ["competitionRoom", "قاعة المسابقة"], ["femaleRestRoom", "قاعة راحة الطالبات"], ["venueNote", "ترتيبات المكان", true]];
  function storageGet(key) { try { return sessionStorage.getItem(key); } catch (_) { return null; } }
  function storageSet(key, value) { try { sessionStorage.setItem(key, value); } catch (_) { /* Editing remains possible without browser storage. */ } }
  function storageRemove(key) { try { sessionStorage.removeItem(key); } catch (_) { /* Ignore blocked storage. */ } }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon"); svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "icons.svg#" + name); svg.append(use); return svg;
  }
  function field(label, path, value, multiline = false, type = "text") {
    const wrapper = element("label", multiline ? "wide" : null, label);
    const control = element(multiline ? "textarea" : "input");
    if (!multiline) control.type = type;
    else control.rows = 3;
    control.name = path;
    control.dataset.path = path;
    control.value = value ?? "";
    if (["text", "textarea"].includes(multiline ? "textarea" : type)) control.maxLength = 3000;
    if (path.startsWith("prizes.")) control.maxLength = multiline ? 1500 : 180;
    control.required = !path.endsWith("endTime");
    wrapper.append(control); return wrapper;
  }
  function action(name, title, handler, disabled = false) {
    const button = element("button", "icon-button" + (name === "trash-2" ? " delete" : ""));
    button.type = "button"; button.title = title; button.setAttribute("aria-label", title); button.disabled = disabled;
    button.append(icon(name)); button.addEventListener("click", handler); return button;
  }
  function message(id, content, type = "") { $(id).textContent = content; $(id).className = "admin-message " + type; }
  function describeError(error) {
    return ({
      "invalid_credentials": "كلمة المرور غير صحيحة.",
      "admin_not_configured": "دخول الإدارة غير مفعّل بعد. اضبط كلمة المرور في إعدادات خدمة الموقع.",
      "weak_admin_password": "كلمة مرور الإدارة في الخدمة يجب أن تكون 12 حرفاً على الأقل.",
      "unauthorized": "انتهت جلسة الإدارة. سجّل الدخول مجدداً؛ مسودتك محفوظة في هذا المتصفح.",
      "too_many_attempts": "محاولات دخول كثيرة. انتظر دقيقة ثم حاول مجدداً.",
      "revision_conflict": "تم نشر نسخة أحدث من جلسة أخرى. مسودتك محفوظة؛ حمّل النسخة المنشورة وراجع الاختلافات قبل النشر.",
      "invalid_config": "راجع بيانات المحتوى والجدول والأعداد قبل النشر.",
      "unknown_action": "خدمة الموقع تحتاج تحديث ملف Code.gs وإعادة نشره لتفعيل الإدارة.",
      "service-not-ready": "رابط خدمة الموقع غير مضبوط.",
      "secure-browser-required": "افتح الإدارة عبر HTTPS أو الرابط المحلي لتمكين الدخول الآمن."
    })[error.message] || "تعذر تأكيد الاتصال أو النشر. بقيت مسودتك؛ جرّب تحميل النسخة المنشورة للتحقق قبل إعادة النشر.";
  }
  function setBusy(value) {
    busy = value; $("editorForm").inert = value;
    ["saveBtn", "refreshBtn", "logoutBtn"].forEach(id => $(id).disabled = value || (id !== "logoutBtn" && previewOnly));
    if (contentSchema < 2) $("saveBtn").disabled = true;
    $("saveBtn").querySelector("span").textContent = value ? "جارٍ المعالجة..." : "نشر التعديلات";
  }
  function updateTotals() {
    const s = config.stats;
    $("adminRemaining").textContent = s.registeredTeams === null ? "—" : Math.max(0, s.teamCapacity - s.registeredTeams);
    $("adminStudents").textContent = s.femaleStudents === null || s.maleStudents === null ? "—" : s.femaleStudents + s.maleStudents;
  }
  function changed() {
    dirty = true;
    storageSet(draftKey, JSON.stringify(config));
    $("editorState").textContent = previewOnly ? "مسودة محلية · سجّل الدخول للنشر" : "تعديلات لم تُنشر بعد";
    updateTotals(); sendPreview();
  }
  function repeatedHeading(title, key, index, length) {
    const header = element("div", "repeated-heading");
    header.append(element("h3", null, title));
    const controls = element("div", "row-actions");
    const move = offset => {
      [config[key][index], config[key][index + offset]] = [config[key][index + offset], config[key][index]];
      changed(); renderArrays();
    };
    controls.append(action("arrow-up", "نقل للأعلى", () => move(-1), index === 0), action("arrow-down", "نقل للأسفل", () => move(1), index === length - 1), action("trash-2", "حذف", () => {
      config[key].splice(index, 1); changed(); renderArrays();
    }, length === 1));
    header.append(controls); return header;
  }
  function renderArrays() {
    ["global", "local"].forEach(key => {
      $(key + "PrizeFields").replaceChildren(...config.prizes[key].map((item, index) => {
        const section = element("div", "repeated-editor");
        section.append(element("h3", null, key === "global" ? "الجائزة العالمية " + (index + 1) : index === 0 ? "الجوائز المالية المحلية" : "المنح الدراسية"));
        if (key === "global") section.append(field("الترتيب", `prizes.${key}.${index}.rank`, item.rank));
        section.append(field("عنوان الجائزة", `prizes.${key}.${index}.title`, item.title), field("القيمة أو العبارة البارزة", `prizes.${key}.${index}.highlight`, item.highlight), field("التفاصيل والشروط", `prizes.${key}.${index}.details`, item.details, true));
        return section;
      }));
    });
    $("benefitFields").replaceChildren(...config.benefits.map((item, index) => {
      const section = element("div", "repeated-editor");
      section.append(element("h3", null, "الميزة " + (index + 1)), field("العنوان", `benefits.${index}.title`, item.title), field("الوصف", `benefits.${index}.body`, item.body, true));
      return section;
    }));
    $("faqFields").replaceChildren(...config.faqs.map((item, index) => {
      const section = element("div", "repeated-editor");
      section.append(repeatedHeading("السؤال " + (index + 1), "faqs", index, config.faqs.length), field("السؤال", `faqs.${index}.question`, item.question), field("الإجابة", `faqs.${index}.answer`, item.answer, true));
      return section;
    }));
    $("timelineFields").replaceChildren(...config.timeline.map((item, index) => {
      const section = element("div", "repeated-editor");
      section.append(repeatedHeading("الفعالية " + (index + 1), "timeline", index, config.timeline.length));
      const times = element("div", "time-grid");
      const kindLabel = element("label", null, "نوع الفعالية"); const select = element("select");
      select.name = `timeline.${index}.kind`; select.dataset.path = select.name;
      [["event", "فعالية محلية"], ["start", "انطلاق المسابقة"], ["end", "نهاية المسابقة"]].forEach(([value, title]) => { const option = element("option", null, title); option.value = value; select.append(option); });
      select.value = item.kind; kindLabel.append(select);
      times.append(field("التاريخ", `timeline.${index}.date`, item.date, false, "date"), field("الوقت", `timeline.${index}.time`, item.time, false, "time"), field("النهاية (اختياري)", `timeline.${index}.endTime`, item.endTime, false, "time"), kindLabel);
      section.append(times, field("عنوان الفعالية", `timeline.${index}.title`, item.title), field("الوصف", `timeline.${index}.description`, item.description, true));
      return section;
    }));
  }
  function renderEditor() {
    $("textFields").replaceChildren(...groups.map(([title, fields]) => {
      const section = element("div", "edit-section"); section.append(element("h2", null, title));
      fields.forEach(([key, label, multiline]) => section.append(field(label, "text." + key, config.text[key], multiline)));
      return section;
    }));
    $("venueFields").replaceChildren(...venueLabels.map(([key, label, multiline]) => field(label, "text." + key, config.text[key], multiline)));
    $("scheduleFields").replaceChildren(field("عنوان البرنامج", "text.scheduleTitle", config.text.scheduleTitle), field("ملاحظة التوقيت", "text.scheduleNote", config.text.scheduleNote, true));
    $("statsNoteField").replaceChildren(field("الملاحظة أسفل الإحصائيات", "text.statsNote", config.text.statsNote, true));
    $("prizeTextFields").replaceChildren(...[["prizesTitle", "عنوان قسم الجوائز"], ["prizesIntro", "مقدمة الجوائز"], ["prizesNote", "شروط الجوائز العالمية"], ["localPrizesNote", "شروط الجوائز المحلية والمنح"]].map(([key, label]) => field(label, "text." + key, config.text[key], key !== "prizesTitle")));
    Object.entries(config.stats).forEach(([key, value]) => {
      const input = $("editorForm").elements.namedItem(key); input.value = value ?? ""; input.dataset.path = "stats." + key;
    });
    $("registrationOpen").checked = config.registrationOpen;
    renderArrays(); updateTotals();
    $("editorState").textContent = previewOnly ? "مسودة محلية · سجّل الدخول للنشر" : config.revision ? `نسخة منشورة رقم ${config.revision}` : "لم تُنشر الإحصائيات بعد";
    $("loginPanel").hidden = true; $("editor").hidden = false; $("logoutBtn").hidden = false;
    setBusy(false);
  }
  function activateTab(name, focus = false) {
    document.querySelectorAll("[data-tab]").forEach(button => {
      const active = button.dataset.tab === name;
      button.classList.toggle("active", active); button.setAttribute("aria-selected", active); button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
      $("panel-" + button.dataset.tab).hidden = !active;
    });
  }
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
    button.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const tabs = Array.from(document.querySelectorAll("[data-tab]"), tab => tab.dataset.tab); const index = tabs.indexOf(button.dataset.tab);
      activateTab(event.key === "Home" ? tabs[0] : event.key === "End" ? tabs.at(-1) : tabs[(index + (event.key === "ArrowLeft" ? 1 : tabs.length - 1)) % tabs.length], true);
    });
  });
  $("editorForm").addEventListener("input", event => {
    if (event.target.id === "registrationOpen") config.registrationOpen = event.target.checked;
    else if (event.target.dataset.path) {
      const parts = event.target.dataset.path.split("."); const last = parts.pop();
      let target = config; parts.forEach(key => target = target[key]);
      target[last] = event.target.type === "number" ? event.target.value === "" ? null : Number(event.target.value) : event.target.value;
    } else return;
    changed();
  });
  $("addFaq").addEventListener("click", () => {
    if (config.faqs.length >= 20) return message("editorMessage", "الحد الأقصى 20 سؤالاً.", "error");
    config.faqs.push({ question: "", answer: "" }); changed(); renderArrays();
    $("faqFields").lastElementChild.querySelector("input").focus();
  });
  $("addEvent").addEventListener("click", () => {
    if (config.timeline.length >= 30) return message("editorMessage", "الحد الأقصى 30 فعالية.", "error");
    config.timeline.push({ date: config.timeline.at(-1)?.date || "2026-11-01", time: "08:00", endTime: "", kind: "event", title: "", description: "" }); changed(); renderArrays();
    $("timelineFields").lastElementChild.querySelector('input[type="text"]').focus();
  });
  $("passwordToggle").addEventListener("click", () => {
    const show = $("adminPassword").type === "password";
    $("adminPassword").type = show ? "text" : "password";
    const label = show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور";
    $("passwordToggle").title = label; $("passwordToggle").setAttribute("aria-label", label);
  });
  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault(); if (busy) return;
    busy = true; $("loginBtn").disabled = true; message("loginMessage", "جارٍ التحقق من الدخول...");
    try {
      const result = await SiteAPI.adminRequest("adminLogin", { password: $("adminPassword").value });
      token = result.token; storageSet(sessionKey, token); previewOnly = false;
      contentSchema = Number(result.contentSchema) || 0;
      config = SiteData.merge(result.config); dirty = false; $("adminPassword").value = "";
      renderEditor(); message("editorMessage", "");
      if (contentSchema < 2) message("editorMessage", "خدمة الشيت تحتاج نشر إصدار الجوائز الجديد. المعاينة متاحة، لكن النشر متوقف حتى تحديث الخدمة ثم تحميل النسخة المنشورة.", "error");
      const draft = storageGet(draftKey);
      if (draft && confirm("يوجد مسودة محفوظة في هذه الجلسة. هل تريد استعادتها؟")) { config = SiteData.merge(JSON.parse(draft)); renderEditor(); changed(); }
    } catch (error) { message("loginMessage", describeError(error), "error"); }
    finally { busy = false; $("loginBtn").disabled = false; }
  });
  $("draftBtn").addEventListener("click", async () => {
    if (busy) return;
    previewOnly = true; dirty = false;
    try { config = SiteData.merge(JSON.parse(storageGet(draftKey))); } catch (_) { config = SiteData.fresh(); }
    renderEditor(); message("editorMessage", "هذه مسودة للمعاينة فقط. النشر يتطلب تسجيل الدخول.");
    if (!storageGet(draftKey)) {
      try { const result = await SiteAPI.jsonp("public"); if (result.ok && result.config && !dirty && previewOnly) { config = SiteData.merge(result.config); renderEditor(); } } catch (_) { /* The offline preview uses bundled defaults. */ }
    }
  });
  $("editorForm").addEventListener("submit", async event => {
    event.preventDefault(); if (busy || previewOnly || !token || contentSchema < 2) return;
    const errors = SiteData.validate(config);
    if (errors.length) { message("editorMessage", errors.join("\n"), "error"); if (Object.values(config.stats).some(value => value === null)) activateTab("stats"); window.scrollTo({ top: 0, behavior: "auto" }); return; }
    setBusy(true); message("editorMessage", "جارٍ نشر التعديلات والتحقق من حفظها...");
    try {
      const result = await SiteAPI.adminRequest("adminSave", { token, config: JSON.stringify(config), baseRevision: config.revision });
      config = SiteData.merge(result.config); dirty = false; storageRemove(draftKey); renderEditor();
      message("editorMessage", "تم نشر التعديلات بنجاح. تظهر للزوار عند التحديث وخلال دقيقة للصفحات المفتوحة.", "success");
    } catch (error) {
      message("editorMessage", describeError(error) + (error.details ? "\n" + error.details.join("\n") : ""), "error");
      if (error.message === "unauthorized") { token = ""; storageRemove(sessionKey); }
    } finally { setBusy(false); }
  });
  $("refreshBtn").addEventListener("click", async () => {
    if (busy || previewOnly || (dirty && !confirm("تحميل النسخة المنشورة سيستبدل التعديلات الحالية. هل تريد المتابعة؟"))) return;
    setBusy(true); message("editorMessage", "جارٍ تحميل النسخة المنشورة...");
    try { const result = await SiteAPI.adminRequest("adminGet", { token }); contentSchema = Number(result.contentSchema) || 0; config = SiteData.merge(result.config); dirty = false; storageRemove(draftKey); renderEditor(); message("editorMessage", contentSchema < 2 ? "خدمة الشيت تحتاج نشر إصدار الجوائز الجديد قبل النشر." : "تم تحميل النسخة المنشورة.", contentSchema < 2 ? "error" : "success"); }
    catch (error) { message("editorMessage", describeError(error), "error"); }
    finally { setBusy(false); }
  });
  $("logoutBtn").addEventListener("click", () => {
    const previousToken = token; token = ""; storageRemove(sessionKey); busy = false;
    if (previousToken) SiteAPI.adminRequest("adminLogout", { token: previousToken }).catch(() => {});
    $("editor").hidden = true; $("loginPanel").hidden = false; $("logoutBtn").hidden = true;
    message("loginMessage", dirty ? "مسودتك محفوظة في هذه الجلسة." : "تم تسجيل الخروج.");
    $("adminPassword").focus();
  });
  function sendPreview() {
    if ($("previewFrame").contentWindow && $("previewDialog").open) $("previewFrame").contentWindow.postMessage({ type: "ieeextreme-preview", config }, location.origin === "null" ? "*" : location.origin);
  }
  $("previewBtn").addEventListener("click", () => {
    $("previewDialog").showModal();
    if (!$("previewFrame").getAttribute("src")) $("previewFrame").src = "index.html?preview=1";
    else sendPreview();
  });
  window.addEventListener("message", event => {
    if (event.source === $("previewFrame").contentWindow && event.origin === location.origin && event.data?.type === "ieeextreme-preview-ready") sendPreview();
  });
  $("closePreview").addEventListener("click", () => $("previewDialog").close());
  ["desktop", "mobile"].forEach(mode => $(mode + "Preview").addEventListener("click", () => {
    $("previewFrame").classList.toggle("mobile", mode === "mobile");
    ["desktop", "mobile"].forEach(key => { $(key + "Preview").classList.toggle("active", mode === key); $(key + "Preview").setAttribute("aria-pressed", mode === key); });
  }));
  window.addEventListener("beforeunload", event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
  token = storageGet(sessionKey) || "";
  if (token) {
    busy = true; $("loginBtn").disabled = true; message("loginMessage", "جارٍ استعادة جلسة الإدارة...");
    SiteAPI.adminRequest("adminGet", { token }).then(result => { contentSchema = Number(result.contentSchema) || 0; config = SiteData.merge(result.config); renderEditor(); if (contentSchema < 2) message("editorMessage", "خدمة الشيت تحتاج نشر إصدار الجوائز الجديد قبل النشر.", "error"); }).catch(error => { token = ""; storageRemove(sessionKey); message("loginMessage", describeError(error), "error"); }).finally(() => { busy = false; $("loginBtn").disabled = false; });
  }
})();
