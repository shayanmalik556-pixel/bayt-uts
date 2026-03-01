(function () {
  'use strict';

  var STORAGE_PERMISSIONS = 'bayt_employer_tag_permissions';
  var STORAGE_EMPLOYER_ROLE = 'bayt_employer_tag_role';

  var MOCK_USERS = [
    { id: 'user-1', name: 'Sarah (Admin)', role: 'Admin' },
    { id: 'user-2', name: 'Omar (Recruiter)', role: 'Recruiter' },
    { id: 'user-3', name: 'Layla (Recruiter)', role: 'Recruiter' }
  ];

  function loadPermissions() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_PERMISSIONS) || '{}');
    } catch (e) {
      return {};
    }
  }

  function savePermissions(data) {
    localStorage.setItem(STORAGE_PERMISSIONS, JSON.stringify(data));
  }

  function getPermissionsForUser(userId) {
    var data = loadPermissions();
    if (data[userId]) return data[userId];
    var user = MOCK_USERS.find(function (u) { return u.id === userId; });
    if (user && user.role === 'Admin') {
      return { create: true, edit: true, merge: true, use: true };
    }
    return { create: true, edit: false, merge: false, use: true };
  }

  function setPermission(userId, key, value) {
    var data = loadPermissions();
    if (!data[userId]) data[userId] = getPermissionsForUser(userId);
    data[userId][key] = !!value;
    savePermissions(data);
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
    });
  }

  function render() {
    var tbody = document.getElementById('employer-permissions-tbody');
    if (!tbody) return;
    tbody.innerHTML = MOCK_USERS.map(function (user) {
      var p = getPermissionsForUser(user.id);
      return '<tr data-user-id="' + user.id + '">' +
        '<td class="perm-user">' + user.name + '</td>' +
        '<td><input type="checkbox" class="perm-checkbox perm-create" data-key="create" ' + (p.create ? 'checked' : '') + ' aria-label="Create" /></td>' +
        '<td><input type="checkbox" class="perm-checkbox perm-edit" data-key="edit" ' + (p.edit ? 'checked' : '') + ' aria-label="Edit" /></td>' +
        '<td><input type="checkbox" class="perm-checkbox perm-merge" data-key="merge" ' + (p.merge ? 'checked' : '') + ' aria-label="Merge" /></td>' +
        '<td><input type="checkbox" class="perm-checkbox perm-use" data-key="use" ' + (p.use ? 'checked' : '') + ' aria-label="Use tags" /></td>' +
        '</tr>';
    }).join('');

    tbody.querySelectorAll('.perm-checkbox').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var row = this.closest('tr');
        var userId = row && row.getAttribute('data-user-id');
        var key = this.getAttribute('data-key');
        if (userId && key) setPermission(userId, key, this.checked);
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
