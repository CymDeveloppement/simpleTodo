const ALERT_DEFAULT_OPTIONS = {
    title: 'Information',
    closeLabel: 'Fermer',
    okLabel: 'Ok',
    backdrop: true,
    keyboard: true,
};

const CONFIRM_DEFAULT_OPTIONS = {
    title: 'Confirmer',
    closeLabel: 'Annuler',
    cancelLabel: 'Annuler',
    confirmLabel: 'Confirmer',
    backdrop: true,
    keyboard: true,
};

function createAlertModalElement({ title, closeLabel, okLabel }) {
    const modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.id = 'alertBsModal';
    modalElement.tabIndex = -1;
    modalElement.setAttribute('aria-labelledby', 'alertBsModalLabel');
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="alertBsModalLabel">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="${closeLabel}"></button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary btn-alert-ok">${okLabel}</button>
                </div>
            </div>
        </div>
    `;
    return modalElement;
}

export function alertBs(message, options = {}) {
    if (!window.bootstrap?.Modal) {
        window.alert?.(message);
        return;
    }

    const mergedOptions = { ...ALERT_DEFAULT_OPTIONS, ...options };

    const existingModal = document.getElementById('alertBsModal');
    if (existingModal) {
        const activeInstance = window.bootstrap?.Modal.getInstance(existingModal);
        if (activeInstance) {
            activeInstance.hide();
        }
        existingModal.remove();
    }

    const modalElement = createAlertModalElement(mergedOptions);
    modalElement.querySelector('.modal-body').innerHTML = typeof message === 'string'
        ? message.replace(/\n/g, '<br>')
        : message;
    document.body.appendChild(modalElement);

    const modalInstance = new window.bootstrap.Modal(modalElement, {
        backdrop: mergedOptions.backdrop,
        keyboard: mergedOptions.keyboard,
    });

    const cleanup = () => {
        modalElement.removeEventListener('hidden.bs.modal', cleanup);
        modalElement.remove();
    };

    modalElement.addEventListener('hidden.bs.modal', cleanup, { once: true });

    const okButton = modalElement.querySelector('.btn-alert-ok');
    okButton?.addEventListener('click', () => modalInstance.hide(), { once: true });

    modalInstance.show();
}

function createConfirmModalElement({ title, closeLabel, confirmLabel, cancelLabel }) {
    const modalElement = document.createElement('div');
    modalElement.className = 'modal fade';
    modalElement.id = 'confirmBsModal';
    modalElement.tabIndex = -1;
    modalElement.setAttribute('aria-labelledby', 'confirmBsModalLabel');
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="confirmBsModalLabel">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="${closeLabel}"></button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-confirm-cancel">${cancelLabel}</button>
                    <button type="button" class="btn btn-danger btn-confirm-ok">${confirmLabel}</button>
                </div>
            </div>
        </div>
    `;
    return modalElement;
}

export function confirmBs(message, options = {}) {
    if (!window.bootstrap?.Modal) {
        const response = window.confirm ? window.confirm(message) : true;
        return Promise.resolve(response);
    }

    const mergedOptions = { ...CONFIRM_DEFAULT_OPTIONS, ...options };
    const existingModal = document.getElementById('confirmBsModal');
    if (existingModal) {
        const activeInstance = window.bootstrap?.Modal.getInstance(existingModal);
        if (activeInstance) {
            activeInstance.hide();
        }
        existingModal.remove();
    }

    const modalElement = createConfirmModalElement(mergedOptions);
    modalElement.querySelector('.modal-body').innerHTML = typeof message === 'string'
        ? message.replace(/\n/g, '<br>')
        : message;
    document.body.appendChild(modalElement);

    const modalInstance = new window.bootstrap.Modal(modalElement, {
        backdrop: mergedOptions.backdrop,
        keyboard: mergedOptions.keyboard,
    });

    return new Promise((resolve) => {
        let resolved = false;

        const cleanup = () => {
            modalElement.removeEventListener('hidden.bs.modal', onHidden);
            modalElement.querySelector('.btn-confirm-ok')?.removeEventListener('click', onConfirm);
            modalElement.querySelector('.btn-confirm-cancel')?.removeEventListener('click', onCancel);
            modalElement.remove();
        };

        const onHidden = () => {
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
            cleanup();
        };

        const onConfirm = () => {
            if (!resolved) {
                resolved = true;
                resolve(true);
            }
            modalInstance.hide();
        };

        const onCancel = () => {
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
            modalInstance.hide();
        };

        modalElement.addEventListener('hidden.bs.modal', onHidden, { once: true });
        modalElement.querySelector('.btn-confirm-ok')?.addEventListener('click', onConfirm, { once: true });
        modalElement.querySelector('.btn-confirm-cancel')?.addEventListener('click', onCancel, { once: true });

        modalInstance.show();
    });
}

window.alertBs = alertBs;
window.confirmBs = confirmBs;

