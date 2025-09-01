let currentPage = 1;
let currentPageSize = 10;
let totalPages = 1;

// Load users on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    setupEventListeners();
});

function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', debounce(() => {
        currentPage = 1;
        loadUsers();
    }, 300));

    // Filters
    document.getElementById('roleFilter').addEventListener('change', () => {
        currentPage = 1;
        loadUsers();
    });
    document.getElementById('statusFilter').addEventListener('change', () => {
        currentPage = 1;
        loadUsers();
    });

    // Page size
    document.getElementById('pageSize').addEventListener('change', (e) => {
        currentPageSize = parseInt(e.target.value);
        currentPage = 1;
        loadUsers();
    });
}

async function loadUsers() {
    try {
        const searchTerm = document.getElementById('searchInput').value;
        const role = document.getElementById('roleFilter').value;
        const isActive = document.getElementById('statusFilter').value;

        const response = await fetch(`/api/users?page=${currentPage}&pageSize=${currentPageSize}&searchTerm=${searchTerm}&role=${role}&isActive=${isActive}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch users');

        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        renderUsers(data.users);
        renderPagination(data.total, data.pageSize);

    } catch (error) {
        showError('Error loading users: ' + error.message);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(user.Username)}</td>
            <td>${escapeHtml(user.Email)}</td>
            <td><span class="badge bg-${getRoleBadgeColor(user.Role)}">${escapeHtml(user.Role)}</span></td>
            <td><span class="badge bg-${user.IsActive ? 'success' : 'danger'}">${user.IsActive ? 'Active' : 'Inactive'}</span></td>
            <td>${new Date(user.CreatedAt).toLocaleDateString()}</td>
            <td>${user.LastLoginAt ? new Date(user.LastLoginAt).toLocaleDateString() : 'Never'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showEditUserModal(${user.Id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.Id})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPagination(total, pageSize) {
    totalPages = Math.ceil(total / pageSize);
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Previous button
    pagination.appendChild(createPaginationButton('Previous', currentPage > 1, () => {
        if (currentPage > 1) {
            currentPage--;
            loadUsers();
        }
    }));

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        pagination.appendChild(createPaginationButton(i.toString(), true, () => {
            currentPage = i;
            loadUsers();
        }, i === currentPage));
    }

    // Next button
    pagination.appendChild(createPaginationButton('Next', currentPage < totalPages, () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadUsers();
        }
    }));
}

function createPaginationButton(text, enabled, onClick, isActive = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-${isActive ? 'primary' : 'outline-primary'}`;
    button.disabled = !enabled;
    button.textContent = text;
    button.onclick = onClick;
    return button;
}

function getRoleBadgeColor(role) {
    switch (role.toLowerCase()) {
        case 'admin': return 'danger';
        case 'manager': return 'warning';
        case 'readonly': return 'info';
        default: return 'success';
    }
}

function showCreateUserModal() {
    document.getElementById('createUserForm').reset();
    new bootstrap.Modal(document.getElementById('createUserModal')).show();
}

async function createUser() {
    try {
        const form = document.getElementById('createUserForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to create user');

        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
        showSuccess('User created successfully');
        loadUsers();

    } catch (error) {
        showError('Error creating user: ' + error.message);
    }
}

async function showEditUserModal(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch user details');

        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const form = document.getElementById('editUserForm');
        form.elements.userId.value = userId;
        form.elements.username.value = data.user.Username;
        form.elements.email.value = data.user.Email;
        form.elements.role.value = data.user.Role;
        form.elements.isActive.value = data.user.IsActive.toString();

        new bootstrap.Modal(document.getElementById('editUserModal')).show();

    } catch (error) {
        showError('Error loading user details: ' + error.message);
    }
}

async function updateUser() {
    try {
        const form = document.getElementById('editUserForm');
        const userId = form.elements.userId.value;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Remove password if empty
        if (!data.password) delete data.password;

        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to update user');

        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
        showSuccess('User updated successfully');
        loadUsers();

    } catch (error) {
        showError('Error updating user: ' + error.message);
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete user');

        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        showSuccess('User deleted successfully');
        loadUsers();

    } catch (error) {
        showError('Error deleting user: ' + error.message);
    }
}

function showSuccess(message) {
    // Implement your success notification
    alert(message);
}

function showError(message) {
    // Implement your error notification
    alert(message);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
