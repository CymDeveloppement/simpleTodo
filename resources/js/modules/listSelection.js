import { API_BASE_URL, getListId, setListId, urlParams } from '../state';
import {
    getCurrentUserEmail,
    getStoredEmail,
    setStoredEmail,
} from './auth';

function generateListId() {
    return 'list_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showListSelectionScreen() {
    const currentEmail = getCurrentUserEmail();
    const headerEmailBadge = currentEmail
        ? `<span class="badge bg-light text-dark user-email" style="font-size: 0.85rem;">${currentEmail}</span>`
        : '';
    const selectionPlaceholder = currentEmail
        ? `-- Sélectionner une liste pour ${currentEmail} --`
        : '-- Sélectionner une liste --';
    const creatorEmailValue = currentEmail || '';

    document.body.innerHTML = `
        <div class="container" style="max-width: 600px; margin: 100px auto;">
            <div class="card">
                <div class="card-header" style="background: linear-gradient(135deg, #8fa4f5 0%, #b491e8 100%); color: white;">
                    <div class="d-flex align-items-center justify-content-between">
                        <h2 class="mb-0"><i class="bi bi-check2-square"></i> SimpleTodo</h2>
                        ${headerEmailBadge}
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="mb-4">Choisir ou créer une liste</h5>
                    
                    <div class="mb-4">
                        <label class="form-label">Mes listes</label>
                        <select id="myLists" class="form-select mylists-select">
                            <option value="">${selectionPlaceholder}</option>
                        </select>
                        <button class="btn btn-primary w-100 mt-2" onclick="loadSelectedList()">
                            <i class="bi bi-box-arrow-in-right"></i> Ouvrir cette liste
                        </button>
                    </div>
                    
                    <hr>
                    
                    <div>
                        <label class="form-label">Créer une nouvelle liste</label>
                        <input type="text" id="newListTitle" class="form-control mb-2" placeholder="Nom de la liste" maxlength="100">
                        <input type="email" id="newListEmail" class="form-control mb-2" placeholder="Votre email (pour être le créateur)" maxlength="255" value="${creatorEmailValue}">
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
    loadMyLists();
}

async function loadMyListsFromAPI() {
    const myLists = [];
    const currentEmail = getCurrentUserEmail();
    const selectionPlaceholder = currentEmail
        ? `-- Sélectionner une liste pour ${currentEmail} --`
        : '-- Sélectionner une liste --';

    try {
        const response = await fetch(`${API_BASE_URL}/api/mylists`);

        if (response.ok) {
            const lists = await response.json();
            lists.forEach(list => {
                myLists.push({
                    listId: list.id,
                    title: list.title,
                });
            });
        } else {
            console.log('Erreur lors du chargement des listes depuis l\'API:', response.status);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des listes depuis l\'API:', error);
    }

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
                        title: parsedData.title || parsedData.listId,
                    });
                }
            }
        }
    }

    const selects = document.querySelectorAll('.mylists-select');
    selects.forEach((select) => {
        select.innerHTML = `<option value="">${selectionPlaceholder}</option>`;

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

function loadMyLists() {
    loadMyListsFromAPI();
}

async function loadSelectedList() {
    const selectEl = document.getElementById('myLists');
    if (!selectEl) {
        return;
    }

    const selectedListId = selectEl.value;
    if (!selectedListId) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/lists/${selectedListId}`);
        if (!response.ok || response.status === 404) {
            localStorage.removeItem(`simpleTodo_list_${selectedListId}`);

            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith('simpleTodo_token_')) {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.listId === selectedListId) {
                        localStorage.removeItem(key);
                    }
                }
            }

            alert('Cette liste n\'existe plus. Retour à l\'accueil.');
            window.location.href = '/';
            return;
        }

        window.location.href = `/${selectedListId}`;
    } catch (error) {
        console.error('Erreur lors de la vérification de la liste:', error);
        alert('Erreur lors de la vérification de la liste.');
    }
}

async function createNewList() {
    const titleInput = document.getElementById('newListTitle');
    const emailInputEl = document.getElementById('newListEmail');

    if (!titleInput) {
        return;
    }

    const title = titleInput.value.trim();
    if (!title) {
        alert('Veuillez entrer un nom pour la liste');
        return;
    }

    const emailInput = emailInputEl ? emailInputEl.value.trim() : '';
    const email = emailInput || getStoredEmail();

    if (!email) {
        alert('Veuillez entrer votre email pour devenir le créateur de la liste');
        if (emailInputEl) {
            emailInputEl.focus();
        }
        return;
    }

    if (!getStoredEmail()) {
        setStoredEmail(email);
    }

    const newListId = generateListId();

    try {
        const response = await fetch(`${API_BASE_URL}/api/lists/${newListId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                creator_email: email,
            }),
        });

        if (response.ok) {
            window.location.href = `/${newListId}`;
        } else {
            alert('Erreur lors de la création de la liste');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion lors de la création de la liste');
    }
}

async function requestAuthEmail() {
    const emailInputEl = document.getElementById('authEmail');
    if (!emailInputEl) {
        return;
    }

    const emailInput = emailInputEl.value.trim();

    if (!emailInput || !emailInput.includes('@')) {
        alert('Veuillez entrer une adresse email valide');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/request-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput }),
        });

        if (response.ok) {
            alert('Un email avec vos liens d\'authentification a été envoyé !');
            emailInputEl.value = '';
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors de l\'envoi de l\'email');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion');
    }
}

function resolveListIdFromPath() {
    const path = window.location.pathname;
    const pathMatch = path.match(/^\/([^\/]+)\/([^\/]+)$/);
    if (pathMatch) {
        const listIdFromPath = pathMatch[1];
        setListId(listIdFromPath);
        return {
            listId: listIdFromPath,
            token: pathMatch[2],
        };
    }
    return null;
}

function getTokenFromUrl() {
    let token = urlParams.get('token');
    if (token) {
        return token;
    }

    const resolved = resolveListIdFromPath();
    return resolved ? resolved.token : null;
}

export {
    generateListId,
    showListSelectionScreen,
    loadMyListsFromAPI,
    loadMyLists,
    loadSelectedList,
    createNewList,
    requestAuthEmail,
    resolveListIdFromPath,
    getTokenFromUrl,
};
