import { API_BASE_URL, getListId } from '../state';
import { getCurrentUserEmail } from './auth';

let listId = getListId();

function setListId(value) {
    listId = value;
}

async function loadTodos() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}`);
        const todos = await response.json();
        displayTodos(todos);
        updateStats(todos);
    } catch (error) {
        console.error('Erreur lors du chargement des todos:', error);
    }
}

function displayTodos(todos) {
    const listContainer = document.getElementById('todoList');
    if (!listContainer) {
        return;
    }

    if (!todos.length) {
        listContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                <p class="mt-3">Aucune tâche pour le moment</p>
            </div>
        `;
        return;
    }

    const grouped = new Map();
    const uncategorized = [];

    todos.forEach(todo => {
        if (todo.category) {
            const categoryId = `cat_${todo.category.id}`;
            if (!grouped.has(categoryId)) {
                grouped.set(categoryId, {
                    name: todo.category.name,
                    color: todo.category.color,
                    todos: [],
                });
            }
            grouped.get(categoryId).todos.push(todo);
        } else {
            uncategorized.push(todo);
        }
    });

    let html = '';

    if (uncategorized.length) {
        html += `
            <div class="mb-3">
                ${uncategorized.map(todo => renderTodo(todo)).join('')}
            </div>
        `;
    }

    if (grouped.size) {
        html += '<div class="accordion" id="todoAccordion">';

        const categoriesArray = Array.from(grouped.entries()).sort((a, b) => {
            const catA = a[1].name.toLowerCase();
            const catB = b[1].name.toLowerCase();
            return catA.localeCompare(catB, 'fr');
        });

        categoriesArray.forEach(([key, data], index) => {
            const collapseId = `collapse_${key}`;
            const headingId = `heading_${key}`;
            const isOpen = index === 0 && !uncategorized.length;
            const badgeColor = data.color || '#6c757d';
            const tasksHtml = data.todos.map(todo => renderTodo(todo)).join('');

            html += `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${headingId}">
                        <button class="accordion-button ${isOpen ? '' : 'collapsed'}" type="button"
                            data-bs-toggle="collapse" data-bs-target="#${collapseId}"
                            aria-expanded="${isOpen ? 'true' : 'false'}" aria-controls="${collapseId}">
                            <span class="badge rounded-pill me-2" style="background-color: ${badgeColor}; color: #fff;">
                                ${escapeHtml(data.name)}
                            </span>
                            <span class="ms-1 text-muted">${data.todos.length} tâche${data.todos.length > 1 ? 's' : ''}</span>
                        </button>
                    </h2>
                    <div id="${collapseId}" class="accordion-collapse collapse ${isOpen ? 'show' : ''}"
                        aria-labelledby="${headingId}" data-bs-parent="#todoAccordion">
                        <div class="accordion-body p-0">
                            ${tasksHtml}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    listContainer.innerHTML = html;
}

function renderTodo(todo) {
    const commentCount = todo.comments ? todo.comments.length : 0;
    const dueDateLabel = todo.due_date ? formatDate(todo.due_date) : 'Aucune date';
    const toggleIcon = todo.completed ? 'bi-arrow-counterclockwise' : 'bi-check-lg';
    const toggleTitle = todo.completed ? 'Marquer comme non terminé' : 'Marquer comme terminé';
    const toggleButtonClass = todo.completed
        ? 'btn btn-sm btn-outline-success btn-circle flex-shrink-0'
        : 'btn btn-sm btn-outline-primary btn-circle flex-shrink-0';
    const creatorBadge = todo.pseudo
        ? `<span class="badge bg-light text-dark pseudo-badge ms-2"><i class="bi bi-person-fill"></i> ${escapeHtml(todo.pseudo)}</span>`
        : '';
    const assignedBadge = todo.assigned_to
        ? `<span class="badge bg-info text-dark pseudo-badge ms-2"><i class="bi bi-person-check"></i> ${escapeHtml(todo.assigned_to)}</span>`
        : '';
    const categoryBadge = todo.category
        ? `<span class="badge" style="background-color:${todo.category.color};">${escapeHtml(todo.category.name)}</span>`
        : '';

    return `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}" data-category="${todo.category ? todo.category.id : ''}" data-assigned="${todo.assigned_to ? escapeHtml(todo.assigned_to) : ''}" data-due-date="${todo.due_date || ''}" data-completed="${todo.completed ? '1' : '0'}">
            <div class="d-flex align-items-start gap-2">
                <button class="${toggleButtonClass}" title="${toggleTitle}"
                    onclick="event.stopPropagation(); toggleTodo(${todo.id})">
                    <i class="bi ${toggleIcon}"></i>
                </button>
                <div class="flex-grow-1">
                    <div>
                        <span class="todo-text ${todo.completed ? 'completed' : ''}">${escapeHtml(todo.text)}</span>
                        ${todo.completed ? '<span class="badge bg-success ms-2"><i class="bi bi-check-circle"></i> Terminé</span>' : ''}
                        ${categoryBadge}
                        ${creatorBadge}
                        ${assignedBadge}
                    </div>
                    <div class="text-muted" style="font-size: 0.85rem;">
                        Ajouté par <strong>${escapeHtml(todo.pseudo || 'Anonyme')}</strong>
                        • ${dueDateLabel}
                    </div>
                </div>
                <div class="d-flex gap-2 flex-shrink-0">
                    <button class="btn btn-sm btn-outline-secondary btn-circle" title="Afficher les commentaires"
                        onclick="event.stopPropagation(); toggleComments(${todo.id})">
                        <i class="bi bi-chat-dots"></i>
                        <span class="comment-badge" id="comment-badge-${todo.id}" ${commentCount > 0 ? '' : 'style="display:none;"'}>${commentCount}</span>
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary btn-circle dropdown-toggle" type="button"
                            id="dropdownMenuButton${todo.id}" data-bs-toggle="dropdown" aria-expanded="false"
                            onclick="event.stopPropagation();">
                            <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton${todo.id}">
                            ${!todo.assigned_to ? `<li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); assignTodo(${todo.id}); return false;"><i class="bi bi-person-plus me-2"></i>Je m'en occupe</a></li>` : ''}
                            <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); changeCategory(${todo.id}); return false;"><i class="bi bi-tag me-2"></i>Changer de catégorie</a></li>
                            <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); changeDueDate(${todo.id}); return false;"><i class="bi bi-calendar-plus me-2"></i>Modifier la date</a></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="event.stopPropagation(); deleteTodo(${todo.id}); return false;"><i class="bi bi-trash me-2"></i>Supprimer</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="comments-section" id="comments-${todo.id}" style="display: none;">
                <div class="comment-list" id="comments-list-${todo.id}"></div>
                <div class="comment-form input-group mt-2">
                    <input type="text" class="form-control" id="comment-input-${todo.id}" placeholder="Ajouter un commentaire...">
                    <button class="btn btn-outline-primary" type="button" onclick="addComment(${todo.id})">
                        <i class="bi bi-send"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function updateStats(todos) {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const remaining = total - completed;

    const totalElement = document.getElementById('totalCount');
    const completedElement = document.getElementById('completedCount');
    const remainingElement = document.getElementById('remainingCount');

    if (totalElement) {
        totalElement.textContent = total;
    }
    if (completedElement) {
        completedElement.textContent = completed;
    }
    if (remainingElement) {
        remainingElement.textContent = remaining;
    }
}

async function addTodo() {
    const input = document.getElementById('todoInput');
    const pseudo = localStorage.getItem('simpleTodo_pseudo');

    if (!input) {
        return;
    }

    const text = input.value.trim();
    if (!text) {
        alert('Veuillez entrer une tâche');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                pseudo: pseudo || 'Anonyme',
            }),
        });

        if (response.ok) {
            input.value = '';
            loadTodos();
        } else {
            alert('Erreur lors de l\'ajout de la tâche');
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la tâche:', error);
        alert('Erreur de connexion');
    }
}

async function toggleTodo(id) {
    const todoElement = document.querySelector(`.todo-item[data-id="${id}"]`);
    const currentCompleted = todoElement?.getAttribute('data-completed') === '1';
    const newCompleted = !currentCompleted;

    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                completed: newCompleted,
            }),
        });

        if (response.ok) {
            loadTodos();
        } else if (response.status === 422) {
            const error = await response.json().catch(() => null);
            console.error('Validation toggle todo:', error);
            alert(error?.message || 'Validation impossible pour cette tâche');
        } else {
            alert('Erreur lors du changement d\'état de la tâche');
        }
    } catch (error) {
        console.error('Erreur toggle todo:', error);
        alert('Erreur de connexion');
    }
}

async function deleteTodo(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            loadTodos();
        } else {
            alert('Erreur lors de la suppression de la tâche');
        }
    } catch (error) {
        console.error('Erreur suppression todo:', error);
        alert('Erreur de connexion');
    }
}

async function clearCompleted() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les tâches terminées ?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            loadTodos();
        } else {
            alert('Erreur lors de la suppression des tâches terminées');
        }
    } catch (error) {
        console.error('Erreur clear completed:', error);
        alert('Erreur de connexion');
    }
}

async function assignTodo(id) {
    const storedPseudo = localStorage.getItem('simpleTodo_pseudo') || '';
    const email = (typeof window !== 'undefined' && window.userEmail)
        ? window.userEmail
        : getCurrentUserEmail();

    if (!email) {
        alert("Impossible d'assigner la tâche : votre adresse email est introuvable. Veuillez vous reconnecter.");
        return;
    }

    let pseudo = storedPseudo;
    if (!pseudo && window.isAuthenticated) {
        pseudo = email.split('@')[0];
        localStorage.setItem('simpleTodo_pseudo', pseudo);
    }

    if (!pseudo) {
        alert('Veuillez enregistrer votre pseudo avant de vous assigner une tâche.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Email': email,
                'X-User-Pseudo': pseudo,
            },
            body: JSON.stringify({
                pseudo,
            }),
        });

        if (response.ok) {
            loadTodos();
        } else if (response.status === 422) {
            const data = await response.json().catch(() => null);
            console.error('Validation assign todo:', data);
            alert((data && data.message) || "Impossible d'assigner la tâche (422)");
        } else {
            alert("Erreur lors de l'assignation de la tâche");
        }
    } catch (error) {
        console.error('Erreur assign todo:', error);
        alert('Erreur de connexion');
    }
}

async function changeDueDate(todoId) {
    const todoElement = document.querySelector(`[data-id="${todoId}"]`);
    if (!todoElement) {
        alert('Impossible de récupérer la tâche ciblée. Veuillez recharger la page.');
        return;
    }

    const currentDueDate = todoElement.getAttribute('data-due-date') || '';
    const currentLabel = currentDueDate
        ? new Date(currentDueDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
        })
        : 'Aucune date';
}

export {
    setListId,
    loadTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    assignTodo,
};
