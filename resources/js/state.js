const API_BASE_URL = '';
const urlParams = new URLSearchParams(window.location.search);

let listId = urlParams.get('list') || null;

function getListId() {
    return listId;
}

function setListId(value) {
    listId = value;
}

export { API_BASE_URL, urlParams, getListId, setListId };
