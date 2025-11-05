// Configuration
const API_BASE_URL = '';

// Récupérer le listId de l'URL (support réécriture d'URL et query string)
const urlParams = new URLSearchParams(window.location.search);
let listId = urlParams.get('list');

// Si pas de listId dans query string, essayer depuis le chemin
if (!listId) {
    const path = window.location.pathname;
    // Extraire l'ID depuis le chemin (ex: /list123 ou /list123/token456)
    const pathMatch = path.match(/^\/([^\/]+)$/);
    if (pathMatch && pathMatch[1] && pathMatch[1] !== 'index.html') {
        listId = pathMatch[1];
    }
}

// Si aucun listId dans l'URL, afficher l'écran de sélection
if (!listId) {
    showListSelectionScreen();
}

// Fonction pour générer un ID de liste unique
function generateListId() {
    return 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Afficher l'écran de sélection/création de liste
function showListSelectionScreen() {
    document.body.innerHTML = `
        <div class="container" style="max-width: 600px; margin: 100px auto;">
            <div class="card">
                <div class="card-header" style="background: linear-gradient(135deg, #8fa4f5 0%, #b491e8 100%); color: white;">
                    <h2 class="mb-0"><i class="bi bi-check2-square"></i> SimpleTodo</h2>
                </div>
                <div class="card-body">
                    <h5 class="mb-4">Choisir ou créer une liste</h5>
                    
                    <div class="mb-4">
                        <label class="form-label">Mes listes</label>
                        <select id="myLists" class="form-select mylists-select">
                            <option value="">-- Sélectionner une liste --</option>
                        </select>
                        <button class="btn btn-primary w-100 mt-2" onclick="loadSelectedList()">
                            <i class="bi bi-box-arrow-in-right"></i> Ouvrir cette liste
                        </button>
                    </div>
                    
                    <hr>
                    
                    <div>
                        <label class="form-label">Créer une nouvelle liste</label>
                        <input type="text" id="newListTitle" class="form-control mb-2" placeholder="Nom de la liste" maxlength="100">
                        <input type="email" id="newListEmail" class="form-control mb-2" placeholder="Votre email (pour être le créateur)" maxlength="255">
                        <small class="text-muted d-block mb-2">Votre email vous donnera les droits de créateur (modifier le thème, supprimer la liste)</small>
                        <button class="btn btn-success w-100" onclick="createNewList()">
                            <i class="bi bi-plus-circle"></i> Créer une nouvelle liste
                        </button>
                    </div>
                    
                    <hr>
                    
                    <div>
                        <label class="form-label">Recevoir un email d'authentification</label>
                        <input type="email" id="authEmail" class="form-control mb-2" placeholder="Votre email" maxlength="255">
                        <small class="text-muted d-block mb-2">Un lien d'authentification vous sera envoyé par email</small>
                        <button class="btn btn-info w-100" onclick="requestAuthEmail()">
                            <i class="bi bi-envelope"></i> Envoyer l'email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Récupérer les listes depuis localStorage
    loadMyLists();
}

// Charger les listes depuis l'API
async function loadMyListsFromAPI() {
    const myLists = [];
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/mylists`);
        
        if (response.ok) {
            const lists = await response.json();
            lists.forEach(list => {
                myLists.push({
                    listId: list.id,
                    title: list.title
                });
            });
        } else {
            console.log('Erreur lors du chargement des listes depuis l\'API:', response.status);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des listes depuis l\'API:', error);
    }
    
    // Récupérer les listes depuis localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('simpleTodo_list_')) {
            const listData = localStorage.getItem(key);
            const parsedData = JSON.parse(listData);
            if (parsedData && parsedData.listId) {
                const existing = myLists.find(l => l.listId === parsedData.listId);
                if (!existing) {
                    myLists.push({
                        listId: parsedData.listId,
                        title: parsedData.title || parsedData.listId
                    });
                }
            }
        }
    }
    
    // Remplir tous les select avec la classe mylists-select
    const selects = document.querySelectorAll('.mylists-select');
    selects.forEach(select => {
        select.innerHTML = '<option value="">-- Sélectionner une liste --</option>';
        
        myLists.forEach(list => {
            const option = document.createElement('option');
            option.value = list.listId;
            option.textContent = list.title;
            select.appendChild(option);
        });
        
        if (myLists.length === 0) {
            select.innerHTML = '<option value="">Aucune liste disponible</option>';
        }
    });
    
    return myLists;
}

// Récupérer les listes depuis localStorage et serveur
function loadMyLists() {
    // Appeler directement loadMyListsFromAPI qui gère tout
    loadMyListsFromAPI();
}

// Charger la liste sélectionnée
async function loadSelectedList() {
    const selectedListId = document.getElementById('myLists').value;
    if (selectedListId) {
        try {
            // Vérifier si la liste existe
            const response = await fetch(`${API_BASE_URL}/api/lists/${selectedListId}`);
            if (!response.ok || response.status === 404) {
                // La liste n'existe pas, la supprimer du localStorage
                console.log('Liste non trouvée, suppression du localStorage');
                
                // Supprimer de simpleTodo_list
                localStorage.removeItem(`simpleTodo_list_${selectedListId}`);
                
                // Supprimer de simpleTodo_token (chercher toutes les entrées)
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('simpleTodo_token_')) {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data && data.listId === selectedListId) {
                            localStorage.removeItem(key);
                        }
                    }
                }
                
                // Retourner à l'accueil
                alert('Cette liste n\'existe plus. Retour à l\'accueil.');
                window.location.href = '/';
                return;
            }
            
            // La liste existe, rediriger avec réécriture d'URL
            window.location.href = `/${selectedListId}`;
        } catch (error) {
            console.error('Erreur lors de la vérification de la liste:', error);
            alert('Erreur lors de la vérification de la liste.');
        }
    }
}

// Créer une nouvelle liste
async function createNewList() {
    const title = document.getElementById('newListTitle').value.trim();
    if (!title) {
        alert('Veuillez entrer un nom pour la liste');
        return;
    }
    
    const emailInput = document.getElementById('newListEmail').value.trim();
    
    // Essayer de récupérer l'email depuis localStorage ou le formulaire
    const email = emailInput || getStoredEmail();
    
    if (!email) {
        alert('Veuillez entrer votre email pour devenir le créateur de la liste');
        document.getElementById('newListEmail').focus();
        return;
    }
    
    // Sauvegarder l'email dans localStorage si pas déjà présent
    if (!getStoredEmail()) {
        setStoredEmail(email);
    }
    
    // Générer un nouvel ID de liste
    const newListId = generateListId();
    
    try {
        // Créer la liste via l'API
        const response = await fetch(`${API_BASE_URL}/api/lists/${newListId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: title,
                creator_email: email
            })
        });
        
        if (response.ok) {
            // Rediriger vers la nouvelle liste avec réécriture d'URL
            window.location.href = `/${newListId}`;
        } else {
            alert('Erreur lors de la création de la liste');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion lors de la création de la liste');
    }
}

// Demander un email d'authentification
async function requestAuthEmail() {
    const emailInput = document.getElementById('authEmail').value.trim();
    
    if (!emailInput || !emailInput.includes('@')) {
        alert('Veuillez entrer une adresse email valide');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/request-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput })
        });
        
        if (response.ok) {
            alert('Un email avec vos liens d\'authentification a été envoyé !');
            document.getElementById('authEmail').value = '';
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors de l\'envoi de l\'email');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion');
    }
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
        alert('Veuillez entrer un pseudo');
    }
}

// Mettre à jour l'affichage de l'info utilisateur
function updateUserInfo() {
    const pseudo = getPseudo();
    const email = getStoredEmail();
    
    const currentPseudoElement = document.getElementById('currentPseudo');
    if (currentPseudoElement && pseudo) {
        currentPseudoElement.textContent = pseudo;
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.style.display = 'flex';
        }
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
    
    // Récupérer le token depuis l'URL si présent (query string ou chemin)
    let tokenFromUrl = urlParams.get('token');
    
    // Si pas dans query string, essayer depuis le chemin
    if (!tokenFromUrl) {
        const path = window.location.pathname;
        const pathMatch = path.match(/^\/([^\/]+)\/([^\/]+)$/);
        if (pathMatch) {
            // Format: /list123/token456
            tokenFromUrl = pathMatch[2];
            if (!listId) {
                listId = pathMatch[1];
            }
        }
    }
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
    
    getPseudo();
    loadListTitle();
    loadHeaderGradient();
    updateUserInfo();
    loadCategories();
    loadTodos();
    loadSubscribers();

    // Si authentifié, clic sur le pseudo → retour à l'accueil
    const currentPseudoEl = document.getElementById('currentPseudo');
    if (currentPseudoEl) {
        currentPseudoEl.style.cursor = 'pointer';
        currentPseudoEl.addEventListener('click', function() {
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
        alert('Veuillez entrer un pseudo');
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

// Charger les todos depuis l'API
async function loadTodos() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}`);
        const todos = await response.json();
        displayTodos(todos);
        updateStats(todos);
    } catch (error) {
        console.error('Erreur lors du chargement des todos:', error);
        const todoListEl = document.getElementById('todoList');
        if (todoListEl) {
            todoListEl.innerHTML = 
                '<div class="alert alert-danger">Erreur de connexion à l\'API</div>';
        }
    }
}

// Afficher les todos
function displayTodos(todos) {
    const todoList = document.getElementById('todoList');
    if (!todoList) return;
    
    if (todos.length === 0) {
        todoList.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                <p class="mt-3">Aucune tâche pour le moment</p>
            </div>
        `;
        return;
    }

    // Séparer les tâches avec et sans catégorie
    const todosWithCategory = todos.filter(t => t.category_id);
    const todosWithoutCategory = todos.filter(t => !t.category_id);
    
    // Fonction de tri par date d'échéance (les plus proches en premier)
    const sortByDueDate = (a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
    };
    
    // Trier les tâches sans catégorie par date d'échéance
    todosWithoutCategory.sort(sortByDueDate);
    
    // Grouper les tâches par catégorie
    const todosByCategory = {};
    todosWithCategory.forEach(todo => {
        if (!todosByCategory[todo.category_id]) {
            todosByCategory[todo.category_id] = [];
        }
        todosByCategory[todo.category_id].push(todo);
    });
    
    // Trier les tâches dans chaque catégorie par date d'échéance
    Object.keys(todosByCategory).forEach(categoryId => {
        todosByCategory[categoryId].sort(sortByDueDate);
    });
    
    let html = '';
    
    // Afficher d'abord les tâches sans catégorie
    if (todosWithoutCategory.length > 0) {
        html += todosWithoutCategory.map(todo => renderTodoItem(todo)).join('');
    }
    
    // Ensuite les catégories avec leurs tâches dans un accordion Bootstrap
    // Afficher TOUTES les catégories, même celles sans tâche
    if (categories.length > 0 || Object.keys(todosByCategory).length > 0) {
        html += '<div class="accordion" id="categoryAccordion">';
        
        // Afficher toutes les catégories existantes
        categories.forEach(category => {
            const categoryTodos = todosByCategory[category.id] || [];
            const accordionId = `collapse-${category.id}`;
            const headingId = `heading-${category.id}`;
            
            html += `
            <div class="accordion-item mt-2" data-category-id="${category.id}">
                <h2 class="accordion-header" id="${headingId}">
                    <button class="accordion-button collapsed" type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target="#${accordionId}" 
                            aria-expanded="false" 
                            aria-controls="${accordionId}">
                        <span class="badge rounded-pill me-2" style="background-color: ${category.color}">${escapeHtml(category.name)}</span>
                        <span class="text-muted small">(${categoryTodos.length} tâche${categoryTodos.length > 1 ? 's' : ''})</span>
                    </button>
                </h2>
                <div id="${accordionId}" 
                     class="accordion-collapse collapse" 
                     aria-labelledby="${headingId}" 
                     data-bs-parent="#categoryAccordion">
                    <div class="accordion-body p-0">
                        ${categoryTodos.length > 0 
                            ? categoryTodos.map(todo => renderTodoItem(todo)).join('')
                            : '<div class="text-center text-muted py-3 small">Aucune tâche dans cette catégorie</div>'
                        }
                    </div>
                </div>
            </div>
            `;
        });
        
        html += '</div>';
    }
    
    todoList.innerHTML = html;
    
    // Charger le nombre de commentaires pour chaque tâche
    todos.forEach(todo => {
        updateCommentBadge(todo.id);
    });
}

// Fonction pour rendre une tâche individuelle
function renderTodoItem(todo) {
    const assignedBadge = todo.assigned_to 
        ? `<span class="badge bg-info ms-2"><i class="bi bi-person-check"></i> ${escapeHtml(todo.assigned_to)}</span>` 
        : '';
    
    // Formater la date de création
    const createdDate = formatCreatedDate(todo.created_at);
    const creationInfo = `<small class="text-muted d-block mt-1" style="font-style: italic; font-size: 0.75rem;">Créé par ${escapeHtml(todo.pseudo)} ${createdDate}</small>`;
    
    // Badge pour la date d'échéance
    let dueDateBadge = '';
    if (todo.due_date) {
        const dueDate = new Date(todo.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let badgeClass = 'bg-secondary';
        if (diffDays < 0) {
            badgeClass = 'bg-danger';
        } else if (diffDays === 0) {
            badgeClass = 'bg-warning';
        } else if (diffDays <= 3) {
            badgeClass = 'bg-warning';
        }
        
        const formattedDate = dueDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        dueDateBadge = `<span class="badge ${badgeClass} ms-2" title="Échéance: ${dueDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}"><i class="bi bi-calendar-event"></i> ${formattedDate}</span>`;
    }
    
    return `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}" data-category="${todo.category_id || ''}">
            <div class="d-flex align-items-center">
                <button class="btn btn-sm ${todo.completed ? 'btn-success' : 'btn-outline-secondary'}" 
                        onclick="event.stopPropagation(); toggleTodo(${todo.id})">
                    <i class="bi ${todo.completed ? 'bi-check-lg' : 'bi-circle'}"></i>
                </button>
                <span class="todo-text ms-2 ${todo.completed ? 'completed' : ''}" style="flex: 1;">
                    ${escapeHtml(todo.text)}
                    ${dueDateBadge}
                    ${assignedBadge}
                </span>
                
                <!-- Bouton Commentaires (toujours visible) -->
                <div class="btn-comment-wrapper me-2">
                    <button class="btn btn-sm btn-outline-info btn-circle btn-comment" onclick="event.stopPropagation(); toggleComments(${todo.id})" title="Commentaires">
                        <i class="bi bi-chat-left"></i>
                    </button>
                    <span id="comment-badge-${todo.id}" class="comment-badge" style="display: none;"></span>
                </div>
                
                <!-- Dropdown pour les autres actions -->
                <div class="dropdown me-2">
                    <button class="btn btn-sm btn-outline-secondary btn-circle dropdown-toggle" type="button" id="dropdownMenuButton${todo.id}" data-bs-toggle="dropdown" aria-expanded="false" onclick="event.stopPropagation();">
                        <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton${todo.id}">
                        ${!todo.assigned_to ? `<li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); assignTodo(${todo.id}); return false;"><i class="bi bi-person-plus me-2"></i>Je m'en occupe</a></li>` : ''}
                        <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); changeCategory(${todo.id}); return false;"><i class="bi bi-tag me-2"></i>Changer de catégorie</a></li>
                        <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); changeDueDate(${todo.id}); return false;"><i class="bi bi-calendar-plus me-2"></i>Modifier la date</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="event.stopPropagation(); deleteTodo(${todo.id}); return false;"><i class="bi bi-trash me-2"></i>Supprimer</a></li>
                    </ul>
                </div>
            </div>
            ${creationInfo}
            <div id="comments-${todo.id}" class="comments-section" style="display: none;">
                <div id="comments-list-${todo.id}"></div>
                <div class="comment-form">
                    <div class="input-group input-group-sm">
                        <input type="text" id="comment-input-${todo.id}" class="form-control" placeholder="Ajouter un commentaire..." maxlength="500">
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); addComment(${todo.id})">
                            <i class="bi bi-send"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

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

// Ajouter un nouveau todo
async function addTodo() {
    const text = document.getElementById('todoInput').value.trim();
    const pseudo = getPseudo();
    
    if (!text) {
        alert('Veuillez entrer une tâche');
        return;
    }
    
    if (!pseudo) {
        alert('Veuillez d\'abord entrer votre pseudo');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                pseudo: pseudo,
                category_id: null,
                due_date: null
            })
        });
        
        if (response.ok) {
            document.getElementById('todoInput').value = '';
            loadTodos();
        } else {
            alert('Erreur lors de l\'ajout de la tâche');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion');
    }
}

// Toggle un todo (complété/non complété)
async function toggleTodo(id) {
    const todo = findTodoElement(id);
    const currentState = todo.classList.contains('completed');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                completed: !currentState
            })
        });
        
        if (response.ok) {
            loadTodos();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Assigner une tâche à soi-même
async function assignTodo(id) {
    const pseudo = getPseudo();
    
    if (!pseudo) {
        alert('Veuillez d\'abord entrer votre pseudo');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pseudo: pseudo
            })
        });
        
        if (response.ok) {
            loadTodos();
        } else {
            alert('Erreur lors de l\'assignation');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion');
    }
}

// Changer la date d'échéance d'une tâche
async function changeDueDate(todoId) {
    // Récupérer la date d'échéance actuelle depuis le DOM ou charger les todos
    let todosData = [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}`);
        todosData = await response.json();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
    }
    
    const todo = todosData.find(t => t.id == todoId);
    const currentDueDate = todo?.due_date || '';
    
    // Créer une modal avec sélecteur de date
    const modalHtml = `
        <div class="modal fade" id="dueDateModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Modifier la date d'échéance</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <label class="form-label">Date d'échéance</label>
                        <input type="date" id="dueDateInput" class="form-control" value="${currentDueDate}">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="button" class="btn btn-danger" onclick="removeDueDate(${todoId})">Supprimer la date</button>
                        <button type="button" class="btn btn-primary" onclick="saveDueDateChange(${todoId})">Sauvegarder</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Supprimer l'ancienne modal si elle existe
    const existingModal = document.getElementById('dueDateModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Ajouter la nouvelle modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Afficher la modal
    const modal = new bootstrap.Modal(document.getElementById('dueDateModal'));
    modal.show();
    
    // Définir les fonctions de sauvegarde dans le scope global
    window.saveDueDateChange = async function(id) {
        const dueDateInput = document.getElementById('dueDateInput');
        const dueDate = dueDateInput.value || null;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    due_date: dueDate
                })
            });
            
            if (response.ok) {
                modal.hide();
                setTimeout(() => document.getElementById('dueDateModal').remove(), 300);
                loadTodos();
            } else {
                alert('Erreur lors de la modification de la date d\'échéance');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la modification de la date d\'échéance');
        }
    };
    
    window.removeDueDate = async function(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    due_date: null
                })
            });
            
            if (response.ok) {
                modal.hide();
                setTimeout(() => document.getElementById('dueDateModal').remove(), 300);
                loadTodos();
            } else {
                alert('Erreur lors de la suppression de la date d\'échéance');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression de la date d\'échéance');
        }
    };
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
                alert('Erreur lors du changement de catégorie');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors du changement de catégorie');
        }
    };
}

// Supprimer un todo
async function deleteTodo(id) {
    if (!confirm('Supprimer cette tâche ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTodos();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Supprimer les todos terminés
async function clearCompleted() {
    if (!confirm('Supprimer toutes les tâches terminées ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/todos/${listId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTodos();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
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
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
        loadComments(todoId);
    } else {
        commentsSection.style.display = 'none';
    }
}

async function loadComments(todoId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/comments/${listId}/${todoId}`);
        const comments = await response.json();
        displayComments(todoId, comments);
    } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
    }
}

async function updateCommentBadge(todoId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/comments/${listId}/${todoId}`);
        const comments = await response.json();
        const badge = document.getElementById(`comment-badge-${todoId}`);
        
        if (badge) {
            if (comments.length > 0) {
                badge.textContent = comments.length;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement du badge:', error);
    }
}

function displayComments(todoId, comments) {
    const commentsList = document.getElementById(`comments-list-${todoId}`);
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="text-muted small">Aucun commentaire</div>';
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
}

async function addComment(todoId) {
    const input = document.getElementById(`comment-input-${todoId}`);
    const text = input.value.trim();
    const pseudo = getPseudo();
    
    if (!text) {
        alert('Veuillez entrer un commentaire');
        return;
    }
    
    if (!pseudo) {
        alert('Veuillez d\'abord entrer votre pseudo');
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
        alert('Erreur lors de l\'ajout du commentaire');
    }
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
}

// Confirmer la suppression de la liste
function confirmDeleteList() {
    if (!confirm('⚠️ Attention : Cette action est irréversible !\n\nVoulez-vous vraiment supprimer cette liste et toutes ses tâches ?')) {
        return;
    }
    
    deleteList();
}

// Supprimer la liste (uniquement pour le créateur)
async function deleteList() {
    const email = getStoredEmail();
    if (!email) {
        alert('Erreur : Email non trouvé');
        return;
    }
    
    try {
        const url = `${API_BASE_URL}/api/lists/${listId}?email=${encodeURIComponent(email)}`;
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Liste supprimée avec succès');
            // Rediriger vers la page de sélection de liste
            showListSelectionScreen();
        } else {
            const error = await response.json();
            alert(error.error || 'Erreur lors de la suppression de la liste');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression de la liste');
    }
}

async function saveTitle() {
    const titleField = document.getElementById('titleField');
    const title = titleField.value.trim();
    
    if (!title) {
        alert('Veuillez entrer un titre');
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
            alert('Erreur lors de la sauvegarde du titre');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la sauvegarde du titre');
    }
}

// Fonctions pour gérer l'email
function getStoredEmail() {
    // Récupérer uniquement le stockage global
    return localStorage.getItem('simpleTodo_email');
}

// Fonction pour partager l'URL de la liste (sans token)
function shareListUrl() {
    if (!listId) {
        alert('Aucune liste sélectionnée');
        return;
    }
    
    // Créer l'URL sans token
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/?list=${listId}`;
    
    // Copier dans le presse-papiers
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Lien copié dans le presse-papiers !\n\n' + shareUrl);
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
        alert('Lien copié dans le presse-papiers !\n\n' + text);
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
        prompt('Copiez ce lien manuellement:', text);
    }
    
    document.body.removeChild(textArea);
}

function setStoredEmail(email) {
    // Sauvegarder uniquement globalement
    localStorage.setItem('simpleTodo_email', email);
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
        alert('Erreur lors de l\'inscription');
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
        alert('Erreur lors de la désinscription');
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
            <button class="btn btn-sm btn-light btn-circle" onclick="resendSubscriberLink(${sub.id})" title="Renvoyer le lien">
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
        alert('Veuillez entrer un nom de catégorie');
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
        alert('Erreur lors de l\'ajout de la catégorie');
    }
}

async function deleteCategory(id) {
    if (!confirm('Supprimer cette catégorie ?')) {
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
