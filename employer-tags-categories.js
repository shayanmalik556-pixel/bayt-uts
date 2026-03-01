(function () {
  'use strict';

  var TAG_DEFINITIONS = window.EMPLOYER_TAG_DEFINITIONS || {};
  var CATEGORY_LABELS = window.EMPLOYER_CATEGORY_LABELS || {};
  var STORAGE_CANDIDATE_TAGS = 'bayt_employer_candidate_tags';
  var STORAGE_CUSTOM = 'bayt_employer_custom_categories_and_tags';
  var customData = { categories: [], tagsByCategory: {} };

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

  function getCategoryLabel(catId) {
    if (CATEGORY_LABELS[catId]) return CATEGORY_LABELS[catId];
    var c = (customData.categories || []).find(function (x) { return (typeof x === 'string' ? x : x.id) === catId; });
    return (c && c.label) ? c.label : catId;
  }

  function getAllCategoryIds() {
    var predefined = Object.keys(TAG_DEFINITIONS);
    var customIds = (customData.categories || []).map(function (c) { return typeof c === 'string' ? c : c.id; });
    return predefined.concat(customIds);
  }

  function getTagsForCategory(catId) {
    var defs = (TAG_DEFINITIONS[catId] || []).map(function (t) { return t.label; });
    var custom = customData.tagsByCategory[catId] || [];
    return defs.concat(custom);
  }

  function replaceTagInCandidateTags(oldLabel, newLabel, categoryId) {
    var data = loadCandidateTags();
    Object.keys(data).forEach(function (applicantId) {
      data[applicantId] = (data[applicantId] || []).map(function (t) {
        if (t.label === oldLabel && (t.categoryId === categoryId || !categoryId)) {
          return { categoryId: t.categoryId, tagId: t.tagId, label: newLabel };
        }
        return t;
      });
    });
    saveCandidateTags(data);
  }

  function moveCandidateTagsToCategory(sourceCatId, targetCatId) {
    var data = loadCandidateTags();
    Object.keys(data).forEach(function (applicantId) {
      data[applicantId] = (data[applicantId] || []).map(function (t) {
        if (t.categoryId === sourceCatId) {
          return { categoryId: targetCatId, tagId: t.tagId, label: t.label };
        }
        return t;
      });
    });
    saveCandidateTags(data);
  }

  function removeTagFromAllCandidates(categoryId, tagLabel) {
    var data = loadCandidateTags();
    Object.keys(data).forEach(function (applicantId) {
      data[applicantId] = (data[applicantId] || []).filter(function (t) {
        return !(t.categoryId === categoryId && t.label === tagLabel);
      });
    });
    saveCandidateTags(data);
  }

  function removeCategoryFromAllCandidates(catId) {
    var data = loadCandidateTags();
    Object.keys(data).forEach(function (applicantId) {
      data[applicantId] = (data[applicantId] || []).filter(function (t) { return t.categoryId !== catId; });
    });
    saveCandidateTags(data);
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return escapeHtml(String(s)).replace(/"/g, '&quot;');
  }

  function showConfirm(message, onConfirm, onCancel) {
    var overlay = document.getElementById('employer-edit-confirm-overlay');
    var msgEl = document.getElementById('employer-edit-confirm-message');
    var okBtn = document.getElementById('employer-edit-confirm-ok');
    var cancelBtn = document.getElementById('employer-edit-confirm-cancel');
    if (!overlay || !msgEl) return;
    msgEl.textContent = message;
    function close() {
      overlay.setAttribute('hidden', '');
      if (okBtn) okBtn.onclick = null;
      if (cancelBtn) cancelBtn.onclick = null;
    }
    if (okBtn) okBtn.onclick = function () { close(); if (onConfirm) onConfirm(); };
    if (cancelBtn) cancelBtn.onclick = function () { close(); if (onCancel) onCancel(); };
    overlay.onclick = function (e) { if (e.target === overlay) { close(); if (onCancel) onCancel(); } };
    overlay.removeAttribute('hidden');
  }

  function showAlert(message) {
    var overlay = document.getElementById('employer-edit-alert-overlay');
    var msgEl = document.getElementById('employer-edit-alert-message');
    var okBtn = document.getElementById('employer-edit-alert-ok');
    if (!overlay || !msgEl) return;
    msgEl.textContent = message;
    function close() { overlay.setAttribute('hidden', ''); if (okBtn) okBtn.onclick = null; }
    if (okBtn) okBtn.onclick = close;
    overlay.onclick = function (e) { if (e.target === overlay) close(); };
    overlay.removeAttribute('hidden');
  }

  function showRenameModal(labelText, currentValue, onSave, onCancel) {
    var overlay = document.getElementById('employer-edit-rename-overlay');
    var labelEl = document.getElementById('employer-edit-rename-label');
    var inputEl = document.getElementById('employer-edit-rename-input');
    var saveBtn = document.getElementById('employer-edit-rename-save');
    var cancelBtn = document.getElementById('employer-edit-rename-cancel');
    if (!overlay || !inputEl) return;
    if (labelEl) labelEl.textContent = labelText || 'New name';
    inputEl.value = currentValue || '';
    function close() {
      overlay.setAttribute('hidden', '');
      if (saveBtn) saveBtn.onclick = null;
      if (cancelBtn) cancelBtn.onclick = null;
    }
    if (saveBtn) saveBtn.onclick = function () {
      var val = (inputEl.value || '').trim();
      close();
      if (onSave) onSave(val);
    };
    if (cancelBtn) cancelBtn.onclick = function () { close(); if (onCancel) onCancel(); };
    overlay.onclick = function (e) { if (e.target === overlay) { close(); if (onCancel) onCancel(); } };
    overlay.removeAttribute('hidden');
    inputEl.focus();
  }

  function nextCustomCategoryId() {
    var ids = (customData.categories || []).map(function (c) { return typeof c === 'string' ? c : c.id; });
    var n = 1;
    while (ids.indexOf('custom-' + n) >= 0) n++;
    return 'custom-' + n;
  }

  function showMergeModal(title, options, onConfirm) {
    var overlay = document.getElementById('employer-edit-merge-overlay');
    var titleEl = document.getElementById('employer-edit-merge-title');
    var selectEl = document.getElementById('employer-edit-merge-select');
    var confirmBtn = document.getElementById('employer-edit-merge-confirm');
    var cancelBtn = document.getElementById('employer-edit-merge-cancel');
    if (!overlay || !selectEl) return;
    if (titleEl) titleEl.textContent = title;
    selectEl.innerHTML = options.map(function (opt) {
      return '<option value="' + escapeAttr(opt.value) + '">' + escapeHtml(opt.label) + '</option>';
    }).join('');
    function close() {
      overlay.setAttribute('hidden', '');
      if (confirmBtn) confirmBtn.onclick = null;
      if (cancelBtn) cancelBtn.onclick = null;
    }
    if (confirmBtn) confirmBtn.onclick = function () {
      var value = selectEl.value;
      close();
      if (value && onConfirm) onConfirm(value);
    };
    if (cancelBtn) cancelBtn.onclick = close;
    overlay.onclick = function (e) { if (e.target === overlay) close(); };
    overlay.removeAttribute('hidden');
  }

  function addCategory(name) {
    name = (name || '').trim();
    if (!name) return false;
    var id = nextCustomCategoryId();
    customData.categories.push({ id: id, label: name });
    customData.tagsByCategory[id] = customData.tagsByCategory[id] || [];
    saveCustom();
    return true;
  }

  function deleteCategory(catId) {
    if (catId.indexOf('custom-') !== 0) return;
    customData.categories = (customData.categories || []).filter(function (c) {
      return (typeof c === 'string' ? c : c.id) !== catId;
    });
    delete customData.tagsByCategory[catId];
    removeCategoryFromAllCandidates(catId);
    saveCustom();
  }

  function mergeCategoryInto(sourceCatId, targetCatId) {
    if (sourceCatId === targetCatId) return;
    var sourceTags = customData.tagsByCategory[sourceCatId] || [];
    var targetTags = (customData.tagsByCategory[targetCatId] || []).slice();
    var predefinedTarget = (TAG_DEFINITIONS[targetCatId] || []).map(function (t) { return t.label; });
    sourceTags.forEach(function (label) {
      if (targetTags.indexOf(label) < 0 && predefinedTarget.indexOf(label) < 0) {
        targetTags.push(label);
      }
    });
    customData.tagsByCategory[targetCatId] = targetTags;
    moveCandidateTagsToCategory(sourceCatId, targetCatId);
    delete customData.tagsByCategory[sourceCatId];
    customData.categories = (customData.categories || []).filter(function (c) {
      return (typeof c === 'string' ? c : c.id) !== sourceCatId;
    });
    saveCustom();
  }

  function addTagToCategory(catId, tagLabel) {
    tagLabel = (tagLabel || '').trim();
    if (!tagLabel) return false;
    var list = customData.tagsByCategory[catId] || [];
    if (list.indexOf(tagLabel) >= 0) return false;
    if (catId.indexOf('custom-') === 0) {
      list.push(tagLabel);
      customData.tagsByCategory[catId] = list;
      saveCustom();
      return true;
    }
    var predefined = (TAG_DEFINITIONS[catId] || []).map(function (t) { return t.label; });
    if (predefined.indexOf(tagLabel) >= 0) return false;
    list.push(tagLabel);
    customData.tagsByCategory[catId] = list;
    saveCustom();
    return true;
  }

  function deleteTag(catId, tagLabel) {
    var list = customData.tagsByCategory[catId] || [];
    var i = list.indexOf(tagLabel);
    if (i < 0) return;
    list.splice(i, 1);
    customData.tagsByCategory[catId] = list.length ? list : (catId.indexOf('custom-') === 0 ? [] : undefined);
    if (!customData.tagsByCategory[catId] && catId.indexOf('custom-') === 0) {
      customData.tagsByCategory[catId] = [];
    }
    removeTagFromAllCandidates(catId, tagLabel);
    saveCustom();
  }

  function mergeTagInto(catId, sourceLabel, targetLabel) {
    if (sourceLabel === targetLabel) return;
    replaceTagInCandidateTags(sourceLabel, targetLabel, catId);
    var list = customData.tagsByCategory[catId] || [];
    var si = list.indexOf(sourceLabel);
    if (si >= 0) {
      list.splice(si, 1);
      customData.tagsByCategory[catId] = list;
    }
    saveCustom();
  }

  function render() {
    loadCustom();
    var predefined = Object.keys(TAG_DEFINITIONS);
    var customIds = (customData.categories || []).map(function (c) { return typeof c === 'string' ? c : c.id; });
    var allCategories = predefined.concat(customIds);
    var container = document.getElementById('employer-edit-categories');
    if (!container) return;

    container.innerHTML = allCategories.map(function (catId, index) {
      var isCustom = catId.indexOf('custom-') === 0;
      var label = getCategoryLabel(catId);
      var tags = getTagsForCategory(catId);
      var expandedClass = index === 0 ? ' edit-category-expanded' : '';
      return '<div class="edit-category-block' + expandedClass + '" data-category="' + escapeAttr(catId) + '">' +
        '<div class="edit-category-header" role="button" tabindex="0" aria-expanded="' + (index === 0 ? 'true' : 'false') + '">' +
        '<span class="edit-category-chevron" aria-hidden="true"><i class="fas fa-chevron-down"></i></span>' +
        '<span class="edit-category-name">' + escapeHtml(label) + '</span>' +
        (isCustom
          ? '<button type="button" class="edit-btn-menu btn-cat-menu" data-category="' + escapeAttr(catId) + '" aria-label="Category actions"><i class="fas fa-ellipsis-v"></i></button>'
          : '') +
        '</div>' +
        '<div class="edit-category-body">' +
        '<ul class="edit-tags-list">' +
        tags.map(function (tagLabel) {
          var isCustomTag = (customData.tagsByCategory[catId] || []).indexOf(tagLabel) >= 0;
          return '<li class="edit-tag-item">' +
            '<span class="edit-tag-label">' + escapeHtml(tagLabel) + '</span>' +
            (isCustomTag
              ? '<button type="button" class="edit-btn-menu btn-tag-menu" data-category="' + escapeAttr(catId) + '" data-tag="' + escapeAttr(tagLabel) + '" aria-label="Tag actions"><i class="fas fa-ellipsis-v"></i></button>'
              : '') +
            '</li>';
        }).join('') +
        '</ul>' +
        '<div class="edit-add-tag-row">' +
        '<button type="button" class="edit-btn-add-tag btn-add-tag" data-category="' + escapeAttr(catId) + '"><i class="fas fa-plus"></i> Add tag</button>' +
        '<div class="edit-add-tag-form" data-category="' + escapeAttr(catId) + '" hidden>' +
        '<input type="text" class="edit-inline-input edit-add-tag-input" placeholder="Tag name" />' +
        '<button type="button" class="btn btn-inline-add edit-add-tag-submit" data-category="' + escapeAttr(catId) + '">Add</button>' +
        '<button type="button" class="btn btn-inline-cancel edit-add-tag-cancel" data-category="' + escapeAttr(catId) + '">Cancel</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    bindCollapse(container);
    bindActionMenus(container);
    bindAddTagForms(container);
  }

  function closeActionsDropdown() {
    var dd = document.getElementById('employer-edit-actions-dropdown');
    if (dd) {
      dd.setAttribute('hidden', '');
      dd.removeAttribute('data-context-type');
      dd.removeAttribute('data-category');
      dd.removeAttribute('data-tag');
    }
  }

  function openActionsDropdown(triggerBtn, contextType, catId, tagLabel) {
    var dd = document.getElementById('employer-edit-actions-dropdown');
    if (!dd) return;
    dd.setAttribute('data-context-type', contextType);
    dd.setAttribute('data-category', catId || '');
    dd.setAttribute('data-tag', tagLabel || '');
    var rect = triggerBtn.getBoundingClientRect();
    dd.style.left = rect.left + 'px';
    dd.style.top = (rect.bottom + 4) + 'px';
    dd.removeAttribute('hidden');
  }

  function runAction(action) {
    var dd = document.getElementById('employer-edit-actions-dropdown');
    if (!dd) return;
    var contextType = dd.getAttribute('data-context-type');
    var catId = dd.getAttribute('data-category');
    var tagLabel = dd.getAttribute('data-tag') || '';
    closeActionsDropdown();

    if (contextType === 'category') {
      if (action === 'rename') {
        var c = customData.categories.find(function (x) { return (typeof x === 'string' ? x : x.id) === catId; });
        var current = c && c.label ? c.label : catId;
        showRenameModal('New category name', current, function (name) {
          if (name && c) {
            c.label = name;
            saveCustom();
            render();
          }
        });
      } else if (action === 'delete') {
        showConfirm('Delete category "' + getCategoryLabel(catId) + '"? All tags in this category will be removed from every candidate. Continue?', function () {
          deleteCategory(catId);
          render();
        });
      } else if (action === 'merge') {
        var sourceLabel = getCategoryLabel(catId);
        showConfirm('All candidates tagged with tags from "' + sourceLabel + '" will be moved to the category you select. Continue?', function () {
          var allIds = getAllCategoryIds().filter(function (id) { return id !== catId; });
          if (allIds.length === 0) {
            showAlert('There is no other category to merge into.');
            return;
          }
          showMergeModal('Merge into which category?', allIds.map(function (id) { return { value: id, label: getCategoryLabel(id) }; }), function (targetCatId) {
            mergeCategoryInto(catId, targetCatId);
            render();
          });
        });
      }
    } else if (contextType === 'tag') {
      if (action === 'rename') {
        var list = customData.tagsByCategory[catId] || [];
        var i = list.indexOf(tagLabel);
        if (i >= 0) {
          showRenameModal('New tag name', tagLabel, function (name) {
            if (name) {
              list[i] = name;
              customData.tagsByCategory[catId] = list;
              replaceTagInCandidateTags(tagLabel, name, catId);
              saveCustom();
              render();
            }
          });
        }
      } else if (action === 'delete') {
        showConfirm('Delete tag "' + tagLabel + '"? This tag will be removed from all candidates. Continue?', function () {
          deleteTag(catId, tagLabel);
          render();
        });
      } else if (action === 'merge') {
        showConfirm('All candidates with tag "' + tagLabel + '" will be moved to the new tag you select. Continue?', function () {
          var tags = getTagsForCategory(catId).filter(function (l) { return l !== tagLabel; });
          if (tags.length === 0) {
            showAlert('There is no other tag in this category to merge into.');
            return;
          }
          showMergeModal('Merge into which tag?', tags.map(function (l) { return { value: l, label: l }; }), function (targetLabel) {
            mergeTagInto(catId, tagLabel, targetLabel);
            render();
          });
        });
      }
    }
  }

  function bindCollapse(container) {
    if (!container) return;
    container.querySelectorAll('.edit-category-header').forEach(function (header) {
      header.addEventListener('click', function (e) {
        if (e.target.closest('.edit-btn-menu')) return;
        var block = header.closest('.edit-category-block');
        if (block) block.classList.toggle('edit-category-expanded');
        header.setAttribute('aria-expanded', block && block.classList.contains('edit-category-expanded') ? 'true' : 'false');
      });
    });
  }

  function bindActionMenus(container) {
    if (!container) return;
    var dd = document.getElementById('employer-edit-actions-dropdown');
    if (!dd) return;

    container.addEventListener('click', function (e) {
      var catMenu = e.target.closest('.btn-cat-menu');
      var tagMenu = e.target.closest('.btn-tag-menu');
      if (catMenu) {
        e.preventDefault();
        e.stopPropagation();
        openActionsDropdown(catMenu, 'category', catMenu.getAttribute('data-category'), null);
      } else if (tagMenu) {
        e.preventDefault();
        e.stopPropagation();
        openActionsDropdown(tagMenu, 'tag', tagMenu.getAttribute('data-category'), tagMenu.getAttribute('data-tag'));
      }
    });

    dd.querySelectorAll('.edit-action-item').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        runAction(btn.getAttribute('data-action'));
      });
    });

    dd.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  function setupCloseDropdownOnOutsideClick() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('#employer-edit-actions-dropdown') || e.target.closest('.edit-btn-menu')) return;
      closeActionsDropdown();
    });
  }

  function initAddCategory() {
    var form = document.getElementById('employer-edit-add-category-form');
    var input = document.getElementById('employer-edit-add-category-input');
    var submit = document.getElementById('employer-edit-add-category-submit');
    var cancel = document.getElementById('employer-edit-add-category-cancel');
    if (!form) return;
    if (submit) {
      submit.addEventListener('click', function () {
        var name = input ? (input.value || '').trim() : '';
        if (!name) return;
        if (addCategory(name)) {
          if (input) input.value = '';
          render();
        } else {
          showAlert('Please enter a category name.');
        }
      });
    }
    if (cancel) {
      cancel.addEventListener('click', function () {
        if (input) input.value = '';
      });
    }
  }

  function bindAddTagForms(container) {
    if (!container) return;

    container.querySelectorAll('.btn-add-tag').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var block = btn.closest('.edit-category-block');
        var form = block && block.querySelector('.edit-add-tag-form');
        if (!form) return;
        form.removeAttribute('hidden');
        var input = form.querySelector('.edit-add-tag-input');
        if (input) {
          input.value = '';
          input.focus();
        }
      });
    });

    container.querySelectorAll('.edit-add-tag-submit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var catId = btn.getAttribute('data-category');
        var block = btn.closest('.edit-category-block');
        var form = block && block.querySelector('.edit-add-tag-form');
        var input = form && form.querySelector('.edit-add-tag-input');
        if (!input) return;
        var tagLabel = (input.value || '').trim();
        if (!tagLabel) return;
        if (addTagToCategory(catId, tagLabel)) {
          if (form) form.setAttribute('hidden', '');
          render();
        } else {
          showAlert('Tag already exists or invalid.');
        }
      });
    });

    container.querySelectorAll('.edit-add-tag-cancel').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var block = btn.closest('.edit-category-block');
        var form = block && block.querySelector('.edit-add-tag-form');
        if (form) form.setAttribute('hidden', '');
      });
    });
  }

  function initRole() {
    var sel = document.getElementById('employer-tag-role');
    if (!sel) return;
    try {
      var saved = localStorage.getItem('bayt_employer_tag_role');
      if (saved === 'admin' || saved === 'recruiter') sel.value = saved;
    } catch (e) {}
    sel.addEventListener('change', function () {
      try { localStorage.setItem('bayt_employer_tag_role', sel.value); } catch (e) {}
    });
  }

  function init() {
    initRole();
    setupCloseDropdownOnOutsideClick();
    initAddCategory();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
