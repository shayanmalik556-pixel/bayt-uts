(function () {
  'use strict';
  function init() {
    var drawer = document.getElementById('nav-drawer');
    var toggle = document.getElementById('nav-toggle');
    if (!drawer || !toggle) return;
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer) {
        toggle.checked = false;
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
