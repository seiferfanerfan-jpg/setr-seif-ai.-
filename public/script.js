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

const countdown = document.querySelector('#release-countdown');
if (countdown) {
  const releaseAt = new Date(countdown.dataset.releaseAt).getTime();
  const hoursNode = document.querySelector('#countdown-hours');
  const minutesNode = document.querySelector('#countdown-minutes');
  const secondsNode = document.querySelector('#countdown-seconds');
  const statusNode = document.querySelector('#countdown-status');
  const downloadLink = document.querySelector('#download-link');
  const fallback = document.querySelector('#download-fallback');
  const fallbackMessage = document.querySelector('#download-fallback-message');
  const releasesApi = countdown.dataset.releasesApi;
  const releasesPage = countdown.dataset.releasesPage;
  const digits = new Intl.NumberFormat('ar-EG', { minimumIntegerDigits: 2, useGrouping: false });
  let releaseCheckStarted = false;
  let timer = null;

  function showNoRelease(message) {
    if (statusNode) statusNode.textContent = '';
    if (downloadLink) downloadLink.hidden = true;
    if (fallbackMessage && message) fallbackMessage.textContent = message;
    if (fallback) fallback.hidden = false;
  }

  async function revealPublishedApk() {
    if (releaseCheckStarted) return;
    releaseCheckStarted = true;
    if (statusNode) statusNode.textContent = 'العدّاد خلص؛ بنتأكد إن ملف التحميل الرسمي موجود على GitHub.';

    try {
      const response = await fetch(releasesApi, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('GitHub release unavailable');
      const release = await response.json();
      const apk = Array.isArray(release.assets)
        ? release.assets.find((asset) => typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.apk'))
        : null;

      if (!apk || typeof apk.browser_download_url !== 'string') {
        showNoRelease('العدّاد خلص، بس ملف APK الرسمي لسه ما اترفعش على GitHub. هنضيف لينك التحميل هنا أول ما يبقى جاهز.');
        return;
      }

      const downloadUrl = new URL(apk.browser_download_url);
      if (downloadUrl.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(downloadUrl.hostname)) {
        showNoRelease('ظهر إصدار، بس رابط التحميل مش من GitHub الرسمي. مش هنعرِض لينك غير موثوق.');
        return;
      }

      if (downloadLink) {
        downloadLink.href = downloadUrl.href;
        downloadLink.hidden = false;
      }
      if (statusNode) statusNode.textContent = 'أول نسخة بقت جاهزة على GitHub — دوس على الزر عشان تحمّلها.';
    } catch {
      showNoRelease('العدّاد خلص، لكن مش قادرين نتحقق من GitHub دلوقتي. جرّب تفتح صفحة الإصدارات الرسمية بعد شوية.');
    }

    if (fallback) {
      const releaseAnchor = fallback.querySelector('a');
      if (releaseAnchor && releasesPage) releaseAnchor.href = releasesPage;
    }
  }

  function renderCountdown() {
    const secondsRemaining = Math.max(0, Math.floor((releaseAt - Date.now()) / 1000));
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = secondsRemaining % 60;

    if (hoursNode) hoursNode.textContent = digits.format(hours);
    if (minutesNode) minutesNode.textContent = digits.format(minutes);
    if (secondsNode) secondsNode.textContent = digits.format(seconds);

    if (secondsRemaining === 0) {
      if (timer) window.clearInterval(timer);
      revealPublishedApk();
    }
  }

  if (Number.isFinite(releaseAt)) {
    renderCountdown();
    if (releaseAt > Date.now()) timer = window.setInterval(renderCountdown, 1000);
  } else {
    showNoRelease('موعد العدّاد مش مضبوط دلوقتي. هنعلن رابط التحميل الرسمي هنا لما يبقى جاهز.');
  }
}
