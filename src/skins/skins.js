let skins = [];
let editingId = null;

const modal = document.getElementById('skinModal');
const modalTitle = document.getElementById('modalTitle');
const skinName = document.getElementById('skinName');
const skinType = document.getElementById('skinType');
const svgGroup = document.getElementById('svgGroup');
const imageGroup = document.getElementById('imageGroup');
const cssGroup = document.getElementById('cssGroup');
const skinSvg = document.getElementById('skinSvg');
const skinImage = document.getElementById('skinImage');
const imagePreview = document.getElementById('imagePreview');
const skinCss = document.getElementById('skinCss');
const skinColor = document.getElementById('skinColor');
const skinSize = document.getElementById('skinSize');

// Charger les skins
async function loadSkins() {
  const data = await chrome.storage.local.get('skins');
  skins = data.skins || [];
  renderSkinList();
}

// Sauvegarder les skins
async function saveSkins() {
  await chrome.storage.local.set({ skins });
}

// Rendu de la liste
function renderSkinList() {
  const list = document.getElementById('skinList');
  list.innerHTML = '';
  skins.forEach(skin => {
    const card = document.createElement('div');
    card.className = 'skin-card';
    card.innerHTML = `
      <h3>${skin.name}</h3>
      <p>Type : ${skin.type}</p>
      <div class="skin-actions">
        <button class="btn-edit" data-id="${skin.id}">✏️</button>
        <button class="btn-delete" data-id="${skin.id}">🗑️</button>
        <button class="btn-activate" data-id="${skin.id}">Utiliser</button>
      </div>
    `;
    list.appendChild(card);
  });

  // Ajouter les événements
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
  });
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => deleteSkin(e.target.dataset.id));
  });
  document.querySelectorAll('.btn-activate').forEach(btn => {
    btn.addEventListener('click', (e) => activateSkin(e.target.dataset.id));
  });
}

// Ouvrir le modal pour ajouter
document.getElementById('addSkin').addEventListener('click', () => {
  editingId = null;
  modalTitle.textContent = 'Nouveau skin';
  skinName.value = '';
  skinType.value = 'svg';
  skinSvg.value = '';
  skinImage.value = '';
  imagePreview.innerHTML = '';
  skinCss.value = '';
  skinColor.value = '#ff5722';
  skinSize.value = 32;
  toggleTypeFields('svg');
  modal.style.display = 'flex';
});

// Ouvrir le modal pour éditer
async function openEditModal(id) {
  const skin = skins.find(s => s.id === id);
  if (!skin) return;
  editingId = id;
  modalTitle.textContent = 'Modifier skin';
  skinName.value = skin.name;
  skinType.value = skin.type;
  skinSvg.value = skin.data || '';
  skinCss.value = skin.data || '';
  skinColor.value = skin.color || '#ff5722';
  skinSize.value = skin.size || 32;
  if (skin.type === 'image' && skin.data) {
    imagePreview.innerHTML = `<img src="${skin.data}" style="max-width:100px;">`;
  }
  toggleTypeFields(skin.type);
  modal.style.display = 'flex';
}

// Supprimer un skin
async function deleteSkin(id) {
  if (confirm('Supprimer ce skin ?')) {
    skins = skins.filter(s => s.id !== id);
    await saveSkins();
    // Si c'était le skin actif, réinitialiser l'actif au premier skin
    const { activeSkinId } = await chrome.storage.local.get('activeSkinId');
    if (activeSkinId === id) {
      const firstSkin = skins[0];
      if (firstSkin) await chrome.storage.local.set({ activeSkinId: firstSkin.id });
    }
    renderSkinList();
  }
}

// Activer un skin
async function activateSkin(id) {
  await chrome.storage.local.set({ activeSkinId: id });
  // Feedback
  alert('Skin activé !');
}

// Gérer l'affichage des champs selon le type
skinType.addEventListener('change', (e) => toggleTypeFields(e.target.value));
function toggleTypeFields(type) {
  svgGroup.style.display = type === 'svg' ? 'block' : 'none';
  imageGroup.style.display = type === 'image' ? 'block' : 'none';
  cssGroup.style.display = type === 'css' ? 'block' : 'none';
}

// Prévisualisation de l'image
skinImage.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreview.innerHTML = `<img src="${event.target.result}" style="max-width:100px;">`;
    };
    reader.readAsDataURL(file);
  }
});

// Sauvegarder le skin
document.getElementById('saveSkin').addEventListener('click', async () => {
  const name = skinName.value.trim();
  if (!name) return alert('Nom requis');

  const type = skinType.value;
  let data = '';
  if (type === 'svg') data = skinSvg.value.trim();
  else if (type === 'image') {
    const img = imagePreview.querySelector('img');
    if (!img) return alert('Veuillez sélectionner une image');
    data = img.src; // dataURL
  } else if (type === 'css') data = skinCss.value.trim();

  if (!data) return alert('Données du skin manquantes');

  const skin = {
    id: editingId || Date.now().toString(),
    name,
    type,
    data,
    color: skinColor.value,
    size: parseInt(skinSize.value)
  };

  if (editingId) {
    const index = skins.findIndex(s => s.id === editingId);
    if (index !== -1) skins[index] = skin;
  } else {
    skins.push(skin);
  }

  await saveSkins();
  modal.style.display = 'none';
  renderSkinList();
});

// Annuler
document.getElementById('cancelModal').addEventListener('click', () => {
  modal.style.display = 'none';
});

// Initialisation
loadSkins();