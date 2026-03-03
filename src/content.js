(function() {
  let cursor, trailCanvas, trailCtx;
  let mouseX = 0, mouseY = 0;
  let trail = [];
  let settings = {};
  let animationFrame;
  let isMouseDown = false;
  let activeSkin = null;
  let styleElement = null; // pour le mode CSS

  // Charger tous les paramètres et le skin actif
  async function loadSettings() {
    const data = await chrome.storage.local.get([
      'enabled', 'cursorMode', 'skins', 'activeSkinId',
      'trailLength', 'trailOpacity', 'trailColor', 'clickEffect'
    ]);
    settings = data;
    if (data.skins && data.activeSkinId) {
      activeSkin = data.skins.find(s => s.id === data.activeSkinId) || data.skins[0];
    }
    applySettings();
  }

  // Appliquer les paramètres
  function applySettings() {
    if (!settings.enabled) {
      removeCursor();
      return;
    }
    if (settings.cursorMode === 'css') {
      applyCSSCursor();
      removeCustomElementCursor();
    } else {
      applyElementCursor();
      removeCSSCursor();
    }
  }

  function applyCSSCursor() {
    if (!activeSkin || activeSkin.type !== 'css') {
      // fallback: utiliser un curseur CSS par défaut
      applyCSSCursorDefault();
      return;
    }
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'floatcursor-css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = `* { cursor: ${activeSkin.data} !important; }`;
    hideDefaultCursor(); // pour masquer le curseur natif si besoin
  }

  function removeCSSCursor() {
    if (styleElement) styleElement.remove();
    styleElement = null;
  }

  function applyElementCursor() {
    if (!cursor) createCursorElements();
    updateCursorStyle();
    if (!trailCanvas && settings.trailLength > 0) createTrailCanvas();
    hideDefaultCursor();
  }

  function removeCustomElementCursor() {
    if (cursor) cursor.remove();
    if (trailCanvas) trailCanvas.remove();
    cursor = null;
    trailCanvas = null;
    if (animationFrame) cancelAnimationFrame(animationFrame);
  }

  function removeCursor() {
    removeCustomElementCursor();
    removeCSSCursor();
    showDefaultCursor();
  }

  function hideDefaultCursor() {
    let style = document.getElementById('floatcursor-hide-default');
    if (!style) {
      style = document.createElement('style');
      style.id = 'floatcursor-hide-default';
      document.head.appendChild(style);
    }
    style.textContent = '* { cursor: none !important; }';
  }

  function showDefaultCursor() {
    const style = document.getElementById('floatcursor-hide-default');
    if (style) style.remove();
  }

  function createCursorElements() {
    cursor = document.createElement('div');
    cursor.id = 'floatcursor-main';
    cursor.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 99999;
      transform: translate(-2px, -2px);
      transition: transform 0.1s ease;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    `;
    document.body.appendChild(cursor);
  }

  function createTrailCanvas() {
    trailCanvas = document.createElement('canvas');
    trailCanvas.id = 'floatcursor-trail';
    trailCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 99998;
    `;
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
    trailCtx = trailCanvas.getContext('2d');
    document.body.appendChild(trailCanvas);
    animationFrame = requestAnimationFrame(drawTrail);
  }

  function updateCursorStyle() {
    if (!cursor || !activeSkin) return;
    cursor.innerHTML = ''; // vider

    const size = activeSkin.size || settings.size || 32;
    cursor.style.width = size + 'px';
    cursor.style.height = size + 'px';

    if (activeSkin.type === 'svg') {
      // Remplacer currentColor par la couleur choisie
      let svg = activeSkin.data;
      if (activeSkin.color) {
        svg = svg.replace(/currentColor/g, activeSkin.color);
      }
      cursor.innerHTML = svg;
    } else if (activeSkin.type === 'image') {
      const img = document.createElement('img');
      img.src = activeSkin.data; // dataURL
      img.style.width = '100%';
      img.style.height = '100%';
      cursor.appendChild(img);
    } else {
      // fallback: simple cercle
      cursor.innerHTML = `<div style="width:100%; height:100%; background:${activeSkin.color || '#ff5722'}; border-radius:50%;"></div>`;
    }
  }

  // Gestion des événements souris pour l'élément curseur
  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (cursor) {
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    }
    if (settings.trailLength > 0 && trailCanvas) {
      trail.push({ x: mouseX, y: mouseY, opacity: settings.trailOpacity });
      if (trail.length > settings.trailLength) trail.shift();
    }
  }

  function onMouseDown() {
    isMouseDown = true;
    if (settings.clickEffect && cursor) {
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(0.8)`;
    }
  }

  function onMouseUp() {
    isMouseDown = false;
    if (cursor) {
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(1)`;
    }
  }

  function onResize() {
    if (trailCanvas) {
      trailCanvas.width = window.innerWidth;
      trailCanvas.height = window.innerHeight;
    }
  }

  function drawTrail() {
    if (!trailCtx || !trailCanvas || settings.trailLength === 0) {
      animationFrame = requestAnimationFrame(drawTrail);
      return;
    }
    trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    trailCtx.shadowColor = 'rgba(0,0,0,0.5)';
    trailCtx.shadowBlur = 4;

    for (let i = 0; i < trail.length; i++) {
      const point = trail[i];
      const opacity = point.opacity * (i / trail.length);
      trailCtx.beginPath();
      trailCtx.arc(point.x, point.y, (settings.size / 4) * (i / trail.length), 0, Math.PI * 2);
      trailCtx.fillStyle = hexToRgba(settings.trailColor, opacity);
      trailCtx.fill();
    }
    animationFrame = requestAnimationFrame(drawTrail);
  }

  function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Écoute des changements de stockage
  chrome.storage.onChanged.addListener((changes) => {
    let reload = false;
    for (let key in changes) {
      if (key === 'skins' || key === 'activeSkinId') reload = true;
      settings[key] = changes[key].newValue;
    }
    if (reload) loadSettings();
    else applySettings();
  });

  // Initialisation
  loadSettings().then(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', onResize);
  });
})();