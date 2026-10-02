(function(root) {
  "use strict";
  const defaults = {
    revision: 0,
    updatedAt: null,
    registrationOpen: true,
    text: {
      eventName: "IEEEXtreme 20.0",
      heroTagline: "من غزة، إلى ساحة البرمجة العالمية.",
      heroDescription: "24 ساعة تجمعك بفريقك وبطلبة من مختلف أنحاء العالم. نلتقي في الجامعة الإسلامية بغزة لنحلّ، نتعلّم، ونصنع تجربة تستحق أن نعيشها معاً.",
      eventDateLabel: "30 أكتوبر – 1 نوفمبر 2026",
      globalTitle: "العالم كلّه يحلّ. وغزة جزء من التحدّي.",
      globalBody: "IEEEXtreme مسابقة برمجة عالمية تنظّمها IEEE. تتنافس فرق من الطلبة الأعضاء في IEEE، بإشراف مراقبين مؤهلين، في حل مسائل برمجية وخوارزمية خلال 24 ساعة متواصلة، في توقيت موحّد حول العالم.",
      globalExtra: "تختبر المسابقة التفكير المنطقي، تصميم الخوارزميات، والعمل الجماعي تحت ضغط الوقت. الفرق عالمياً تضم من عضو إلى ثلاثة أعضاء؛ وفي استضافة غزة نستهدف فرقاً من ثلاثة أعضاء.",
      localTitle: "تحدٍّ عالمي، ولقاء يجمع مجتمع غزة التقني.",
      localBody: "الجامعة الإسلامية بغزة هي المستضيف المحلي، ويتابع فرع IEEE الطلابي التنظيم واستقبال طلبة الجامعات والكليات في قطاع غزة. من استقبال الفرق ومؤتمر الانطلاق إلى الفعاليات الحماسية ولحظة بدء التحدّي، أنت جزء من تجربة جماعية تمتد إلى ما بعد آخر مسألة.",
      gazaTitle: "مساحة لنلتقي، نتعلّم، ونُظهر ما نستطيع.",
      gazaBody: "في غزة، نعرف قيمة كل فرصة تجمعنا حول المعرفة. هذه دعوة للطالبات والطلاب من مختلف الجامعات والكليات: أحضروا شغفكم بالبرمجة، وتجربتكم، ورغبتكم في التعلّم. هنا نلتقي كزملاء، ونواجه التحدّي كفرق، ونمثّل مجتمعنا بأفكارنا وعملنا.",
      gazaExtra: "لا تحتاج أن تعرف حلّ كل مسألة لتبدأ. تحتاج فضولاً، استعداداً للتدرّب، وفريقاً تتكامل معه. سجّل حتى إن لم يكتمل فريقك، وحدّد في النموذج حاجتك للمساعدة في تكوين الفريق أو العضوية.",
      branchTitle: "فرع IEEE في الجامعة الإسلامية بغزة",
      branchBody: "مجتمع طلابي يربط المعرفة بالتجربة: ورش، تدريب، مسابقات، وفرص للعمل الجماعي والتواصل مع المجتمع التقني العالمي. نرافق الطلبة في التحضير للمشاركة وتنسيق الفرق.",
      venueHost: "الجامعة الإسلامية بغزة",
      venueBuilding: "مبنى فلسطين",
      competitionRoom: "P101",
      femaleRestRoom: "P102",
      venueNote: "قاعة P101 للمسابقة، وقاعة P102 مخصصة لراحة الطالبات. اذكر أي احتياجات خاصة في نموذج التسجيل لتراجعها اللجنة المنظمة.",
      scheduleTitle: "من أوّل لقاء، إلى آخر سطر برمجي.",
      scheduleNote: "جميع الأوقات بتوقيت غزة. الانطلاق العالمي: 31 أكتوبر 2026، الساعة 00:00 UTC. أي تعديل تنظيمي سيظهر هنا.",
      registrationTitle: "مكانك بيننا يبدأ بطلب تسجيل.",
      registrationBody: "سجّل بشكل فردي، سواء كان لديك فريق كامل أو تبحث عن زملاء. تراجع اللجنة الطلبات وتتواصل مع المقبولين لاستكمال التحضير والتسجيل الرسمي.",
      registrationNote: "التسجيل هنا طلب مشاركة محلي، وليس بديلاً عن التسجيل الرسمي في IEEEXtreme. يلزم استيفاء شروط المسابقة وعضوية IEEE للمشاركة الرسمية.",
      statsNote: "أعداد التسجيل المنشورة من اللجنة المنظمة. التسجيل لا يعني القبول النهائي.",
      prizesTitle: "تحدٍّ يستحقّ الجهد. وجوائز تفتح آفاقاً.",
      prizesIntro: "نافس على الجوائز العالمية، واكتشف فرص التكريم والدعم الدراسي في استضافة غزة.",
      prizesNote: "الجوائز العالمية حسب إعلان IEEE وشروطها. الاستحقاق مرتبط بالترتيب الرسمي، وقد تؤثر قيود السفر والقوانين على إتاحتها.",
      localPrizesNote: "تعلن اللجنة المنظمة قيم الجوائز المحلية، والجهات المانحة، وعدد المنح وشروط الاستحقاق. المشاركة لا تعني الحصول على جائزة أو منحة."
    },
    stats: { teamCapacity: 20, registeredTeams: null, femaleStudents: null, maleStudents: null },
    benefits: [
      { title: "تعلّم يتجاوز المحاضرة", body: "طبّق الخوارزميات على مسائل حقيقية، واكتشف طرق تفكير جديدة من زملائك." },
      { title: "فريق تتكامل معه", body: "قسّم الأدوار، ناقش الحلول، وجرّب معنى التعاون عندما يكون الوقت جزءاً من التحدّي." },
      { title: "تجربة تجمعنا", body: "لقاء مع مجتمع غزة التقني، وفعاليات قبل المسابقة، وذكريات نصنعها معاً." }
    ],
    prizes: {
      global: [
        { rank: "الأول عالمياً", title: "رحلة إلى مؤتمر IEEE", highlight: "وجهتك إلى العالم", details: "لكل عضو في الفريق: تذاكر سفر ذهاباً وإياباً، تسجيل المؤتمر وإقامة 3 ليالٍ. يمكن تقديم بدائل عند تقييد السفر." },
        { rank: "الثاني عالمياً", title: "جائزة مالية", highlight: "400 دولار / عضو", details: "1,200 دولار لفريق من 3 أعضاء، وفق شروط الجائزة العالمية." },
        { rank: "الثالث عالمياً", title: "جائزة مالية", highlight: "300 دولار / عضو", details: "900 دولار لفريق من 3 أعضاء، وفق شروط الجائزة العالمية." },
        { rank: "من الرابع إلى العاشر عالمياً", title: "حزمة هدايا خاصة", highlight: "لكل عضو", details: "منتجات وهدايا IEEEXtreme خاصة لأعضاء الفرق الفائزة." },
        { rank: "من الحادي عشر إلى العشرين عالمياً", title: "هدايا IEEEXtreme", highlight: "لكل عضو", details: "حزمة منتجات وهدايا لأعضاء الفرق ضمن هذه المراكز." },
        { rank: "أول 3 فرق في كل IEEE Region", title: "تكريم على مستوى المنطقة", highlight: "لجميع أعضاء الفرق", details: "حزمة منتجات وهدايا IEEEXtreme لأفضل ثلاثة فرق في كل منطقة IEEE." }
      ],
      local: [
        { title: "جوائز مالية محلية", highlight: "تميّز يُكافأ", details: "جوائز مالية ضمن الاستضافة المحلية في غزة. تُعلن القيم وآلية التوزيع من اللجنة المنظمة." },
        { title: "منح دراسية", highlight: "فرصة لما بعد المسابقة", details: "منح دراسية ضمن فرص الدعم المحلية، وفق شروط الاستحقاق التي تعلنها اللجنة والجهات المانحة." }
      ]
    },
    timeline: [
      { date: "2026-10-30", time: "17:00", endTime: "19:00", kind: "event", title: "الاستقبال والتعارف", description: "استقبال المشاركين، تنظيم الفرق، والتعرّف على المكان والزملاء." },
      { date: "2026-10-30", time: "19:30", endTime: "", kind: "event", title: "مؤتمر انطلاق المسابقة", description: "لقاء الانطلاق والأجواء المحلية، والتعرّف على التحدّي والتعليمات التنظيمية." },
      { date: "2026-10-30", time: "21:00", endTime: "", kind: "event", title: "فعاليات ما قبل المسابقة", description: "أجواء حماسية، أنشطة جماعية، واستعداد للحظة التي يبدأ فيها التحدّي العالمي." },
      { date: "2026-10-31", time: "02:00", endTime: "", kind: "start", title: "الانطلاق الفعلي للمسابقة", description: "نبدأ مع العالم: 24 ساعة من حل المسائل والبرمجة والعمل الجماعي." },
      { date: "2026-11-01", time: "02:00", endTime: "", kind: "end", title: "نهاية المسابقة", description: "نهاية التحدّي البرمجي العالمي بعد 24 ساعة متواصلة." },
      { date: "2026-11-01", time: "02:00", endTime: "07:00", kind: "event", title: "متابعة الفعاليات والراحة", description: "وقت للراحة واللقاء بعد انتهاء المسابقة، ومتابعة الأجواء والفعاليات." },
      { date: "2026-11-01", time: "07:00", endTime: "", kind: "event", title: "الإفطار والمغادرة", description: "نتناول الإفطار معاً، ثم نودّع تجربة مليئة بالتعلّم والتحدّي." }
    ],
    faqs: [
      { question: "هل المشاركة لطلبة الجامعة الإسلامية فقط؟", answer: "الدعوة المحلية لطلبة الجامعات والكليات في قطاع غزة. تستضيف الجامعة الإسلامية بغزة اللقاء، وتراجع اللجنة طلبات المشاركة حسب السعة والجاهزية." },
      { question: "هل أحتاج أن أكون محترفاً؟", answer: "يمكنك تقديم طلبك وتحديد مستواك الحالي. الاستعداد للتدرّب والالتزام مهمان، وتراجع اللجنة الجاهزية قبل اعتماد المشاركة الرسمية." },
      { question: "ليس لديّ فريق، هل أسجّل؟", answer: "نعم. اختر التسجيل الفردي في النموذج، أو وضّح أن فريقك ناقص، لتراجع اللجنة إمكانية ضمّك إلى فريق مناسب." },
      { question: "هل يسجّل قائد الفريق عن الجميع؟", answer: "لا، كل طالب وطالبة يسجّل بشكل فردي. اكتبوا اسم الفريق وبيانات القائد بنفس الصيغة لربط الطلبات." },
      { question: "ما ترتيبات راحة الطالبات؟", answer: "قاعة P102 في مبنى فلسطين مخصصة لراحة الطالبات، وقاعة P101 لاستضافة المسابقة. يمكن توضيح أي احتياجات إضافية في النموذج." },
      { question: "هل هذا هو التسجيل العالمي الرسمي؟", answer: "هذا نموذج المشاركة المحلية. المشاركة الرسمية تتطلب عضوية IEEE واستيفاء الشروط والتسجيل العالمي. حدّد حاجتك للمساعدة في النموذج، والتسجيل المحلي لا يعني القبول النهائي." }
    ]
  };

  function fresh() { return JSON.parse(JSON.stringify(defaults)); }
  function merge(input) {
    const data = fresh();
    if (!input || typeof input !== "object") return data;
    Object.keys(data.text).forEach(key => {
      if (typeof input.text?.[key] === "string") data.text[key] = input.text[key];
    });
    Object.keys(data.stats).forEach(key => {
      if (input.stats?.[key] === null || Number.isInteger(input.stats?.[key])) data.stats[key] = input.stats[key];
    });
    ["timeline", "benefits", "faqs"].forEach(key => {
      if (Array.isArray(input[key]) && input[key].length) data[key] = input[key];
    });
    ["global", "local"].forEach(key => {
      const incoming = input.prizes?.[key];
      if (Array.isArray(incoming) && incoming.length === defaults.prizes[key].length) {
        data.prizes[key] = data.prizes[key].map((item, index) => Object.fromEntries(Object.entries(item).map(([field, value]) => [field, typeof incoming[index]?.[field] === "string" ? incoming[index][field] : value])));
      }
    });
    data.registrationOpen = input.registrationOpen !== false;
    data.revision = Number(input.revision) || 0;
    data.updatedAt = input.updatedAt || null;
    return data;
  }

  function validate(data) {
    const errors = [];
    if (JSON.stringify(data).length > 28000) errors.push("المحتوى طويل جداً؛ اختصر بعض النصوص قبل النشر.");
    Object.keys(defaults.text).forEach(key => {
      if (typeof data.text?.[key] !== "string" || !data.text[key].trim() || data.text[key].length > 3000) errors.push("أكمل جميع حقول المحتوى؛ الحد الأقصى 3000 حرف لكل حقل.");
    });
    Object.keys(defaults.stats).forEach(key => {
      if (!Number.isInteger(data.stats?.[key]) || data.stats[key] < 0 || data.stats[key] > 10000) errors.push("أدخل أعداداً صحيحة من 0 إلى 10000 في الإحصائيات.");
    });
    if (data.stats?.teamCapacity < 1) errors.push("سعة الفرق يجب أن تكون فريقاً واحداً على الأقل.");
    if (data.stats?.registeredTeams > data.stats?.teamCapacity) errors.push("عدد الفرق المسجلة أكبر من السعة المحددة.");
    let previous = "";
    const timeline = Array.isArray(data.timeline) ? data.timeline : [];
    if (!timeline.length || timeline.length > 30) errors.push("أضف من 1 إلى 30 فعالية للجدول.");
    timeline.forEach(item => {
      const stamp = `${item.date}T${item.time}`;
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(item.date) && !isNaN(Date.parse(item.date)) && new Date(item.date).toISOString().slice(0, 10) === item.date;
      if (!validDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time) || !["event", "start", "end"].includes(item.kind)) errors.push("راجع تاريخ ووقت ونوع كل فعالية.");
      if (!item.title?.trim() || !item.description?.trim() || item.title.length > 180 || item.description.length > 1500) errors.push("أكمل عنوان ووصف كل فعالية.");
      if (item.endTime && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.endTime) || item.endTime <= item.time)) errors.push("وقت نهاية الفعالية يجب أن يأتي بعد بدايتها في اليوم نفسه.");
      if (previous && stamp < previous) errors.push("رتّب الفعاليات حسب التاريخ والوقت.");
      previous = stamp;
    });
    const starts = timeline.filter(item => item.kind === "start");
    const ends = timeline.filter(item => item.kind === "end");
    if (starts.length !== 1 || ends.length !== 1) errors.push("حدّد فعالية واحدة لانطلاق المسابقة وأخرى لانتهائها.");
    else if (Date.parse(`${ends[0].date}T${ends[0].time}:00Z`) - Date.parse(`${starts[0].date}T${starts[0].time}:00Z`) !== 86400000) errors.push("مدة المسابقة بين الانطلاق والانتهاء يجب أن تكون 24 ساعة.");
    if (!Array.isArray(data.benefits) || data.benefits.length !== 3 || data.benefits.some(item => !item.title?.trim() || !item.body?.trim() || item.title.length > 180 || item.body.length > 1500)) errors.push("أكمل مزايا المشاركة الثلاث.");
    if (!Array.isArray(data.faqs) || !data.faqs.length || data.faqs.length > 20 || data.faqs.some(item => !item.question?.trim() || !item.answer?.trim() || item.question.length > 300 || item.answer.length > 2000)) errors.push("أكمل الأسئلة والأجوبة؛ الحد الأقصى 20 سؤالاً.");
    ["global", "local"].forEach(key => {
      const items = data.prizes?.[key];
      if (!Array.isArray(items) || items.length !== defaults.prizes[key].length || items.some(item => Object.keys(defaults.prizes[key][0]).some(field => typeof item?.[field] !== "string" || !item[field].trim() || item[field].length > (field === "details" ? 1500 : 180)))) errors.push("أكمل تفاصيل الجوائز العالمية والمحلية ضمن الطول المسموح.");
    });
    return [...new Set(errors)];
  }
  root.SiteData = { defaults, fresh, merge, validate };
  if (typeof module !== "undefined") module.exports = root.SiteData;
})(typeof window !== "undefined" ? window : globalThis);
