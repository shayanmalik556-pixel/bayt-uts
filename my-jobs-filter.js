(function () {
  'use strict';

  var TAG_DEFINITIONS = window.TAG_DEFINITIONS || {};
  var CATEGORY_LABELS = {
    industry: 'Industry',
    skills: 'Skills',
    seniority: 'Seniority',
    employment_type: 'Employment Type',
    experience_level: 'Experience Level'
  };
  var STORAGE_JOBS_TAGS = 'bayt_my_jobs_listing_tags';
  var STORAGE_CUSTOM = 'bayt_custom_categories_and_tags';

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
      return { categories: d.categories || [], tagsByCategory: d.tagsByCategory || {} };
    } catch (e) {
      return { categories: [], tagsByCategory: {} };
    }
  }

  function getAllCategories(customData) {
    var predefined = Object.keys(TAG_DEFINITIONS);
    var customIds = (customData.categories || []).map(function (c) { return typeof c === 'string' ? c : c.id; });
    return predefined.concat(customIds);
  }

  function getCategoryLabel(catId, customData) {
    if (CATEGORY_LABELS[catId]) return CATEGORY_LABELS[catId];
    var custom = (customData.categories || []).find(function (c) { return (typeof c === 'string' ? c : c.id) === catId; });
    return custom && custom.label ? custom.label : catId;
  }

  function getTagsForCategory(catId, customData) {
    var list = (TAG_DEFINITIONS[catId] || []).map(function (t) { return { id: t.id, label: t.label }; });
    var custom = (customData.tagsByCategory[catId] || []).map(function (label) { return { id: 'custom-' + label, label: label }; });
    return list.concat(custom);
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return escapeHtml(String(s)).replace(/"/g, '&quot;');
  }

  function renderFilterBody() {
    var customData = loadCustom();
    var body = document.getElementById('seeker-filter-body');
    if (!body) return;
    var cats = getAllCategories(customData);
    body.innerHTML = cats.map(function (catId) {
      var tags = getTagsForCategory(catId, customData);
      if (tags.length === 0) return '';
      var label = getCategoryLabel(catId, customData);
      var checkboxes = tags.map(function (t) {
        return '<label class="filter-check-label">' +
          '<input type="checkbox" class="filter-check" data-category="' + escapeAttr(catId) + '" data-tag-id="' + escapeAttr(t.id) + '"> ' +
          escapeHtml(t.label) + '</label>';
      }).join('');
      return '<div class="filter-category-block">' +
        '<h3 class="filter-category-title">' + escapeHtml(label) + '</h3>' +
        '<div class="filter-tag-checks">' + checkboxes + '</div></div>';
    }).filter(Boolean).join('');
  }

  function getSelectedFilter() {
    var selected = {};
    document.querySelectorAll('#seeker-filter-body .filter-check:checked').forEach(function (cb) {
      var cat = cb.getAttribute('data-category');
      var tagId = cb.getAttribute('data-tag-id');
      if (!cat || !tagId) return;
      if (!selected[cat]) selected[cat] = [];
      selected[cat].push(tagId);
    });
    return selected;
  }

  function jobMatchesFilter(jobTags, filterSelected) {
    var cats = Object.keys(filterSelected);
    if (cats.length === 0) return true;
    for (var i = 0; i < cats.length; i++) {
      var catId = cats[i];
      var allowed = filterSelected[catId];
      if (!allowed || allowed.length === 0) continue;
      var hasMatch = (jobTags || []).some(function (t) {
        return t.categoryId === catId && allowed.indexOf(t.tagId) !== -1;
      });
      if (!hasMatch) return false;
    }
    return true;
  }

  function applyFilter() {
    var filterSelected = getSelectedFilter();
    var jobTagsData = loadJobTags();
    document.querySelectorAll('.job-card').forEach(function (card) {
      var jobId = card.getAttribute('data-job-id');
      if (!jobId) return;
      var tags = jobTagsData[jobId] || [];
      var show = jobMatchesFilter(tags, filterSelected);
      card.style.display = show ? '' : 'none';
    });
  }

  function openFilterModal() {
    renderFilterBody();
    var overlay = document.getElementById('seeker-filter-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  function closeFilterModal() {
    var overlay = document.getElementById('seeker-filter-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  function clearFilter() {
    document.querySelectorAll('#seeker-filter-body .filter-check').forEach(function (cb) { cb.checked = false; });
    applyFilter();
  }

  function init() {
    var btn = document.getElementById('seeker-filter-btn');
    var closeBtn = document.getElementById('seeker-filter-close');
    var overlay = document.getElementById('seeker-filter-overlay');
    var applyBtn = document.getElementById('seeker-filter-apply');
    var clearBtn = document.getElementById('seeker-filter-clear');

    if (btn) btn.addEventListener('click', openFilterModal);
    if (closeBtn) closeBtn.addEventListener('click', closeFilterModal);
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeFilterModal();
      });
    }
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        applyFilter();
        closeFilterModal();
      });
    }
    if (clearBtn) clearBtn.addEventListener('click', clearFilter);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
