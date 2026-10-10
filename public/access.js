const keyForm = document.querySelector('[data-key-form]');
const keyResult = document.querySelector('[data-key-result]');
const keyOutput = document.querySelector('[data-key-output]');
const keyMessage = document.querySelector('[data-key-message]');
const copyMessage = document.querySelector('[data-copy-message]');
const submitButton = document.querySelector('[data-key-submit]');
const submitLabel = document.querySelector('[data-submit-label]');
const isEnglish = document.documentElement.lang.toLowerCase().startsWith('en');
const messages = isEnglish
  ? {
      generating: 'Generating your key…',
      generate: 'Generate key',
      requestError: 'We could not create the key. Check your details and try again later.',
      success: 'Your key was created and the request was recorded.',
      copied: 'Key copied. Save it somewhere private.',
      copyFallback: 'Select the key above and copy it manually.',
    }
  : {
      generating: 'جاري توليد المفتاح…',
      generate: 'توليد مفتاح',
      requestError: 'تعذّر إنشاء المفتاح. راجع بياناتك وحاول تاني بعد شوية.',
      success: 'تم إنشاء المفتاح وتسجيل طلبك.',
      copied: 'اتنسخ المفتاح. احفظه في مكان خاص.',
      copyFallback: 'حدّدنا المفتاح؛ انسخه يدويًا من هنا.',
    };

function showMessage(element, message, isError = true) {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
  element.classList.toggle('is-error', isError);
  element.classList.toggle('is-success', !isError);
}

if (keyForm && keyResult && keyOutput && submitButton) {
  keyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage(keyMessage, '');
    showMessage(copyMessage, '');
    if (!keyForm.reportValidity()) return;

    const formData = new FormData(keyForm);
    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      consent: formData.get('consent') === 'on',
      website: String(formData.get('website') || ''),
    };

    submitButton.disabled = true;
    if (submitLabel) submitLabel.textContent = messages.generating;

    try {
      const response = await fetch('/api/access-keys', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.key !== 'string') {
        throw new Error(isEnglish ? messages.requestError : (result.error || messages.requestError));
      }

      keyOutput.textContent = result.key;
      keyForm.hidden = true;
      keyResult.hidden = false;
      keyOutput.focus();
      showMessage(keyMessage, messages.success, false);
    } catch (error) {
      showMessage(keyMessage, isEnglish ? messages.requestError : (error instanceof Error ? error.message : messages.requestError));
      submitButton.disabled = false;
      if (submitLabel) submitLabel.textContent = messages.generate;
    }
  });

  document.querySelector('[data-copy-key]')?.addEventListener('click', async () => {
    const key = keyOutput.textContent || '';
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      showMessage(copyMessage, messages.copied, false);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(keyOutput);
      selection?.removeAllRanges();
      selection?.addRange(range);
      showMessage(copyMessage, messages.copyFallback);
      keyOutput.focus();
    }
  });
}
