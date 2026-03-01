(function () {
  'use strict';

  var STORAGE_JOBS_TAGS = 'bayt_my_jobs_listing_tags';
  var STORAGE_CUSTOM = 'bayt_custom_categories_and_tags';
  var CATEGORY_LABELS = {
    industry: 'Industry',
    skills: 'Skills',
    seniority: 'Seniority',
    employment_type: 'Employment Type',
    experience_level: 'Experience Level'
  };

  var customData = { categories: [], tagsByCategory: {} };

  function loadJobTags() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_JOBS_TAGS) || '{}');
    } catch (e) {
      return {};
    }
  }

  function loadCustom() {
    try {
      var d = JSON.parse(localStorage.getItem(STORAGE_CUSTOM) || '{}');
      customData.categories = d.categories || [];
      customData.tagsByCategory = d.tagsByCategory || {};
    } catch (e) {}
  }

  function getCategoryLabel(catId) {
    if (CATEGORY_LABELS[catId]) return CATEGORY_LABELS[catId];
    var c = (customData.categories || []).find(function (x) { return (typeof x === 'string' ? x : x.id) === catId; });
    return (c && c.label) ? c.label : catId;
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  var CHART_COLORS = ['#0066b3', '#00a651', '#e87722', '#6b4c9a', '#e31e24', '#00bcd4', '#8bc34a', '#ff9800'];

  function angleToXY(cx, cy, r, deg) {
    var rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function pieSlicePath(cx, cy, r, startDeg, endDeg) {
    var p1 = angleToXY(cx, cy, r, startDeg);
    var p2 = angleToXY(cx, cy, r, endDeg);
    var large = endDeg - startDeg > 180 ? 1 : 0;
    return 'M ' + cx + ' ' + cy + ' L ' + p1.x + ' ' + p1.y + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p2.x + ' ' + p2.y + ' Z';
  }

  function donutSlicePath(cx, cy, rOuter, rInner, startDeg, endDeg) {
    var outer1 = angleToXY(cx, cy, rOuter, startDeg);
    var outer2 = angleToXY(cx, cy, rOuter, endDeg);
    var inner1 = angleToXY(cx, cy, rInner, startDeg);
    var inner2 = angleToXY(cx, cy, rInner, endDeg);
    var large = endDeg - startDeg > 180 ? 1 : 0;
    return 'M ' + inner1.x + ' ' + inner1.y + ' L ' + outer1.x + ' ' + outer1.y + ' A ' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 1 ' + outer2.x + ' ' + outer2.y + ' L ' + inner2.x + ' ' + inner2.y + ' A ' + rInner + ' ' + rInner + ' 0 ' + large + ' 0 ' + inner1.x + ' ' + inner1.y + ' Z';
  }

  function renderPieChart(data, size) {
    size = size || 160;
    var cx = size / 2, cy = size / 2, r = size / 2 - 8;
    var total = data.reduce(function (sum, d) { return sum + d.value; }, 0);
    if (total === 0) {
      return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#eee"/></svg>';
    }
    var segments = [];
    var start = 0;
    data.forEach(function (d, i) {
      var pct = d.value / total;
      var end = start + pct * 360;
      if (pct > 0) {
        segments.push('<path fill="' + (d.color || CHART_COLORS[i % CHART_COLORS.length]) + '" d="' + pieSlicePath(cx, cy, r, start, end) + '"/>');
      }
      start = end;
    });
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' + segments.join('') + '</svg>';
  }

  function renderDonutChart(data, size) {
    size = size || 160;
    var cx = size / 2, cy = size / 2, rOuter = size / 2 - 8, rInner = size / 4;
    var total = data.reduce(function (sum, d) { return sum + d.value; }, 0);
    if (total === 0) {
      return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + rOuter + '" fill="#eee"/><circle cx="' + cx + '" cy="' + cy + '" r="' + rInner + '" fill="#fafafa"/></svg>';
    }
    var segments = [];
    var start = 0;
    data.forEach(function (d, i) {
      var pct = d.value / total;
      var end = start + pct * 360;
      if (pct > 0) {
        segments.push('<path fill="' + (d.color || CHART_COLORS[i % CHART_COLORS.length]) + '" d="' + donutSlicePath(cx, cy, rOuter, rInner, start, end) + '"/>');
      }
      start = end;
    });
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' + segments.join('') + '</svg>';
  }

  function render() {
    loadCustom();
    var data = loadJobTags();
    var totalTags = 0;
    var jobsTagged = Object.keys(data).filter(function (id) { return (data[id] || []).length > 0; }).length;
    var byCategory = {};
    var byTag = {};
    Object.keys(data).forEach(function (jobId) {
      (data[jobId] || []).forEach(function (t) {
        totalTags++;
        byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + 1;
        var key = (t.label || '').trim();
        if (key) byTag[key] = (byTag[key] || 0) + 1;
      });
    });
    var maxCount = Math.max.apply(null, Object.values(byCategory).concat([1]));
    var topTags = Object.keys(byTag)
      .map(function (label) { return { label: label, value: byTag[label] }; })
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 15);
    var maxTagCount = topTags.length ? Math.max.apply(null, topTags.map(function (t) { return t.value; })) : 1;
    var statsEl = document.getElementById('dashboard-stats');
    if (statsEl) {
      statsEl.innerHTML = '<div class="stat-box"><span class="stat-value">' + totalTags + '</span><span class="stat-label">Total tags used</span></div>' +
        '<div class="stat-box"><span class="stat-value">' + Object.keys(byTag).length + '</span><span class="stat-label">Unique tags</span></div>' +
        '<div class="stat-box"><span class="stat-value">' + jobsTagged + '</span><span class="stat-label">Jobs tagged</span></div>' +
        '<div class="stat-box"><span class="stat-value">' + Object.keys(byCategory).length + '</span><span class="stat-label">Categories used</span></div>';
    }
    var chartsEl = document.getElementById('dashboard-charts');
    if (chartsEl) {
      var chartRows = Object.keys(byCategory).map(function (catId) {
        var count = byCategory[catId];
        var pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return '<div class="chart-bar-row">' +
          '<span class="chart-bar-label">' + escapeHtml(getCategoryLabel(catId)) + '</span>' +
          '<div class="chart-bar-track"><div class="chart-bar-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="chart-bar-value">' + count + '</span></div>';
      }).join('');
      chartsEl.innerHTML = '<div class="chart-block">' +
        '<h3>Tags by category</h3><div class="chart-bars">' + (chartRows || '<p class="empty-msg">No data yet.</p>') + '</div></div>';
    }

    var pieDonutEl = document.getElementById('dashboard-pie-donut');
    if (pieDonutEl) {
      var totalJobs = (window.MOCK_JOBS && window.MOCK_JOBS.length) ? window.MOCK_JOBS.length : 10;
      var jobsUntagged = Math.max(0, totalJobs - jobsTagged);
      var pieDataByCategory = Object.keys(byCategory).map(function (catId, i) {
        return { label: getCategoryLabel(catId), value: byCategory[catId], color: CHART_COLORS[i % CHART_COLORS.length] };
      });
      var donutJobData = [
        { label: 'Tagged', value: jobsTagged, color: CHART_COLORS[0] },
        { label: 'Untagged', value: jobsUntagged, color: '#ddd' }
      ];
      var donut1Html = '<div class="dashboard-chart-card"><h3>Jobs: Tagged vs Untagged</h3><div class="chart-svg-wrap">' +
        renderDonutChart(donutJobData) +
        '<ul class="chart-legend">' + donutJobData.map(function (d, i) {
          return '<li><span class="chart-legend-swatch" style="background:' + d.color + '"></span>' + escapeHtml(d.label) + ' (' + d.value + ')</li>';
        }).join('') + '</ul></div></div>';
      var topTagsForCharts = topTags.slice(0, 8).map(function (t, i) {
        return { label: t.label, value: t.value, color: CHART_COLORS[i % CHART_COLORS.length] };
      });
      var pieTagsHtml = '<div class="dashboard-chart-card"><h3>Most used tags</h3><div class="chart-svg-wrap">' +
        renderPieChart(topTagsForCharts.length ? topTagsForCharts : [{ value: 1, color: '#eee' }]) +
        '<ul class="chart-legend">' + (topTagsForCharts.length ? topTagsForCharts.map(function (d, i) {
          return '<li><span class="chart-legend-swatch" style="background:' + (d.color || CHART_COLORS[i]) + '"></span>' + escapeHtml(d.label) + ' (' + d.value + ')</li>';
        }).join('') : '<li><span class="chart-legend-swatch" style="background:#eee"></span>No tags yet</li>') + '</ul></div></div>';
      pieDonutEl.innerHTML = donut1Html + pieTagsHtml;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
