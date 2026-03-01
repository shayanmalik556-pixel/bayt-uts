(function () {
  'use strict';

  // Progress rings: set stroke-dasharray from data-score (as percentage of circle)
  var rings = document.querySelectorAll('.progress-ring');
  var radius = 36;
  var circumference = 2 * Math.PI * radius;

  rings.forEach(function (ring) {
    var score = parseInt(ring.getAttribute('data-score'), 10) || 0;
    // Ring shows score as % of circle: 76 -> 76%, 164 -> ~82%
    var displayPercent = ring.classList.contains('progress-orange')
      ? Math.min((score / 200) * 100, 100)
      : Math.min(score, 100);
    var filled = (displayPercent / 100) * circumference;
    var gap = circumference - filled;
    var fill = ring.querySelector('.ring-fill');
    if (fill) {
      fill.setAttribute('stroke-dasharray', filled + ' ' + gap);
      fill.setAttribute('stroke-dashoffset', 0);
    }
  });

  // Tabs: switch active state (content stays same for demo)
  var tabButtons = document.querySelectorAll('.tab');

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabButtons.forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
    });
  });
})();
