const pageLanguage = document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'ar';
const messages = {
  ar: {
    openMenu: 'افتح القائمة',
    closeMenu: 'اقفل القائمة',
    queueWait: 'نأسف لك، تم وضعك في طابور الانتظار.',
    queueReady: 'أصبح بإمكانك تنزيل التطبيق الآن.',
  },
  en: {
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    queueWait: 'Sorry, you’ve been placed in the waiting queue.',
    queueReady: 'You can download the app now.',
  },
};
const copy = messages[pageLanguage];

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isExpanded));
    menuButton.setAttribute('aria-label', isExpanded ? copy.openMenu : copy.closeMenu);
    navigation.classList.toggle('is-open', !isExpanded);
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', copy.openMenu);
      navigation.classList.remove('is-open');
    });
  });
}

const year = document.querySelector('#current-year');
if (year) year.textContent = String(new Date().getFullYear());

function initializeWelcomeIntro() {
  if (!document.documentElement.hasAttribute('data-murshid-intro')) return;

  const introKey = 'murshid-intro-message-v2';
  let alreadySeen = false;
  try {
    alreadySeen = window.localStorage.getItem(introKey) === '1';
  } catch {
    alreadySeen = false;
  }
  if (alreadySeen) {
    document.documentElement.classList.add('intro-seen');
    document.documentElement.classList.remove('intro-pending');
    return;
  }

  const introCopy = pageLanguage === 'en'
    ? {
        direction: 'ltr',
        language: 'en',
        eyebrow: 'A note from the Murshid development team',
        title: 'Murshid S7',
        skip: 'Show the full message',
        waiting: 'The welcome message is being written…',
        noteWriting: 'Adding the final note…',
        ready: 'The message is ready.',
        enter: 'Continue to the website',
        hashtag: '#Murshid_S7_Developer_Team',
        closingNote: 'Please note that you are now inside the website.',
        body: `Welcome ✿ to Murshid ۝
Your daily companion ♡ to use your phone with ease and enjoy a clearer, smoother experience! (◔‿◔)

♥️ Dear Murshid user,

To help us offer you the best experience, we recommend visiting the Murshid website from time to time to follow the latest releases and updates. 💫

📌 How can you follow the latest Murshid updates?

1. Open the Murshid app.
2. Go to Settings.
3. Tap “Visit website” and wait a moment.

Whenever a new version of Murshid becomes available, you’ll find its details clearly on the website, and you’ll also receive a notification from the app so you can stay up to date! 🚀

Don’t forget to follow Murshid’s official channel inside the app to keep up with everything new and enjoy an easier, better experience with us. ♥️

Murshid S7 ۝
Your daily companion, always here to help you move forward! 💫

`,
      }
    : {
        direction: 'rtl',
        language: 'ar-EG',
        eyebrow: 'رسالة من فريق مطوري مرشد',
        title: 'مرشد S7',
        skip: 'عرض الرسالة كاملة',
        waiting: 'بنكتبلك رسالة الترحيب…',
        noteWriting: 'بنضيف آخر سطر…',
        ready: 'الرسالة جاهزة.',
        enter: 'ادخل الموقع',
        hashtag: '#فريق_مطوري_مرشد_S7',
        closingNote: 'مع العلم انك الان داخل الموقع الالكتروني',
        body: `أهــلًا بيك ✿ في مُرشد ۝
رفيقك اليومي ♡ علشان تستخدم موبايلك بسهولة، وتستمتع بتجربة أسهل وأوضح! (◔‿◔)

♥️ عزيزنا مستخدم مُرشد،

علشان نقدر نقدّم لك أفضل تجربة، بننصحك تزور موقع مُرشد الإلكتروني من وقت للتاني، علشان تتابع أحدث الإصدارات والتحديثات أول بأول. 💫

📌 إزاي تتابع آخر تحديثات مُرشد؟

١. افتح تطبيق مُرشد.
٢. ادخل على الإعدادات.
٣. اضغط على «زيارة الموقع الإلكتروني»، واستنى شوية.

أول ما يتوفر إصدار جديد من مُرشد، هتلاقي تفاصيله واضحة على الموقع، وكمان هيوصلك إشعار من التطبيق نفسه علشان تفضل عارف كل جديد! 🚀

ومتنساش تتابع القناة الرسمية لمُرشد الموجودة جوه التطبيق، علشان يوصلك كل جديد وتستمتع بتجربة أسهل وأفضل معانا. ♥️

مُرشد S7 ۝
رفيقك اليومي، وكل يوم معاك للأفضل! 💫

`,
      };

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const overlay = make('div', 'intro-overlay');
  overlay.dataset.introOverlay = '';
  overlay.dataset.skipVerified = '';
  overlay.setAttribute('lang', introCopy.language);
  overlay.setAttribute('dir', introCopy.direction);

  const panel = make('section', 'intro-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'intro-title');
  panel.setAttribute('aria-describedby', 'intro-message-accessible');
  panel.tabIndex = -1;

  const topLine = make('div', 'intro-topline');
  const brand = make('div', 'intro-brand');
  brand.setAttribute('aria-hidden', 'true');
  brand.append(make('span', 'intro-brand-mark', pageLanguage === 'en' ? 'M' : 'م'));
  brand.append(make('span', 'intro-brand-name', pageLanguage === 'en' ? 'Murshid S7' : 'مرشد S7'));
  const skipButton = make('button', 'intro-skip', introCopy.skip);
  skipButton.type = 'button';
  skipButton.setAttribute('data-intro-skip', '');
  topLine.append(brand, skipButton);

  const heading = make('p', 'intro-eyebrow', introCopy.eyebrow);
  const title = make('h1', 'intro-title', introCopy.title);
  title.id = 'intro-title';
  const typedCopy = make('p', 'intro-typed-copy');
  typedCopy.setAttribute('aria-hidden', 'true');
  typedCopy.dir = introCopy.direction;
  typedCopy.classList.add('is-typing');

  const signature = make('div', 'intro-signature');
  signature.hidden = true;
  const hashtag = make('bdi', 'intro-hashtag', introCopy.hashtag);
  hashtag.dir = 'ltr';
  signature.append(hashtag);
  const verifiedMark = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  verifiedMark.setAttribute('class', 'intro-verified');
  verifiedMark.setAttribute('viewBox', '0 0 24 24');
  verifiedMark.setAttribute('aria-hidden', 'true');
  verifiedMark.setAttribute('focusable', 'false');
  const verifiedCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  verifiedCircle.setAttribute('cx', '12');
  verifiedCircle.setAttribute('cy', '12');
  verifiedCircle.setAttribute('r', '11');
  verifiedCircle.setAttribute('fill', '#2787f5');
  const verifiedCheck = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  verifiedCheck.setAttribute('d', 'm6.7 12.3 3.4 3.3 7.2-7.4');
  verifiedCheck.setAttribute('fill', 'none');
  verifiedCheck.setAttribute('stroke', '#fff');
  verifiedCheck.setAttribute('stroke-width', '2.4');
  verifiedCheck.setAttribute('stroke-linecap', 'round');
  verifiedCheck.setAttribute('stroke-linejoin', 'round');
  verifiedMark.append(verifiedCircle, verifiedCheck);
  signature.append(verifiedMark);

  const closingNote = make('p', 'intro-closing-note');
  closingNote.hidden = true;
  closingNote.dir = introCopy.direction;
  const accessibleMessage = make('p', 'intro-sr-only', `${introCopy.body}${introCopy.hashtag}\n${introCopy.closingNote}`);
  accessibleMessage.id = 'intro-message-accessible';
  const actions = make('div', 'intro-actions');
  const hint = make('p', 'intro-hint', introCopy.waiting);
  hint.setAttribute('role', 'status');
  hint.setAttribute('aria-live', 'polite');
  const enterButton = make('button', 'intro-enter', introCopy.enter);
  enterButton.type = 'button';
  enterButton.hidden = true;
  actions.append(hint, enterButton);

  panel.append(topLine, heading, title, typedCopy, signature, closingNote, accessibleMessage, actions);
  overlay.append(panel);

  const inertedNodes = Array.from(document.body.children)
    .filter((node) => node !== overlay && node.tagName !== 'SCRIPT')
    .map((node) => ({ node, wasInert: node.inert }));
  document.body.insertBefore(overlay, document.body.firstChild);
  inertedNodes.forEach(({ node }) => { node.inert = true; });
  document.body.classList.add('intro-open');
  document.documentElement.classList.remove('intro-pending');

  let complete = false;
  let timer = 0;
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(introCopy.language, { granularity: 'grapheme' })
    : null;
  const graphemes = segmenter
    ? Array.from(segmenter.segment(introCopy.body), (part) => part.segment)
    : Array.from(introCopy.body);
  const noteGraphemes = segmenter
    ? Array.from(segmenter.segment(introCopy.closingNote), (part) => part.segment)
    : Array.from(introCopy.closingNote);
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let index = 0;
  let noteIndex = 0;

  const finishMessage = () => {
    if (complete) return;
    complete = true;
    window.clearTimeout(timer);
    typedCopy.textContent = introCopy.body;
    typedCopy.classList.remove('is-typing');
    signature.hidden = false;
    signature.classList.add('is-visible');
    closingNote.textContent = introCopy.closingNote;
    closingNote.hidden = false;
    closingNote.classList.remove('is-typing');
    skipButton.hidden = true;
    enterButton.hidden = false;
    hint.textContent = introCopy.ready;
    window.setTimeout(() => enterButton.focus({ preventScroll: false }), 100);
  };

  const typeClosingNote = () => {
    const wasAtBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 72;
    const fragment = document.createDocumentFragment();
    for (let count = 0; count < 2 && noteIndex < noteGraphemes.length; count += 1, noteIndex += 1) {
      fragment.append(document.createTextNode(noteGraphemes[noteIndex]));
    }
    closingNote.append(fragment);
    if (wasAtBottom) panel.scrollTop = panel.scrollHeight;
    if (noteIndex >= noteGraphemes.length) finishMessage();
    else timer = window.setTimeout(typeClosingNote, 18);
  };

  const finishBodyTyping = () => {
    if (complete) return;
    typedCopy.textContent = introCopy.body;
    typedCopy.classList.remove('is-typing');
    signature.hidden = false;
    signature.classList.add('is-visible');
    closingNote.hidden = false;
    closingNote.classList.add('is-typing');
    hint.textContent = introCopy.noteWriting;
    if (reducedMotion) finishMessage();
    else timer = window.setTimeout(typeClosingNote, 140);
  };

  const typeNext = () => {
    const wasAtBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 72;
    const fragment = document.createDocumentFragment();
    for (let count = 0; count < 2 && index < graphemes.length; count += 1, index += 1) {
      fragment.append(document.createTextNode(graphemes[index]));
    }
    typedCopy.append(fragment);
    if (wasAtBottom) panel.scrollTop = panel.scrollHeight;
    if (index >= graphemes.length) finishBodyTyping();
    else timer = window.setTimeout(typeNext, 18);
  };

  skipButton.addEventListener('click', finishMessage);
  enterButton.addEventListener('click', () => {
    if (!complete) return;
    try {
      window.localStorage.setItem(introKey, '1');
    } catch {
      // The message can still be dismissed for this page view.
    }
    document.documentElement.classList.add('intro-seen');
    document.body.classList.remove('intro-open');
    overlay.classList.add('is-closing');
    window.setTimeout(() => {
      overlay.remove();
      inertedNodes.forEach(({ node, wasInert }) => { node.inert = wasInert; });
      const returnFocus = document.querySelector('.brand, #main h1, main');
      returnFocus?.focus?.({ preventScroll: true });
    }, 360);
  });

  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !complete) {
      event.preventDefault();
      finishMessage();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [skipButton, enterButton].filter((button) => !button.hidden && !button.disabled);
    if (!focusable.length) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (reducedMotion) {
    finishMessage();
  } else {
    window.setTimeout(() => skipButton.focus({ preventScroll: true }), 0);
    timer = window.setTimeout(typeNext, 180);
  }
}

initializeWelcomeIntro();

const downloadConfig = window.MURSHID_DOWNLOAD_CONFIG || {};
const fileId = typeof downloadConfig.googleDriveFileId === 'string'
  ? downloadConfig.googleDriveFileId.trim()
  : '';
const downloadUrl = fileId && /^[\w-]+$/.test(fileId)
  ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
  : '';

const releaseCountdown = document.querySelector('[data-release-countdown]');
if (releaseCountdown) {
  const deadline = Date.parse(releaseCountdown.dataset.deadline || '');
  const hours = releaseCountdown.querySelector('[data-countdown-hours]');
  const minutes = releaseCountdown.querySelector('[data-countdown-minutes]');
  const seconds = releaseCountdown.querySelector('[data-countdown-seconds]');
  const clock = releaseCountdown.querySelector('[data-countdown-clock]');
  const expired = releaseCountdown.querySelector('[data-countdown-expired]');
  const locale = pageLanguage === 'en' ? 'en-US' : 'ar-EG';
  const zero = pageLanguage === 'en' ? '0' : '٠';
  const numberFormat = new Intl.NumberFormat(locale, { useGrouping: false });

  if (Number.isFinite(deadline) && hours && minutes && seconds && clock && expired) {
    const updateCountdown = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        clock.hidden = true;
        expired.hidden = false;
        window.clearInterval(countdownInterval);
        return;
      }

      const wholeSeconds = Math.floor(remaining / 1000);
      const totalHours = Math.floor(wholeSeconds / 3600);
      const remainingMinutes = Math.floor((wholeSeconds % 3600) / 60);
      const remainingSeconds = wholeSeconds % 60;
      hours.textContent = numberFormat.format(totalHours);
      minutes.textContent = numberFormat.format(remainingMinutes).padStart(2, zero);
      seconds.textContent = numberFormat.format(remainingSeconds).padStart(2, zero);
    };

    let countdownInterval;
    updateCountdown();
    if (Date.now() < deadline) countdownInterval = window.setInterval(updateCountdown, 1000);
  }
}

document.querySelectorAll('[data-download-queue]').forEach((queue) => {
  const startButton = queue.querySelector('[data-queue-start]');
  const status = queue.querySelector('[data-queue-status]');
  const downloadButton = queue.querySelector('[data-queue-download]');
  if (!startButton || !status || !downloadButton || !downloadUrl) return;

  downloadButton.href = downloadUrl;
  startButton.addEventListener('click', () => {
    if (startButton.disabled) return;
    startButton.disabled = true;
    startButton.hidden = true;
    status.textContent = copy.queueWait;
    status.hidden = false;

    window.setTimeout(() => {
      downloadButton.hidden = false;
      status.textContent = copy.queueReady;
    }, 5000);
  }, { once: true });
});

function initializeAutoplayVideo() {
  const video = document.querySelector('[data-autoplay-video]');
  const source = video?.querySelector('source[data-src]');
  if (!video || !source) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (reducedMotion) video.removeAttribute('autoplay');

  let sourceLoaded = false;
  const loadAndPlay = () => {
    if (!sourceLoaded) {
      source.src = source.dataset.src || '';
      source.removeAttribute('data-src');
      video.load();
      sourceLoaded = true;
    }
    if (!reducedMotion) {
      const playback = video.play();
      playback?.catch(() => {
        // Browser autoplay policies may require the user to press Play.
      });
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        loadAndPlay();
      } else if (!video.paused && !video.ended) {
        video.pause();
      }
    }, { rootMargin: '250px 0px' });
    observer.observe(video);
  } else {
    loadAndPlay();
  }
}

initializeAutoplayVideo();

function addVerifiedBrandMarks() {
  if (pageLanguage !== 'ar') return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.includes('مرشد')) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest('script,style,noscript,textarea,svg,[data-skip-verified]')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((textNode) => {
    const fragment = document.createDocumentFragment();
    textNode.nodeValue.split(/(مرشد)/g).forEach((part) => {
      if (part === 'مرشد') {
        const brand = document.createElement('span');
        brand.className = 'verified-brand';
        brand.textContent = part;
        fragment.append(brand);
      } else if (part) {
        fragment.append(document.createTextNode(part));
      }
    });
    textNode.replaceWith(fragment);
  });
}

addVerifiedBrandMarks();


function initializeAdminDiscovery() {
  const triggers = [...document.querySelectorAll('[data-admin-unlock-trigger]')];
  const links = [...document.querySelectorAll('[data-admin-unlock-link]')];
  if (!links.length) return;

  const countKey = 'murshid-admin-discovery-count-v1';
  const unlockedKey = 'murshid-admin-discovery-unlocked-v1';
  let count = 0;
  let unlocked = false;

  try {
    count = Number.parseInt(sessionStorage.getItem(countKey) || '0', 10) || 0;
    unlocked = sessionStorage.getItem(unlockedKey) === '1';
  } catch {
    // Keep the counter in memory if browser storage is unavailable.
  }

  const revealLinks = () => {
    links.forEach((link) => { link.hidden = false; });
  };

  if (unlocked) revealLinks();
  if (unlocked || !triggers.length) return;

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      count = Math.min(30, count + 1);
      try { sessionStorage.setItem(countKey, String(count)); } catch {}

      if (count >= 30) {
        unlocked = true;
        try { sessionStorage.setItem(unlockedKey, '1'); } catch {}
        revealLinks();
      }
    });
  });
}

initializeAdminDiscovery();


function initializeAdminPageVisibility() {
  const root = document.documentElement;
  if (!root.classList.contains('admin-discovery-locked')) return;
  try {
    if (sessionStorage.getItem('murshid-admin-discovery-unlocked-v1') === '1') {
      root.classList.remove('admin-discovery-locked');
    }
  } catch {
    // Leave the Admin page hidden if session storage cannot be checked.
  }
}

initializeAdminPageVisibility();


function initializeDeveloperTeamForms() {
  const forms = [...document.querySelectorAll('[data-developer-form]')];
  if (!forms.length) return;
  const email = 'seiferfan077@gmail.com';
  const copy = {
    ar: { name: 'اكتب اسمك بشكل صحيح عشان نقدر نراجع الطلب.', phone: 'راجع رقم الموبايل واكتبه بشكل صحيح.', key: 'اكتب مفتاح الوصول VIP اللي معاك.', consent: 'لازم توافق على البنود والخصوصية قبل تجهيز الطلب.', ready: 'اتجهّزت مسودة الإيميل. راجعها واضغط إرسال عشان يوصل طلبك للفريق.' },
    en: { name: 'Enter your name so the team can review the application.', phone: 'Check and enter a valid phone number.', key: 'Enter your VIP access key.', consent: 'Please accept the terms and privacy rules before preparing the application.', ready: 'The email draft is ready. Review it and press Send to submit your application.' },
  };
  forms.forEach((form) => {
    const language = form.dataset.language === 'en' ? 'en' : 'ar';
    const text = copy[language];
    const status = form.querySelector('[data-form-status]');
    const notice = form.querySelector('[data-consent-notice]');
    const consent = form.elements.consent;
    const setStatus = (message, state = '') => { status.textContent = message; status.dataset.state = state; };
    consent?.addEventListener('change', () => {
      if (notice) notice.hidden = !consent.checked;
      if (consent.checked) setStatus('');
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = form.elements.name.value.trim().replace(/[\r\n]+/g, ' ');
      const phone = form.elements.phone.value.trim().replace(/[\r\n]+/g, ' ');
      const vipKey = form.elements.vipKey.value.trim().replace(/[\r\n]+/g, ' ');
      const phoneDigits = phone.replace(/[^0-9٠-٩]/g, '');
      if (name.length < 2) return setStatus(text.name, 'error');
      if (phoneDigits.length < 6) return setStatus(text.phone, 'error');
      if (!vipKey) return setStatus(text.key, 'error');
      if (!consent.checked) return setStatus(text.consent, 'error');
      const subject = language === 'en'
        ? 'Murshid developer team application — Admin review'
        : 'طلب الانضمام لفريق مطوري مُرشد S7 — مراجعة Admin';
      const body = language === 'en'
        ? [
            'Hello Murshid S7 development team,',
            'I am applying to join the Murshid developer team and asking you to review my application for a possible Admin role. I want to contribute responsibly to improving the app and serving its users.',
            '', 'My details:', `Full name: ${name}`, `Phone number: ${phone}`, `VIP access key: ${vipKey}`,
            '',
            'I confirm that the information is accurate and that I am authorized to submit this key for review. I understand that a key not registered on the website is not rejected automatically and will be reviewed manually. Sending this application does not grant Admin access or access to user data. The team may contact me for clarification or a trial task.',
            'If approved, I will protect user privacy, keep keys and information confidential, follow security guidance, and use any permission only for authorized work. I understand that sharing credentials or misusing permissions may lead to rejection or removal of access. I agree to the terms, privacy rules, and responsible work commitment.',
            '', 'Please review my application and contact me with the decision and next steps.', 'Sincerely,', name,
          ].join('\n')
        : [
            'السلام عليكم ورحمة الله وبركاته،',
            'إلى فريق مطوري مُرشد S7،',
            'أتقدم بطلب الانضمام إلى فريق مطوري مُرشد والنظر في منحي دور Admin بعد مراجعة الطلب. أرغب في المساهمة في تحسين التطبيق وخدمة مستخدميه، وأتعهد بالعمل بجدية وأمانة واحترام واتباع توجيهات الفريق وسياسات الخصوصية والأمان.',
            '', 'بياناتي:', `الاسم: ${name}`, `رقم الهاتف: ${phone}`, `مفتاح الوصول VIP: ${vipKey}`,
            '',
            'أؤكد صحة البيانات وأنني مخول باستخدام المفتاح المذكور لغرض مراجعة هذا الطلب. أعلم أن المفتاح غير المسجل بالموقع لا يؤدي إلى رفض الطلب تلقائيًا، بل يخضع للمراجعة اليدوية، وأن تقديم الطلب لا يمنحني صلاحية Admin أو وصولًا لأي بيانات. القرار يعود للفريق وقد يطلب توضيحات إضافية أو مهمة تجريبية.',
            'إذا تمت الموافقة، أتعهد بالمحافظة على سرية معلومات المستخدمين والمفاتيح، وعدم استخدامها إلا ضمن المهام المصرح بها، واحترام الخصوصية والإبلاغ عن أي مشكلة أمنية. أفهم أن مشاركة بيانات الدخول أو إساءة استخدام الصلاحيات قد يؤدي إلى رفض الطلب أو سحبها، وأوافق على الالتزام بالشروط والخصوصية والعمل بأمانة وضمير كامل.',
            '', 'أرجو مراجعة طلبي والتواصل معي لإبلاغي بالقرار والخطوات التالية.', 'مع خالص التقدير،', name,
          ].join('\n');
      setStatus(text.ready);
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  });
}

initializeDeveloperTeamForms();
