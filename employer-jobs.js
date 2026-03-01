(function () {
  'use strict';

  var jobs = window.EMPLOYER_JOBS || [];

  function render() {
    var container = document.getElementById('employer-jobs-list');
    if (!container) return;
    container.innerHTML = jobs.map(function (job) {
      return (
        '<article class="employer-job-row" data-job-id="' + escapeAttr(job.id) + '">' +
          '<div class="employer-job-info">' +
            '<h2 class="employer-job-title">' + escapeHtml(job.title) + '</h2>' +
            '<p class="employer-job-meta">' + escapeHtml(job.location) + ' · Posted ' + escapeHtml(job.postedDate) + ' · ' + job.applicationCount + ' applications</p>' +
          '</div>' +
          '<div class="employer-job-actions">' +
            '<a href="employer-applicants.html?jobId=' + encodeURIComponent(job.id) + '" class="btn btn-primary employer-btn-applications">' +
              '<i class="fas fa-users"></i> Applications' +
            '</a>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return escapeHtml(String(s)).replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
