(function () {
  'use strict';

  var TAG_DEFINITIONS = window.EMPLOYER_TAG_DEFINITIONS || {};
  var CATEGORY_LABELS = window.EMPLOYER_CATEGORY_LABELS || {};
  var STORAGE_CANDIDATE_TAGS = 'bayt_employer_candidate_tags';
  var STORAGE_CUSTOM = 'bayt_employer_custom_categories_and_tags';

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
      return { categories: d.categories || [], tagsByCategory: d.tagsByCategory || {} };
    } catch (e) {
      return { categories: [], tagsByCategory: {} };
    }
  }

  function getAllCategories(customData) {
    var predefined = Object.keys(TAG_DEFINITIONS).filter(function (id) { return id !== 'source'; });
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
    var body = document.getElementById('employer-filter-body');
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
    document.querySelectorAll('#employer-filter-body .filter-check:checked').forEach(function (cb) {
      var cat = cb.getAttribute('data-category');
      var tagId = cb.getAttribute('data-tag-id');
      if (!cat || !tagId) return;
      if (!selected[cat]) selected[cat] = [];
      selected[cat].push(tagId);
    });
    return selected;
  }

  function applicantMatchesFilter(applicantTags, filterSelected) {
    var cats = Object.keys(filterSelected);
    if (cats.length === 0) return true;
    for (var i = 0; i < cats.length; i++) {
      var catId = cats[i];
      var allowed = filterSelected[catId];
      if (!allowed || allowed.length === 0) continue;
      var hasMatch = (applicantTags || []).some(function (t) {
        return t.categoryId === catId && allowed.indexOf(t.tagId) !== -1;
      });
      if (!hasMatch) return false;
    }
    return true;
  }

  function applyFilter() {
    var filterSelected = getSelectedFilter();
    var candidateTagsData = loadCandidateTags();
    document.querySelectorAll('.employer-applicant-row').forEach(function (row) {
      var applicantId = row.getAttribute('data-applicant-id');
      if (!applicantId) return;
      var tags = candidateTagsData[applicantId] || [];
      var show = applicantMatchesFilter(tags, filterSelected);
      row.style.display = show ? '' : 'none';
    });
  }

  function openFilterModal() {
    renderFilterBody();
    var overlay = document.getElementById('employer-filter-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  function closeFilterModal() {
    var overlay = document.getElementById('employer-filter-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  function clearFilter() {
    document.querySelectorAll('#employer-filter-body .filter-check').forEach(function (cb) { cb.checked = false; });
    applyFilter();
  }

  function init() {
    var btn = document.getElementById('employer-filter-btn');
    var closeBtn = document.getElementById('employer-filter-close');
    var overlay = document.getElementById('employer-filter-overlay');
    var applyBtn = document.getElementById('employer-filter-apply');
    var clearBtn = document.getElementById('employer-filter-clear');

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
