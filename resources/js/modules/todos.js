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

    const html = todos.map(todo => renderTodo(todo)).join('');
    listContainer.innerHTML = html;
}

function renderTodo(todo) {
    const commentCount = todo.comments ? todo.comments.length : 0;
    const dueDateLabel = todo.due_date ? formatDate(todo.due_date) : 'Aucune date';
    const toggleIcon = todo.completed ? 'bi-arrow-counterclockwise' : 'bi-check-lg';
    const toggleTitle = todo.completed ? 'Marquer comme non terminé' : 'Marquer comme terminé';

    return `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
            <div class="d-flex align-items-start gap-2">
                <button class="btn btn-sm btn-outline-success btn-circle flex-shrink-0" title="${toggleTitle}"
                    onclick="event.stopPropagation(); toggleTodo(${todo.id})">
                    <i class="bi ${toggleIcon}"></i>
                </button>
                <div class="flex-grow-1">
                    <div>
                        <span class="todo-text ${todo.completed ? 'completed' : ''}">${escapeHtml(todo.text)}</span>
                        ${todo.completed ? '<span class="badge bg-success ms-2">Terminé</span>' : ''}
                    </div>
                    <div class="text-muted" style="font-size: 0.85rem;">
                        Ajouté par <strong>${escapeHtml(todo.pseudo || 'Anonyme')}</strong>
                        ${todo.assigned_to ? ` • Assigné à ${escapeHtml(todo.assigned_to)}` : ''}
                        • ${dueDateLabel}
                    </div>
                </div>
                <div class="d-flex gap-2 flex-shrink-0">
                    <button class="btn btn-sm btn-outline-secondary btn-circle" title="Afficher les commentaires"
                        onclick="event.stopPropagation(); toggleComments(${todo.id})">
                        <i class="bi bi-chat-dots"></i>
                        ${commentCount > 0 ? `<span class="comment-badge">${commentCount}</span>` : ''}
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
            <div class="comments-section" id="commentsContainer${todo.id}" style="display: none;"></div>
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
    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                toggle: true,
            }),
        });

        if (response.ok) {
            loadTodos();
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
    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            loadTodos();
        } else {
            alert('Erreur lors de l\'assignation de la tâche');
        }
    } catch (error) {
        console.error('Erreur assign todo:', error);
        alert('Erreur de connexion');
    }
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
