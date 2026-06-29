// Trabalho Interdisciplinar 1 - Aplicações Web
//
// Módulo de registro/login de usuários para aplicação com backend JSON Server.
// Adaptado para a D.O.S.E.: usuários têm is_worker (funcionário x cliente),
// role (cargo na farmácia) e company_id (farmácia à qual pertencem).
//
// Uso do gate nas páginas:
//   <script src="/assets/js/login.js" data-require="worker"></script>  -> exige funcionário logado
//   <script src="/assets/js/login.js" data-require="auth"></script>    -> exige qualquer usuário logado
//   <script src="/assets/js/login.js"></script>                        -> sem gate (ex.: a própria página de login)

const LOGIN_URL = "/modulos/login/login.html";
const WORKER_HOME = "/index.html";
const CLIENT_HOME = "/modulos/Beatriz/farmacias/index.html";
const API_URL = "/usuarios";
const COMPANIES_URL = "/companies";

const SCRIPT_EL = document.currentScript;
const REQUIRE = SCRIPT_EL ? SCRIPT_EL.dataset.require : undefined; // "worker" | "auth" | undefined

var db_usuarios = {};
var usuarioCorrente = {};

function getSession() {
    const raw = sessionStorage.getItem("usuarioCorrente");
    return raw ? JSON.parse(raw) : null;
}

function homeForUser(user) {
    return user && user.is_worker ? WORKER_HOME : CLIENT_HOME;
}

// Inicializa a aplicação de Login / aplica o gate de acesso
function initLoginApp() {
    const pagina = window.location.pathname;

    // Página de login: apenas carrega a base de usuários
    if (pagina === LOGIN_URL) {
        carregarUsuarios(() => console.log("Usuários carregados..."));
        return;
    }

    // Demais páginas
    const sessao = getSession();
    if (sessao) usuarioCorrente = sessao;

    if (REQUIRE) {
        if (!sessao) {
            // Não logado: guarda destino e manda para o login
            sessionStorage.setItem("returnURL", pagina);
            window.location.href = LOGIN_URL;
            return;
        }
        if (REQUIRE === "worker" && !usuarioCorrente.is_worker) {
            // Logado, mas é cliente tentando página interna: manda para a área do cliente
            window.location.href = CLIENT_HOME;
            return;
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        showUserInfo("userInfo");
    });
}

function carregarUsuarios(callback) {
    fetch(API_URL)
        .then((response) => response.json())
        .then((data) => {
            db_usuarios = data;
            callback();
        })
        .catch((error) => {
            console.error("Erro ao ler usuários via API JSONServer:", error);
        });
}

// Valida login/senha; se ok, salva o usuário corrente na sessão e retorna true
function loginUser(login, senha) {
    for (var i = 0; i < db_usuarios.length; i++) {
        var usuario = db_usuarios[i];
        if (login == usuario.login && senha == usuario.senha) {
            usuarioCorrente = {
                id: usuario.id,
                login: usuario.login,
                email: usuario.email,
                nome: usuario.nome,
                is_worker: !!usuario.is_worker,
                role: usuario.role || null,
                company_id: usuario.company_id ?? null,
            };
            sessionStorage.setItem("usuarioCorrente", JSON.stringify(usuarioCorrente));
            return true;
        }
    }
    return false;
}

// Faz logout e leva para o login
function logoutUser() {
    sessionStorage.removeItem("usuarioCorrente");
    window.location = LOGIN_URL;
}

// Redireciona após login bem-sucedido, respeitando a página de origem e o papel
function redirectAfterLogin() {
    const returnURL = sessionStorage.getItem("returnURL");
    sessionStorage.removeItem("returnURL");
    window.location.href = returnURL || homeForUser(usuarioCorrente);
}

// Cadastra um novo usuário. Funcionário precisa de invite_key válido (define company_id) e cargo.
// Cliente informa apenas dados básicos. Retorna { ok, error }.
async function registerUser({ nome, login, email, senha, isWorker, role, inviteKey }) {
    let company_id = null;

    if (isWorker) {
        let companies;
        try {
            companies = await fetch(COMPANIES_URL).then((r) => r.json());
        } catch (e) {
            return { ok: false, error: "Não foi possível validar a chave de convite." };
        }
        const company = companies.find((c) => c.invite_key && c.invite_key === inviteKey);
        if (!company) {
            return { ok: false, error: "Chave de convite inválida. Confira com a farmácia." };
        }
        company_id = company.id;
    }

    const novoUsuario = {
        login,
        senha,
        nome,
        email,
        is_worker: !!isWorker,
        role: isWorker ? role : null,
        company_id,
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(novoUsuario),
        });
        if (!response.ok) throw new Error(`status ${response.status}`);
        return { ok: true };
    } catch (e) {
        console.error("Erro ao inserir usuário:", e);
        return { ok: false, error: "Erro ao criar a conta. Tente novamente." };
    }
}

function showUserInfo(element) {
    var elemUser = document.getElementById(element);
    if (elemUser && usuarioCorrente && usuarioCorrente.nome) {
        elemUser.textContent = `${usuarioCorrente.nome} (${usuarioCorrente.login})`;
    }
}

// Inicializa o LoginApp
initLoginApp();
