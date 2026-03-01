(function () {
  'use strict';

  var TAG_DEFINITIONS = window.TAG_DEFINITIONS || {};
  var STORAGE_JOBS_TAGS = 'bayt_my_jobs_listing_tags';
  var STORAGE_CUSTOM = 'bayt_custom_categories_and_tags';
  var CATEGORY_LABELS = {
    industry: 'Industry',
    skills: 'Skills',
    seniority: 'Seniority',
    employment_type: 'Employment Type',
    experience_level: 'Experience Level'
  };

  var jobTitles = {
    '1': { title: 'Data Analyst - No Experience Required', company: 'Peroptyx' },
    '2': { title: 'Data Analyst', company: 'Mohamed N. Al Hajery and Sons Co. LTD' }
  };

  var customData = { categories: [], tagsByCategory: {} };
  var selectedTags = {};

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

  function getAllCategories() {
    var predefined = Object.keys(TAG_DEFINITIONS || {});
    var customIds = (customData.categories || []).map(function (c) { return typeof c === 'string' ? c : c.id; });
    return predefined.concat(customIds);
  }

  function getTagsForCategory(catId) {
    var list = (TAG_DEFINITIONS[catId] || []).map(function (t) { return { id: t.id, label: t.label }; });
    var custom = (customData.tagsByCategory[catId] || []).map(function (label) { return { id: 'custom-' + label, label: label }; });
    return list.concat(custom);
  }

  function openFilter(group) {
    var row = document.getElementById('manage-filters-row');
    if (!row) return;
    row.querySelectorAll('.filter-group').forEach(function (g) {
      if (g !== group) {
        var d = g.querySelector('.filter-dropdown');
        if (d) { d.hidden = true; }
        var t = g.querySelector('.filter-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    });
    var dropdown = group.querySelector('.filter-dropdown');
    if (!dropdown) return;
    dropdown.hidden = !dropdown.hidden;
    group.querySelector('.filter-trigger').setAttribute('aria-expanded', dropdown.hidden ? 'false' : 'true');
    if (!dropdown.hidden) {
      var input = group.querySelector('.filter-typeahead');
      if (input) { input.value = ''; input.focus(); }
      renderFilterOptions(group);
    }
  }

  function renderFilterOptions(group) {
    var category = group.getAttribute('data-category');
    var typeahead = (group.querySelector('.filter-typeahead').value || '').toLowerCase();
    var optionsEl = group.querySelector('.filter-options');
    var tags = getTagsForCategory(category).filter(function (t) {
      return t.label.toLowerCase().indexOf(typeahead) >= 0;
    });
    var selected = selectedTags[category] || [];
    optionsEl.innerHTML = tags.map(function (t) {
      var checked = selected.indexOf(t.id) >= 0;
      return '<div class="filter-option" role="option" data-tag-id="' + escapeAttr(t.id) + '" aria-selected="' + checked + '">' +
        '<input type="checkbox" id="opt-m-' + escapeAttr(category) + '-' + escapeAttr(t.id) + '" ' + (checked ? 'checked' : '') + ' />' +
        '<label for="opt-m-' + escapeAttr(category) + '-' + escapeAttr(t.id) + '">' + escapeHtml(t.label) + '</label></div>';
    }).join('');
    optionsEl.querySelectorAll('.filter-option').forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        if (e.target.type === 'checkbox') return;
        var cb = opt.querySelector('input[type="checkbox"]');
        cb.checked = !cb.checked;
        toggleTag(category, opt.getAttribute('data-tag-id'), cb.checked);
      });
    });
    optionsEl.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var opt = cb.closest('.filter-option');
        toggleTag(category, opt.getAttribute('data-tag-id'), cb.checked);
      });
    });
  }

  function toggleTag(category, tagId, selected) {
    if (!selectedTags[category]) selectedTags[category] = [];
    if (selected) {
      if (selectedTags[category].indexOf(tagId) < 0) selectedTags[category].push(tagId);
    } else {
      selectedTags[category] = selectedTags[category].filter(function (id) { return id !== tagId; });
    }
    var group = document.querySelector('.filter-group[data-category="' + category + '"]');
    if (group) renderFilterOptions(group);
    renderChips();
    runFilter();
  }

  function renderChips() {
    var container = document.getElementById('manage-filter-chips');
    var activeContainer = document.getElementById('manage-active-filters');
    if (!container || !activeContainer) return;
    var chips = [];
    getAllCategories().forEach(function (cat) {
      (selectedTags[cat] || []).forEach(function (tagId) {
        var tag = getTagsForCategory(cat).find(function (t) { return t.id === tagId; });
        if (tag) chips.push({ category: cat, id: tagId, label: tag.label });
      });
    });
    container.innerHTML = chips.map(function (c) {
      return '<span class="filter-chip">' + escapeHtml(c.label) +
        '<button type="button" class="chip-remove" data-category="' + escapeAttr(c.category) + '" data-tag-id="' + escapeAttr(c.id) + '" aria-label="Remove">×</button></span>';
    }).join('');
    activeContainer.hidden = chips.length === 0;
    container.querySelectorAll('.chip-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-category');
        var id = btn.getAttribute('data-tag-id');
        selectedTags[cat] = (selectedTags[cat] || []).filter(function (x) { return x !== id; });
        var group = document.querySelector('.filter-group[data-category="' + cat + '"]');
        if (group) renderFilterOptions(group);
        renderChips();
        runFilter();
      });
    });
  }

  function runFilter() {
    var search = (document.getElementById('filter-jobs-search') && document.getElementById('filter-jobs-search').value) || '';
    search = search.trim().toLowerCase();
    var data = loadJobTags();
    var jobIds = Object.keys(jobTitles);
    var allIds = Object.keys(data);
    allIds.forEach(function (id) { if (jobIds.indexOf(id) < 0) jobIds.push(id); });
    var jobs = jobIds.map(function (jobId) {
      var meta = jobTitles[jobId] || { title: 'Job #' + jobId, company: '' };
      var tagObjects = data[jobId] || [];
      var tags = tagObjects.map(function (t) { return t.label; });
      return { id: jobId, title: meta.title, company: meta.company, tags: tags, tagObjects: tagObjects };
    });

    if (search) {
      jobs = jobs.filter(function (j) {
        return j.title.toLowerCase().indexOf(search) >= 0 || (j.company && j.company.toLowerCase().indexOf(search) >= 0);
      });
    }

    getAllCategories().forEach(function (cat) {
      var sel = selectedTags[cat] || [];
      if (sel.length === 0) return;
      jobs = jobs.filter(function (j) {
        return j.tagObjects.some(function (t) { return t.categoryId === cat && sel.indexOf(t.tagId) >= 0; });
      });
    });

    var listEl = document.getElementById('filter-jobs-list');
    if (listEl) {
      listEl.innerHTML = jobs.length === 0 ? '<p class="empty-msg">No jobs match.</p>' : jobs.map(function (j) {
        var tagChips = (j.tagObjects || []).map(function (t) {
          return '<span class="job-tag-chip job-tag-chip-removable" data-job-id="' + escapeAttr(j.id) + '" data-category="' + escapeAttr(t.categoryId) + '" title="Click to remove">' +
            '<span class="job-tag-chip-label">' + escapeHtml(t.label) + '</span>' +
            '<button type="button" class="job-tag-chip-remove" data-job-id="' + escapeAttr(j.id) + '" data-category="' + escapeAttr(t.categoryId) + '" aria-label="Remove tag">&times;</button></span>';
        }).join('');
        return '<div class="job-row" data-job-id="' + escapeAttr(j.id) + '">' +
          '<div class="job-row-info"><h3>' + escapeHtml(j.title) + '</h3><p>' + escapeHtml(j.company) + '</p></div>' +
          '<div class="job-row-tags-wrap">' +
          '<div class="job-row-tags">' + tagChips + '</div>' +
          '<button type="button" class="btn-add-tag-inline" data-job-id="' + escapeAttr(j.id) + '" aria-label="Add tag"><i class="fas fa-plus"></i> Add Tag</button>' +
          '</div></div>';
      }).join('');
    }
  }

  function removeTagFromJob(jobId, categoryId) {
    var data = loadJobTags();
    if (!data[jobId]) return;
    data[jobId] = data[jobId].filter(function (t) { return t.categoryId !== categoryId; });
    saveJobTags(data);
    runFilter();
    renderChips();
  }

  function assignTagToJob(jobId, categoryId, tagId, label) {
    var data = loadJobTags();
    if (!data[jobId]) data[jobId] = [];
    data[jobId] = (data[jobId] || []).filter(function (t) { return t.categoryId !== categoryId; });
    data[jobId].push({ categoryId: categoryId, tagId: tagId, label: label });
    saveJobTags(data);
    closeTagModal();
    runFilter();
    renderChips();
  }

  var modalJobId = null;
  var modalCategoryId = null;

  function openTagModal(jobId) {
    modalJobId = jobId;
    modalCategoryId = null;
    var overlay = document.getElementById('manage-tag-modal-overlay');
    var catView = document.getElementById('manage-tag-modal-categories');
    var tagsView = document.getElementById('manage-tag-modal-tags');
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    catView.hidden = false;
    tagsView.hidden = true;
    renderTagModalCategories();
  }

  function closeTagModal() {
    var overlay = document.getElementById('manage-tag-modal-overlay');
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    modalJobId = null;
    modalCategoryId = null;
  }

  function renderTagModalCategories() {
    var list = document.getElementById('manage-tag-category-list');
    if (!list) return;
    var cats = getAllCategories();
    list.innerHTML = cats.map(function (catId) {
      return '<li><button type="button" class="tag-category-item" data-category="' + escapeAttr(catId) + '">' + escapeHtml(getCategoryLabel(catId)) + '</button></li>';
    }).join('');
    list.querySelectorAll('.tag-category-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showTagSelectionInModal(btn.getAttribute('data-category'));
      });
    });
  }

  function showTagSelectionInModal(categoryId) {
    modalCategoryId = categoryId;
    document.getElementById('manage-tag-modal-categories').hidden = true;
    var tagsView = document.getElementById('manage-tag-modal-tags');
    tagsView.hidden = false;
    document.getElementById('manage-tag-modal-subtitle').textContent = getCategoryLabel(categoryId);
    var tags = getTagsForCategory(categoryId);
    var list = document.getElementById('manage-tag-option-list');
    list.innerHTML = tags.map(function (t) {
      return '<li><button type="button" class="tag-option-item" data-tag-id="' + escapeAttr(t.id) + '" data-tag-label="' + escapeAttr(t.label) + '">' + escapeHtml(t.label) + '</button></li>';
    }).join('');
    list.querySelectorAll('.tag-option-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        assignTagToJob(modalJobId, modalCategoryId, btn.getAttribute('data-tag-id'), btn.getAttribute('data-tag-label'));
      });
    });
  }

  function bindJobRowEvents() {
    var listEl = document.getElementById('filter-jobs-list');
    if (!listEl) return;
    listEl.addEventListener('click', function (e) {
      var addBtn = e.target.closest('.btn-add-tag-inline');
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        openTagModal(addBtn.getAttribute('data-job-id'));
        return;
      }
      var removeBtn = e.target.closest('.job-tag-chip-remove');
      var chip = e.target.closest('.job-tag-chip-removable');
      if (removeBtn) {
        e.preventDefault();
        e.stopPropagation();
        removeTagFromJob(removeBtn.getAttribute('data-job-id'), removeBtn.getAttribute('data-category'));
        return;
      }
      if (chip) {
        e.preventDefault();
        e.stopPropagation();
        removeTagFromJob(chip.getAttribute('data-job-id'), chip.getAttribute('data-category'));
      }
    }, true);
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }

  function buildFilterRow() {
    loadCustom();
    var categories = getAllCategories();
    getAllCategories().forEach(function (cat) {
      selectedTags[cat] = selectedTags[cat] || [];
    });
    var row = document.getElementById('manage-filters-row');
    if (!row) return;
    row.innerHTML = categories.map(function (catId) {
      var label = getCategoryLabel(catId);
      return '<div class="filter-group" data-category="' + escapeAttr(catId) + '">' +
        '<button type="button" class="filter-trigger" aria-expanded="false" aria-haspopup="listbox">' +
        '<span class="filter-label">' + escapeHtml(label) + '</span><i class="fas fa-chevron-down"></i></button>' +
        '<div class="filter-dropdown" hidden>' +
        '<input type="text" class="filter-typeahead" placeholder="Search ' + escapeAttr(label.toLowerCase()) + '..." aria-label="Search ' + escapeAttr(label) + '" />' +
        '<div class="filter-options" role="listbox"></div></div></div>';
    }).join('');

    row.querySelectorAll('.filter-dropdown').forEach(function (d) {
      d.hidden = true;
    });

    row.querySelectorAll('.filter-trigger').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openFilter(btn.closest('.filter-group'));
      });
    });
    row.querySelectorAll('.filter-typeahead').forEach(function (input) {
      input.addEventListener('input', function () {
        renderFilterOptions(input.closest('.filter-group'));
      });
    });
  }

  function setupClickOutside() {
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.filter-group') && !e.target.closest('#manage-active-filters')) {
        var row = document.getElementById('manage-filters-row');
        if (row) {
          row.querySelectorAll('.filter-dropdown').forEach(function (d) { d.hidden = true; });
          row.querySelectorAll('.filter-trigger').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
        }
      }
    });
  }

  function init() {
    setupClickOutside();
    buildFilterRow();
    bindJobRowEvents();
    renderChips();
    runFilter();

    var searchInput = document.getElementById('filter-jobs-search');
    if (searchInput) searchInput.addEventListener('input', runFilter);

    var clearBtn = document.getElementById('manage-clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        getAllCategories().forEach(function (c) { selectedTags[c] = []; });
        document.querySelectorAll('#manage-filters-row .filter-group').forEach(renderFilterOptions);
        renderChips();
        runFilter();
      });
    }

    var modalClose = document.getElementById('manage-tag-modal-close');
    var modalOverlay = document.getElementById('manage-tag-modal-overlay');
    var modalBack = document.getElementById('manage-tag-modal-back');
    if (modalClose) modalClose.addEventListener('click', closeTagModal);
    if (modalOverlay) modalOverlay.addEventListener('click', function (e) {
      if (e.target === this) closeTagModal();
    });
    if (modalBack) modalBack.addEventListener('click', function () {
      var tagsView = document.getElementById('manage-tag-modal-tags');
      var catView = document.getElementById('manage-tag-modal-categories');
      if (tagsView) tagsView.hidden = true;
      if (catView) catView.hidden = false;
      modalCategoryId = null;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
