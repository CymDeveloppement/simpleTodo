const de={title:"Information",closeLabel:"Fermer",okLabel:"Ok",backdrop:!0,keyboard:!0},ue={title:"Confirmer",closeLabel:"Annuler",cancelLabel:"Annuler",confirmLabel:"Confirmer",backdrop:!0,keyboard:!0};function me({title:e,closeLabel:t,okLabel:n}){const s=document.createElement("div");return s.className="modal fade",s.id="alertBsModal",s.tabIndex=-1,s.setAttribute("aria-labelledby","alertBsModalLabel"),s.setAttribute("aria-hidden","true"),s.innerHTML=`
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="alertBsModalLabel">${e}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="${t}"></button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary btn-alert-ok">${n}</button>
                </div>
            </div>
        </div>
    `,s}function r(e,t={}){var u,m,g;if(!((u=window.bootstrap)!=null&&u.Modal)){(m=window.alert)==null||m.call(window,e);return}const n={...de,...t},s=document.getElementById("alertBsModal");if(s){const f=(g=window.bootstrap)==null?void 0:g.Modal.getInstance(s);f&&f.hide(),s.remove()}const o=me(n);o.querySelector(".modal-body").innerHTML=typeof e=="string"?e.replace(/\n/g,"<br>"):e,document.body.appendChild(o);const i=new window.bootstrap.Modal(o,{backdrop:n.backdrop,keyboard:n.keyboard}),a=()=>{o.removeEventListener("hidden.bs.modal",a),o.remove()};o.addEventListener("hidden.bs.modal",a,{once:!0});const c=o.querySelector(".btn-alert-ok");c==null||c.addEventListener("click",()=>i.hide(),{once:!0}),i.show()}function pe({title:e,closeLabel:t,confirmLabel:n,cancelLabel:s}){const o=document.createElement("div");return o.className="modal fade",o.id="confirmBsModal",o.tabIndex=-1,o.setAttribute("aria-labelledby","confirmBsModalLabel"),o.setAttribute("aria-hidden","true"),o.innerHTML=`
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="confirmBsModalLabel">${e}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="${t}"></button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-confirm-cancel">${s}</button>
                    <button type="button" class="btn btn-danger btn-confirm-ok">${n}</button>
                </div>
            </div>
        </div>
    `,o}function w(e,t={}){var a,c;if(!((a=window.bootstrap)!=null&&a.Modal)){const u=window.confirm?window.confirm(e):!0;return Promise.resolve(u)}const n={...ue,...t},s=document.getElementById("confirmBsModal");if(s){const u=(c=window.bootstrap)==null?void 0:c.Modal.getInstance(s);u&&u.hide(),s.remove()}const o=pe(n);o.querySelector(".modal-body").innerHTML=typeof e=="string"?e.replace(/\n/g,"<br>"):e,document.body.appendChild(o);const i=new window.bootstrap.Modal(o,{backdrop:n.backdrop,keyboard:n.keyboard});return new Promise(u=>{var L,H;let m=!1;const g=()=>{var F,q;o.removeEventListener("hidden.bs.modal",f),(F=o.querySelector(".btn-confirm-ok"))==null||F.removeEventListener("click",v),(q=o.querySelector(".btn-confirm-cancel"))==null||q.removeEventListener("click",k),o.remove()},f=()=>{m||(m=!0,u(!1)),g()},v=()=>{m||(m=!0,u(!0)),i.hide()},k=()=>{m||(m=!0,u(!1)),i.hide()};o.addEventListener("hidden.bs.modal",f,{once:!0}),(L=o.querySelector(".btn-confirm-ok"))==null||L.addEventListener("click",v,{once:!0}),(H=o.querySelector(".btn-confirm-cancel"))==null||H.addEventListener("click",k,{once:!0}),i.show()})}window.alertBs=r;window.confirmBs=w;const d="",I=new URLSearchParams(window.location.search);let K=I.get("list")||null;function _(){return K}function Y(e){K=e}function fe(){const e=document.querySelector('meta[name="app:auth"]');let t="",n="",s=null,o=!1;if(e){const c=e.dataset;c&&(t=(c.email||"").trim(),n=(c.sessionEmail||"").trim(),s=c.name||null,o=c.authenticated==="1")}const i=document.querySelector('meta[name="csrf-token"]');i&&(window.csrfToken=i.getAttribute("content"));const a=t||n||"";window.authUser={email:a||null,name:s,isAuthenticated:o},window.userEmail=a,window.isAuthenticated=o,window.sessionEmail=n}function ge(){if(typeof window>"u"||typeof window.fetch!="function"||window.fetch.__isAuthenticatedWrapper)return;const e=window.fetch.bind(window);window.fetch=(t,n={})=>{const s={...n};s.credentials=s.credentials||"include";const o=new Headers(s.headers||{});if(o.has("Accept")||o.set("Accept","application/json"),window.csrfToken&&!o.has("X-CSRF-Token")){const i=(s.method||"GET").toUpperCase();i!=="GET"&&i!=="HEAD"&&o.set("X-CSRF-Token",window.csrfToken)}return s.headers=o,e(t,s)},window.fetch.__isAuthenticatedWrapper=!0}function p(){const e=localStorage.getItem("simpleTodo_email");return e?e.trim():""}function $(e){const t=(e||"").trim();t?(localStorage.setItem("simpleTodo_email",t),typeof window<"u"&&(window.userEmail=t)):(localStorage.removeItem("simpleTodo_email"),typeof window<"u"&&(window.userEmail="")),A()}function T(){let e="";if(typeof window<"u"&&window.userEmail&&typeof window.userEmail=="string"&&window.userEmail.trim()!==""&&(e=window.userEmail.trim()),!e){const t=p();t&&(e=t)}return e}function A(){const e=document.querySelectorAll(".user-email");if(!e.length)return;const t=!!(typeof window<"u"&&window.isAuthenticated),n=T();e.forEach(s=>{const o=s.querySelector(".user-email-text");o&&(t&&n?(o.textContent=n,s.style.display="inline-flex",typeof window<"u"&&(window.userEmail=n,window.authUser||(window.authUser={}),window.authUser.email=n,window.authUser.isAuthenticated=!0)):(o.textContent="",s.style.display="none"))})}function ye(){return"list_"+Date.now()+"_"+Math.random().toString(36).substr(2,9)}function Z(){const e=T(),t=e?`<span class="badge bg-light text-dark" style="font-size: 0.85rem;">${e}</span>`:"",n=e?`-- Sélectionner une liste pour ${e} --`:"-- Sélectionner une liste --",s=e||"";document.body.innerHTML=`
        <div class="container" style="max-width: 600px; margin: 100px auto;">
            <div class="card">
                <div class="card-header" style="background: linear-gradient(135deg, #8fa4f5 0%, #b491e8 100%); color: white;">
                    <div class="d-flex align-items-center justify-content-between">
                        <h2 class="mb-0"><i class="bi bi-check2-square"></i> SimpleTodo</h2>
                        ${t}
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="mb-4">Choisir ou créer une liste</h5>
                    
                    <div class="mb-4">
                        <label class="form-label">Mes listes</label>
                        <select id="myLists" class="form-select mylists-select">
                            <option value="">${n}</option>
                        </select>
                        <button class="btn btn-primary w-100 mt-2" onclick="loadSelectedList()">
                            <i class="bi bi-box-arrow-in-right"></i> Ouvrir cette liste
                        </button>
                    </div>
                    
                    <hr>
                    
                    <div>
                        <label class="form-label">Créer une nouvelle liste</label>
                        <input type="text" id="newListTitle" class="form-control mb-2" placeholder="Nom de la liste" maxlength="100">
                        <input type="email" id="newListEmail" class="form-control mb-2" placeholder="Votre email (pour être le créateur)" maxlength="255" value="${s}">
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
    `,he()}async function be(){const e=[],t=T(),n=t?`-- Sélectionner une liste pour ${t} --`:"-- Sélectionner une liste --";try{const o=await fetch(`${d}/api/mylists`);o.ok?(await o.json()).forEach(a=>{e.push({listId:a.id,title:a.title})}):console.log("Erreur lors du chargement des listes depuis l'API:",o.status)}catch(o){console.error("Erreur lors du chargement des listes depuis l'API:",o)}for(let o=0;o<localStorage.length;o++){const i=localStorage.key(o);if(i.startsWith("simpleTodo_list_")){const a=localStorage.getItem(i),c=JSON.parse(a);c&&c.listId&&(e.find(m=>m.listId===c.listId)||e.push({listId:c.listId,title:c.title||c.listId}))}}return document.querySelectorAll(".mylists-select").forEach(o=>{o.innerHTML=`<option value="">${n}</option>`,e.forEach(i=>{const a=document.createElement("option");a.value=i.listId,a.textContent=i.title,o.appendChild(a)}),e.length===0&&(o.innerHTML='<option value="">Aucune liste disponible</option>')}),e}function he(){be()}async function we(){const e=document.getElementById("myLists");if(!e)return;const t=e.value;if(t)try{const n=await fetch(`${d}/api/lists/${t}`);if(!n.ok||n.status===404){localStorage.removeItem(`simpleTodo_list_${t}`);for(let s=localStorage.length-1;s>=0;s--){const o=localStorage.key(s);if(o&&o.startsWith("simpleTodo_token_")){const i=JSON.parse(localStorage.getItem(o));i&&i.listId===t&&localStorage.removeItem(o)}}r("Cette liste n'existe plus. Retour à l'accueil."),window.location.href="/";return}window.location.href=`/${t}`}catch(n){console.error("Erreur lors de la vérification de la liste:",n),r("Erreur lors de la vérification de la liste.")}}async function Ee(){const e=document.getElementById("newListTitle"),t=document.getElementById("newListEmail");if(!e)return;const n=e.value.trim();if(!n){r("Veuillez entrer un nom pour la liste");return}const o=(t?t.value.trim():"")||p();if(!o){r("Veuillez entrer votre email pour devenir le créateur de la liste"),t&&t.focus();return}p()||$(o);const i=ye();try{(await fetch(`${d}/api/lists/${i}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:n,creator_email:o})})).ok?window.location.href=`/${i}`:r("Erreur lors de la création de la liste")}catch(a){console.error("Erreur:",a),r("Erreur de connexion lors de la création de la liste")}}async function ve(){const e=document.getElementById("authEmail");if(!e)return;const t=e.value.trim();if(!t||!t.includes("@")){r("Veuillez entrer une adresse email valide");return}try{const n=await fetch(`${d}/api/auth/request-email`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t})});if(n.ok)r("Un email avec vos liens d'authentification a été envoyé !"),e.value="";else{const s=await n.json();r(s.message||"Erreur lors de l'envoi de l'email")}}catch(n){console.error("Erreur:",n),r("Erreur de connexion")}}function $e(){const t=window.location.pathname.match(/^\/([^\/]+)\/([^\/]+)$/);if(t){const n=t[1];return Y(n),{listId:n,token:t[2]}}return null}function Ce(){let e=I.get("token");if(e)return e;const t=$e();return t?t.token:null}let h=_();function M(e){h=e}async function y(){try{const t=await(await fetch(`${d}/api/todos/${h}`)).json();Ie(t),Se(t)}catch(e){console.error("Erreur lors du chargement des todos:",e)}}function Ie(e){const t=document.getElementById("todoList");if(!t)return;if(!e.length){t.innerHTML=`
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox" style="font-size: 3rem;"></i>
                <p class="mt-3">Aucune tâche pour le moment</p>
            </div>
        `;return}const n=new Map,s=[];e.forEach(i=>{if(i.category){const a=`cat_${i.category.id}`;n.has(a)||n.set(a,{name:i.category.name,color:i.category.color,todos:[]}),n.get(a).todos.push(i)}else s.push(i)});let o="";s.length&&(o+=`
            <div class="mb-3">
                ${s.map(i=>J(i)).join("")}
            </div>
        `),n.size&&(o+='<div class="accordion" id="todoAccordion">',Array.from(n.entries()).sort((a,c)=>{const u=a[1].name.toLowerCase(),m=c[1].name.toLowerCase();return u.localeCompare(m,"fr")}).forEach(([a,c],u)=>{const m=`collapse_${a}`,g=`heading_${a}`,f=u===0&&!s.length,v=c.color||"#6c757d",k=c.todos.map(L=>J(L)).join("");o+=`
                <div class="accordion-item">
                    <h2 class="accordion-header" id="${g}">
                        <button class="accordion-button ${f?"":"collapsed"}" type="button"
                            data-bs-toggle="collapse" data-bs-target="#${m}"
                            aria-expanded="${f?"true":"false"}" aria-controls="${m}">
                            <span class="badge rounded-pill me-2" style="background-color: ${v}; color: #fff;">
                                ${b(c.name)}
                            </span>
                            <span class="ms-1 text-muted">${c.todos.length} tâche${c.todos.length>1?"s":""}</span>
                        </button>
                    </h2>
                    <div id="${m}" class="accordion-collapse collapse ${f?"show":""}"
                        aria-labelledby="${g}" data-bs-parent="#todoAccordion">
                        <div class="accordion-body p-0">
                            ${k}
                        </div>
                    </div>
                </div>
            `}),o+="</div>"),t.innerHTML=o,window.updateCommentBadge&&e.forEach(i=>{window.updateCommentBadge(i.id)})}function J(e){const t=e.comments?e.comments.length:0,n=e.due_date?Te(e.due_date):"Aucune date",s=e.completed?"bi-arrow-counterclockwise":"bi-check-lg",o=e.completed?"Marquer comme non terminé":"Marquer comme terminé",i=e.completed?"btn btn-sm btn-outline-success flex-shrink-0":"btn btn-sm btn-outline-primary flex-shrink-0",a=e.pseudo?`<span class="badge bg-light text-dark pseudo-badge ms-2"><i class="bi bi-person-fill"></i> ${b(e.pseudo)}</span>`:"",c=e.assigned_to?`<span class="badge bg-info text-dark pseudo-badge ms-2"><i class="bi bi-person-check"></i> ${b(e.assigned_to)}</span>`:"",u=e.category?`<span class="badge" style="background-color:${e.category.color};">${b(e.category.name)}</span>`:"",m=t>0?"btn btn-sm btn-outline-primary":"btn btn-sm btn-outline-secondary";return`
        <div class="todo-item ${e.completed?"completed":""}" data-id="${e.id}" data-category="${e.category?e.category.id:""}" data-assigned="${e.assigned_to?b(e.assigned_to):""}" data-due-date="${e.due_date||""}" data-completed="${e.completed?"1":"0"}">
            <div class="d-flex align-items-start gap-2">
                <button class="${i}" title="${o}"
                    onclick="event.stopPropagation(); toggleTodo(${e.id})">
                    <i class="bi ${s}"></i>
                </button>
                <div class="flex-grow-1">
                    <div>
                        <span class="todo-text ${e.completed?"completed":""}">${b(e.text)}</span>
                        ${e.completed?'<span class="badge bg-success ms-2"><i class="bi bi-check-circle"></i> Terminé</span>':""}
                        ${u}
                        ${a}
                        ${c}
                    </div>
                    <div class="text-muted" style="font-size: 0.85rem;">
                        Ajouté par <strong>${b(e.pseudo||"Anonyme")}</strong>
                        • ${n}
                    </div>
                </div>
                <div class="d-flex gap-2 flex-shrink-0">
                    <button id="comment-button-${e.id}" class="${m} btn-comment-wrapper" title="Afficher les commentaires"
                        onclick="event.stopPropagation(); toggleComments(${e.id})">
                        <i class="bi bi-chat-dots"></i>
                        <span class="comment-badge" id="comment-badge-${e.id}" ${t>0?"":'style="display:none;"'}>${t}</span>
                        <span class="comment-badge comment-badge-new d-none" id="comment-new-badge-${e.id}"></span>
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button"
                            id="dropdownMenuButton${e.id}" data-bs-toggle="dropdown" aria-expanded="false"
                            onclick="event.stopPropagation();">
                            <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton${e.id}">
                            ${e.assigned_to?"":`<li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); assignTodo(${e.id}); return false;"><i class="bi bi-person-plus me-2"></i>Je m'en occupe</a></li>`}
                            <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); changeCategory(${e.id}); return false;"><i class="bi bi-tag me-2"></i>Changer de catégorie</a></li>
                            <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); changeDueDate(${e.id}); return false;"><i class="bi bi-calendar-plus me-2"></i>Modifier la date</a></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="event.stopPropagation(); deleteTodo(${e.id}); return false;"><i class="bi bi-trash me-2"></i>Supprimer</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="comments-section" id="comments-${e.id}" style="display: none;">
                <div class="comment-list" id="comments-list-${e.id}"></div>
                <div class="comment-form input-group mt-2">
                    <input type="text" class="form-control" id="comment-input-${e.id}" placeholder="Ajouter un commentaire...">
                    <button class="btn btn-outline-primary" type="button" onclick="addComment(${e.id})">
                        <i class="bi bi-send"></i>
                    </button>
                </div>
            </div>
        </div>
    `}function b(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function Te(e){return new Date(e).toLocaleDateString("fr-FR",{year:"numeric",month:"long",day:"numeric"})}function Se(e){const t=e.length,n=e.filter(c=>c.completed).length,s=t-n,o=document.getElementById("totalCount"),i=document.getElementById("completedCount"),a=document.getElementById("remainingCount");o&&(o.textContent=t),i&&(i.textContent=n),a&&(a.textContent=s)}async function ee(){const e=document.getElementById("todoInput"),t=localStorage.getItem("simpleTodo_pseudo");if(!e)return;const n=e.value.trim();if(!n){r("Veuillez entrer une tâche");return}try{(await fetch(`${d}/api/todos/${h}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:n,pseudo:t||"Anonyme"})})).ok?(e.value="",y()):r("Erreur lors de l'ajout de la tâche")}catch(s){console.error("Erreur lors de l'ajout de la tâche:",s),r("Erreur de connexion")}}async function ke(e){const t=document.querySelector(`.todo-item[data-id="${e}"]`),s=!((t==null?void 0:t.getAttribute("data-completed"))==="1");try{const o=await fetch(`${d}/api/todos/${h}/${e}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({completed:s})});if(o.ok)y();else if(o.status===422){const i=await o.json().catch(()=>null);console.error("Validation toggle todo:",i),r((i==null?void 0:i.message)||"Validation impossible pour cette tâche")}else r("Erreur lors du changement d'état de la tâche")}catch(o){console.error("Erreur toggle todo:",o),r("Erreur de connexion")}}async function Le(e){if(await w("Êtes-vous sûr de vouloir supprimer cette tâche ?"))try{(await fetch(`${d}/api/todos/${h}/${e}`,{method:"DELETE"})).ok?y():r("Erreur lors de la suppression de la tâche")}catch(n){console.error("Erreur suppression todo:",n),r("Erreur de connexion")}}async function Be(){if(await w("Êtes-vous sûr de vouloir supprimer toutes les tâches terminées ?"))try{(await fetch(`${d}/api/todos/${h}`,{method:"DELETE"})).ok?y():r("Erreur lors de la suppression des tâches terminées")}catch(t){console.error("Erreur clear completed:",t),r("Erreur de connexion")}}async function xe(e){const t=localStorage.getItem("simpleTodo_pseudo")||"",n=typeof window<"u"&&window.userEmail?window.userEmail:T();if(!n){r("Impossible d'assigner la tâche : votre adresse email est introuvable. Veuillez vous reconnecter.");return}let s=t;if(!s&&window.isAuthenticated&&(s=n.split("@")[0],localStorage.setItem("simpleTodo_pseudo",s)),!s){r("Veuillez enregistrer votre pseudo avant de vous assigner une tâche.");return}try{const o=await fetch(`${d}/api/todos/${h}/${e}/assign`,{method:"POST",headers:{"Content-Type":"application/json","X-User-Email":n,"X-User-Pseudo":s},body:JSON.stringify({pseudo:s})});if(o.ok)y();else if(o.status===422){const i=await o.json().catch(()=>null);console.error("Validation assign todo:",i),r(i&&i.message||"Impossible d'assigner la tâche (422)")}else r("Erreur lors de l'assignation de la tâche")}catch(o){console.error("Erreur assign todo:",o),r("Erreur de connexion")}}Object.assign(window,{loadSelectedList:we,createNewList:Ee,requestAuthEmail:ve,alertBs:r,confirmBs:w,addTodo:ee,saveTitle:Ve,cancelTitleEdit:qe,editTitle:Fe,subscribe:j,unsubscribe:Ge,inviteCollaborator:ce,addCategory:Ye,savePseudo:te,savePseudoFromModal:ne,changeHeaderGradient:_e,saveAutoAssignOption:Me,deleteCategory:Ze,clearCompleted:Be,confirmDeleteList:Je,runServerUpdate:Pe,shareListUrl:ze,toggleTodo:ke,toggleComments:Oe,assignTodo:xe,changeCategory:je,changeDueDate:De,deleteTodo:Le,addComment:re,resendSubscriberLink:We,updateCommentBadge:se});fe();ge();let l=_();M(l);if(!l){const t=window.location.pathname.match(/^\/([^\/]+)$/);t&&t[1]&&t[1]!=="index.html"&&(l=t[1],Y(l),M(l))}l||Z();function E(){const e=localStorage.getItem("simpleTodo_pseudo"),t=document.getElementById("pseudo");return e&&t?(t.value=e,e):null}function te(){const e=document.getElementById("pseudo");if(!e)return;const t=e.value.trim();t?(localStorage.setItem("simpleTodo_pseudo",t),S(),new bootstrap.Collapse(document.getElementById("userSettings"),{toggle:!0})):r("Veuillez entrer un pseudo")}function S(){const e=E(),t=p(),n=document.querySelector(".user-pseudo"),s=n?n.querySelector(".user-pseudo-text"):null;n&&s&&e?(s.textContent=e,n.style.display="inline-flex"):n&&(s&&(s.textContent=""),n.style.display="none");const o=document.getElementById("userInfo");if(o&&(o.style.display=e||window.isAuthenticated&&T()?"flex":"none"),t){const i=document.getElementById("emailBadge");i&&(i.style.display="inline-block")}else{const i=document.getElementById("emailBadge");i&&(i.style.display="none")}}const B={gradient1:"linear-gradient(135deg, #8fa4f5 0%, #b491e8 100%)",gradient2:"linear-gradient(135deg, #f66 0%, #ff9240 100%)",gradient3:"linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)",gradient4:"linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",gradient5:"linear-gradient(135deg, #fd79a8 0%, #e84393 100%)",gradient6:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",gradient7:"linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)",gradient8:"linear-gradient(135deg, #a29bfe 0%, #fd79a8 100%)"};async function Ae(){let e="gradient1";try{const o=await(await fetch(`${d}/api/lists/${l}`)).json();o.header_gradient&&(e=o.header_gradient)}catch(s){console.error("Erreur chargement gradient:",s)}const t=document.querySelector(".card-header");t&&B[e]&&(t.style.background=B[e]);const n=document.getElementById("headerGradient");n&&(n.value=e)}async function _e(){const e=document.getElementById("headerGradient").value,t=document.querySelector(".card-header");if(t&&B[e]){t.style.background=B[e];try{await fetch(`${d}/api/lists/${l}`,{method:"PUT",headers:{"Content-Type":"application/json","X-CSRF-Token":window.csrfToken},body:JSON.stringify({header_gradient:e})})}catch(n){console.error("Erreur sauvegarde gradient:",n)}}}async function Me(){const e=document.getElementById("autoAssignToCreator");if(!e)return;const t=e.checked;window.autoAssignToCreator=t;try{const n=await fetch(`${d}/api/lists/${l}`,{method:"PUT",headers:{"Content-Type":"application/json","X-CSRF-Token":window.csrfToken},body:JSON.stringify({auto_assign_to_creator:t})});n.ok||(console.error("Erreur sauvegarde option assignation:",n.statusText),e.checked=!t,window.autoAssignToCreator=!t)}catch(n){console.error("Erreur sauvegarde option assignation:",n),e.checked=!t,window.autoAssignToCreator=!t}}document.addEventListener("DOMContentLoaded",function(){const e=localStorage.getItem("simpleTodo_pseudo");let t=Ce();if(l=_(),M(l),t&&l){const i={listId:l,token:t};X().then(a=>{a&&(i.title=a),localStorage.setItem(`simpleTodo_token_${t}`,JSON.stringify(i))}).catch(a=>{localStorage.setItem(`simpleTodo_token_${t}`,JSON.stringify(i))})}const n=I.get("email");n&&(document.getElementById("email").value=n,localStorage.getItem("simpleTodo_pseudo")&&setTimeout(function(){j()},500)),e||(new bootstrap.Modal(document.getElementById("pseudoModal")).show(),setTimeout(function(){document.getElementById("modalPseudo").focus()},500)),typeof window<"u"&&window.isAuthenticated&&window.userEmail?$(window.userEmail):A(),E(),X(),Ae(),S(),A(),U(),y(),O();const s=document.querySelector(".user-pseudo");s&&(s.style.cursor="pointer",s.addEventListener("click",function(){(window.userEmail||p()||"").trim()&&(window.location.href="/")})),setInterval(Ke,5e3);const o=document.getElementById("userSettings");o&&o.addEventListener("show.bs.collapse",function(){N()})});async function Pe(){const e=document.getElementById("updateOutput"),t=document.getElementById("updateStatus");e&&(e.textContent="Exécution en cours..."),t&&(t.style.display="block",t.textContent="");try{const n=!!(document.getElementById("updateForce")&&document.getElementById("updateForce").checked),s=await fetch(`${d}/api/update`,{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-Token":window.csrfToken,"X-User-Email":window.userEmail||p()||""},body:JSON.stringify({email:window.userEmail||p()||"",force:n})}),o=await s.json(),i=[];i.push(`Success: ${!!o.success}`),typeof o.code<"u"&&i.push(`Exit code: ${o.code}`),o.stdout&&(i.push(`
--- stdout ---`),i.push(o.stdout)),o.stderr&&(i.push(`
--- stderr ---`),i.push(o.stderr)),e&&(e.textContent=i.join(`
`)),t&&(t.textContent=s.ok?"Mise à jour terminée.":"Erreur lors de la mise à jour.")}catch(n){e&&(e.textContent=`Erreur: ${n}`),t&&(t.textContent="Erreur lors de la mise à jour.")}}function ne(){const e=document.getElementById("modalPseudo").value.trim();if(e){localStorage.setItem("simpleTodo_pseudo",e),S();const t=I.get("email");t&&(document.getElementById("email").value=t,setTimeout(function(){j()},300)),bootstrap.Modal.getInstance(document.getElementById("pseudoModal")).hide()}else r("Veuillez entrer un pseudo")}document.addEventListener("DOMContentLoaded",function(){const e=document.getElementById("modalPseudo");e&&e.addEventListener("keypress",function(t){t.key==="Enter"&&ne()})});function C(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}async function De(e){const t=document.querySelector(`[data-id="${e}"]`);if(!t){r("Impossible de récupérer la tâche ciblée. Veuillez recharger la page.");return}const n=t.getAttribute("data-due-date")||"",s=n?new Date(n).toLocaleDateString("fr-FR",{day:"numeric",month:"numeric",year:"numeric"}):"Aucune date",o=document.createElement("div");o.innerHTML=`
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
                            <input type="date" class="form-control" id="newDueDate" value="${n}" min="${new Date().toISOString().split("T")[0]}">
                        </div>
                        <p class="text-muted">Date actuelle : ${s}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" id="removeDueDateBtn">Supprimer la date</button>
                        <button type="button" class="btn btn-primary" id="saveDueDateBtn">Sauvegarder</button>
                    </div>
                </div>
            </div>
        </div>
    `,document.body.appendChild(o);const i=document.getElementById("dueDateModal"),a=new bootstrap.Modal(i);a.show();const c=document.getElementById("newDueDate"),u=document.getElementById("saveDueDateBtn"),m=document.getElementById("removeDueDateBtn"),g=()=>{a.hide(),setTimeout(()=>o.remove(),300)};u.addEventListener("click",async()=>{try{const f=c.value;(await fetch(`${d}/api/todos/${l}/${e}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({due_date:f})})).ok?(g(),y()):r("Erreur lors de la modification de la date d'échéance")}catch(f){console.error("Erreur:",f),r("Erreur lors de la modification de la date d'échéance")}}),m.addEventListener("click",async()=>{try{(await fetch(`${d}/api/todos/${l}/${e}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({due_date:null})})).ok?(g(),y()):r("Erreur lors de la suppression de la date d'échéance")}catch(f){console.error("Erreur:",f),r("Erreur lors de la suppression de la date d'échéance")}})}async function je(e){const n=document.querySelector(`[data-id="${e}"]`).dataset.category||"",s=`
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
                        <button type="button" class="btn btn-primary" onclick="saveCategoryChange(${e})">Sauvegarder</button>
                    </div>
                </div>
            </div>
        </div>
    `,o=document.getElementById("categoryModal");o&&o.remove(),document.body.insertAdjacentHTML("beforeend",s);const i=document.getElementById("categorySelect");i.innerHTML='<option value="">Aucune catégorie</option>',x.forEach(c=>{const u=document.createElement("option");u.value=c.id,u.textContent=c.name,u.style.backgroundColor=c.color,u.style.color="white",c.id==n&&(u.selected=!0),i.appendChild(u)});const a=new bootstrap.Modal(document.getElementById("categoryModal"));a.show(),window.saveCategoryChange=async function(c){const u=i.value||null;try{(await fetch(`${d}/api/todos/${l}/${c}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({category_id:u})})).ok?(a.hide(),setTimeout(()=>document.getElementById("categoryModal").remove(),300),y()):r("Erreur lors du changement de catégorie")}catch(m){console.error("Erreur:",m),r("Erreur lors du changement de catégorie")}}}const R=document.getElementById("todoInput");R&&R.addEventListener("keypress",function(e){e.key==="Enter"&&ee()});const V=document.getElementById("pseudo");V&&V.addEventListener("keypress",function(e){e.key==="Enter"&&te()});const z=document.getElementById("inviteEmail");z&&z.addEventListener("keypress",function(e){e.key==="Enter"&&ce()});async function Oe(e){const t=document.getElementById(`comments-${e}`);t&&(t.style.display==="none"||t.style.display===""?(t.style.display="block",oe(e)):t.style.display="none")}async function oe(e){try{const[t,n]=await Promise.all([fetch(`${d}/api/comments/${l}/${e}`).then(o=>o.json()),ae(e)]),s=ie(t);Ue(e,t),P(e,t.length,n.new_comments,s),s&&await He(e,s)}catch(t){console.error("Erreur lors du chargement des commentaires:",t)}}async function se(e){try{const[t,n]=await Promise.all([fetch(`${d}/api/comments/${l}/${e}`).then(i=>i.json()),ae(e)]),s=document.getElementById(`comment-badge-${e}`),o=ie(t);if(!s)return;le(s,t.length),P(e,t.length,n.new_comments,o)}catch(t){console.error("Erreur lors du chargement du badge:",t)}}function Ue(e,t){const n=document.getElementById(`comments-list-${e}`);if(t.length===0){n.innerHTML='<div class="text-muted small">Aucun commentaire</div>',P(e,0,0,0),G(e);return}n.innerHTML=t.map(s=>{const o=s.created_at?Qe(s.created_at):"";return`
        <div class="comment-item">
            <div class="comment-pseudo">${C(s.pseudo)}</div>
            <div>${C(s.text)}</div>
            ${o?`<div class="text-muted small fst-italic mt-1">${o}</div>`:""}
        </div>
        `}).join(""),G(e)}function ie(e){return!Array.isArray(e)||e.length===0?0:e.reduce((t,n)=>{const s=Number(n==null?void 0:n.id)||0;return s>t?s:t},0)}async function re(e){const t=document.getElementById(`comment-input-${e}`);if(!t)return;const n=t.value.trim(),s=E();if(!n){r("Veuillez entrer un commentaire");return}if(!s){r("Veuillez d'abord entrer votre pseudo");return}try{(await fetch(`${d}/api/comments/${l}/${e}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:n,pseudo:s})})).ok&&(t.value="",oe(e),se(e))}catch(o){console.error("Erreur:",o),r("Erreur lors de l'ajout du commentaire")}}function G(e){const t=document.getElementById(`comment-input-${e}`);!t||t.dataset.enterHandler==="true"||(t.addEventListener("keydown",n=>{n.key==="Enter"&&!n.shiftKey&&(n.preventDefault(),re(e))}),t.dataset.enterHandler="true")}function Ne(e,t){const n=document.getElementById(`comment-button-${e}`);n&&(n.classList.remove("btn-outline-secondary","btn-outline-primary"),t>0?n.classList.add("btn-outline-primary"):n.classList.add("btn-outline-secondary"))}function P(e,t,n,s){Ne(e,t);const o=document.getElementById(`comment-new-badge-${e}`);o&&(le(o,n),o.dataset.lastCommentId=String(s||""))}async function He(e,t){const n=p();if(!n||!l||!t)return 0;try{const s=await fetch(`${d}/api/subscribers/${l}/todos/${e}/last-comment`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:n,comment_id:t})});if(!s.ok)return 0;const o=await s.json();return Number((o==null?void 0:o.new_comments)||0)}catch(s){return console.error("Erreur lors de la mise à jour du dernier commentaire consulté:",s),0}}async function ae(e){const t=p();if(!t||!l)return{stored_comment_id:0,new_comments:0};try{const n=await fetch(`${d}/api/subscribers/${l}/todos/${e}/last-comment?email=${encodeURIComponent(t)}`);return n.ok?await n.json():{stored_comment_id:0,new_comments:0}}catch(n){return console.error("Erreur lors de la récupération du dernier commentaire consulté:",n),{stored_comment_id:0,new_comments:0}}}function le(e,t){e&&(e.textContent=t>0?t:"",e.classList.toggle("d-none",t===0))}async function X(){const e=I.get("title");let t="SimpleTodo";if(e){t=decodeURIComponent(e),document.getElementById("listTitle").textContent=t,localStorage.setItem(`simpleTodo_list_${l}`,JSON.stringify({listId:l,title:t}));const o=p();try{if(await fetch(`${d}/api/lists/${l}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:t,creator_email:o})}),o){window.isListCreator=!0,console.log("isListCreator set to true (new list creation)"),$(o);try{const i=E()||"Créateur";await fetch(`${d}/api/subscribers/${l}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:o,pseudo:i})})}catch(i){console.error("Erreur abonnement auto:",i)}}}catch(i){console.error("Erreur sauvegarde liste:",i)}return W(),t}const n=p(),s=n?`${d}/api/lists/${l}?email=${encodeURIComponent(n)}`:`${d}/api/lists/${l}`;try{const i=await(await fetch(s)).json();t=i.title||"SimpleTodo",window.isListCreator=i.is_creator,window.isSubscriber=i.is_subscriber||!1,window.autoAssignToCreator=i.auto_assign_to_creator||!1,console.log("isListCreator from API:",window.isListCreator),console.log("isSubscriber from API:",window.isSubscriber),console.log("autoAssignToCreator from API:",window.autoAssignToCreator),console.log("Creator email from API:",i.creator_email),window.isListCreator&&!p()&&i.creator_email&&($(i.creator_email),console.log("Creator email set from API:",i.creator_email));const a=document.getElementById("autoAssignToCreator");a&&(a.checked=window.autoAssignToCreator),W(),D();const c=document.getElementById("listTitle");c&&(c.textContent=t)}catch(o){console.error("Erreur lors du chargement du titre:",o);const i=document.getElementById("listTitle");i&&(i.textContent="SimpleTodo")}return t}function Fe(){const e=document.getElementById("titleInput"),t=document.getElementById("titleField");t.value=document.getElementById("listTitle").textContent,e.style.display="block"}function qe(){document.getElementById("titleInput").style.display="none"}function W(){console.log("updateDeleteButton called, isListCreator:",window.isListCreator);const e=document.getElementById("deleteListBtnSettings");e&&window.isListCreator?e.classList.remove("d-none"):e&&e.classList.add("d-none");const t=document.querySelectorAll(".creator-only");console.log("Found",t.length,"creator-only sections"),t.forEach(n=>{window.isListCreator?(n.classList.add("show"),n.classList.remove("d-none")):(n.classList.remove("show"),n.classList.add("d-none"))})}async function Je(){await w(`Attention : Cette action est irréversible !

Voulez-vous vraiment supprimer cette liste et toutes ses tâches ?`)&&await Re()}async function Re(){const e=p();if(!e){r("Erreur : Email non trouvé");return}try{const t=`${d}/api/lists/${l}?email=${encodeURIComponent(e)}`,n=await fetch(t,{method:"DELETE"});if(n.ok)r("Liste supprimée avec succès"),Z();else{const s=await n.json();r(s.error||"Erreur lors de la suppression de la liste")}}catch(t){console.error("Erreur:",t),r("Erreur lors de la suppression de la liste")}}async function Ve(){const t=document.getElementById("titleField").value.trim();if(!t){r("Veuillez entrer un titre");return}try{const n=p(),s=n?`${d}/api/lists/${l}?email=${encodeURIComponent(n)}`:`${d}/api/lists/${l}`;(await fetch(s,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:t})})).ok?(document.getElementById("listTitle").textContent=t,document.getElementById("titleInput").style.display="none"):r("Erreur lors de la sauvegarde du titre")}catch(n){console.error("Erreur:",n),r("Erreur lors de la sauvegarde du titre")}}function ze(){if(!l){r("Aucune liste sélectionnée");return}const t=`${window.location.origin}/?list=${l}`;navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(t).then(()=>{r(`Lien copié dans le presse-papiers !

`+t)}).catch(n=>{console.error("Erreur lors de la copie:",n),Q(t)}):Q(t)}function Q(e){const t=document.createElement("textarea");t.value=e,t.style.position="fixed",t.style.opacity="0",document.body.appendChild(t),t.focus(),t.select();try{document.execCommand("copy"),r(`Lien copié dans le presse-papiers !

`+e)}catch(n){console.error("Erreur lors de la copie:",n),prompt("Copiez ce lien manuellement:",e)}document.body.removeChild(t)}function D(){const e=p(),t=document.getElementById("emailSubscription"),n=document.getElementById("emailUnsubscribe"),s=document.getElementById("emailDisplay");if(!e){t&&(t.style.display="block"),n&&(n.style.display="none");return}window.isSubscriber?(s&&(s.textContent=e),n&&(n.style.display="block"),t&&(t.style.display="none")):(s&&(s.textContent=""),t&&(t.style.display="block"),n&&(n.style.display="none"))}async function j(){const e=document.getElementById("email"),t=e.value.trim();if(!t||!t.includes("@"))return;const n=E();try{(await fetch(`${d}/api/subscribers/${l}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,pseudo:n})})).ok&&($(t),e.value="",window.isSubscriber=!0,D(),S(),O())}catch(s){console.error("Erreur:",s),r("Erreur lors de l'inscription")}}async function Ge(){const e=p();if(e)try{(await fetch(`${d}/api/subscribers/${l}`,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:e})})).ok&&(document.getElementById("email").value="",window.isSubscriber=!1,D(),S(),O())}catch(t){console.error("Erreur:",t),r("Erreur lors de la désinscription")}}async function O(){try{const t=await(await fetch(`${d}/api/subscribers/${l}`)).json();await Xe(t)}catch(e){console.error("Erreur:",e);const t=document.getElementById("subscribersList");t&&(t.innerHTML='<div class="text-white small text-center py-2">Erreur de chargement</div>')}}async function Xe(e){const t=document.getElementById("subscribersList");if(!t)return;if(e.length===0){t.innerHTML='<div class="text-white small text-center py-2"><i class="bi bi-inbox"></i> Aucun abonné pour le moment</div>';return}let n=null;console.log("displaySubscribers - isListCreator:",window.isListCreator);try{const s=p(),o=s?`${d}/api/lists/${l}?email=${encodeURIComponent(s)}`:`${d}/api/lists/${l}`,a=await(await fetch(o)).json();n=a.creator_email,console.log("Creator email from API:",n),a.is_creator!==void 0&&(window.isListCreator=a.is_creator,console.log("isListCreator from API:",window.isListCreator))}catch(s){console.error("Erreur récupération email créateur:",s)}t.innerHTML=e.map(s=>{const o=n&&n.trim()===s.email.trim();return console.log("Subscriber:",s.email,"Creator email:",n,"isCreator:",o),`
        <div class="d-flex align-items-center justify-content-between py-1">
            <div>
                <small class="text-white">
                    ${o?'<i class="bi bi-star-fill text-warning me-1" title="Créateur"></i>':""}
                    ${C(s.pseudo||s.email)} 
                    ${s.pseudo?`<span class="text-white">(${C(s.email)})</span>`:""}
                </small>
            </div>
            <button class="btn btn-sm btn-light" onclick="resendSubscriberLink(${s.id})" title="Renvoyer le lien">
                <i class="bi bi-send"></i>
            </button>
        </div>
        `}).join("")}async function We(e){try{(await fetch(`${d}/api/subscribers/${l}/${e}/resend`,{method:"POST",headers:{"Content-Type":"application/json"}})).ok}catch(t){console.error("Erreur:",t)}}async function ce(){const e=document.getElementById("inviteEmail"),t=e.value.trim();if(!t||!t.includes("@"))return;const n=E();try{(await fetch(`${d}/api/invitations/${l}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:t,invited_by:n||"Quelqu'un"})})).ok&&(e.value="")}catch(s){console.error("Erreur:",s)}}function Qe(e){const t=new Date(e),s=new Date-t;if(s<6e4)return"À l'instant";if(s<36e5){const o=Math.floor(s/6e4);return`Il y a ${o} minute${o>1?"s":""}`}if(s<864e5){const o=Math.floor(s/36e5);return`Il y a ${o} heure${o>1?"s":""}`}if(s<6048e5){const o=Math.floor(s/864e5);return`Il y a ${o} jour${o>1?"s":""}`}return t.toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}let x=[];async function U(){try{x=await(await fetch(`${d}/api/categories/${l}`)).json()}catch(e){console.error("Erreur lors du chargement des catégories:",e)}}async function Ke(){try{const e=await fetch(`${d}/api/email-queue/process`,{method:"POST"});if(e.ok){const t=await e.json();t.processed>0&&console.log(`Emails traités: ${t.sent} envoyés, ${t.failed} échoués`)}}catch{}}async function N(){const e=document.getElementById("categoriesContainer");if(e.innerHTML="",x.length===0){e.innerHTML='<div class="text-muted text-white small">Aucune catégorie</div>';return}x.forEach(t=>{const n=document.createElement("div");n.className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-white",n.innerHTML=`
            <div class="d-flex align-items-center">
                <span class="badge rounded-pill me-2" style="background-color: ${t.color}; color: white;">
                    ${C(t.name)}
                </span>
            </div>
            <button class="btn btn-sm btn-outline-light" onclick="deleteCategory(${t.id})">
                <i class="bi bi-trash"></i>
            </button>
        `,e.appendChild(n)})}async function Ye(){const e=document.getElementById("newCategoryName").value.trim(),t=document.getElementById("newCategoryColor").value;if(!e){r("Veuillez entrer un nom de catégorie");return}try{(await fetch(`${d}/api/categories/${l}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:e,color:t})})).ok&&(document.getElementById("newCategoryName").value="",U(),N())}catch(n){console.error("Erreur:",n),r("Erreur lors de l'ajout de la catégorie")}}async function Ze(e){if(await w("Supprimer cette catégorie ?"))try{(await fetch(`${d}/api/categories/${l}/${e}`,{method:"DELETE"})).ok&&(U(),N())}catch(n){console.error("Erreur:",n)}}
