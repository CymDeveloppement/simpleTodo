import { API_BASE_URL, getListId } from '../state';
import { getCurrentUserEmail } from './auth';
import { alertBs, confirmBs } from './alert';

let listId = getListId();
let mistralDraft = null;

function setListId(value) {
    listId = value;
}

function priorityToBootstrap(priority) {
    switch ((priority || 'medium').toLowerCase()) {
        case 'high':
            return 'danger';
        case 'low':
            return 'secondary';
        default:
            return 'primary';
    }
}

function initMistralModal() {
    const generateBtn = document.getElementById('mistralGenerateBtn');
    const importBtn = document.getElementById('mistralImportBtn');
    const modalElement = document.getElementById('mistralModal');

    if (!generateBtn || !modalElement) {
        return;
    }

    const originalGenerateLabel = generateBtn.innerHTML;

    const promptField = document.getElementById('mistralPrompt');
    const maxItemsField = document.getElementById('mistralMaxItems');
    const deadlineField = document.getElementById('mistralDeadline');
    const alertBox = document.getElementById('mistralAlert');
    const statusBox = document.getElementById('mistralStatus');
    const resultWrapper = document.getElementById('mistralResultWrapper');
    const resultTitle = document.getElementById('mistralResultTitle');
    const resultSummary = document.getElementById('mistralResultSummary');
    const resultItems = document.getElementById('mistralResultItems');

    const resetModal = () => {
        mistralDraft = null;
        if (alertBox) {
            alertBox.classList.add('d-none');
            alertBox.textContent = '';
        }
        if (statusBox) {
            statusBox.classList.add('d-none');
            statusBox.classList.remove('text-success', 'text-danger');
            statusBox.classList.add('text-muted');
            statusBox.textContent = '';
        }
        if (resultWrapper) {
            resultWrapper.classList.add('d-none');
            resultTitle.textContent = '';
            resultSummary.textContent = '';
            resultItems.innerHTML = '';
        }
        if (deadlineField) {
            deadlineField.value = '';
        }
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalGenerateLabel;
        if (importBtn) {
            importBtn.disabled = true;
        }
    };

    modalElement.addEventListener('shown.bs.modal', () => {
        resetModal();
        promptField?.focus();
    });

    const handleGenerate = async () => {
        if (!promptField || !maxItemsField || !alertBox || !resultWrapper || !resultTitle || !resultSummary || !resultItems) {
            return;
        }

        const prompt = promptField.value.trim();
        const maxItems = parseInt(maxItemsField.value, 10);
        const deadline = deadlineField?.value ? deadlineField.value : null;
        const rawEmail = (typeof window !== 'undefined') ? (window.userEmail || getCurrentUserEmail()) : '';
        const currentEmail = rawEmail ? rawEmail.trim() : '';

        if (!window.isListCreator) {
            alertBox.textContent = 'Seul le propriétaire de la liste peut utiliser la génération Mistral.';
            alertBox.classList.remove('d-none');
            return;
        }

        if (prompt === '') {
            alertBox.textContent = 'Veuillez décrire ce que vous souhaitez générer.';
            alertBox.classList.remove('d-none');
            return;
        }

        alertBox.classList.add('d-none');
        resultWrapper.classList.add('d-none');
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Génération en cours…';
        if (statusBox) {
            statusBox.classList.remove('d-none', 'text-success', 'text-danger');
            statusBox.classList.add('text-muted');
            statusBox.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Génération en cours…';
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/mistral/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Email': currentEmail || '',
                },
                body: JSON.stringify({
                    prompt,
                    max_items: Number.isNaN(maxItems) ? undefined : maxItems,
                    deadline,
                    list_id: listId,
                    email: currentEmail || undefined,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || 'Erreur lors de la génération.');
            }

            const data = await response.json();
            mistralDraft = data;

            resultTitle.textContent = data.title || 'Liste générée';
            resultSummary.textContent = data.summary || '';
            resultSummary.style.display = data.summary ? 'block' : 'none';

            if (Array.isArray(data.items) && data.items.length) {
                resultItems.innerHTML = data.items.map((item, index) => `
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between">
                            <span class="fw-semibold">${escapeHtml(item.title || `Tâche ${index + 1}`)}</span>
                            <span class="badge bg-${priorityToBootstrap(item.priority)} text-uppercase">${(item.priority || 'medium')}</span>
                        </div>
                        ${item.description ? `<p class="mb-1">${escapeHtml(item.description)}</p>` : ''}
                        <div class="text-muted small d-flex flex-wrap gap-3">
                            ${item.category ? `<span><i class="bi bi-tag"></i> ${escapeHtml(item.category)}</span>` : ''}
                            ${item.due_date ? `<span><i class="bi bi-calendar-event"></i> ${escapeHtml(item.due_date)}</span>` : ''}
                        </div>
                    </li>
                `).join('');
            } else {
                resultItems.innerHTML = `
                    <li class="list-group-item text-muted text-center">
                        <i class="bi bi-info-circle"></i> Aucune tâche générée.
                    </li>
                `;
            }

            resultWrapper.classList.remove('d-none');
            if (importBtn) {
                importBtn.disabled = false;
            }
            if (statusBox) {
                statusBox.classList.remove('text-muted', 'text-danger');
                statusBox.classList.add('text-success');
                statusBox.innerHTML = '<i class="bi bi-check-circle me-1"></i>Génération terminée.';
            }
        } catch (error) {
            console.error('[Mistral] Generation error:', error);
            alertBox.textContent = error instanceof Error ? error.message : 'Erreur inattendue.';
            alertBox.classList.remove('d-none');
            if (statusBox) {
                statusBox.classList.remove('text-muted', 'text-success');
                statusBox.classList.add('text-danger');
                statusBox.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Erreur lors de la génération.';
            }
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalGenerateLabel;
        }
    };

    const handleImport = async () => {
        if (!mistralDraft || !Array.isArray(mistralDraft.items) || !mistralDraft.items.length) {
            alertBs('Aucune tâche à importer.');
            return;
        }

        try {
            const pseudo = localStorage.getItem('simpleTodo_pseudo') || 'Mistral';
            const email = getCurrentUserEmail();

            if (importBtn) {
                importBtn.disabled = true;
                importBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Import en cours...';
            }

            for (const [index, item] of mistralDraft.items.entries()) {
                const payload = {
                    text: item.title || `Tâche générée ${index + 1}`,
                    pseudo,
                    description: item.description || null,
                    due_date: item.due_date || null,
                    priority: item.priority || 'medium',
                    category_name: item.category || null,
                    source: 'mistral',
                };

                await fetch(`${API_BASE_URL}/api/todos/${listId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(email ? { 'X-User-Email': email } : {}),
                    },
                    body: JSON.stringify(payload),
                });
            }

            loadTodos();
            alertBs('Tâches importées avec succès depuis Mistral.');
            if (importBtn) {
                importBtn.disabled = false;
                importBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Importer dans la liste';
            }
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal?.hide();
        } catch (error) {
            console.error('[Mistral] Import error:', error);
            alertBs('Erreur lors de l\'import des tâches générées.');
            if (importBtn) {
                importBtn.disabled = false;
                importBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Importer dans la liste';
            }
            return;
        }

        if (importBtn) {
            importBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Importer dans la liste';
        }
    };

    generateBtn.addEventListener('click', handleGenerate);
    if (importBtn) {
        importBtn.addEventListener('click', handleImport);
    }
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

    if (window.updateCommentBadge) {
        todos.forEach(todo => {
            window.updateCommentBadge(todo.id);
        });
    }
}

function renderTodo(todo) {
    const commentCount = todo.comments ? todo.comments.length : 0;
    const dueDateLabel = todo.due_date ? formatDate(todo.due_date) : 'Aucune date';
    const toggleIcon = todo.completed ? 'bi-arrow-counterclockwise' : 'bi-check-lg';
    const toggleTitle = todo.completed ? 'Marquer comme non terminé' : 'Marquer comme terminé';
    const toggleButtonClass = todo.completed
        ? 'btn btn-sm btn-outline-success flex-shrink-0'
        : 'btn btn-sm btn-outline-primary flex-shrink-0';
    const creatorBadge = todo.pseudo
        ? `<span class="badge bg-light text-dark pseudo-badge ms-2"><i class="bi bi-person-fill"></i> ${escapeHtml(todo.pseudo)}</span>`
        : '';
    const assignedBadge = todo.assigned_to
        ? `<span class="badge bg-info text-dark pseudo-badge ms-2"><i class="bi bi-person-check"></i> ${escapeHtml(todo.assigned_to)}</span>`
        : '';
    const categoryBadge = todo.category
        ? `<span class="badge" style="background-color:${todo.category.color};">${escapeHtml(todo.category.name)}</span>`
        : '';

    const commentsButtonClass = commentCount > 0
        ? 'btn btn-sm btn-outline-primary'
        : 'btn btn-sm btn-outline-secondary';

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
                    <button id="comment-button-${todo.id}" class="${commentsButtonClass} btn-comment-wrapper" title="Afficher les commentaires"
                        onclick="event.stopPropagation(); toggleComments(${todo.id})">
                        <i class="bi bi-chat-dots"></i>
                        <span class="comment-badge" id="comment-badge-${todo.id}" ${commentCount > 0 ? '' : 'style="display:none;"'}>${commentCount}</span>
                        <span class="comment-badge comment-badge-new d-none" id="comment-new-badge-${todo.id}"></span>
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button"
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
        alertBs('Veuillez entrer une tâche');
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
            alertBs('Erreur lors de l\'ajout de la tâche');
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la tâche:', error);
        alertBs('Erreur de connexion');
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
            alertBs(error?.message || 'Validation impossible pour cette tâche');
        } else {
            alertBs('Erreur lors du changement d\'état de la tâche');
        }
    } catch (error) {
        console.error('Erreur toggle todo:', error);
        alertBs('Erreur de connexion');
    }
}

async function deleteTodo(id) {
    const confirmed = await confirmBs('Êtes-vous sûr de vouloir supprimer cette tâche ?');
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            loadTodos();
        } else {
            alertBs('Erreur lors de la suppression de la tâche');
        }
    } catch (error) {
        console.error('Erreur suppression todo:', error);
        alertBs('Erreur de connexion');
    }
}

async function clearCompleted() {
    const confirmed = await confirmBs('Êtes-vous sûr de vouloir supprimer toutes les tâches terminées ?');
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            loadTodos();
        } else {
            alertBs('Erreur lors de la suppression des tâches terminées');
        }
    } catch (error) {
        console.error('Erreur clear completed:', error);
        alertBs('Erreur de connexion');
    }
}

async function assignTodo(id) {
    const storedPseudo = localStorage.getItem('simpleTodo_pseudo') || '';
    const email = (typeof window !== 'undefined' && window.userEmail)
        ? window.userEmail
        : getCurrentUserEmail();

    if (!email) {
        alertBs("Impossible d'assigner la tâche : votre adresse email est introuvable. Veuillez vous reconnecter.");
        return;
    }

    let pseudo = storedPseudo;
    if (!pseudo && window.isAuthenticated) {
        pseudo = email.split('@')[0];
        localStorage.setItem('simpleTodo_pseudo', pseudo);
    }

    if (!pseudo) {
        alertBs('Veuillez enregistrer votre pseudo avant de vous assigner une tâche.');
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
            alertBs((data && data.message) || "Impossible d'assigner la tâche (422)");
        } else {
            alertBs("Erreur lors de l'assignation de la tâche");
        }
    } catch (error) {
        console.error('Erreur assign todo:', error);
        alertBs('Erreur de connexion');
    }
}

async function changeDueDate(todoId) {
    const todoElement = document.querySelector(`[data-id="${todoId}"]`);
    if (!todoElement) {
        alertBs('Impossible de récupérer la tâche ciblée. Veuillez recharger la page.');
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

    const container = document.createElement('div');
    container.innerHTML = `
        <div class="modal fade" id="dueDateModal" tabindex="-1" aria-labelledby="dueDateModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="dueDateModalLabel"><i class="bi bi-calendar-event"></i> Modifier la date d'échéance</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="newDueDate" class="form-label">Nouvelle date</label>
                            <input type="date" class="form-control" id="newDueDate" value="${currentDueDate}" min="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <p class="text-muted">Date actuelle : ${currentLabel}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" id="removeDueDateBtn">Supprimer la date</button>
                        <button type="button" class="btn btn-primary" id="saveDueDateBtn">Sauvegarder</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    const modalElement = document.getElementById('dueDateModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    const newDueDateInput = document.getElementById('newDueDate');
    const saveButton = document.getElementById('saveDueDateBtn');
    const removeButton = document.getElementById('removeDueDateBtn');

    const closeModal = () => {
        modal.hide();
        setTimeout(() => container.remove(), 300);
    };

    saveButton.addEventListener('click', async () => {
        try {
            const dueDate = newDueDateInput.value;

            const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${todoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    due_date: dueDate,
                }),
            });

            if (response.ok) {
                closeModal();
                loadTodos();
            } else {
                alertBs('Erreur lors de la modification de la date d\'échéance');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alertBs('Erreur lors de la modification de la date d\'échéance');
        }
    });

    removeButton.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${todoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    due_date: null,
                }),
            });

            if (response.ok) {
                closeModal();
                loadTodos();
            } else {
                alertBs('Erreur lors de la suppression de la date d\'échéance');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alertBs('Erreur lors de la suppression de la date d\'échéance');
        }
    });
}

export {
    initMistralModal,
    setListId,
    loadTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    assignTodo,
};
