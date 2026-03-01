(function () {
  'use strict';

  var STORAGE_CANDIDATE_TAGS = 'bayt_employer_candidate_tags';
  var STORAGE_CUSTOM = 'bayt_employer_custom_categories_and_tags';
  var STORAGE_EMPLOYER_ROLE = 'bayt_employer_tag_role';
  var CATEGORY_LABELS = window.EMPLOYER_CATEGORY_LABELS || {};

  var customData = { categories: [], tagsByCategory: {} };

  function loadCandidateTags() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_CANDIDATE_TAGS) || '{}');
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

  function donutSlicePath(cx, cy, rOuter, rInner, startDeg, endDeg) {
    var outer1 = angleToXY(cx, cy, rOuter, startDeg);
    var outer2 = angleToXY(cx, cy, rOuter, endDeg);
    var inner1 = angleToXY(cx, cy, rInner, startDeg);
    var inner2 = angleToXY(cx, cy, rInner, endDeg);
    var large = endDeg - startDeg > 180 ? 1 : 0;
    return 'M ' + inner1.x + ' ' + inner1.y + ' L ' + outer1.x + ' ' + outer1.y + ' A ' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 1 ' + outer2.x + ' ' + outer2.y + ' L ' + inner2.x + ' ' + inner2.y + ' A ' + rInner + ' ' + rInner + ' 0 ' + large + ' 0 ' + inner1.x + ' ' + inner1.y + ' Z';
  }

  function pieSlicePath(cx, cy, r, startDeg, endDeg) {
    var p1 = angleToXY(cx, cy, r, startDeg);
    var p2 = angleToXY(cx, cy, r, endDeg);
    var large = endDeg - startDeg > 180 ? 1 : 0;
    return 'M ' + cx + ' ' + cy + ' L ' + p1.x + ' ' + p1.y + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + p2.x + ' ' + p2.y + ' Z';
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

  function initRole() {
    var sel = document.getElementById('employer-tag-role');
    if (!sel) return;
    try {
      var saved = localStorage.getItem(STORAGE_EMPLOYER_ROLE);
      if (saved === 'admin' || saved === 'recruiter') sel.value = saved;
    } catch (e) {}
    sel.addEventListener('change', function () {
      try {
        localStorage.setItem(STORAGE_EMPLOYER_ROLE, sel.value);
      } catch (e) {}
    });
  }

  function render() {
    loadCustom();
    var data = loadCandidateTags();
    var totalTags = 0;
    var candidatesTagged = 0;
    var byCategory = {};
    var byTag = {};
    var EXCLUDE_CATEGORY_SOURCE = true;
    Object.keys(data).forEach(function (applicantId) {
      var list = (data[applicantId] || []).filter(function (t) { return !EXCLUDE_CATEGORY_SOURCE || t.categoryId !== 'source'; });
      if (list.length > 0) candidatesTagged++;
      list.forEach(function (t) {
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

    var jobs = window.EMPLOYER_JOBS || [];
    var applicantsByJob = window.EMPLOYER_APPLICANTS || {};
    var totalCandidates = 0;
    Object.keys(applicantsByJob).forEach(function (jid) {
      totalCandidates += (applicantsByJob[jid] || []).length;
    });
    if (totalCandidates === 0) totalCandidates = 16;

    var activeTaggers = 3;
    var totalTeamMembers = 5;
    var statsEl = document.getElementById('employer-dashboard-stats');
    if (statsEl) {
      statsEl.innerHTML =
        '<div class="stat-box"><span class="stat-value">' + totalTags + '</span><span class="stat-label">Total tags used</span></div>' +
        '<div class="stat-box"><span class="stat-value">' + Object.keys(byTag).length + '</span><span class="stat-label">Unique tags</span></div>' +
        '<div class="stat-box"><span class="stat-value">' + candidatesTagged + ' / ' + totalCandidates + '</span><span class="stat-label">Candidates tagged</span></div>' +
        '<div class="stat-box"><span class="stat-value">' + activeTaggers + ' / ' + totalTeamMembers + '</span><span class="stat-label">Team members using tags</span></div>';
    }

    var chartsEl = document.getElementById('employer-dashboard-charts');
    if (chartsEl) {
      var chartRows = Object.keys(byCategory)
        .filter(function (catId) { return catId !== 'source'; })
        .map(function (catId) {
          var count = byCategory[catId];
          var pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return '<div class="chart-bar-row">' +
            '<span class="chart-bar-label">' + escapeHtml(getCategoryLabel(catId)) + '</span>' +
            '<div class="chart-bar-track"><div class="chart-bar-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="chart-bar-value">' + count + '</span></div>';
        }).join('');
      chartsEl.innerHTML = '<div class="chart-block">' +
        '<h3>Tags by category</h3><div class="chart-bars">' + (chartRows || '<p class="empty-msg">No data yet. Tag candidates from Job Postings → Applications.</p>') + '</div></div>';
    }

    var byPriority = {};
    Object.keys(data).forEach(function (applicantId) {
      (data[applicantId] || []).forEach(function (t) {
        if (t.categoryId === 'priority') {
          var l = (t.label || '').trim();
          if (l) byPriority[l] = (byPriority[l] || 0) + 1;
        }
      });
    });
    var priorityData = Object.keys(byPriority).map(function (l, i) {
      return { label: l, value: byPriority[l], color: CHART_COLORS[i % CHART_COLORS.length] };
    });
    var widgetPriorityEl = document.getElementById('employer-widget-priority');
    if (widgetPriorityEl) {
      widgetPriorityEl.innerHTML = priorityData.length > 0
        ? renderPieChart(priorityData, 140) + '<ul class="chart-legend">' + priorityData.map(function (d, i) {
          return '<li><span class="chart-legend-swatch" style="background:' + (d.color || CHART_COLORS[i]) + '"></span>' + escapeHtml(d.label) + ' (' + d.value + ')</li>';
        }).join('') + '</ul>'
        : '<p class="empty-msg">No priority tags yet.</p>';
    }

    var activityList = [
      { who: 'Sarah', action: 'tagged Layla Mahmoud', tag: 'Interview' },
      { who: 'Omar', action: 'tagged Nadia Fathi', tag: 'Shortlist' },
      { who: 'Sarah', action: 'tagged Sara Al-Rashid', tag: 'High priority' },
      { who: 'Layla', action: 'tagged Youssef Ahmed', tag: 'JavaScript' },
      { who: 'Omar', action: 'tagged Mariam Saleh', tag: 'React' }
    ];
    var widgetActivityEl = document.getElementById('employer-widget-activity');
    if (widgetActivityEl) {
      widgetActivityEl.innerHTML = activityList.map(function (a) {
        return '<li class="employer-activity-item">' + escapeHtml(a.who) + ' ' + escapeHtml(a.action) + ' with <strong>' + escapeHtml(a.tag) + '</strong></li>';
      }).join('');
    }

    var pieDonutEl = document.getElementById('employer-dashboard-pie-donut');
    if (pieDonutEl) {
      var candidatesUntagged = Math.max(0, totalCandidates - candidatesTagged);
      var donutJobData = [
        { label: 'Tagged', value: candidatesTagged, color: CHART_COLORS[0] },
        { label: 'Untagged', value: candidatesUntagged, color: '#ddd' }
      ];
      var donut1Html = '<div class="dashboard-chart-card"><h3>Candidates: Tagged vs Untagged</h3><div class="chart-svg-wrap">' +
        renderDonutChart(donutJobData) +
        '<ul class="chart-legend">' + donutJobData.map(function (d) {
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

    renderPipelineWidget();
  }

  function getPipelineByCategory(catId) {
    var data = loadCandidateTags();
    var byLabel = {};
    Object.keys(data).forEach(function (applicantId) {
      (data[applicantId] || []).forEach(function (t) {
        if (t.categoryId === catId) {
          var label = (t.label || t.tagId || '').trim();
          if (label) byLabel[label] = (byLabel[label] || 0) + 1;
        }
      });
    });
    return byLabel;
  }

  function renderPipelineWidget(applicantsByCategoryByLabel) {
    var catSelect = document.getElementById('employer-pipeline-category');
    var chartEl = document.getElementById('employer-pipeline-chart');
    var TAG_DEFINITIONS = window.EMPLOYER_TAG_DEFINITIONS || {};
    var allCatIds = Object.keys(TAG_DEFINITIONS)
      .concat((customData.categories || []).map(function (c) { return typeof c === 'string' ? c : c.id; }))
      .filter(function (id) { return id !== 'source'; });
    if (catSelect) {
      catSelect.innerHTML = allCatIds.map(function (id) {
        return '<option value="' + escapeHtml(id) + '">' + escapeHtml(getCategoryLabel(id)) + '</option>';
      }).join('');
      catSelect.addEventListener('change', function () {
        renderPipelineChart(this.value, chartEl);
      });
    }
    var firstCat = allCatIds[0] || '';
    if (firstCat && chartEl) renderPipelineChart(firstCat, chartEl);
  }

  function renderPipelineChart(catId, chartEl) {
    if (!chartEl) return;
    var byLabel = getPipelineByCategory(catId);
    var labels = Object.keys(byLabel);
    var maxCount = Math.max.apply(null, labels.map(function (l) { return byLabel[l]; }).concat([1]));
    var chartBars = labels.sort().map(function (label) {
      var count = byLabel[label];
      var pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
      return '<div class="chart-vertical-bar-item">' +
        '<div class="chart-vertical-bar-wrap">' +
          '<div class="chart-vertical-bar-fill" style="height:' + pct + '%"></div>' +
        '</div>' +
        '<span class="chart-vertical-bar-value">' + count + '</span>' +
        '<span class="chart-vertical-bar-label">' + escapeHtml(label) + '</span>' +
        '</div>';
    }).join('');
    chartEl.innerHTML = labels.length ? '<div class="chart-vertical-bars">' + chartBars + '</div>' : '<p class="empty-msg">No applications tagged in this category yet.</p>';
  }

  function init() {
    initRole();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
