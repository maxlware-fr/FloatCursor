document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    enabled: document.getElementById('enabled'),
    cursorMode: document.getElementById('cursorMode'),
    skinSelect: document.getElementById('skinSelect'),
    manageSkins: document.getElementById('manageSkins'),
    trailLength: document.getElementById('trailLength'),
    trailLengthValue: document.getElementById('trailLengthValue'),
    trailOpacity: document.getElementById('trailOpacity'),
    trailOpacityValue: document.getElementById('trailOpacityValue'),
    trailColor: document.getElementById('trailColor'),
    clickEffect: document.getElementById('clickEffect'),
    openSkins: document.getElementById('openSkins')
  };

  // Charger les paramètres et la liste des skins
  function loadSettings() {
    chrome.storage.local.get([
      'enabled', 'cursorMode', 'skins', 'activeSkinId',
      'trailLength', 'trailOpacity', 'trailColor', 'clickEffect'
    ], (data) => {
      elements.enabled.checked = data.enabled ?? true;
      elements.cursorMode.value = data.cursorMode ?? 'element';
      elements.trailLength.value = data.trailLength ?? 10;
      elements.trailLengthValue.textContent = data.trailLength ?? 10;
      elements.trailOpacity.value = data.trailOpacity ?? 0.6;
      elements.trailOpacityValue.textContent = data.trailOpacity ?? 0.6;
      elements.trailColor.value = data.trailColor ?? '#ff5722';
      elements.clickEffect.checked = data.clickEffect ?? true;

      // Remplir le sélecteur de skins
      const skins = data.skins || [];
      elements.skinSelect.innerHTML = '';
      skins.forEach(skin => {
        const option = document.createElement('option');
        option.value = skin.id;
        option.textContent = skin.name;
        if (skin.id === data.activeSkinId) option.selected = true;
        elements.skinSelect.appendChild(option);
      });
    });
  }

  loadSettings();

  // Sauvegarder les changements
  function saveSetting(key, value) {
    chrome.storage.local.set({ [key]: value });
  }

  elements.enabled.addEventListener('change', (e) => saveSetting('enabled', e.target.checked));
  elements.cursorMode.addEventListener('change', (e) => saveSetting('cursorMode', e.target.value));
  elements.skinSelect.addEventListener('change', (e) => saveSetting('activeSkinId', e.target.value));
  elements.trailLength.addEventListener('input', (e) => {
    elements.trailLengthValue.textContent = e.target.value;
    saveSetting('trailLength', parseInt(e.target.value));
  });
  elements.trailOpacity.addEventListener('input', (e) => {
    elements.trailOpacityValue.textContent = e.target.value;
    saveSetting('trailOpacity', parseFloat(e.target.value));
  });
  elements.trailColor.addEventListener('input', (e) => saveSetting('trailColor', e.target.value));
  elements.clickEffect.addEventListener('change', (e) => saveSetting('clickEffect', e.target.checked));

  // Ouvrir le gestionnaire de skins
  elements.manageSkins.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('skins/skins.html') });
  });
  elements.openSkins.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('skins/skins.html') });
  });
});