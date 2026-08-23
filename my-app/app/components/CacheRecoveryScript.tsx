const recoveryScript = String.raw`
(function () {
  var RECOVERY_KEY = 'smartaccess-cache-recovery-v2';
  var recoveryStarted = false;

  function storageGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }
  function storageSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) {}
  }
  function storageRemove(key) {
    try { sessionStorage.removeItem(key); } catch (_) {}
  }

  async function clearAppCaches() {
    if (!('caches' in window)) return;
    var keys = await caches.keys();
    await Promise.all(keys.filter(function (key) {
      return key.indexOf('smartaccess-cache-') === 0;
    }).map(function (key) { return caches.delete(key); }));
  }

  async function updateWorkers() {
    if (!('serviceWorker' in navigator)) return;
    var registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(async function (registration) {
      try {
        if (registration.active) {
          registration.active.postMessage({ type: 'CLEAR_APP_CACHES' });
        }
        await registration.update();
      } catch (_) {}
    }));
  }

  function showRecoveryScreen() {
    function render() {
      if (!document.body || document.documentElement.dataset.smartaccessHydrated === '1') return;
      document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#0f0a1e;color:#fff;font-family:system-ui,sans-serif"><section role="alert" style="max-width:440px;text-align:center"><h1 style="font-size:22px">กำลังกู้คืนหน้าเว็บ</h1><p style="color:#c4b5fd;line-height:1.6">พบไฟล์หน้าเว็บรุ่นเก่าค้างอยู่ ระบบล้างเฉพาะแคชของ SmartAccess แล้ว แต่ยังโหลดหน้าใหม่ไม่สำเร็จ</p><button id="smartaccess-retry" style="border:0;border-radius:10px;padding:12px 18px;background:#7c3aed;color:#fff;font-weight:700">ลองโหลดใหม่อีกครั้ง</button></section></main>';
      var button = document.getElementById('smartaccess-retry');
      if (button) button.addEventListener('click', function () {
        storageRemove(RECOVERY_KEY);
        var url = new URL(location.href);
        url.searchParams.set('__cache_recovery', Date.now().toString());
        location.replace(url.toString());
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', render, { once: true });
    } else {
      render();
    }
  }

  async function recover() {
    // A deployment can also replace a lazy-loaded chunk after the first
    // hydration, so a real asset error must still recover an already-open app.
    if (recoveryStarted) return;
    recoveryStarted = true;
    if (storageGet(RECOVERY_KEY) === '1') {
      showRecoveryScreen();
      return;
    }
    storageSet(RECOVERY_KEY, '1');
    try { await clearAppCaches(); } catch (_) {}
    try { await updateWorkers(); } catch (_) {}
    var url = new URL(location.href);
    url.searchParams.set('__cache_recovery', Date.now().toString());
    location.replace(url.toString());
  }

  function isNextAssetFailure(event) {
    var target = event && event.target;
    var assetUrl = target && (target.src || target.href || '');
    if (assetUrl && assetUrl.indexOf('/_next/static/') !== -1) return true;
    var reason = event && (event.reason || event.error);
    var message = String((reason && (reason.message || reason)) || (event && event.message) || '');
    return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|MIME type.*script|Unexpected token '<'/i.test(message);
  }

  window.__smartaccessMarkHydrated = function () {
    document.documentElement.dataset.smartaccessHydrated = '1';
    storageRemove(RECOVERY_KEY);
    var url = new URL(location.href);
    if (url.searchParams.has('__cache_recovery')) {
      url.searchParams.delete('__cache_recovery');
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    }
  };
  window.addEventListener('error', function (event) {
    if (isNextAssetFailure(event)) recover();
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    if (isNextAssetFailure(event)) recover();
  });
  window.setTimeout(function () {
    if (document.documentElement.dataset.smartaccessHydrated !== '1') recover();
  }, 20000);
})();
`;

export default function CacheRecoveryScript() {
  return <script id="smartaccess-cache-recovery" dangerouslySetInnerHTML={{ __html: recoveryScript }} />;
}
