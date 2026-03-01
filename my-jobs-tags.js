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

  var customData = { categories: [], tagsByCategory: {} };

  function loadJobTags() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_JOBS_TAGS) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveJobTags(data) {
    localStorage.setItem(STORAGE_JOBS_TAGS, JSON.stringify(data));
  }

  function loadCustom() {
    try {
      var d = JSON.parse(localStorage.getItem(STORAGE_CUSTOM) || '{}');
      customData.categories = d.categories || [];
      customData.tagsByCategory = d.tagsByCategory || {};
    } catch (e) {}
  }

  function saveCustom() {
    localStorage.setItem(STORAGE_CUSTOM, JSON.stringify({
      categories: customData.categories,
      tagsByCategory: customData.tagsByCategory
    }));
  }

  function getAllCategories() {
    var predefined = Object.keys(TAG_DEFINITIONS);
    var customIds = (customData.categories || []).map(function (c) { return typeof c === 'string' ? c : c.id; });
    return predefined.concat(customIds);
  }

  function getCategoryLabel(catId) {
    if (CATEGORY_LABELS[catId]) return CATEGORY_LABELS[catId];
    var custom = (customData.categories || []).find(function (c) { return (typeof c === 'string' ? c : c.id) === catId; });
    return custom && custom.label ? custom.label : catId;
  }

  function getTagsForCategory(catId) {
    var list = (TAG_DEFINITIONS[catId] || []).map(function (t) { return { id: t.id, label: t.label, custom: false }; });
    var custom = (customData.tagsByCategory[catId] || []).map(function (label) { return { id: 'custom-' + label, label: label, custom: true }; });
    return list.concat(custom);
  }

  var currentJobId = null;
  var currentCategoryId = null;

  function openModal(jobId) {
    currentJobId = jobId;
    currentCategoryId = null;
    var overlay = document.getElementById('tag-modal-overlay');
    var catView = document.getElementById('tag-modal-categories');
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    catView.hidden = false;
    hideAddCategoryInline();
    if (document.getElementById('btn-add-category').hidden) document.getElementById('btn-add-category').hidden = false;
    renderCategoryList();
  }

  function closeModal() {
    var overlay = document.getElementById('tag-modal-overlay');
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    currentJobId = null;
    currentCategoryId = null;
  }

  function renderCategoryList() {
    var container = document.getElementById('tag-category-list');
    var cats = getAllCategories();
    container.innerHTML = cats.map(function (catId) {
      var tags = getTagsForCategory(catId);
      var tagButtons = tags.map(function (t) {
        return '<li><button type="button" class="tag-option-item" data-category="' + escapeAttr(catId) + '" data-tag-id="' + escapeAttr(t.id) + '" data-tag-label="' + escapeAttr(t.label) + '">' + escapeHtml(t.label) + '</button></li>';
      }).join('');
      var label = getCategoryLabel(catId);
      return '<div class="tag-category-dropdown" data-category="' + escapeAttr(catId) + '">' +
        '<button type="button" class="tag-category-dropdown-header" aria-expanded="false" aria-controls="tag-panel-' + escapeAttr(catId) + '" data-category="' + escapeAttr(catId) + '">' +
          '<span class="tag-category-dropdown-label">' + escapeHtml(label) + '</span>' +
          '<i class="tag-category-dropdown-chevron fas fa-chevron-down" aria-hidden="true"></i>' +
        '</button>' +
        '<div class="tag-category-dropdown-panel" id="tag-panel-' + escapeAttr(catId) + '" role="region">' +
          '<ul class="tag-option-list">' + tagButtons + '</ul>' +
          '<div class="tag-dropdown-add-custom-wrap">' +
            '<div class="inline-add-wrap tag-dropdown-add-inline" hidden>' +
              '<input type="text" class="inline-add-input tag-dropdown-custom-input" placeholder="Tag name" data-category="' + escapeAttr(catId) + '" />' +
              '<div class="inline-add-actions">' +
                '<button type="button" class="btn btn-inline-add tag-dropdown-custom-submit">Add</button>' +
                '<button type="button" class="btn btn-inline-cancel tag-dropdown-custom-cancel">Cancel</button>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn-add-custom-tag-in-dropdown" data-category="' + escapeAttr(catId) + '"><i class="fas fa-plus"></i> Add custom tag</button>' +
          '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    container.querySelectorAll('.tag-category-dropdown-header').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dropdown = this.closest('.tag-category-dropdown');
        var panel = dropdown.querySelector('.tag-category-dropdown-panel');
        var isOpen = dropdown.classList.contains('is-open');
        if (isOpen) {
          dropdown.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          dropdown.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    container.querySelectorAll('.tag-option-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var catId = this.getAttribute('data-category');
        assignTag(currentJobId, catId, this.getAttribute('data-tag-id'), this.getAttribute('data-tag-label'));
        closeModal();
        renderAllJobChips();
      });
    });

    container.querySelectorAll('.btn-add-custom-tag-in-dropdown').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var catId = this.getAttribute('data-category');
        var dropdown = this.closest('.tag-category-dropdown');
        var inline = dropdown.querySelector('.tag-dropdown-add-inline');
        var wrap = dropdown.querySelector('.tag-dropdown-add-custom-wrap');
        wrap.querySelector('.btn-add-custom-tag-in-dropdown').hidden = true;
        inline.hidden = false;
        dropdown.querySelector('.tag-dropdown-custom-input').value = '';
        dropdown.querySelector('.tag-dropdown-custom-input').focus();
      });
    });

    container.querySelectorAll('.tag-dropdown-custom-cancel').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dropdown = this.closest('.tag-category-dropdown');
        var inline = dropdown.querySelector('.tag-dropdown-add-inline');
        var wrap = dropdown.querySelector('.tag-dropdown-add-custom-wrap');
        inline.hidden = true;
        wrap.querySelector('.btn-add-custom-tag-in-dropdown').hidden = false;
        dropdown.querySelector('.tag-dropdown-custom-input').value = '';
      });
    });

    container.querySelectorAll('.tag-dropdown-custom-input').forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.closest('.tag-category-dropdown').querySelector('.tag-dropdown-custom-submit').click();
        }
        if (e.key === 'Escape') {
          input.closest('.tag-category-dropdown').querySelector('.tag-dropdown-custom-cancel').click();
        }
      });
    });

    container.querySelectorAll('.tag-dropdown-custom-submit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dropdown = this.closest('.tag-category-dropdown');
        var catId = dropdown.getAttribute('data-category');
        var input = dropdown.querySelector('.tag-dropdown-custom-input');
        var label = (input.value || '').trim();
        if (!label) return;
        var list = customData.tagsByCategory[catId] || [];
        if (list.indexOf(label) >= 0) {
          assignTag(currentJobId, catId, 'custom-' + label, label);
          closeModal();
          renderAllJobChips();
          return;
        }
        list.push(label);
        customData.tagsByCategory[catId] = list;
        saveCustom();
        assignTag(currentJobId, catId, 'custom-' + label, label);
        var inlineEl = dropdown.querySelector('.tag-dropdown-add-inline');
        var wrapEl = dropdown.querySelector('.tag-dropdown-add-custom-wrap');
        if (inlineEl) inlineEl.hidden = true;
        if (wrapEl) {
          var addBtn = wrapEl.querySelector('.btn-add-custom-tag-in-dropdown');
          if (addBtn) addBtn.hidden = false;
        }
        input.value = '';
        closeModal();
        renderAllJobChips();
      });
    });
  }

  function assignTag(jobId, categoryId, tagId, label) {
    var data = loadJobTags();
    if (!data[jobId]) data[jobId] = [];
    data[jobId] = (data[jobId] || []).filter(function (t) { return t.categoryId !== categoryId; });
    data[jobId].push({ categoryId: categoryId, tagId: tagId, label: label });
    saveJobTags(data);
  }

  function removeTag(jobId, categoryId) {
    var data = loadJobTags();
    if (!data[jobId]) return;
    data[jobId] = data[jobId].filter(function (t) { return t.categoryId !== categoryId; });
    saveJobTags(data);
  }

  function renderAllJobChips() {
    document.querySelectorAll('.job-card[data-job-id]').forEach(function (card) {
      renderJobChips(card.getAttribute('data-job-id'));
    });
  }

  function renderJobChips(jobId) {
    var container = document.querySelector('.job-tags-chips[data-job-id="' + jobId + '"]');
    if (!container) return;
    var data = loadJobTags();
    var tags = (data[jobId] || []);
    container.innerHTML = tags.map(function (t) {
      return '<span class="job-tag-chip">' +
        '<span class="job-tag-chip-label">' + escapeHtml(t.label) + '</span>' +
        '<button type="button" class="job-tag-chip-remove" data-job-id="' + escapeAttr(jobId) + '" data-category="' + escapeAttr(t.categoryId) + '" aria-label="Remove tag">&times;</button>' +
        '</span>';
    }).join('');
    container.querySelectorAll('.job-tag-chip-remove').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        removeTagFromJob(btn.getAttribute('data-job-id'), btn.getAttribute('data-category'));
        renderJobChips(btn.getAttribute('data-job-id'));
      });
    });
  }

  function removeTagFromJob(jobId, categoryId) {
    var data = loadJobTags();
    if (!data[jobId]) return;
    data[jobId] = data[jobId].filter(function (t) { return t.categoryId !== categoryId; });
    saveJobTags(data);
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  function showAddCategoryInline() {
    document.getElementById('add-category-inline').hidden = false;
    document.getElementById('btn-add-category').hidden = true;
    var input = document.getElementById('add-category-input');
    input.value = '';
    input.focus();
  }

  function hideAddCategoryInline() {
    document.getElementById('add-category-inline').hidden = true;
    document.getElementById('btn-add-category').hidden = false;
    document.getElementById('add-category-input').value = '';
  }

  function submitAddCategory() {
    var input = document.getElementById('add-category-input');
    var name = (input.value || '').trim();
    if (!name) return;
    var id = 'custom-' + name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    var exists = (customData.categories || []).some(function (c) { return (typeof c === 'string' ? c : c.id) === id; });
    if (exists) {
      return;
    }
    customData.categories = customData.categories || [];
    customData.categories.push({ id: id, label: name });
    customData.tagsByCategory[id] = customData.tagsByCategory[id] || [];
    saveCustom();
    hideAddCategoryInline();
    renderCategoryList();
  }

  function init() {
    loadCustom();
    renderAllJobChips();

    var overlay = document.getElementById('tag-modal-overlay');
    overlay.style.display = 'none';

    document.querySelectorAll('.btn-add-tag').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(this.getAttribute('data-job-id'));
      });
    });

    document.getElementById('tag-modal-close').addEventListener('click', function (e) {
      e.preventDefault();
      closeModal();
    });
    document.getElementById('tag-modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
    document.getElementById('btn-add-category').addEventListener('click', showAddCategoryInline);
    document.getElementById('add-category-cancel').addEventListener('click', hideAddCategoryInline);
    document.getElementById('add-category-submit').addEventListener('click', submitAddCategory);
    document.getElementById('add-category-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitAddCategory();
      if (e.key === 'Escape') hideAddCategoryInline();
    });

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
