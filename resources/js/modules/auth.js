function bootstrapAuthContext() {
    const metaAuth = document.querySelector('meta[name="app:auth"]');
    let email = '';
    let sessionEmail = '';
    let name = null;
    let isAuthenticated = false;

    if (metaAuth) {
        const dataset = metaAuth.dataset;
        if (dataset) {
            email = (dataset.email || '').trim();
            sessionEmail = (dataset.sessionEmail || '').trim();
            name = dataset.name || null;
            isAuthenticated = dataset.authenticated === '1';
        }
    }

    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
        window.csrfToken = csrfMeta.getAttribute('content');
    }

    const resolvedEmail = email || sessionEmail || '';

    window.authUser = {
        email: resolvedEmail || null,
        name,
        isAuthenticated,
    };
    window.userEmail = resolvedEmail;
    window.isAuthenticated = isAuthenticated;
    window.sessionEmail = sessionEmail;
}

function setupAuthenticatedFetch() {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
        return;
    }

    if (window.fetch.__isAuthenticatedWrapper) {
        return;
    }

    const nativeFetch = window.fetch.bind(window);

    window.fetch = (input, init = {}) => {
        const options = { ...init };

        options.credentials = options.credentials || 'include';

        const headers = new Headers(options.headers || {});

        if (!headers.has('Accept')) {
            headers.set('Accept', 'application/json');
        }

        if (window.csrfToken && !headers.has('X-CSRF-Token')) {
            const method = (options.method || 'GET').toUpperCase();
            if (method !== 'GET' && method !== 'HEAD') {
                headers.set('X-CSRF-Token', window.csrfToken);
            }
        }

        options.headers = headers;

        return nativeFetch(input, options);
    };

    window.fetch.__isAuthenticatedWrapper = true;
}

function getStoredEmail() {
    const email = localStorage.getItem('simpleTodo_email');
    return email ? email.trim() : '';
}

function setStoredEmail(email) {
    const value = (email || '').trim();

    if (value) {
        localStorage.setItem('simpleTodo_email', value);
        if (typeof window !== 'undefined') {
            window.userEmail = value;
        }
    } else {
        localStorage.removeItem('simpleTodo_email');
        if (typeof window !== 'undefined') {
            window.userEmail = '';
        }
    }

    updateUserEmailBadge();
}

function getCurrentUserEmail() {
    let email = '';

    if (typeof window !== 'undefined') {
        if (window.userEmail && typeof window.userEmail === 'string' && window.userEmail.trim() !== '') {
            email = window.userEmail.trim();
        }
    }

    if (!email) {
        const stored = getStoredEmail();
        if (stored) {
            email = stored;
        }
    }

    return email;
}

function updateUserEmailBadge() {
    const containers = document.querySelectorAll('.user-email');
    if (!containers.length) {
        return;
    }

    const isAuthenticated = !!(typeof window !== 'undefined' && window.isAuthenticated);
    const email = getCurrentUserEmail();

    containers.forEach((container) => {
        const textElement = container.querySelector('.user-email-text');
        if (!textElement) {
            return;
        }

        if (isAuthenticated && email) {
            textElement.textContent = email;
            container.style.display = 'inline-flex';
            if (typeof window !== 'undefined') {
                window.userEmail = email;
                if (!window.authUser) {
                    window.authUser = {};
                }
                window.authUser.email = email;
                window.authUser.isAuthenticated = true;
            }
        } else {
            textElement.textContent = '';
            container.style.display = 'none';
        }
    });
}

function setAuthenticatedUser(email) {
    const value = (email || '').trim();

    if (!value) {
        return;
    }

    if (typeof window !== 'undefined') {
        window.isAuthenticated = true;
        if (!window.authUser) {
            window.authUser = {};
        }
        window.authUser.email = value;
        window.authUser.isAuthenticated = true;
    }

    setStoredEmail(value);
}

function clearAuthenticatedUser() {
    if (typeof window !== 'undefined') {
        window.isAuthenticated = false;
        if (window.authUser) {
            window.authUser.email = null;
            window.authUser.isAuthenticated = false;
        }
    }

    setStoredEmail('');
}

export {
    bootstrapAuthContext,
    setupAuthenticatedFetch,
    getStoredEmail,
    setStoredEmail,
    getCurrentUserEmail,
    updateUserEmailBadge,
    setAuthenticatedUser,
    clearAuthenticatedUser,
};
