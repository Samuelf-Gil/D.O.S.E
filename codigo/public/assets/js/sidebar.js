/**
 * Sidebar de navegação compartilhada da D.O.S.E.
 * Uso: <script src="/assets/js/sidebar.js" data-role="funcionario|cliente"></script>
 * - funcionario: navegação interna (padrão)
 * - cliente: navegação externa (consulta de produtos e farmácias)
 * Não deve ser incluída nas páginas de login.
 */
(function () {
    const role = (document.currentScript && document.currentScript.dataset.role) || "funcionario";

    const ICONS = {
        package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
        list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
        plus: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
        trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
        star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
        pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
        pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
        logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
        menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    };

    const MENUS = {
        funcionario: {
            subtitle: "Painel do Funcionário",
            items: [
                { label: "Pedidos", href: "/modulos/Samuel/Pedido.html", icon: "package" },
                { label: "Consulta de Produtos", href: "/modulos/Maria Eduarda Madeira/consulta.html", icon: "list" },
                { label: "Cadastro de Produtos", href: "/modulos/Beatriz/cadastro/index.html", icon: "plus" },
                { label: "Descartes", href: "/modulos/Isadora/index.html", icon: "trash" },
                { label: "Reclamações", href: "/modulos/Isadora/SPRINT2Isa/reclamacoesview.html", icon: "alert" },
                { label: "Relatórios", href: "/modulos/Igor/relatorios/relatorios.html", icon: "chart" },
            ],
        },
        cliente: {
            subtitle: "Área do Cliente",
            items: [
                { label: "Farmácias", href: "/modulos/Beatriz/farmacias/index.html", icon: "pin" },
                { label: "Avaliações", href: "/modulos/Igor/avaliacoes/avaliacoes.html", icon: "star" },
            ],
        },
    };

    const menu = MENUS[role] || MENUS.funcionario;

    function svg(name) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
    }

    function injectStyles() {
        if (document.getElementById("dose-sidebar-styles")) return;
        const style = document.createElement("style");
        style.id = "dose-sidebar-styles";
        style.textContent = `
            #dose-sidebar { position: fixed; top: 0; left: 0; height: 100vh; width: 256px; z-index: 50;
                background: #364E72; color: #fff; display: flex; flex-direction: column;
                box-shadow: 2px 0 12px rgba(0,0,0,.12); transition: transform .25s ease;
                font-family: ui-sans-serif, system-ui, sans-serif; }
            #dose-sidebar .ds-brand { padding: 20px 18px; border-bottom: 1px solid rgba(122,177,201,.35); }
            #dose-sidebar .ds-brand h2 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: .18em; }
            #dose-sidebar .ds-brand p { margin: 2px 0 0; font-size: 11px; text-transform: uppercase;
                letter-spacing: .12em; color: rgba(255,255,255,.65); }
            #dose-sidebar nav { flex: 1; overflow-y: auto; padding: 12px 10px; }
            #dose-sidebar ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
            #dose-sidebar a { display: flex; align-items: center; gap: 12px; padding: 10px 12px;
                border-radius: 12px; color: rgba(255,255,255,.85); text-decoration: none;
                font-size: 14px; font-weight: 500; transition: background .15s, color .15s; }
            #dose-sidebar a:hover { background: rgba(255,255,255,.10); color: #fff; }
            #dose-sidebar a.active { background: #74C2C9; color: #fff; font-weight: 600; }
            #dose-sidebar a svg { flex-shrink: 0; }
            #dose-sidebar .ds-foot { padding: 10px; border-top: 1px solid rgba(122,177,201,.35); }
            #dose-sidebar-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 40; display: none; }
            #dose-sidebar-toggle { position: fixed; top: 12px; left: 12px; z-index: 50;
                width: 42px; height: 42px; border-radius: 12px; border: none; cursor: pointer;
                background: #364E72; color: #fff; display: none; align-items: center; justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,.18); }
            @media (min-width: 768px) {
                body { padding-left: 256px !important; }
            }
            @media (max-width: 767px) {
                #dose-sidebar { transform: translateX(-100%); }
                #dose-sidebar.open { transform: translateX(0); }
                #dose-sidebar.open ~ #dose-sidebar-backdrop { display: block; }
                #dose-sidebar-toggle { display: flex; }
            }
        `;
        document.head.appendChild(style);
    }

    function build() {
        injectStyles();

        const current = decodeURIComponent(location.pathname);
        const itemsHtml = menu.items.map((it) => {
            const active = current === it.href ? " active" : "";
            return `<li><a class="ds-link${active}" href="${encodeURI(it.href)}">${svg(it.icon)}<span>${it.label}</span></a></li>`;
        }).join("");

        const aside = document.createElement("aside");
        aside.id = "dose-sidebar";
        aside.setAttribute("data-side", "left");
        aside.innerHTML = `
            <div class="ds-brand">
                <h2>D.O.S.E</h2>
                <p>${menu.subtitle}</p>
            </div>
            <nav aria-label="Navegação principal">
                <ul>${itemsHtml}</ul>
            </nav>
            <div class="ds-foot">
                <ul><li><a id="ds-logout" href="/modulos/login/login.html">${svg("logout")}<span>Sair</span></a></li></ul>
            </div>`;

        const backdrop = document.createElement("div");
        backdrop.id = "dose-sidebar-backdrop";

        const toggle = document.createElement("button");
        toggle.id = "dose-sidebar-toggle";
        toggle.setAttribute("aria-label", "Abrir menu");
        toggle.innerHTML = svg("menu");

        document.body.insertBefore(aside, document.body.firstChild);
        document.body.insertBefore(backdrop, aside.nextSibling);
        document.body.appendChild(toggle);

        const close = () => aside.classList.remove("open");
        toggle.addEventListener("click", () => aside.classList.toggle("open"));
        backdrop.addEventListener("click", close);

        const logoutLink = aside.querySelector("#ds-logout");
        if (logoutLink) {
            logoutLink.addEventListener("click", (e) => {
                e.preventDefault();
                try { sessionStorage.removeItem("usuarioCorrente"); } catch (_) {}
                window.location.href = "/modulos/login/login.html";
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", build);
    } else {
        build();
    }
})();
