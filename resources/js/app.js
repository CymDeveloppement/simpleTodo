import '../css/app.css';
import { alertBs, confirmBs } from './modules/alert.js';

import { API_BASE_URL, urlParams, getListId, setListId } from './state';
import {
    bootstrapAuthContext,
    setupAuthenticatedFetch,
    getStoredEmail,
    setStoredEmail,
    getCurrentUserEmail,
    updateUserEmailBadge,
    setAuthenticatedUser,
    clearAuthenticatedUser,
} from './modules/auth.js';
import {
    generateListId,
    showListSelectionScreen,
    loadMyListsFromAPI,
    loadMyLists,
    loadSelectedList,
    createNewList,
    requestAuthEmail,
    resolveListIdFromPath,
    getTokenFromUrl,
} from './modules/listSelection.js';
import {
    setListId as setTodosListId,
    loadTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    assignTodo,
} from './modules/todos.js';

Object.assign(window, {
    loadSelectedList,
    createNewList,
    requestAuthEmail,
    alertBs,
    confirmBs,
    addTodo,
    saveTitle,
    cancelTitleEdit,
    editTitle,
    subscribe,
    unsubscribe,
    inviteCollaborator,
    addCategory,
    savePseudo,
    savePseudoFromModal,
    changeHeaderGradient,
    saveAutoAssignOption,
    deleteCategory,
    clearCompleted,
    confirmDeleteList,
    runServerUpdate,
    shareListUrl,
    toggleTodo,
    toggleComments,
    assignTodo,
    changeCategory,
    changeDueDate,
    deleteTodo,
    addComment,
    resendSubscriberLink,
    updateCommentBadge,
});

bootstrapAuthContext();
setupAuthenticatedFetch();

let listId = getListId();
setTodosListId(listId);

let updateBannerCheckDone = false;
let updateBannerCheckInProgress = false;

// Si pas de listId dans query string, essayer depuis le chemin
if (!listId) {
    const path = window.location.pathname;
    // Extraire l'ID depuis le chemin (ex: /list123 ou /list123/token456)
    const pathMatch = path.match(/^\/([^\/]+)$/);
    if (pathMatch && pathMatch[1] && pathMatch[1] !== 'index.html') {
        listId = pathMatch[1];
        setListId(listId);
        setTodosListId(listId);
    }
}

// Si aucun listId dans l'URL, afficher l'écran de sélection
if (!listId) {
    showListSelectionScreen();
}

// Récupérer le pseudo depuis localStorage
function getPseudo() {
    const storedPseudo = localStorage.getItem('simpleTodo_pseudo');
    const pseudoElement = document.getElementById('pseudo');
    if (storedPseudo && pseudoElement) {
        pseudoElement.value = storedPseudo;
        return storedPseudo;
    }
    return null;
}

// Sauvegarder le pseudo dans localStorage
function savePseudo() {
    const pseudoElement = document.getElementById('pseudo');
    if (!pseudoElement) return;
    
    const pseudo = pseudoElement.value.trim();
    if (pseudo) {
        localStorage.setItem('simpleTodo_pseudo', pseudo);
        updateUserInfo();
        // Fermer le collapse après sauvegarde
        const collapse = new bootstrap.Collapse(document.getElementById('userSettings'), { toggle: true });
    } else {
        alertBs('Veuillez entrer un pseudo');
    }
}

// Mettre à jour l'affichage de l'info utilisateur
function updateUserInfo() {
    const pseudo = getPseudo();
    const email = getStoredEmail();
    
    const pseudoContainer = document.querySelector('.user-pseudo');
    const pseudoTextElement = pseudoContainer ? pseudoContainer.querySelector('.user-pseudo-text') : null;

    if (pseudoContainer && pseudoTextElement && pseudo) {
        pseudoTextElement.textContent = pseudo;
        pseudoContainer.style.display = 'inline-flex';
    } else if (pseudoContainer) {
        pseudoTextElement && (pseudoTextElement.textContent = '');
        pseudoContainer.style.display = 'none';
    }

    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        userInfoElement.style.display = (pseudo || (window.isAuthenticated && getCurrentUserEmail())) ? 'flex' : 'none';
    }
    
    if (email) {
        const emailBadgeElement = document.getElementById('emailBadge');
        if (emailBadgeElement) {
            emailBadgeElement.style.display = 'inline-block';
        }
    } else {
        const emailBadgeElement = document.getElementById('emailBadge');
        if (emailBadgeElement) {
            emailBadgeElement.style.display = 'none';
        }
    }
}

// Gradients disponibles
const gradients = {
    gradient1: 'linear-gradient(135deg, #8fa4f5 0%, #b491e8 100%)', // Bleu/Violet clair (défaut)
    gradient2: 'linear-gradient(135deg, #f66 0%, #ff9240 100%)', // Rouge/Orange
    gradient3: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)', // Vert/Menthe
    gradient4: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)', // Bleu clair/Cyan
    gradient5: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)', // Rose/Violet
    gradient6: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Bleu foncé/Violet foncé
    gradient7: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)', // Orange/Jaune
    gradient8: 'linear-gradient(135deg, #a29bfe 0%, #fd79a8 100%)' // Violet foncé/Rose
};

// Charger le gradient sauvegardé
async function loadHeaderGradient() {
    let savedGradient = 'gradient1';
    
    // Charger depuis l'API
    try {
        const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`);
        const data = await response.json();
        if (data.header_gradient) {
            savedGradient = data.header_gradient;
        }
    } catch (error) {
        console.error('Erreur chargement gradient:', error);
    }
    
    const header = document.querySelector('.card-header');
    if (header && gradients[savedGradient]) {
        header.style.background = gradients[savedGradient];
    }
    
    const select = document.getElementById('headerGradient');
    if (select) {
        select.value = savedGradient;
    }
}

// Changer le gradient du header
async function changeHeaderGradient() {
    const selectedGradient = document.getElementById('headerGradient').value;
    const header = document.querySelector('.card-header');
    if (header && gradients[selectedGradient]) {
        header.style.background = gradients[selectedGradient];
        
        // Sauvegarder dans la base de données
        try {
            await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': window.csrfToken
                },
                body: JSON.stringify({ header_gradient: selectedGradient })
            });
        } catch (error) {
            console.error('Erreur sauvegarde gradient:', error);
        }
    }
}

// Sauvegarder l'option d'assignation automatique
async function saveAutoAssignOption() {
    const checkbox = document.getElementById('autoAssignToCreator');
    if (!checkbox) return;
    
    const enabled = checkbox.checked;
    window.autoAssignToCreator = enabled;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': window.csrfToken
            },
            body: JSON.stringify({ auto_assign_to_creator: enabled })
        });
        
        if (!response.ok) {
            console.error('Erreur sauvegarde option assignation:', response.statusText);
            // Restaurer l'état précédent en cas d'erreur
            checkbox.checked = !enabled;
            window.autoAssignToCreator = !enabled;
        }
    } catch (error) {
        console.error('Erreur sauvegarde option assignation:', error);
        // Restaurer l'état précédent en cas d'erreur
        checkbox.checked = !enabled;
        window.autoAssignToCreator = !enabled;
    }
}

// Charger le pseudo et le titre au démarrage
document.addEventListener('DOMContentLoaded', function() {
    const storedPseudo = localStorage.getItem('simpleTodo_pseudo');
    
    // Récupérer le token depuis l'URL (query string ou chemin)
    let tokenFromUrl = getTokenFromUrl();
    listId = getListId();
    setTodosListId(listId);
    
    if (tokenFromUrl && listId) {
        // Enregistrer la liste avec token dans localStorage
        const listData = {
            listId: listId,
            token: tokenFromUrl
        };
        // Charger le titre de la liste si disponible
        loadListTitle().then(title => {
            if (title) {
                listData.title = title;
            }
            localStorage.setItem(`simpleTodo_token_${tokenFromUrl}`, JSON.stringify(listData));
        }).catch(e => {
            localStorage.setItem(`simpleTodo_token_${tokenFromUrl}`, JSON.stringify(listData));
        });
    }
    
    // Récupérer l'email depuis l'URL si présent (depuis une invitation)
    const emailFromUrl = urlParams.get('email');
    if (emailFromUrl) {
        // Pré-remplir le champ email dans les paramètres
        document.getElementById('email').value = emailFromUrl;
        
        // Si on a un pseudo, on s'inscrit automatiquement
        const pseudo = localStorage.getItem('simpleTodo_pseudo');
        if (pseudo) {
            // S'inscrire automatiquement
            setTimeout(function() {
                subscribe();
            }, 500);
        }
    }
    
    if (!storedPseudo) {
        // Afficher la modal si aucun pseudo
        const modal = new bootstrap.Modal(document.getElementById('pseudoModal'));
        modal.show();
        
        // Focus sur le champ de saisie après affichage de la modal
        setTimeout(function() {
            document.getElementById('modalPseudo').focus();
        }, 500);
    }
    
    if (typeof window !== 'undefined' && window.isAuthenticated && window.userEmail) {
        setStoredEmail(window.userEmail);
    } else {
        updateUserEmailBadge();
    }

    getPseudo();
    loadListTitle();
    loadHeaderGradient();
    updateUserInfo();
    updateUserEmailBadge();
    loadCategories();
    loadTodos();
    loadSubscribers();

    // Si authentifié, clic sur le pseudo → retour à l'accueil
    const pseudoClickable = document.querySelector('.user-pseudo');
    if (pseudoClickable) {
        pseudoClickable.style.cursor = 'pointer';
        pseudoClickable.addEventListener('click', function() {
            const email = (window.userEmail || getStoredEmail() || '').trim();
            if (email) {
                window.location.href = '/';
            }
        });
    }
    
    // Traiter la file d'emails de manière transparente toutes les 5 secondes
    setInterval(processEmailQueue, 5000);

    // Charger les catégories quand le collapse s'ouvre
    const userSettingsCollapse = document.getElementById('userSettings');
    if (userSettingsCollapse) {
        userSettingsCollapse.addEventListener('show.bs.collapse', function () {
            loadCategoriesInModal();
        });
    }
});

// Lancer la mise à jour serveur (créateur/admin uniquement)
async function runServerUpdate() {
    const outputEl = document.getElementById('updateOutput');
    const statusEl = document.getElementById('updateStatus');
    if (outputEl) outputEl.textContent = 'Exécution en cours...';
    if (statusEl) { statusEl.style.display = 'block'; statusEl.textContent = ''; }

    try {
        const force = !!(document.getElementById('updateForce') && document.getElementById('updateForce').checked);
        const response = await fetch(`${API_BASE_URL}/api/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': window.csrfToken,
                'X-User-Email': (window.userEmail || getStoredEmail() || '')
            },
            body: JSON.stringify({ email: (window.userEmail || getStoredEmail() || ''), force: force })
        });
        const data = await response.json();
        const lines = [];
        lines.push(`Success: ${!!data.success}`);
        if (typeof data.code !== 'undefined') lines.push(`Exit code: ${data.code}`);
        if (data.stdout) {
            lines.push('\n--- stdout ---');
            lines.push(data.stdout);
        }
        if (data.stderr) {
            lines.push('\n--- stderr ---');
            lines.push(data.stderr);
        }
        if (outputEl) outputEl.textContent = lines.join('\n');
        if (statusEl) statusEl.textContent = response.ok ? 'Mise à jour terminée.' : 'Erreur lors de la mise à jour.';
    } catch (e) {
        if (outputEl) outputEl.textContent = `Erreur: ${e}`;
        if (statusEl) statusEl.textContent = 'Erreur lors de la mise à jour.';
    }
}

// Fonction pour sauvegarder le pseudo depuis la modal
function savePseudoFromModal() {
    const pseudo = document.getElementById('modalPseudo').value.trim();
    if (pseudo) {
        localStorage.setItem('simpleTodo_pseudo', pseudo);
        updateUserInfo();
        
        // Récupérer l'email depuis l'URL si présent
        const emailFromUrl = urlParams.get('email');
        if (emailFromUrl) {
            // Pré-remplir le champ email
            document.getElementById('email').value = emailFromUrl;
            
            // S'inscrire automatiquement aux notifications
            setTimeout(function() {
                subscribe();
            }, 300);
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('pseudoModal'));
        modal.hide();
    } else {
        alertBs('Veuillez entrer un pseudo');
    }
}

// Permettre d'envoyer avec la touche Entrée dans la modal
document.addEventListener('DOMContentLoaded', function() {
    const modalPseudoInput = document.getElementById('modalPseudo');
    if (modalPseudoInput) {
        modalPseudoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                savePseudoFromModal();
            }
        });
    }
});

// Échapper le HTML pour éviter les injections
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mettre à jour les statistiques
function updateStats(todos) {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    
    const totalCountEl = document.getElementById('totalCount');
    const completedCountEl = document.getElementById('completedCount');
    const clearBtnEl = document.getElementById('clearBtn');
    
    if (totalCountEl) totalCountEl.textContent = total;
    if (completedCountEl) completedCountEl.textContent = completed;
    if (clearBtnEl) clearBtnEl.style.display = completed > 0 ? 'block' : 'none';
}

// Changer la date d'échéance d'une tâche
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
                    due_date: dueDate
                })
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
                    due_date: null
                })
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

// Changer la catégorie d'une tâche
async function changeCategory(todoId) {
    const todo = document.querySelector(`[data-id="${todoId}"]`);
    const currentCategory = todo.dataset.category || '';
    
    // Créer une modal avec sélecteur de catégorie
    const modalHtml = `
        <div class="modal fade" id="categoryModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Changer la catégorie</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <label class="form-label">Catégorie</label>
                        <select id="categorySelect" class="form-select">
                            <option value="">Aucune catégorie</option>
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-primary" onclick="saveCategoryChange(${todoId})">Sauvegarder</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Supprimer l'ancienne modal si elle existe
    const existingModal = document.getElementById('categoryModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Ajouter la nouvelle modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Remplir le sélecteur avec les catégories
    const select = document.getElementById('categorySelect');
    select.innerHTML = '<option value="">Aucune catégorie</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        option.style.backgroundColor = cat.color;
        option.style.color = 'white';
        if (cat.id == currentCategory) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // Afficher la modal
    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    modal.show();
    
    // Définir la fonction de sauvegarde dans le scope global
    window.saveCategoryChange = async function(id) {
        const categoryId = select.value || null;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category_id: categoryId
                })
            });
            
            if (response.ok) {
                modal.hide();
                setTimeout(() => document.getElementById('categoryModal').remove(), 300);
                loadTodos();
            } else {
                alertBs('Erreur lors du changement de catégorie');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alertBs('Erreur lors du changement de catégorie');
        }
    };
}

// Trouver l'élément todo
function findTodoElement(id) {
    return document.querySelector(`[data-id="${id}"]`);
}

// Permettre l'ajout avec la touche Entrée
const todoInput = document.getElementById('todoInput');
if (todoInput) {
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
}

const pseudoInput = document.getElementById('pseudo');
if (pseudoInput) {
    pseudoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            savePseudo();
        }
    });
}

// Permettre d'envoyer avec Enter pour inviter
const inviteEmailInput = document.getElementById('inviteEmail');
if (inviteEmailInput) {
    inviteEmailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            inviteCollaborator();
        }
    });
}

// Fonctions pour les commentaires
async function toggleComments(todoId) {
    const commentsSection = document.getElementById(`comments-${todoId}`);
    if (!commentsSection) {
        return;
    }

    if (commentsSection.style.display === 'none' || commentsSection.style.display === '') {
        commentsSection.style.display = 'block';
        loadComments(todoId);
    } else {
        commentsSection.style.display = 'none';
    }
}

async function loadComments(todoId) {
    try {
        const [comments, metadata] = await Promise.all([
            fetch(`${API_BASE_URL}/api/comments/${listId}/${todoId}`).then(res => res.json()),
            fetchLastViewedComment(todoId),
        ]);
        const lastCommentId = extractLastCommentId(comments);
        displayComments(todoId, comments);
        updateCommentBadgeState(todoId, comments.length, metadata.new_comments, lastCommentId);
        if (lastCommentId) {
            await syncLastViewedComment(todoId, lastCommentId);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
    }
}

async function updateCommentBadge(todoId) {
    try {
        const [comments, metadata] = await Promise.all([
            fetch(`${API_BASE_URL}/api/comments/${listId}/${todoId}`).then(res => res.json()),
            fetchLastViewedComment(todoId),
        ]);
        const badge = document.getElementById(`comment-badge-${todoId}`);
        const lastCommentId = extractLastCommentId(comments);
        if (!badge) {
            return;
        }

        updateTotalCommentBadge(badge, comments.length);
        updateCommentBadgeState(todoId, comments.length, metadata.new_comments, lastCommentId);
    } catch (error) {
        console.error('Erreur lors du chargement du badge:', error);
    }
}

function displayComments(todoId, comments) {
    const commentsList = document.getElementById(`comments-list-${todoId}`);
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="text-muted small">Aucun commentaire</div>';
        updateCommentBadgeState(todoId, 0, 0, 0);
        setupCommentInput(todoId);
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => {
        const date = comment.created_at ? formatDate(comment.created_at) : '';
        return `
        <div class="comment-item">
            <div class="comment-pseudo">${escapeHtml(comment.pseudo)}</div>
            <div>${escapeHtml(comment.text)}</div>
            ${date ? `<div class="text-muted small fst-italic mt-1">${date}</div>` : ''}
        </div>
        `;
    }).join('');

    setupCommentInput(todoId);
}

function extractLastCommentId(comments) {
    if (!Array.isArray(comments) || comments.length === 0) {
        return 0;
    }
    return comments.reduce((max, comment) => {
        const commentId = Number(comment?.id) || 0;
        return commentId > max ? commentId : max;
    }, 0);
}

async function addComment(todoId) {
    const input = document.getElementById(`comment-input-${todoId}`);
    if (!input) {
        return;
    }

    const text = input.value.trim();
    const pseudo = getPseudo();
    
    if (!text) {
        alertBs('Veuillez entrer un commentaire');
        return;
    }
    
    if (!pseudo) {
        alertBs('Veuillez d\'abord entrer votre pseudo');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/comments/${listId}/${todoId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                pseudo: pseudo
            })
        });
        
        if (response.ok) {
            input.value = '';
            loadComments(todoId);
            updateCommentBadge(todoId);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alertBs('Erreur lors de l\'ajout du commentaire');
    }
}

function setupCommentInput(todoId) {
    const input = document.getElementById(`comment-input-${todoId}`);
    if (!input || input.dataset.enterHandler === 'true') {
        return;
    }

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            addComment(todoId);
        }
    });

    input.dataset.enterHandler = 'true';
}

async function maybeShowUpdateBanner() {
    const adminEmail = (window.adminEmail || '').toLowerCase();
    const currentEmail = (window.userEmail || getStoredEmail() || '').trim().toLowerCase();

    if (!adminEmail || !currentEmail || adminEmail !== currentEmail) {
        return;
    }

    if (updateBannerCheckDone || updateBannerCheckInProgress) {
        return;
    }

    updateBannerCheckInProgress = true;
    try {
        const response = await fetch(`${API_BASE_URL}/api/update/check`);
        if (!response.ok) {
            return;
        }

        const data = await response.json();
        if (!data.success) {
            return;
        }

        updateBannerCheckDone = true;

        if (!data.has_update) {
            return;
        }

        const updateContainer = document.getElementById('updateLinkContainer');
        const updateLink = document.getElementById('updateLink');
        if (!updateContainer || !updateLink) {
            return;
        }

        const parts = [];
        if (data.remote_tag) {
            parts.push(data.remote_tag);
        }
        if (data.remote_name) {
            parts.push(data.remote_name);
        }
        const suffix = parts.join(' - ');
        updateLink.textContent = suffix ? `Mettre à jour l'application (${suffix})` : `Mettre à jour l'application`;
        updateLink.classList.remove('d-none');
        updateContainer.classList.remove('d-none');
    } catch (error) {
        console.error('Erreur lors de la vérification de mise à jour:', error);
    } finally {
        updateBannerCheckInProgress = false;
    }
}

function setCommentButtonState(todoId, commentCount) {
    const button = document.getElementById(`comment-button-${todoId}`);
    if (!button) {
        return;
    }
    button.classList.remove('btn-outline-secondary', 'btn-outline-primary');
    if (commentCount > 0) {
        button.classList.add('btn-outline-primary');
    } else {
        button.classList.add('btn-outline-secondary');
    }
}

function updateCommentBadgeState(todoId, totalComments, newCount, lastCommentId) {
    setCommentButtonState(todoId, totalComments);

    const newBadge = document.getElementById(`comment-new-badge-${todoId}`);
    if (!newBadge) {
        return;
    }
    updateTotalCommentBadge(newBadge, newCount);
    newBadge.dataset.lastCommentId = String(lastCommentId || '');
}

async function syncLastViewedComment(todoId, lastId) {
    const email = getStoredEmail();
    if (!email || !listId || !lastId) {
        return 0;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/subscribers/${listId}/todos/${todoId}/last-comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                comment_id: lastId,
            }),
        });

        if (!response.ok) {
            return 0;
        }

        const data = await response.json();
        return Number(data?.new_comments || 0);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du dernier commentaire consulté:', error);
        return 0;
    }
}

async function fetchLastViewedComment(todoId) {
    const email = getStoredEmail();
    if (!email || !listId) {
        return { stored_comment_id: 0, new_comments: 0 };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/subscribers/${listId}/todos/${todoId}/last-comment?email=${encodeURIComponent(email)}`);
        if (!response.ok) {
            return { stored_comment_id: 0, new_comments: 0 };
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération du dernier commentaire consulté:', error);
        return { stored_comment_id: 0, new_comments: 0 };
    }
}
function updateTotalCommentBadge(badge, count) {
    if (!badge) {
        return;
    }

    badge.textContent = count > 0 ? count : '';
    badge.classList.toggle('d-none', count === 0);
}

// Fonctions pour gérer le titre de la liste
async function loadListTitle() {
    // Vérifier si un titre est passé dans l'URL
    const titleFromUrl = urlParams.get('title');
    let title = 'SimpleTodo';
    
    if (titleFromUrl) {
        title = decodeURIComponent(titleFromUrl);
        document.getElementById('listTitle').textContent = title;
        // Sauvegarder la liste avec titre
        localStorage.setItem(`simpleTodo_list_${listId}`, JSON.stringify({
            listId: listId,
            title: title
        }));
        // Créer/sauvegarder la liste dans l'API si possible avec l'email du créateur
        const email = getStoredEmail();
        try {
            await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: title,
                    creator_email: email
                })
            });
            
            // Vérifier si on est le créateur
            if (email) {
                window.isListCreator = true;
                console.log('isListCreator set to true (new list creation)');
                
                // Stocker l'email globalement AVANT l'abonnement
                setStoredEmail(email);
                
                // Abonner automatiquement le créateur aux notifications
                try {
                    const pseudo = getPseudo() || 'Créateur';
                    await fetch(`${API_BASE_URL}/api/subscribers/${listId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: email,
                            pseudo: pseudo
                        })
                    });
                } catch (e) {
                    console.error('Erreur abonnement auto:', e);
                }
            }
        } catch (e) {
            console.error('Erreur sauvegarde liste:', e);
        }
        
        // Afficher ou cacher le bouton de suppression
        updateDeleteButton();
        maybeShowUpdateBanner();
        
        return title;
    }
    
    const email = getStoredEmail();
    const url = email ? `${API_BASE_URL}/api/lists/${listId}?email=${encodeURIComponent(email)}` : `${API_BASE_URL}/api/lists/${listId}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        title = data.title || 'SimpleTodo';
        
        // Enregistrer si on est le créateur et abonné
        window.isListCreator = data.is_creator;
        window.isSubscriber = data.is_subscriber || false;
        window.autoAssignToCreator = data.auto_assign_to_creator || false;
        window.adminEmail = (data.admin_email || '').toLowerCase();
        console.log('isListCreator from API:', window.isListCreator);
        console.log('isSubscriber from API:', window.isSubscriber);
        console.log('autoAssignToCreator from API:', window.autoAssignToCreator);
        console.log('Creator email from API:', data.creator_email);
        
        // Si on est le créateur mais pas d'email stocké, récupérer l'email du créateur
        if (window.isListCreator && !getStoredEmail() && data.creator_email) {
            setStoredEmail(data.creator_email);
            console.log('Creator email set from API:', data.creator_email);
        }
        
        // Mettre à jour la checkbox d'assignation automatique
        const autoAssignCheckbox = document.getElementById('autoAssignToCreator');
        if (autoAssignCheckbox) {
            autoAssignCheckbox.checked = window.autoAssignToCreator;
        }
        
        // Afficher ou cacher le bouton de suppression
        updateDeleteButton();
        
        // Afficher le champ d'abonnement selon isSubscriber
        updateEmailSubscriptionDisplay();
        const listTitleEl = document.getElementById('listTitle');
        if (listTitleEl) listTitleEl.textContent = title;
    } catch (error) {
        console.error('Erreur lors du chargement du titre:', error);
        const listTitleEl = document.getElementById('listTitle');
        if (listTitleEl) listTitleEl.textContent = 'SimpleTodo';
    }
    
    return title;
}

function editTitle() {
    const titleInput = document.getElementById('titleInput');
    const titleField = document.getElementById('titleField');
    titleField.value = document.getElementById('listTitle').textContent;
    titleInput.style.display = 'block';
}

function cancelTitleEdit() {
    document.getElementById('titleInput').style.display = 'none';
}

// Afficher ou cacher les sections créateur (uniquement pour le créateur)
function updateDeleteButton() {
    console.log('updateDeleteButton called, isListCreator:', window.isListCreator);
    
    const deleteBtn = document.getElementById('deleteListBtnSettings');
    if (deleteBtn && window.isListCreator) {
        deleteBtn.classList.remove('d-none');
    } else if (deleteBtn) {
        deleteBtn.classList.add('d-none');
    }
    
    // Afficher ou cacher toutes les sections réservées au créateur
    const creatorSections = document.querySelectorAll('.creator-only');
    console.log('Found', creatorSections.length, 'creator-only sections');
    creatorSections.forEach(section => {
        if (window.isListCreator) {
            section.classList.add('show');
            section.classList.remove('d-none');
        } else {
            section.classList.remove('show');
            section.classList.add('d-none');
        }
    });

    const updateContainer = document.getElementById('updateLinkContainer');
    const updateLink = document.getElementById('updateLink');

    if (window.isListCreator) {
        if (updateContainer) updateContainer.classList.add('d-none');
        if (updateLink) updateLink.classList.add('d-none');
        maybeShowUpdateBanner();
    } else {
        if (updateContainer) updateContainer.classList.add('d-none');
        if (updateLink) updateLink.classList.add('d-none');
        updateBannerCheckDone = false;
    }
}

// Confirmer la suppression de la liste
async function confirmDeleteList() {
    const confirmed = await confirmBs('Attention : Cette action est irréversible !\n\nVoulez-vous vraiment supprimer cette liste et toutes ses tâches ?');
    if (!confirmed) {
        return;
    }
    
    await deleteList();
}

// Supprimer la liste (uniquement pour le créateur)
async function deleteList() {
    const email = getStoredEmail();
    if (!email) {
        alertBs('Erreur : Email non trouvé');
        return;
    }
    
    try {
        const url = `${API_BASE_URL}/api/lists/${listId}?email=${encodeURIComponent(email)}`;
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alertBs('Liste supprimée avec succès');
            // Rediriger vers la page de sélection de liste
            showListSelectionScreen();
        } else {
            const error = await response.json();
            alertBs(error.error || 'Erreur lors de la suppression de la liste');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alertBs('Erreur lors de la suppression de la liste');
    }
}

async function saveTitle() {
    const titleField = document.getElementById('titleField');
    const title = titleField.value.trim();
    
    if (!title) {
        alertBs('Veuillez entrer un titre');
        return;
    }
    
    try {
        const userEmail = getStoredEmail();
        const url = userEmail ? `${API_BASE_URL}/api/lists/${listId}?email=${encodeURIComponent(userEmail)}` : `${API_BASE_URL}/api/lists/${listId}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title
            })
        });
        
        if (response.ok) {
            document.getElementById('listTitle').textContent = title;
            document.getElementById('titleInput').style.display = 'none';
        } else {
            alertBs('Erreur lors de la sauvegarde du titre');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alertBs('Erreur lors de la sauvegarde du titre');
    }
}

// Fonction pour partager l'URL de la liste (sans token)
function shareListUrl() {
    if (!listId) {
        alertBs('Aucune liste sélectionnée');
        return;
    }
    
    // Créer l'URL sans token
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/?list=${listId}`;
    
    // Copier dans le presse-papiers
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alertBs('Lien copié dans le presse-papiers !\n\n' + shareUrl);
        }).catch(err => {
            console.error('Erreur lors de la copie:', err);
            fallbackCopyToClipboard(shareUrl);
        });
    } else {
        fallbackCopyToClipboard(shareUrl);
    }
}

// Méthode de secours pour copier dans le presse-papiers
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        alertBs('Lien copié dans le presse-papiers !\n\n' + text);
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
        prompt('Copiez ce lien manuellement:', text);
    }
    
    document.body.removeChild(textArea);
}

// Fonction simplifiée pour gérer l'affichage de l'abonnement
function updateEmailSubscriptionDisplay() {
    const email = getStoredEmail();
    const emailSubscriptionEl = document.getElementById('emailSubscription');
    const emailUnsubscribeEl = document.getElementById('emailUnsubscribe');
    const emailDisplayEl = document.getElementById('emailDisplay');
    
    if (!email) {
        // Pas d'email, afficher le champ de saisie
        if (emailSubscriptionEl) {
            emailSubscriptionEl.style.display = 'block';
        }
        if (emailUnsubscribeEl) {
            emailUnsubscribeEl.style.display = 'none';
        }
        return;
    }
    
    if (window.isSubscriber) {
        // Utilisateur abonné, afficher le bouton de désabonnement
        if (emailDisplayEl) emailDisplayEl.textContent = email;
        if (emailUnsubscribeEl) {
            emailUnsubscribeEl.style.display = 'block';
        }
        if (emailSubscriptionEl) {
            emailSubscriptionEl.style.display = 'none';
        }
    } else {
        // Utilisateur non abonné, afficher le champ de saisie
        if (emailDisplayEl) emailDisplayEl.textContent = '';
        if (emailSubscriptionEl) {
            emailSubscriptionEl.style.display = 'block';
        }
        if (emailUnsubscribeEl) {
            emailUnsubscribeEl.style.display = 'none';
        }
    }
}

async function subscribe() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    
    if (!email || !email.includes('@')) {
        return;
    }
    
    // Récupérer le pseudo si disponible
    const pseudo = getPseudo();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/subscribers/${listId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email,
                pseudo: pseudo
            })
        });
        
        if (response.ok) {
            setStoredEmail(email);
            emailInput.value = '';
            
            // Recharger les données de la liste pour récupérer isSubscriber
            window.isSubscriber = true;
            updateEmailSubscriptionDisplay();
            updateUserInfo();
            loadSubscribers(); // Recharger la liste des abonnés
        }
    } catch (error) {
        console.error('Erreur:', error);
        alertBs('Erreur lors de l\'inscription');
    }
}

async function unsubscribe() {
    const email = getStoredEmail();
    
    if (!email) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/subscribers/${listId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });
        
        if (response.ok) {
            document.getElementById('email').value = '';
            
            // Recharger les données de la liste pour récupérer isSubscriber
            window.isSubscriber = false;
            updateEmailSubscriptionDisplay();
            updateUserInfo();
            loadSubscribers(); // Recharger la liste des abonnés
        }
    } catch (error) {
        console.error('Erreur:', error);
        alertBs('Erreur lors de la désinscription');
    }
}

// Charger et afficher la liste des abonnés
async function loadSubscribers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/subscribers/${listId}`);
        const subscribers = await response.json();
        
        // Ne pas préremplir le champ email automatiquement
        // L'utilisateur doit saisir son email manuellement pour s'inscrire
        
        // Afficher les abonnés
        await displaySubscribers(subscribers);
    } catch (error) {
        console.error('Erreur:', error);
        const subscribersListEl = document.getElementById('subscribersList');
        if (subscribersListEl) {
            subscribersListEl.innerHTML = 
                '<div class="text-white small text-center py-2">Erreur de chargement</div>';
        }
    }
}

// Afficher la liste des abonnés
async function displaySubscribers(subscribers) {
    const container = document.getElementById('subscribersList');
    if (!container) return;
    
    if (subscribers.length === 0) {
        container.innerHTML = 
            '<div class="text-white small text-center py-2"><i class="bi bi-inbox"></i> Aucun abonné pour le moment</div>';
        return;
    }
    
    // Récupérer l'email du créateur depuis l'API uniquement
    let creatorEmail = null;
    console.log('displaySubscribers - isListCreator:', window.isListCreator);
    
    try {
        // Ajouter l'email dans les paramètres pour déterminer is_creator
        const userEmail = getStoredEmail();
        const url = userEmail ? `${API_BASE_URL}/api/lists/${listId}?email=${encodeURIComponent(userEmail)}` : `${API_BASE_URL}/api/lists/${listId}`;
        const listResponse = await fetch(url);
        const listData = await listResponse.json();
        creatorEmail = listData.creator_email;
        console.log('Creator email from API:', creatorEmail);
        
        // Utiliser is_creator de l'API
        if (listData.is_creator !== undefined) {
            window.isListCreator = listData.is_creator;
            console.log('isListCreator from API:', window.isListCreator);
        }
    } catch (e) {
        console.error('Erreur récupération email créateur:', e);
    }
    
    container.innerHTML = subscribers.map(sub => {
        const isCreator = creatorEmail && creatorEmail.trim() === sub.email.trim();
        console.log('Subscriber:', sub.email, 'Creator email:', creatorEmail, 'isCreator:', isCreator);
        return `
        <div class="d-flex align-items-center justify-content-between py-1">
            <div>
                <small class="text-white">
                    ${isCreator ? '<i class="bi bi-star-fill text-warning me-1" title="Créateur"></i>' : ''}
                    ${escapeHtml(sub.pseudo || sub.email)} 
                    ${sub.pseudo ? `<span class="text-white">(${escapeHtml(sub.email)})</span>` : ''}
                </small>
            </div>
            <button class="btn btn-sm btn-light" onclick="resendSubscriberLink(${sub.id})" title="Renvoyer le lien">
                <i class="bi bi-send"></i>
            </button>
        </div>
        `;
    }).join('');
}

// Renvoyer le lien à un abonné
async function resendSubscriberLink(subscriberId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/subscribers/${listId}/${subscriberId}/resend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            // Pas besoin de message, juste envoie silencieusement
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Inviter un collaborateur par email
async function inviteCollaborator() {
    const emailInput = document.getElementById('inviteEmail');
    const email = emailInput.value.trim();
    
    if (!email || !email.includes('@')) {
        return;
    }
    
    const pseudo = getPseudo();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/invitations/${listId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email,
                invited_by: pseudo || 'Quelqu\'un'
            })
        });
        
        if (response.ok) {
            emailInput.value = '';
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Fonction pour formater la date de création (affichée sous les tâches)
function formatCreatedDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Si moins d'une minute
    if (diff < 60000) {
        return 'à l\'instant';
    }
    
    // Si moins d'une heure
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    // Si aujourd'hui
    if (date.toDateString() === now.toDateString()) {
        return `aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Si hier
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Si cette semaine
    if (diff < 604800000) {
        return `le ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Date complète
    return `le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

// Fonction pour formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Si moins d'une minute
    if (diff < 60000) {
        return 'À l\'instant';
    }
    
    // Si moins d'une heure
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    // Si moins de 24 heures
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    
    // Si moins d'une semaine
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
    
    // Date complète pour les dates plus anciennes
    return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fonctions pour gérer les catégories
let categories = [];

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories/${listId}`);
        categories = await response.json();
        updateCategorySelects();
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
    }
}

function updateCategorySelects() {
    // Cette fonction n'est plus utilisée car le sélecteur de catégorie a été retiré
    // Les catégories sont maintenant assignées via le bouton sur chaque tâche
    return;
}

// Traiter la file d'emails de manière transparente
async function processEmailQueue() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/email-queue/process`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.processed > 0) {
                console.log(`Emails traités: ${result.sent} envoyés, ${result.failed} échoués`);
            }
        }
    } catch (error) {
        // Ignorer silencieusement les erreurs pour ne pas polluer la console
        // L'envoi d'emails est en arrière-plan
    }
}

// Charger les catégories dans le collapse des paramètres
async function loadCategoriesInModal() {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = '';
    
    if (categories.length === 0) {
        container.innerHTML = '<div class="text-muted text-white small">Aucune catégorie</div>';
        return;
    }
    
    categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'd-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-white';
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="badge rounded-pill me-2" style="background-color: ${cat.color}; color: white;">
                    ${escapeHtml(cat.name)}
                </span>
            </div>
            <button class="btn btn-sm btn-outline-light" onclick="deleteCategory(${cat.id})">
                <i class="bi bi-trash"></i>
            </button>
        `;
        container.appendChild(item);
    });
}

async function addCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const color = document.getElementById('newCategoryColor').value;
    
    if (!name) {
        alertBs('Veuillez entrer un nom de catégorie');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories/${listId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                color: color
            })
        });
        
        if (response.ok) {
            document.getElementById('newCategoryName').value = '';
            loadCategories();
            loadCategoriesInModal();
        }
    } catch (error) {
        console.error('Erreur:', error);
        alertBs('Erreur lors de l\'ajout de la catégorie');
    }
}

async function deleteCategory(id) {
    const confirmed = await confirmBs('Supprimer cette catégorie ?');
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories/${listId}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadCategories();
            loadCategoriesInModal();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}
