(function () {
  'use strict';

  var STORAGE_CANDIDATE_TAGS = 'bayt_employer_candidate_tags';
  var STORAGE_CUSTOM = 'bayt_employer_custom_categories_and_tags';
  var STORAGE_EMPLOYER_ROLE = 'bayt_employer_tag_role';
  var TAG_DEFINITIONS = window.EMPLOYER_TAG_DEFINITIONS || {};
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
    return CATEGORY_LABELS[catId] || catId;
  }

  function getRole() {
    try {
      return localStorage.getItem(STORAGE_EMPLOYER_ROLE) || 'admin';
    } catch (e) { return 'admin'; }
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function buildTagList() {
    var tagData = loadCandidateTags();
    var usage = {};
    var lastUsed = {};
    Object.keys(tagData).forEach(function (applicantId) {
      (tagData[applicantId] || []).forEach(function (t) {
        var key = t.categoryId + '::' + (t.tagId || t.label);
        usage[key] = (usage[key] || 0) + 1;
        lastUsed[key] = lastUsed[key] || new Date().toISOString().slice(0, 10);
      });
    });
    var list = [];
    Object.keys(TAG_DEFINITIONS).forEach(function (catId) {
      (TAG_DEFINITIONS[catId] || []).forEach(function (t) {
        var key = catId + '::' + t.id;
        list.push({
          tagId: t.id,
          label: t.label,
          categoryId: catId,
          categoryLabel: getCategoryLabel(catId),
          usage: usage[key] || 0,
          status: 'Active',
          createdBy: 'System',
          lastUsed: lastUsed[key] || '—',
          isSystem: true
        });
      });
    });
    Object.keys(customData.tagsByCategory || {}).forEach(function (catId) {
      (customData.tagsByCategory[catId] || []).forEach(function (label) {
        var tagId = 'custom-' + label;
        var key = catId + '::' + tagId;
        list.push({
          tagId: tagId,
          label: label,
          categoryId: catId,
          categoryLabel: getCategoryLabel(catId),
          usage: usage[key] || 0,
          status: 'Active',
          createdBy: 'Workspace',
          lastUsed: lastUsed[key] || '—',
          isSystem: false
        });
      });
    });
    return list;
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
      render();
    });
  }

  function render() {
    loadCustom();
    var tags = buildTagList();
    var isAdmin = getRole() === 'admin';
    var tbody = document.getElementById('employer-tag-table-body');
    if (!tbody) return;
    if (tags.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">No tags yet. Create tags from Categories &amp; Tags or by tagging candidates.</td></tr>';
      return;
    }
    tbody.innerHTML = tags.map(function (t) {
      var actions = isAdmin && !t.isSystem
        ? '<button type="button" class="btn-link btn-action" data-action="edit" data-tag-id="' + escapeHtml(t.tagId) + '" data-category="' + escapeHtml(t.categoryId) + '">Edit</button> ' +
          '<button type="button" class="btn-link btn-action" data-action="merge" data-tag-id="' + escapeHtml(t.tagId) + '">Merge</button> ' +
          '<button type="button" class="btn-link btn-action" data-action="archive" data-tag-id="' + escapeHtml(t.tagId) + '">Archive</button> ' +
          (t.usage === 0 ? '<button type="button" class="btn-link btn-action btn-danger" data-action="delete" data-tag-id="' + escapeHtml(t.tagId) + '">Delete</button>' : '')
        : (isAdmin && t.isSystem ? '<span class="muted">System tag</span>' : '—');
      return '<tr>' +
        '<td>' + escapeHtml(t.label) + '</td>' +
        '<td>' + escapeHtml(t.categoryLabel) + '</td>' +
        '<td>' + t.usage + '</td>' +
        '<td>' + escapeHtml(t.status) + '</td>' +
        '<td>' + escapeHtml(t.createdBy) + '</td>' +
        '<td>' + escapeHtml(t.lastUsed) + '</td>' +
        '<td class="td-actions">' + actions + '</td></tr>';
    }).join('');

    tbody.querySelectorAll('.btn-action').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = this.getAttribute('data-action');
        if (action === 'edit') { /* could open rename modal */ }
        if (action === 'merge') { /* could open merge modal */ }
        if (action === 'archive') { /* could set status Archived */ }
        if (action === 'delete') { /* could remove if unused */ }
      });
    });
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
