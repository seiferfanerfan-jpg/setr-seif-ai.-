const keyForm = document.querySelector('[data-key-form]');
const keyResult = document.querySelector('[data-key-result]');
const keyOutput = document.querySelector('[data-key-output]');
const keyMessage = document.querySelector('[data-key-message]');
const copyMessage = document.querySelector('[data-copy-message]');
const submitButton = document.querySelector('[data-key-submit]');
const submitLabel = document.querySelector('[data-submit-label]');

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
    if (submitLabel) submitLabel.textContent = 'جاري توليد المفتاح…';

    try {
      const response = await fetch('/api/access-keys', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.key !== 'string') {
        throw new Error(result.error || 'تعذّر إنشاء المفتاح. حاول تاني بعد شوية.');
      }

      keyOutput.textContent = result.key;
      keyForm.hidden = true;
      keyResult.hidden = false;
      keyOutput.focus();
      showMessage(keyMessage, 'تم إنشاء المفتاح وتسجيل طلبك.', false);
    } catch (error) {
      showMessage(keyMessage, error instanceof Error ? error.message : 'تعذّر إنشاء المفتاح. حاول تاني بعد شوية.');
      submitButton.disabled = false;
      if (submitLabel) submitLabel.textContent = 'توليد مفتاح';
    }
  });

  document.querySelector('[data-copy-key]')?.addEventListener('click', async () => {
    const key = keyOutput.textContent || '';
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      showMessage(copyMessage, 'اتنسخ المفتاح. احفظه في مكان خاص.', false);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(keyOutput);
      selection?.removeAllRanges();
      selection?.addRange(range);
      showMessage(copyMessage, 'حدّدنا المفتاح؛ انسخه يدويًا من هنا.');
      keyOutput.focus();
    }
  });
}
