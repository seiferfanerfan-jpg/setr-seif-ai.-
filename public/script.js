const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isExpanded));
    menuButton.setAttribute('aria-label', isExpanded ? 'افتح القائمة' : 'اقفل القائمة');
    navigation.classList.toggle('is-open', !isExpanded);
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'افتح القائمة');
      navigation.classList.remove('is-open');
    });
  });
}

const year = document.querySelector('#current-year');
if (year) year.textContent = String(new Date().getFullYear());

const welcomeAnnouncement = document.querySelector('[data-welcome-announcement]');
if (welcomeAnnouncement) {
  const welcomeDismissedKey = 'murshid-welcome-dismissed-v1';
  const dismissWelcome = welcomeAnnouncement.querySelector('[data-dismiss-welcome]');
  let alreadyDismissed = false;
  try {
    alreadyDismissed = window.localStorage.getItem(welcomeDismissedKey) === '1';
  } catch {
    alreadyDismissed = false;
  }
  welcomeAnnouncement.hidden = alreadyDismissed;
  dismissWelcome?.addEventListener('click', () => {
    welcomeAnnouncement.hidden = true;
    try {
      window.localStorage.setItem(welcomeDismissedKey, '1');
    } catch {
      // The message still closes for this page view if storage is unavailable.
    }
  });
}

const downloadConfig = window.MURSHID_DOWNLOAD_CONFIG || {};
const downloadWidget = document.querySelector('[data-download-widget]');

if (downloadWidget) {
  const releaseAt = Date.parse(downloadConfig.availableAt || '');
  const rawDriveUrl = typeof downloadConfig.googleDriveUrl === 'string'
    ? downloadConfig.googleDriveUrl.trim()
    : '';
  const hoursNode = downloadWidget.querySelector('[data-hours]');
  const minutesNode = downloadWidget.querySelector('[data-minutes]');
  const secondsNode = downloadWidget.querySelector('[data-seconds]');
  const countdownClock = downloadWidget.querySelector('[data-countdown-clock]');
  const statusNode = downloadWidget.querySelector('[data-download-status]');
  const pendingNode = downloadWidget.querySelector('[data-download-pending]');
  const linkField = downloadWidget.querySelector('[data-drive-url-field]');
  const copyButtons = [...downloadWidget.querySelectorAll('[data-copy-download-link]')];
  const openLinks = [...downloadWidget.querySelectorAll('[data-open-drive]')];
  const digits = new Intl.NumberFormat('ar-EG', { minimumIntegerDigits: 2, useGrouping: false });
  let timer = null;
  let driveUrl = '';

  try {
    const candidate = new URL(rawDriveUrl);
    if (candidate.protocol === 'https:' && ['drive.google.com', 'docs.google.com'].includes(candidate.hostname)) {
      driveUrl = candidate.href;
    }
  } catch {
    driveUrl = '';
  }

  function setUnavailable(message, status) {
    if (linkField) {
      linkField.value = '';
      linkField.disabled = true;
    }
    copyButtons.forEach((button) => { button.disabled = true; });
    openLinks.forEach((link) => { link.hidden = true; });
    if (pendingNode) {
      pendingNode.textContent = message;
      pendingNode.hidden = false;
    }
    if (statusNode) statusNode.textContent = status;
  }

  function enableDriveLink() {
    if (!driveUrl) {
      setUnavailable(
        'العدّاد خلص، بس ملف APK لسه مش مرفوع على Google Drive. حقل النسخ هيتفعل لما الرابط الرسمي يبقى جاهز ومتاح للعامة.',
        'التحميل لسه مش متاح؛ ما فيش رابط رسمي للملف لحد دلوقتي.'
      );
      return;
    }

    if (linkField) {
      linkField.value = driveUrl;
      linkField.disabled = false;
    }
    copyButtons.forEach((button) => { button.disabled = false; });
    openLinks.forEach((link) => {
      link.href = driveUrl;
      link.hidden = false;
    });
    if (pendingNode) pendingNode.hidden = true;
    if (statusNode) statusNode.textContent = 'رابط Google Drive الرسمي بقى جاهز؛ افتحه أو انسخه والصقه في Chrome.';
  }

  async function copyDriveLink() {
    if (!driveUrl || Date.now() < releaseAt) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(driveUrl);
      } else {
        linkField?.focus();
        linkField?.select();
        if (!document.execCommand || !document.execCommand('copy')) throw new Error('Clipboard unavailable');
      }
      if (statusNode) statusNode.textContent = 'اتنسخ الرابط. افتح Chrome والصقه في شريط العنوان، وبعدها اضغط انتقال.';
    } catch {
      linkField?.focus();
      linkField?.select();
      if (statusNode) statusNode.textContent = 'ما قدرناش ننسخ تلقائيًا؛ حدّد الرابط الظاهر وانسخه يدويًا.';
    }
  }

  copyButtons.forEach((button) => button.addEventListener('click', copyDriveLink));

  function renderDownloadState() {
    const secondsRemaining = Math.max(0, Math.floor((releaseAt - Date.now()) / 1000));
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = secondsRemaining % 60;

    if (hoursNode) hoursNode.textContent = digits.format(hours);
    if (minutesNode) minutesNode.textContent = digits.format(minutes);
    if (secondsNode) secondsNode.textContent = digits.format(seconds);

    if (secondsRemaining === 0) {
      if (timer) window.clearInterval(timer);
      enableDriveLink();
    } else {
      setUnavailable(
        'الملف لسه مش موجود على Drive؛ الرابط وزر النسخ هيتفعلوا بعد انتهاء العدّاد ورفع الملف الرسمي.',
        'رابط التحميل هيتاح بعد انتهاء العدّاد ورفع الملف على Google Drive.'
      );
    }
  }

  if (!Number.isFinite(releaseAt)) {
    if (countdownClock) countdownClock.hidden = true;
    setUnavailable('الرابط الرسمي هيتضاف هنا بعد رفع ملف APK على Google Drive.', 'موعد الإتاحة مش متاح دلوقتي.');
  } else {
    renderDownloadState();
    if (releaseAt > Date.now()) timer = window.setInterval(renderDownloadState, 1000);
  }
}
