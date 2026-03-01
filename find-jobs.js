(function () {
  'use strict';

  var TAG_DEFINITIONS = window.TAG_DEFINITIONS || {};
  var MOCK_JOBS = window.MOCK_JOBS || [];
  var SAVED_SEARCHES_KEY = 'bayt_saved_searches';

  var state = {
    selectedTags: {
      industry: [],
      skills: [],
      seniority: [],
      employment_type: [],
      experience_level: []
    },
    keyword: ''
  };

  function getSavedSearches() {
    try {
      return JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function setSavedSearches(list) {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(list));
  }

  function openFilter(group) {
    document.querySelectorAll('.filter-group').forEach(function (g) {
      if (g !== group) {
        g.querySelector('.filter-dropdown').hidden = true;
        g.querySelector('.filter-trigger').setAttribute('aria-expanded', 'false');
      }
    });
    var dropdown = group.querySelector('.filter-dropdown');
    dropdown.hidden = !dropdown.hidden;
    group.querySelector('.filter-trigger').setAttribute('aria-expanded', dropdown.hidden ? 'false' : 'true');
    if (!dropdown.hidden) {
      group.querySelector('.filter-typeahead').value = '';
      renderFilterOptions(group);
      group.querySelector('.filter-typeahead').focus();
    }
  }

  function renderFilterOptions(group) {
    var category = group.getAttribute('data-category');
    var typeahead = group.querySelector('.filter-typeahead').value.toLowerCase();
    var optionsEl = group.querySelector('.filter-options');
    var tags = (TAG_DEFINITIONS[category] || []).filter(function (t) {
      return t.label.toLowerCase().indexOf(typeahead) >= 0;
    });
    var selected = state.selectedTags[category] || [];
    optionsEl.innerHTML = tags.map(function (t) {
      var checked = selected.indexOf(t.id) >= 0;
      return '<div class="filter-option" role="option" data-tag-id="' + t.id + '" aria-selected="' + checked + '">' +
        '<input type="checkbox" id="opt-' + category + '-' + t.id + '" ' + (checked ? 'checked' : '') + ' />' +
        '<label for="opt-' + category + '-' + t.id + '">' + t.label + '</label></div>';
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
        toggleTag(category, cb.closest('.filter-option').getAttribute('data-tag-id'), cb.checked);
      });
    });
  }

  function toggleTag(category, tagId, selected) {
    var arr = state.selectedTags[category] || [];
    if (selected) {
      if (arr.indexOf(tagId) < 0) arr.push(tagId);
    } else {
      state.selectedTags[category] = arr.filter(function (id) { return id !== tagId; });
      return;
    }
    state.selectedTags[category] = arr;
    renderFilterOptions(document.querySelector('.filter-group[data-category="' + category + '"]'));
    renderChips();
    runFilter();
  }

  function renderChips() {
    var container = document.getElementById('filter-chips');
    var activeContainer = document.getElementById('active-filters');
    var chips = [];
    Object.keys(state.selectedTags).forEach(function (cat) {
      (state.selectedTags[cat] || []).forEach(function (tagId) {
        var tag = (TAG_DEFINITIONS[cat] || []).find(function (t) { return t.id === tagId; });
        if (tag) chips.push({ category: cat, id: tagId, label: tag.label });
      });
    });
    container.innerHTML = chips.map(function (c) {
      return '<span class="filter-chip">' + c.label + '<button type="button" class="chip-remove" data-category="' + c.category + '" data-tag-id="' + c.id + '" aria-label="Remove">×</button></span>';
    }).join('');
    activeContainer.hidden = chips.length === 0;
    container.querySelectorAll('.chip-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-category');
        var id = btn.getAttribute('data-tag-id');
        state.selectedTags[cat] = (state.selectedTags[cat] || []).filter(function (x) { return x !== id; });
        renderChips();
        runFilter();
        var group = document.querySelector('.filter-group[data-category="' + cat + '"]');
        if (group) renderFilterOptions(group);
      });
    });
  }

  function runFilter() {
    var keyword = (document.getElementById('keyword-search') && document.getElementById('keyword-search').value) || '';
    keyword = keyword.trim().toLowerCase();
    state.keyword = keyword;

    var filtered = MOCK_JOBS.filter(function (job) {
      if (keyword && job.title.toLowerCase().indexOf(keyword) < 0 && job.company.toLowerCase().indexOf(keyword) < 0) return false;
      var categories = Object.keys(state.selectedTags);
      for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        var selected = state.selectedTags[cat] || [];
        if (selected.length === 0) continue;
        var jobTags = (job.tag_ids && job.tag_ids[cat]) || [];
        var match = selected.some(function (tid) { return jobTags.indexOf(tid) >= 0; });
        if (!match) return false;
      }
      return true;
    });

    renderJobResults(document.getElementById('job-results'), filtered);
    document.getElementById('results-count').innerHTML = 'Showing <strong>' + filtered.length + '</strong> jobs';
  }

  function renderJobResults(container, jobs) {
    if (!container) return;
    container.innerHTML = jobs.map(function (job) {
      return '<article class="job-card job-card-search">' +
        '<div class="job-card-body">' +
        '<h2 class="job-title"><a href="#">' + escapeHtml(job.title) + '</a></h2>' +
        '<p class="company">' + escapeHtml(job.company) + '</p>' +
        '<p class="location">' + escapeHtml(job.location) + '</p>' +
        '<div class="job-actions">' +
        '<button type="button" class="btn btn-primary">Apply</button>' +
        '<button type="button" class="btn btn-secondary">Save</button>' +
        '</div></div></article>';
    }).join('');
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderRecommended() {
    var container = document.getElementById('recommended-results');
    if (!container) return;
    var profileSkillIds = ['sk-data', 'sk-sql', 'sk-excel'];
    var recommended = MOCK_JOBS.filter(function (job) {
      var jobSkills = (job.tag_ids && job.tag_ids.skills) || [];
      return jobSkills.some(function (sid) { return profileSkillIds.indexOf(sid) >= 0; });
    }).slice(0, 4);
    renderJobResults(container, recommended);
  }

  function bindFilters() {
    document.querySelectorAll('.filter-trigger').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openFilter(btn.closest('.filter-group'));
      });
    });
    document.querySelectorAll('.filter-typeahead').forEach(function (input) {
      input.addEventListener('input', function () {
        renderFilterOptions(input.closest('.filter-group'));
      });
    });
    document.getElementById('clear-filters').addEventListener('click', function () {
      Object.keys(state.selectedTags).forEach(function (c) { state.selectedTags[c] = []; });
      renderChips();
      document.querySelectorAll('.filter-group').forEach(function (g) { renderFilterOptions(g); });
      runFilter();
    });
    document.getElementById('keyword-search').addEventListener('input', runFilter);
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.filter-group')) {
        document.querySelectorAll('.filter-dropdown').forEach(function (d) { d.hidden = true; });
        document.querySelectorAll('.filter-trigger').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      }
    });
  }

  function saveSearch() {
    var hasAny = Object.keys(state.selectedTags).some(function (c) { return (state.selectedTags[c] || []).length > 0; });
    if (!hasAny) {
      alert('Select at least one filter before saving.');
      return;
    }
    var name = prompt('Name this search:', 'My search');
    if (!name) return;
    var tagIds = [];
    Object.keys(state.selectedTags).forEach(function (c) {
      (state.selectedTags[c] || []).forEach(function (id) { tagIds.push({ category: c, id: id }); });
    });
    var list = getSavedSearches();
    list.push({
      id: Date.now().toString(),
      name: name,
      selected_tag_ids: tagIds,
      frequency: 'daily'
    });
    setSavedSearches(list);
    renderSavedSearches();
  }

  function renderSavedSearches() {
    var list = getSavedSearches();
    var listEl = document.getElementById('saved-searches-list');
    var emptyEl = document.getElementById('saved-searches-empty');
    listEl.innerHTML = '';
    if (list.length === 0) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    list.forEach(function (s) {
      var item = document.createElement('div');
      item.className = 'saved-search-item';
      item.innerHTML = '<div class="saved-search-info">' +
        '<strong>' + escapeHtml(s.name) + '</strong>' +
        '<span class="saved-search-meta">Alerts: ' + (s.frequency || 'daily') + '</span>' +
        '</div>' +
        '<div class="saved-search-actions">' +
        '<button type="button" class="btn btn-small btn-subscribe" data-id="' + s.id + '"><i class="fas fa-bell"></i> Get alerts</button>' +
        '<button type="button" class="btn btn-small btn-apply-saved" data-id="' + s.id + '">Apply</button>' +
        '<button type="button" class="btn btn-small btn-remove-saved" data-id="' + s.id + '" aria-label="Remove">×</button>' +
        '</div>';
      listEl.appendChild(item);
      item.querySelector('.btn-apply-saved').addEventListener('click', function () {
        state.selectedTags = { industry: [], skills: [], seniority: [], employment_type: [], experience_level: [] };
        (s.selected_tag_ids || []).forEach(function (o) {
          if (!state.selectedTags[o.category]) state.selectedTags[o.category] = [];
          state.selectedTags[o.category].push(o.id);
        });
        renderChips();
        document.querySelectorAll('.filter-group').forEach(function (g) { renderFilterOptions(g); });
        runFilter();
      });
      item.querySelector('.btn-remove-saved').addEventListener('click', function () {
        setSavedSearches(getSavedSearches().filter(function (x) { return x.id !== s.id; }));
        renderSavedSearches();
      });
    });
  }

  function init() {
    Object.keys(TAG_DEFINITIONS).forEach(function (cat) {
      if (!state.selectedTags[cat]) state.selectedTags[cat] = [];
    });
    bindFilters();
    renderChips();
    runFilter();
    renderRecommended();
    renderSavedSearches();
    document.getElementById('save-search-btn').addEventListener('click', saveSearch);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
