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
  const numberFormat = new Intl.NumberFormat('ar-EG', { useGrouping: false });

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
      minutes.textContent = numberFormat.format(remainingMinutes).padStart(2, '٠');
      seconds.textContent = numberFormat.format(remainingSeconds).padStart(2, '٠');
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
    status.textContent = 'نأسف لك، تم وضعك في طابور الانتظار.';
    status.hidden = false;

    window.setTimeout(() => {
      downloadButton.hidden = false;
      status.textContent = 'أصبح بإمكانك تنزيل التطبيق الآن.';
    }, 5000);
  }, { once: true });
});

function addVerifiedBrandMarks() {
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
