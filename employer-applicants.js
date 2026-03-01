(function () {
  'use strict';

  /* Fallback data so applicants always show if data script fails to load */
  if (!window.EMPLOYER_APPLICANTS || Object.keys(window.EMPLOYER_APPLICANTS).length === 0) {
    window.EMPLOYER_APPLICANTS = {
      'job-1': [
        { id: 'app-1-1', name: 'Sara Al-Rashid', email: 'sara.r@email.com', appliedDate: '2026-02-24', currentStage: 'Screening' },
        { id: 'app-1-2', name: 'Omar Hassan', email: 'omar.h@email.com', appliedDate: '2026-02-23', currentStage: 'Applied' },
        { id: 'app-1-3', name: 'Layla Mahmoud', email: 'layla.m@email.com', appliedDate: '2026-02-22', currentStage: 'Interview' },
        { id: 'app-1-4', name: 'Khalid Ibrahim', email: 'khalid.i@email.com', appliedDate: '2026-02-21', currentStage: 'Applied' },
        { id: 'app-1-5', name: 'Nadia Fathi', email: 'nadia.f@email.com', appliedDate: '2026-02-20', currentStage: 'Shortlist' }
      ],
      'job-2': [
        { id: 'app-2-1', name: 'Youssef Ahmed', email: 'youssef.a@email.com', appliedDate: '2026-02-25', currentStage: 'Applied' },
        { id: 'app-2-2', name: 'Mariam Saleh', email: 'mariam.s@email.com', appliedDate: '2026-02-24', currentStage: 'Technical Test' },
        { id: 'app-2-3', name: 'Tariq Nasser', email: 'tariq.n@email.com', appliedDate: '2026-02-23', currentStage: 'Applied' }
      ],
      'job-3': [
        { id: 'app-3-1', name: 'Hana Khalil', email: 'hana.k@email.com', appliedDate: '2026-02-22', currentStage: 'Interview' },
        { id: 'app-3-2', name: 'Rami Farouk', email: 'rami.f@email.com', appliedDate: '2026-02-21', currentStage: 'Shortlist' }
      ]
    };
  }
  if (!window.EMPLOYER_JOBS || window.EMPLOYER_JOBS.length === 0) {
    window.EMPLOYER_JOBS = [
      { id: 'job-1', title: 'Senior Data Analyst', location: 'Riyadh, Saudi Arabia', postedDate: '2026-02-20', status: 'active', applicationCount: 12 },
      { id: 'job-2', title: 'Frontend Developer', location: 'Dubai, UAE', postedDate: '2026-02-18', status: 'active', applicationCount: 8 },
      { id: 'job-3', title: 'Product Manager', location: 'Cairo, Egypt', postedDate: '2026-02-15', status: 'active', applicationCount: 5 }
    ];
  }

  var TAG_DEFINITIONS = window.EMPLOYER_TAG_DEFINITIONS || {};
  var CATEGORY_LABELS = window.EMPLOYER_CATEGORY_LABELS || {};
  var STORAGE_CANDIDATE_TAGS = 'bayt_employer_candidate_tags';
  var STORAGE_CUSTOM = 'bayt_employer_custom_categories_and_tags';

  var customData = { categories: [], tagsByCategory: {} };
  var currentApplicantId = null;
  var currentCategoryId = null;
  var currentJobId = null;

  function getJobId() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('jobId') || '';
    return String(id).trim();
  }

  function loadCandidateTags() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_CANDIDATE_TAGS) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveCandidateTags(data) {
    localStorage.setItem(STORAGE_CANDIDATE_TAGS, JSON.stringify(data));
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
    var predefined = Object.keys(TAG_DEFINITIONS).filter(function (k) { return (TAG_DEFINITIONS[k] || []).length >= 0; });
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

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return escapeHtml(String(s)).replace(/"/g, '&quot;');
  }

  function openModal(applicantId) {
    currentApplicantId = applicantId;
    currentCategoryId = null;
    var overlay = document.getElementById('applicant-tag-modal-overlay');
    var catView = document.getElementById('applicant-tag-modal-categories');
    if (!overlay || !catView) return;
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    catView.hidden = false;
    hideAddCategoryInline();
    var btnCat = document.getElementById('applicant-btn-add-category');
    if (btnCat && btnCat.hidden) btnCat.hidden = false;
    renderCategoryList();
  }

  function closeModal() {
    var overlay = document.getElementById('applicant-tag-modal-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
    }
    currentApplicantId = null;
    currentCategoryId = null;
  }

  function renderCategoryList() {
    var container = document.getElementById('applicant-tag-category-list');
    if (!container) return;
    var cats = getAllCategories();
    container.innerHTML = cats.map(function (catId) {
      var tags = getTagsForCategory(catId);
      var tagButtons = tags.map(function (t) {
        return '<li><button type="button" class="tag-option-item" data-category="' + escapeAttr(catId) + '" data-tag-id="' + escapeAttr(t.id) + '" data-tag-label="' + escapeAttr(t.label) + '">' + escapeHtml(t.label) + '</button></li>';
      }).join('');
      var label = getCategoryLabel(catId);
      return '<div class="tag-category-dropdown" data-category="' + escapeAttr(catId) + '">' +
        '<button type="button" class="tag-category-dropdown-header" aria-expanded="false" aria-controls="applicant-tag-panel-' + escapeAttr(catId) + '" data-category="' + escapeAttr(catId) + '">' +
          '<span class="tag-category-dropdown-label">' + escapeHtml(label) + '</span>' +
          '<i class="tag-category-dropdown-chevron fas fa-chevron-down" aria-hidden="true"></i>' +
        '</button>' +
        '<div class="tag-category-dropdown-panel" id="applicant-tag-panel-' + escapeAttr(catId) + '" role="region">' +
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
        assignTag(currentApplicantId, catId, this.getAttribute('data-tag-id'), this.getAttribute('data-tag-label'));
        closeModal();
        renderAllApplicantChips();
      });
    });

    container.querySelectorAll('.btn-add-custom-tag-in-dropdown').forEach(function (btn) {
      btn.addEventListener('click', function () {
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
        var label = (input && input.value ? input.value.trim() : '');
        if (!label) return;
        var list = customData.tagsByCategory[catId] || [];
        if (list.indexOf(label) >= 0) {
          assignTag(currentApplicantId, catId, 'custom-' + label, label);
          closeModal();
          renderAllApplicantChips();
          return;
        }
        list.push(label);
        customData.tagsByCategory[catId] = list;
        saveCustom();
        assignTag(currentApplicantId, catId, 'custom-' + label, label);
        var inlineEl = dropdown.querySelector('.tag-dropdown-add-inline');
        var wrapEl = dropdown.querySelector('.tag-dropdown-add-custom-wrap');
        if (inlineEl) inlineEl.hidden = true;
        if (wrapEl) {
          var addBtn = wrapEl.querySelector('.btn-add-custom-tag-in-dropdown');
          if (addBtn) addBtn.hidden = false;
        }
        input.value = '';
        closeModal();
        renderAllApplicantChips();
      });
    });
  }

  function assignTag(applicantId, categoryId, tagId, label) {
    var data = loadCandidateTags();
    if (!data[applicantId]) data[applicantId] = [];
    data[applicantId] = (data[applicantId] || []).filter(function (t) { return t.categoryId !== categoryId; });
    data[applicantId].push({ categoryId: categoryId, tagId: tagId, label: label });
    saveCandidateTags(data);
  }

  function removeTag(applicantId, categoryId) {
    var data = loadCandidateTags();
    if (!data[applicantId]) return;
    data[applicantId] = data[applicantId].filter(function (t) { return t.categoryId !== categoryId; });
    saveCandidateTags(data);
  }

  function renderAllApplicantChips() {
    document.querySelectorAll('[data-applicant-id]').forEach(function (row) {
      var id = row.getAttribute('data-applicant-id');
      if (id) renderApplicantChips(id);
    });
  }

  function renderApplicantChips(applicantId) {
    var container = document.querySelector('.applicant-tags-chips[data-applicant-id="' + applicantId + '"]');
    if (!container) return;
    var data = loadCandidateTags();
    var tags = (data[applicantId] || []);
    container.innerHTML = tags.map(function (t) {
      return '<span class="applicant-tag-chip">' +
        '<span class="applicant-tag-chip-label">' + escapeHtml(t.label) + '</span>' +
        '<button type="button" class="applicant-tag-chip-remove" data-applicant-id="' + escapeAttr(applicantId) + '" data-category="' + escapeAttr(t.categoryId) + '" aria-label="Remove tag">&times;</button>' +
        '</span>';
    }).join('');
    container.querySelectorAll('.applicant-tag-chip-remove').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        removeTag(btn.getAttribute('data-applicant-id'), btn.getAttribute('data-category'));
        renderApplicantChips(btn.getAttribute('data-applicant-id'));
      });
    });
  }

  function showAddCategoryInline() {
    var inline = document.getElementById('applicant-add-category-inline');
    var btn = document.getElementById('applicant-btn-add-category');
    var input = document.getElementById('applicant-add-category-input');
    if (inline) inline.hidden = false;
    if (btn) btn.hidden = true;
    if (input) { input.value = ''; input.focus(); }
  }

  function hideAddCategoryInline() {
    var inline = document.getElementById('applicant-add-category-inline');
    var btn = document.getElementById('applicant-btn-add-category');
    var input = document.getElementById('applicant-add-category-input');
    if (inline) inline.hidden = true;
    if (btn) btn.hidden = false;
    if (input) input.value = '';
  }

  function submitAddCategory() {
    var input = document.getElementById('applicant-add-category-input');
    var name = (input && input.value ? input.value.trim() : '');
    if (!name) return;
    var id = 'custom-' + name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    var exists = (customData.categories || []).some(function (c) { return (typeof c === 'string' ? c : c.id) === id; });
    if (exists) return;
    customData.categories = customData.categories || [];
    customData.categories.push({ id: id, label: name });
    customData.tagsByCategory[id] = customData.tagsByCategory[id] || [];
    saveCustom();
    hideAddCategoryInline();
    renderCategoryList();
  }

  function renderApplicants() {
    currentJobId = getJobId();
    var jobs = window.EMPLOYER_JOBS || [];
    var applicantsByJob = window.EMPLOYER_APPLICANTS || {};
    var job = jobs.find(function (j) { return j.id === currentJobId; });
    var applicants = applicantsByJob[currentJobId] || [];

    var titleEl = document.getElementById('applicants-job-title');
    var subtitleEl = document.getElementById('applicants-job-subtitle');
    var listEl = document.getElementById('employer-applicants-list');
    if (!listEl) return;

    if (titleEl) titleEl.textContent = job ? job.title + ' – Applications' : 'Applications';
    if (subtitleEl) subtitleEl.textContent = job ? job.location + ' · ' + applicants.length + ' applicant(s)' : (currentJobId ? 'No job found.' : 'Riyadh, Saudi Arabia · 5 applicant(s)');

    if (!currentJobId) {
      currentJobId = 'job-1';
      job = jobs.find(function (j) { return j.id === currentJobId; }) || { title: 'Senior Data Analyst', location: 'Riyadh, Saudi Arabia' };
      applicants = applicantsByJob[currentJobId] || [];
    }
    if (!job && currentJobId) {
      listEl.innerHTML = '<p class="employer-no-applicants">No job found for this link. <a href="employer-jobs.html">Return to Job Postings</a>.</p>';
      return;
    }
    if (applicants.length === 0) {
      listEl.innerHTML = '<p class="employer-no-applicants">No applicants yet for this job.</p>';
      return;
    }

    listEl.innerHTML = applicants.map(function (app) {
      return (
        '<article class="employer-applicant-row" data-applicant-id="' + escapeAttr(app.id) + '">' +
          '<div class="employer-applicant-info">' +
            '<div class="employer-applicant-name-row">' +
              '<h3 class="employer-applicant-name">' + escapeHtml(app.name) + '</h3>' +
              '<button type="button" class="employer-btn-add-tag btn-add-tag-applicant btn-add-tag-icon employer-tag-btn-mobile" data-applicant-id="' + escapeAttr(app.id) + '" aria-label="Add tag" title="Add tag"><i class="fas fa-tag"></i></button>' +
            '</div>' +
            '<p class="employer-applicant-email">' + escapeHtml(app.email) + '</p>' +
            '<p class="employer-applicant-meta">Applied ' + escapeHtml(app.appliedDate) + ' · ' + escapeHtml(app.currentStage) + '</p>' +
          '</div>' +
          '<div class="employer-applicant-tags-wrap">' +
            '<div class="applicant-tags-chips" data-applicant-id="' + escapeAttr(app.id) + '"></div>' +
            '<button type="button" class="employer-btn-add-tag btn-add-tag-applicant btn-add-tag-icon employer-tag-btn-desktop" data-applicant-id="' + escapeAttr(app.id) + '" aria-label="Add tag" title="Add tag"><i class="fas fa-tag"></i></button>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    applicants.forEach(function (app) { renderApplicantChips(app.id); });

    listEl.querySelectorAll('.btn-add-tag-applicant').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(this.getAttribute('data-applicant-id'));
      });
    });

    listEl.querySelectorAll('.applicant-tags-chips').forEach(function (chipContainer) {
      chipContainer.addEventListener('click', function (e) {
        if (e.target.closest('.applicant-tag-chip-remove')) return;
        var chip = e.target.closest('.applicant-tag-chip');
        if (chip) {
          var row = chip.closest('[data-applicant-id]');
          var id = row && row.getAttribute('data-applicant-id');
          if (id) openModal(id);
        }
      });
    });
  }

  function init() {
    loadCustom();
    renderApplicants();

    var overlay = document.getElementById('applicant-tag-modal-overlay');
    if (overlay) overlay.style.display = 'none';

    var closeBtn = document.getElementById('applicant-tag-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', function (e) { e.preventDefault(); closeModal(); });

    if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

    var btnCat = document.getElementById('applicant-btn-add-category');
    if (btnCat) btnCat.addEventListener('click', showAddCategoryInline);
    var addCatCancel = document.getElementById('applicant-add-category-cancel');
    if (addCatCancel) addCatCancel.addEventListener('click', hideAddCategoryInline);
    var addCatSubmit = document.getElementById('applicant-add-category-submit');
    if (addCatSubmit) addCatSubmit.addEventListener('click', submitAddCategory);
    var addCatInput = document.getElementById('applicant-add-category-input');
    if (addCatInput) {
      addCatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submitAddCategory();
        if (e.key === 'Escape') hideAddCategoryInline();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
