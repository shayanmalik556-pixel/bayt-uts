(function () {
  'use strict';

  var STORAGE_CANDIDATE_TAGS = 'bayt_employer_candidate_tags';
  var STORAGE_CUSTOM = 'bayt_employer_custom_categories_and_tags';
  var STORAGE_EMPLOYER_ROLE = 'bayt_employer_tag_role';
  var TAG_DEFINITIONS = window.EMPLOYER_TAG_DEFINITIONS || {};
  var CATEGORY_LABELS = window.EMPLOYER_CATEGORY_LABELS || {};
  var customData = { categories: [], tagsByCategory: {} };
  var selectedTagIds = {};

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

  function getAllCategories() {
    var pre = Object.keys(TAG_DEFINITIONS);
    var custom = (customData.categories || []).map(function (c) { return typeof c === 'string' ? c : c.id; });
    return pre.concat(custom);
  }

  function getCategoryLabel(catId) {
    return CATEGORY_LABELS[catId] || catId;
  }

  function getTagsForCategory(catId) {
    var list = (TAG_DEFINITIONS[catId] || []).map(function (t) { return { id: t.id, label: t.label }; });
    var custom = (customData.tagsByCategory[catId] || []).map(function (l) { return { id: 'custom-' + l, label: l }; });
    return list.concat(custom);
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function getRole() {
    try {
      return localStorage.getItem(STORAGE_EMPLOYER_ROLE) || 'admin';
    } catch (e) { return 'admin'; }
  }

  function initRole() {
    var sel = document.getElementById('employer-tag-role');
    if (!sel) return;
    try {
      var saved = localStorage.getItem(STORAGE_EMPLOYER_ROLE);
      if (saved === 'admin' || saved === 'recruiter') sel.value = saved;
    } catch (e) {}
    sel.addEventListener('change', function () {
      try { localStorage.setItem(STORAGE_EMPLOYER_ROLE, sel.value); } catch (e) {}
      renderCandidates();
    });
  }

  function getAllCandidatesWithTags() {
    var applicantsByJob = window.EMPLOYER_APPLICANTS || {};
    var tagData = loadCandidateTags();
    var list = [];
    Object.keys(applicantsByJob).forEach(function (jobId) {
      (applicantsByJob[jobId] || []).forEach(function (app) {
        var tags = (tagData[app.id] || []).map(function (t) { return t.tagId || t.label; });
        list.push({
          id: app.id,
          name: app.name,
          email: app.email,
          jobId: jobId,
          appliedDate: app.appliedDate,
          currentStage: app.currentStage,
          tagIds: tags,
          tagLabels: (tagData[app.id] || []).map(function (t) { return t.label; })
        });
      });
    });
    return list;
  }

  function renderFilters() {
    var row = document.getElementById('employer-filters-row');
    if (!row) return;
    var cats = getAllCategories();
    row.innerHTML = cats.map(function (catId) {
      var tags = getTagsForCategory(catId);
      var opts = tags.map(function (t) {
        var sel = selectedTagIds[catId] && selectedTagIds[catId].indexOf(t.id) >= 0 ? ' selected' : '';
        return '<option value="' + escapeHtml(t.id) + '"' + sel + '>' + escapeHtml(t.label) + '</option>';
      }).join('');
      return '<div class="filter-dropdown-wrap">' +
        '<button type="button" class="filter-trigger" data-category="' + escapeHtml(catId) + '" aria-haspopup="listbox" aria-expanded="false">' +
        escapeHtml(getCategoryLabel(catId)) + ' <i class="fas fa-chevron-down"></i></button>' +
        '<div class="filter-dropdown" id="employer-filter-' + escapeHtml(catId) + '" hidden role="listbox">' +
        tags.map(function (t) {
          var active = selectedTagIds[catId] && selectedTagIds[catId].indexOf(t.id) >= 0;
          return '<div class="filter-option' + (active ? ' selected' : '') + '" data-category="' + escapeHtml(catId) + '" data-tag-id="' + escapeHtml(t.id) + '" data-tag-label="' + escapeHtml(t.label) + '" role="option">' + escapeHtml(t.label) + '</div>';
        }).join('') +
        '</div></div>';
    }).join('');

    row.querySelectorAll('.filter-trigger').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = this.getAttribute('data-category');
        var dd = document.getElementById('employer-filter-' + cat);
        if (!dd) return;
        var open = !dd.hidden;
        document.querySelectorAll('#employer-filters-row .filter-dropdown').forEach(function (d) { d.hidden = true; });
        if (!open) dd.hidden = false;
        btn.setAttribute('aria-expanded', dd.hidden ? 'false' : 'true');
      });
    });
    row.querySelectorAll('.filter-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var cat = this.getAttribute('data-category');
        var tagId = this.getAttribute('data-tag-id');
        if (!selectedTagIds[cat]) selectedTagIds[cat] = [];
        var idx = selectedTagIds[cat].indexOf(tagId);
        if (idx >= 0) selectedTagIds[cat].splice(idx, 1);
        else selectedTagIds[cat].push(tagId);
        this.classList.toggle('selected');
        updateActiveFilters();
        renderCandidates();
      });
    });
  }

  function updateActiveFilters() {
    var chips = [];
    Object.keys(selectedTagIds).forEach(function (catId) {
      (selectedTagIds[catId] || []).forEach(function (tagId) {
        var tags = getTagsForCategory(catId);
        var t = tags.find(function (x) { return x.id === tagId; });
        chips.push({ categoryId: catId, tagId: tagId, label: t ? t.label : tagId });
      });
    });
    var chipEl = document.getElementById('employer-filter-chips');
    var activeEl = document.getElementById('employer-active-filters');
    if (chipEl) {
      chipEl.innerHTML = chips.map(function (c) {
        return '<span class="filter-chip">' + escapeHtml(c.label) +
          '<button type="button" class="filter-chip-remove" data-category="' + escapeHtml(c.categoryId) + '" data-tag-id="' + escapeHtml(c.tagId) + '" aria-label="Remove">&times;</button></span>';
      }).join('');
      chipEl.querySelectorAll('.filter-chip-remove').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var cat = btn.getAttribute('data-category');
          var tagId = btn.getAttribute('data-tag-id');
          if (selectedTagIds[cat]) {
            var i = selectedTagIds[cat].indexOf(tagId);
            if (i >= 0) selectedTagIds[cat].splice(i, 1);
          }
          updateActiveFilters();
          renderFilters();
          renderCandidates();
        });
      });
    }
    if (activeEl) activeEl.hidden = chips.length === 0;
  }

  function renderCandidates() {
    var list = getAllCandidatesWithTags();
    var search = (document.getElementById('employer-filter-search') && document.getElementById('employer-filter-search').value || '').trim().toLowerCase();
    if (search) {
      list = list.filter(function (c) {
        return (c.name && c.name.toLowerCase().indexOf(search) >= 0) ||
          (c.email && c.email.toLowerCase().indexOf(search) >= 0);
      });
    }
    var selectedList = [];
    Object.keys(selectedTagIds).forEach(function (catId) {
      (selectedTagIds[catId] || []).forEach(function (tagId) {
        selectedList.push({ categoryId: catId, tagId: tagId });
      });
    });
    if (selectedList.length > 0) {
      list = list.filter(function (c) {
        return selectedList.every(function (s) {
          return (c.tagIds || []).indexOf(s.tagId) >= 0;
        });
      });
    }
    var container = document.getElementById('employer-filter-candidates-list');
    if (!container) return;
    if (list.length === 0) {
      container.innerHTML = '<p class="employer-no-candidates">No candidates match the current filters.</p>';
      return;
    }
    container.innerHTML = list.map(function (c) {
      var job = (window.EMPLOYER_JOBS || []).find(function (j) { return j.id === c.jobId; });
      var jobTitle = job ? job.title : c.jobId;
      return '<article class="employer-applicant-row">' +
        '<div class="employer-applicant-info">' +
          '<h3 class="employer-applicant-name">' + escapeHtml(c.name) + '</h3>' +
          '<p class="employer-applicant-email">' + escapeHtml(c.email) + '</p>' +
          '<p class="employer-applicant-meta">' + escapeHtml(jobTitle) + ' · Applied ' + escapeHtml(c.appliedDate) + ' · ' + escapeHtml(c.currentStage) + '</p>' +
        '</div>' +
        '<div class="employer-applicant-tags-wrap">' +
          (c.tagLabels && c.tagLabels.length ? c.tagLabels.map(function (l) { return '<span class="applicant-tag-chip">' + escapeHtml(l) + '</span>'; }).join('') : '') +
        '</div></article>';
    }).join('');
  }

  function init() {
    loadCustom();
    initRole();
    renderFilters();
    updateActiveFilters();
    renderCandidates();

    var clearBtn = document.getElementById('employer-clear-filters');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      selectedTagIds = {};
      updateActiveFilters();
      renderFilters();
      renderCandidates();
    });

    var searchEl = document.getElementById('employer-filter-search');
    if (searchEl) searchEl.addEventListener('input', renderCandidates);

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.filter-dropdown-wrap')) {
        document.querySelectorAll('#employer-filters-row .filter-dropdown').forEach(function (d) { d.hidden = true; });
        document.querySelectorAll('.filter-trigger').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
