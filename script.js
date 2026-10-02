/**
 * IEEEXtreme 20.0 Gaza Registration
 * نسخة سريعة + تأكيد حفظ حقيقي + بدون إظهار تفاصيل التخزين للمستخدم
 *
 * الفكرة:
 * 1) إرسال سريع POST no-cors.
 * 2) تأكيد الحفظ عبر status check باستخدام JSONP.
 * 3) إعادة محاولة تلقائية بنفس submissionId إذا تأخر الحفظ.
 * 4) منع التكرار من جهة السيرفر.
 */

const WEB_APP_URL = window.APP_SETTINGS?.serviceUrl || "";
const POST_TIMEOUT_MS = 6500;
const FIRST_CONFIRMATION_CHECKS = [
  { delay: 500, timeout: 4000 },
  { delay: 1400, timeout: 4000 }
];
const RETRY_CONFIRMATION_CHECKS = [
  { delay: 2000, timeout: 5000 }
];
const PENDING_STORAGE_KEY = "ieeextreme20.pendingSubmissions.v1";
const MAX_PENDING_SUBMISSIONS = 8;

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const form = document.getElementById("registrationForm");
const submitBtn = document.getElementById("submitBtn");
const statusText = document.getElementById("statusText");
const modal = document.getElementById("successModal");
const closeModal = document.getElementById("closeModal");
const okModal = document.getElementById("okModal");
const gender = document.getElementById("gender");
const femaleSection = document.getElementById("femaleSection");
const clientTimestamp = document.getElementById("clientTimestamp");
const submissionIdField = document.getElementById("submissionId");
let retryingPendingSubmissions = false;

form?.setAttribute("novalidate", "novalidate");

menuBtn?.addEventListener("click", () => {
  const open = navLinks?.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(!!open));
});
document.querySelectorAll(".links a").forEach(a => a.addEventListener("click", () => {
  navLinks?.classList.remove("open");
  menuBtn?.setAttribute("aria-expanded", "false");
}));

function toggleFemaleSection() {
  if (!gender || !femaleSection) return;
  femaleSection.style.display = gender.value === "أنثى" ? "block" : "none";
}
gender?.addEventListener("change", toggleFemaleSection);
toggleFemaleSection();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
}

function serviceReady() {
  return WEB_APP_URL && !WEB_APP_URL.includes("PASTE_YOUR") && WEB_APP_URL.startsWith("https://script.google.com/macros/s/") && WEB_APP_URL.includes("/exec");
}

function jsonp(action, params = {}, timeoutMs = 8000) {
  return window.SiteAPI.jsonp(action, params, timeoutMs);
}

function modalParts() {
  return {
    icon: modal?.querySelector(".check"),
    title: modal?.querySelector("h2"),
    text: modal?.querySelector("p"),
    close: closeModal,
    ok: okModal
  };
}

function showModal(type, title, htmlMessage, options = {}) {
  if (!modal) {
    alert(title + "\n" + htmlMessage.replace(/<[^>]*>?/gm, ""));
    return;
  }

  const parts = modalParts();

  if (parts.icon) {
    parts.icon.textContent = type === "loading" ? "…" : type === "error" ? "!" : "✓";
    parts.icon.style.background = type === "error"
      ? "linear-gradient(135deg,#ff6b6b,#ffd166)"
      : type === "loading"
        ? "linear-gradient(135deg,#ffd166,#00a6ff)"
        : "linear-gradient(135deg,#00e6c3,#00a6ff)";
  }

  if (parts.title) parts.title.textContent = title;
  if (parts.text) parts.text.innerHTML = htmlMessage;

  const canClose = options.canClose !== false;
  if (parts.close) parts.close.style.display = canClose ? "block" : "none";
  if (parts.ok) parts.ok.style.display = canClose ? "inline-flex" : "none";

  modal.classList.add("show");
}

function closeSuccess() {
  modal?.classList.remove("show");
}
closeModal?.addEventListener("click", closeSuccess);
okModal?.addEventListener("click", closeSuccess);
modal?.addEventListener("click", e => {
  if (e.target === modal && closeModal?.style.display !== "none") closeSuccess();
});

function isVisible(element) {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

function prefersFastScroll() {
  return window.innerWidth <= 768 || (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function getQuestionTitle(input) {
  const label = input.closest("label");
  if (label) {
    const clone = label.cloneNode(true);
    clone.querySelectorAll("input,select,textarea,button").forEach(el => el.remove());
    const text = clone.textContent.replace(/\s+/g, " ").trim();
    if (text) return text;
  }

  const section = input.closest(".form-section");
  const h3 = section?.querySelector("h3")?.textContent?.trim();
  return h3 || input.name || "سؤال مطلوب";
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, match => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[match]));
}

function validateRequiredFields() {
  const missing = [];
  const invalidEmails = [];
  const invalidPhones = [];

  form.querySelectorAll("[required]").forEach(field => {
    if (field.type === "hidden" || !isVisible(field)) return;

    if (field.type === "checkbox") {
      if (!field.checked) missing.push(getQuestionTitle(field));
      return;
    }

    const value = String(field.value || "").trim();
    if (!value) {
      missing.push(getQuestionTitle(field));
      return;
    }

    if (field.type === "email" && !field.checkValidity()) {
      invalidEmails.push(getQuestionTitle(field));
    }

    if (field.type === "tel" && value && !/^[0-9+\-\s]{8,20}$/.test(value)) {
      invalidPhones.push(getQuestionTitle(field));
    }
  });

  if (document.querySelectorAll('input[name="languages"]:checked').length === 0) {
    missing.push("لغات البرمجة التي تستطيع استخدامها");
  }

  if (document.querySelectorAll('input[name="topics"]:checked').length === 0) {
    missing.push("المواضيع التي لديك معرفة بها");
  }

  return { missing, invalidEmails, invalidPhones };
}

function showValidationErrors(errors) {
  const parts = [];

  if (errors.missing.length) {
    parts.push(`<b>الأسئلة الناقصة:</b><ul>${errors.missing.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
  }

  if (errors.invalidEmails.length) {
    parts.push(`<b>بريد إلكتروني غير صحيح:</b><ul>${errors.invalidEmails.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
  }

  if (errors.invalidPhones.length) {
    parts.push(`<b>رقم جوال غير صحيح:</b><ul>${errors.invalidPhones.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`);
  }

  showModal(
    "error",
    "يوجد بيانات ناقصة أو غير صحيحة",
    parts.join("<br>") + "<br><b>يرجى إكمال البيانات ثم إعادة الإرسال.</b>"
  );

  const firstInvalid = Array.from(form.querySelectorAll("[required]")).find(field => {
    if (field.type === "hidden" || !isVisible(field)) return false;
    if (field.type === "checkbox") return !field.checked;
    return !String(field.value || "").trim() || !field.checkValidity();
  });

  firstInvalid?.scrollIntoView({ behavior: prefersFastScroll() ? "auto" : "smooth", block: "center" });
  setTimeout(() => firstInvalid?.focus?.(), 350);
}

function collectData(formEl) {
  const fd = new FormData(formEl);
  const data = {};
  for (const [key, value] of fd.entries()) {
    data[key] = data[key] ? data[key] + ", " + value : value;
  }
  return data;
}

function createSubmissionId() {
  const rand = Math.random().toString(36).slice(2);
  return "sub_" + Date.now() + "_" + rand;
}

function canUseNetwork() {
  return navigator.onLine !== false;
}

function readPendingSubmissions() {
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function writePendingSubmissions(items) {
  try {
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(items.slice(-MAX_PENDING_SUBMISSIONS)));
    return true;
  } catch (err) {
    return false;
  }
}

function rememberPendingSubmission(data) {
  if (!data.submissionId) data.submissionId = createSubmissionId();

  const now = new Date().toISOString();
  const queue = readPendingSubmissions().filter(item => item.submissionId !== data.submissionId);
  queue.push({
    ...data,
    clientQueuedAt: data.clientQueuedAt || now,
    queuedAt: data.queuedAt || now,
    lastAttemptAt: now,
    attempts: Number(data.attempts || 0) + 1
  });

  return writePendingSubmissions(queue);
}

function forgetPendingSubmission(submissionId) {
  if (!submissionId) return;
  const queue = readPendingSubmissions().filter(item => item.submissionId !== submissionId);
  writePendingSubmissions(queue);
}

function ensureCurrentSubmissionId() {
  if (!submissionIdField) return createSubmissionId();
  if (!submissionIdField.value) submissionIdField.value = createSubmissionId();
  return submissionIdField.value;
}

function clearCurrentSubmissionId() {
  if (submissionIdField) submissionIdField.value = "";
}

function updatePendingStatusText() {
  if (!statusText) return;

  const count = readPendingSubmissions().length;
  if (count) {
    statusText.dataset.pendingNotice = "true";
    statusText.textContent = `يوجد ${count} طلب محفوظ مؤقتاً وسيتم إرساله تلقائياً عند توفر الاتصال.`;
    return;
  }

  if (statusText.dataset.pendingNotice === "true") {
    delete statusText.dataset.pendingNotice;
    statusText.textContent = "تم إرسال الطلبات المحفوظة بنجاح.";
  }
}

function retryPendingSubmissionsSoon(delayMs = 10000) {
  if (new URLSearchParams(location.search).has("preview")) return;
  setTimeout(retryPendingSubmissions, delayMs);
}

function submissionPayloadOnly(item) {
  const payload = { ...item };
  delete payload.queuedAt;
  delete payload.lastAttemptAt;
  delete payload.attempts;
  return payload;
}

async function postNoCors(data, timeoutMs = POST_TIMEOUT_MS) {
  return window.SiteAPI.post("register", data, timeoutMs);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntilSaved(submissionId, checks = FIRST_CONFIRMATION_CHECKS) {
  for (const check of checks) {
    await sleep(check.delay);

    try {
      const res = await jsonp("status", { submissionId }, check.timeout);
      if (res && res.saved) return res;
      if (res?.error === "registration_closed") throw new Error("registration_closed");
    } catch (err) {
      if (err.message === "registration_closed") throw err;
      // نكمل المحاولات بدون إظهار خطأ للمستخدم
    }
  }

  throw new Error("not-confirmed");
}

async function submitFastConfirmed(data, options = {}) {
  const quiet = options.quiet === true;
  const allowImmediateRetry = options.retry === true;
  data.submissionId = data.submissionId || createSubmissionId();

  let firstPostSucceeded = false;
  let firstPostError = null;

  try {
    await postNoCors(data);
    firstPostSucceeded = true;
  } catch (err) {
    firstPostError = err;
  }

  try {
    return { status: "saved", response: await waitUntilSaved(data.submissionId) };
  } catch (firstError) {
    if (firstError.message === "registration_closed") throw firstError;
    if (!quiet && statusText) statusText.textContent = "ما زال الإرسال قيد المعالجة...";

    if (!allowImmediateRetry) {
      return { status: "pending", error: firstError };
    }

    let retryPostSucceeded = false;
    let retryPostError = null;

    try {
      await postNoCors(data);
      retryPostSucceeded = true;
    } catch (err) {
      retryPostError = err;
    }

    if (!firstPostSucceeded && !retryPostSucceeded) {
      throw retryPostError || firstPostError || firstError;
    }

    try {
      return { status: "saved", response: await waitUntilSaved(data.submissionId, RETRY_CONFIRMATION_CHECKS) };
    } catch (retryError) {
      if (retryError.message === "registration_closed") throw retryError;
      return { status: "pending", error: retryError };
    }
  }
}

async function retryPendingSubmissions() {
  if (retryingPendingSubmissions || submitBtn?.dataset.sending || !serviceReady() || !canUseNetwork() || window.eventContent?.registrationOpen === false || new URLSearchParams(location.search).has("preview")) return;

  const queue = readPendingSubmissions();
  if (!queue.length) return;

  retryingPendingSubmissions = true;

  try {
    for (const item of queue) {
      const payload = submissionPayloadOnly(item);

      try {
        const result = await submitFastConfirmed(payload, { quiet: true, retry: true });
        if (result.status === "saved") {
          forgetPendingSubmission(payload.submissionId);
        } else {
          rememberPendingSubmission(item);
        }
      } catch (err) {
        if (err.message === "registration_closed") {
          if (statusText) statusText.textContent = "استقبال الطلبات مغلق حالياً. طلبك المحلي لم يُعتمد بعد.";
          break;
        }
        rememberPendingSubmission(item);
      }
    }
  } finally {
    retryingPendingSubmissions = false;
    updatePendingStatusText();
  }
}

window.addEventListener("online", () => {
  setTimeout(retryPendingSubmissions, 800);
});

window.addEventListener("load", () => {
  updatePendingStatusText();
  setTimeout(retryPendingSubmissions, 2500);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) retryPendingSubmissions();
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (submitBtn?.dataset.sending) return;
  if (new URLSearchParams(location.search).has("preview")) return;
  if (window.eventContent?.registrationOpen === false) {
    showModal("error", "التسجيل مغلق حالياً", "أغلقت اللجنة استقبال الطلبات الجديدة. تابع الموقع لمعرفة أي تحديث.");
    return;
  }

  const errors = validateRequiredFields();
  if (errors.missing.length || errors.invalidEmails.length || errors.invalidPhones.length) {
    showValidationErrors(errors);
    return;
  }

  if (!serviceReady()) {
    showModal(
      "error",
      "النظام غير جاهز للإرسال",
      "لم يتم ربط نظام الإرسال بعد. يرجى التواصل مع مسؤول الموقع."
    );
    return;
  }

  if (clientTimestamp) clientTimestamp.value = new Date().toISOString();
  ensureCurrentSubmissionId();

  const data = collectData(form);
  data.submissionId = data.submissionId || ensureCurrentSubmissionId();

  if (!canUseNetwork()) {
    const stored = rememberPendingSubmission(data);
    if (stored) retryPendingSubmissionsSoon(12000);
    showModal(
      stored ? "loading" : "error",
      stored ? "تم حفظ الطلب مؤقتاً" : "الاتصال غير متاح",
      stored
        ? "الاتصال بالإنترنت غير متاح حالياً. تم حفظ الطلب في هذا الجهاز وسيتم إرساله تلقائياً عند رجوع الاتصال."
        : "الاتصال بالإنترنت غير متاح حالياً، ولم يستطع المتصفح حفظ نسخة مؤقتة. أبقِ الصفحة مفتوحة وحاول مرة أخرى عند رجوع الاتصال."
    );

    if (statusText) {
      statusText.textContent = stored
        ? "الطلب محفوظ مؤقتاً وسيعاد إرساله تلقائياً عند توفر الاتصال."
        : "الاتصال غير متاح. حاول مرة أخرى عند رجوع الإنترنت.";
    }
    return;
  }

  submitBtn.disabled = true;
  submitBtn.dataset.sending = "true";
  rememberPendingSubmission(data);
  submitBtn.textContent = "جاري الإرسال...";
  if (statusText) statusText.textContent = "جاري إرسال الطلب...";

  showModal(
    "loading",
    "جاري إرسال البيانات",
    "يرجى الانتظار قليلًا، يتم الآن إرسال طلب التسجيل.",
    { canClose: false }
  );

  try {
    const result = await submitFastConfirmed(data);

    if (result.status === "pending") {
      const stored = rememberPendingSubmission(data);
      if (stored) retryPendingSubmissionsSoon();
      showModal(
        stored ? "loading" : "error",
        stored ? "تم حفظ الطلب مؤقتاً" : "الإرسال بطيء ولم يتأكد بعد",
        stored
          ? "تمت محاولة إرسال الطلب، لكن خدمة التأكيد تأخرت. تم حفظ الطلب مؤقتاً وسيتم إرساله تلقائياً مرة أخرى بدون تكرار عند تحسن الاتصال."
          : "تمت محاولة إرسال الطلب، لكن خدمة التأكيد تأخرت. لم يتم مسح البيانات من النموذج حتى تتمكن من المحاولة مرة أخرى بعد قليل بدون إعادة تعبئة كل شيء."
      );

      if (statusText) {
        statusText.textContent = stored
          ? "الطلب محفوظ مؤقتاً وسيعاد إرساله تلقائياً."
          : "تأخر تأكيد الحفظ. يمكنك المحاولة مرة أخرى بعد قليل.";
      }
      return;
    }

    forgetPendingSubmission(data.submissionId);
    form.reset();
    clearCurrentSubmissionId();
    toggleFemaleSection();

    showModal(
      "success",
      "تم استلام طلبك بنجاح",
      "تم إرسال طلب التسجيل بنجاح. سيتم مراجعة البيانات والتواصل مع المقبولين لاحقًا."
    );

    if (statusText) statusText.textContent = "تم إرسال الطلب بنجاح.";
    window.refreshEventContent?.();
  } catch (err) {
    if (err.message === "registration_closed") {
      forgetPendingSubmission(data.submissionId);
      showModal("error", "التسجيل مغلق حالياً", "أغلقت اللجنة استقبال الطلبات أثناء الإرسال، ولم يُقبل طلب جديد. بياناتك بقيت في النموذج.");
      if (statusText) statusText.textContent = "لم يُقبل الطلب؛ استقبال التسجيلات مغلق.";
      window.refreshEventContent?.();
      return;
    }
    console.error(err);
    const stored = rememberPendingSubmission(data);
    if (stored) {
      retryPendingSubmissionsSoon();
      showModal(
        "loading",
        "تم حفظ الطلب مؤقتاً",
        "تعذر تأكيد الاتصال بالشيت حالياً، لذلك تم حفظ الطلب في هذا الجهاز وسيتم إرساله تلقائياً عند تحسن الاتصال."
      );

      if (statusText) statusText.textContent = "الطلب محفوظ مؤقتاً وسيعاد إرساله تلقائياً.";
      return;
    }

    showModal(
      "error",
      "لم يتم إرسال الطلب",
      "تعذر تأكيد إرسال الطلب حاليًا. يرجى التأكد من الاتصال بالإنترنت ثم المحاولة مرة أخرى."
    );

    if (statusText) statusText.textContent = "فشل الإرسال. يرجى المحاولة مرة أخرى.";
  } finally {
    delete submitBtn.dataset.sending;
    submitBtn.disabled = window.eventContent?.registrationOpen === false;
    submitBtn.textContent = submitBtn.disabled ? "التسجيل مغلق حالياً" : "إرسال طلب التسجيل";
  }
});
