chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Skins par défaut
    const defaultSkins = [
      {
        id: 'default-svg',
        name: 'SVG par défaut',
        type: 'svg',
        data: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L10 21L12.5 13.5L20 10L3 3Z" fill="currentColor" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg>',
        color: '#ff5722',
        size: 32
      },
      {
        id: 'simple-black',
        name: 'Simple noir',
        type: 'css',
        data: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'10\' fill=\'black\' /%3E%3C/svg%3E") 12 12, auto',
        size: 24
      }
    ];

    chrome.storage.local.set({
      skins: defaultSkins,
      activeSkinId: 'default-svg',
      enabled: true,
      cursorMode: 'element', // 'element' ou 'css'
      trailLength: 10,
      trailOpacity: 0.6,
      trailColor: '#ff5722',
      clickEffect: true
    });
  }
});