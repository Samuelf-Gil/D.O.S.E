import { toast } from "../utils/index.js";

lucide.createIcons();

const RATINGS_PER_PAGE = 4

const CURRENT_USER_ID = "2"

const ratingsPagination = {
    companyId: "1",
    usuariosById: {},
    ratingsById: {},
    page: 1,
    totalPages: 1,
    totalRatings: 0,
    ratingCount: 0,
    ratingSum: 0,
    editingRatingId: null,
    editingOldRating: 0,
}

const round2 = (value) => Math.round(value * 100) / 100

async function getCompanyData(companyId = "1") {
    try {
        const url = `/companies/${companyId}`
        const data = await fetch(url)
        return await data.json()
    } catch (error) {
        toast({ title: "Ocorreu um erro", description: "Ocorreu um erro ao carregar as avaliações, tente novamente mais tarde", category: "error" })
    }
}

async function getRatingsPage(companyId, page) {
    try {
        const url = `/ratings?company_id=${companyId}&_page=${page}&_limit=${RATINGS_PER_PAGE}`
        const response = await fetch(url)
        const ratings = await response.json()
        const total = Number(response.headers.get("X-Total-Count")) || ratings.length
        return { ratings, total }
    } catch (error) {
        toast({ title: "Ocorreu um erro", description: "Ocorreu um erro ao carregar as avaliações, tente novamente mais tarde", category: "error" })
        return { ratings: [], total: 0 }
    }
}

async function getUsersData() {
    try {
        const url = `/usuarios`
        const data = await fetch(url)
        return await data.json()
    } catch (error) {
        toast({ title: "Ocorreu um erro", description: "Ocorreu um erro ao carregar os usuários, tente novamente mais tarde", category: "error" })
    }
}

async function buildCompanyData(companyId = "1") {
    try {
        const companyTitle = document.getElementById("companyTitle")
        const [companyData, usuarios] = await Promise.all([
            getCompanyData(companyId),
            getUsersData(),
        ])

        companyTitle.textContent = companyData.name
        markStarAsRating(companyData.rating, "starsFilled")

        ratingsPagination.companyId = companyId
        ratingsPagination.usuariosById = Object.fromEntries(usuarios.map((usuario) => [usuario.id, usuario]))
        ratingsPagination.page = 1
        await renderRatingsPage()

        ratingsPagination.ratingCount = ratingsPagination.totalRatings
        ratingsPagination.ratingSum = companyData.rating * ratingsPagination.totalRatings
    } catch (error) {
        toast({ title: "Ocorreu um erro", description: "Ocorreu um erro ao carregar as avaliações, tente novamente mais tarde", category: "error" })
    }
}

function markStarAsRating(rating, elementId) {
    const percent = (rating / 5) * 100
    document.getElementById(elementId).style.width = `${percent}%`
}

function buildStarsMarkup(filledId) {
    const star = '<i data-lucide="star" class="fill-current shrink-0 w-4 h-4"></i>'
    const stars = star.repeat(5)
    return `
        <article class="relative inline-flex w-fit">
            <article class="flex text-gray-300">${stars}</article>
            <article id="${filledId}" class="flex text-amber-300 absolute top-0 left-0 overflow-hidden">${stars}</article>
        </article>
    `
}

function buildRatingCard(rating, autor, starsFilledId) {
    const card = document.createElement("article")
    card.className = "ratingCard flex flex-col gap-2 border rounded-md w-full p-3 shadow-md"

    const isOwner = String(rating.user_id) === CURRENT_USER_ID
    const actions = isOwner ? `
        <article class="ratingCardActions flex items-center gap-2">
            <button type="button" class="editrating w-fit h-fit cursor-pointer" data-id="${rating.id}">
                <i data-lucide="pencil" class="w-4 h-4 text-zinc-500"></i>
            </button>
            <button type="button" class="deleterating w-fit h-fit cursor-pointer" data-id="${rating.id}">
                <i data-lucide="trash-2" class="w-4 h-4 text-zinc-500"></i>
            </button>
        </article>
    ` : ""

    card.innerHTML = `
        <article class="flex justify-between items-start gap-2">
            <article class="ratingCardUserDataCard flex gap-2 items-center">
                <i class="h-7 w-7 text-zinc-600" data-lucide="circle-user"></i>
                <article class="flex flex-col gap-0.5">
                    <h4 class="text-sm text-zinc-500 font-semibold" data-field="name"></h4>
                    ${buildStarsMarkup(starsFilledId)}
                </article>
            </article>
            ${actions}
        </article>
        <article data-field="description"></article>
    `

    card.querySelector('[data-field="name"]').textContent = autor?.nome ?? "Usuário desconhecido"
    card.querySelector('[data-field="description"]').textContent = rating.description

    return card
}

async function renderRatingsPage() {
    const { companyId, usuariosById, page } = ratingsPagination
    const parent = document.getElementById("ratingsCardsParent")

    const { ratings, total } = await getRatingsPage(companyId, page)
    ratingsPagination.totalRatings = total
    ratingsPagination.totalPages = Math.max(1, Math.ceil(total / RATINGS_PER_PAGE))
    ratingsPagination.ratingsById = Object.fromEntries(ratings.map((rating) => [String(rating.id), rating]))

    parent.innerHTML = ""
    ratings.forEach((rating) => {
        const autor = usuariosById[rating.user_id]
        const starsFilledId = `starsFilled-${rating.id}`
        parent.appendChild(buildRatingCard(rating, autor, starsFilledId))
        markStarAsRating(rating.rating, starsFilledId)
    })

    updatePaginationState()
    lucide.createIcons()
}

function setNavButtonDisabled(link, disabled) {
    link.classList.toggle("opacity-50", disabled)
    link.classList.toggle("pointer-events-none", disabled)
    if (disabled) {
        link.setAttribute("aria-disabled", "true")
    } else {
        link.removeAttribute("aria-disabled")
    }
}

function updatePaginationState() {
    const nav = document.getElementById("ratingsPagination")
    const { page, totalPages } = ratingsPagination

    nav.querySelectorAll("a[data-page]").forEach((link) => {
        const isCurrent = Number(link.dataset.page) === page
        link.className = isCurrent ? "btn-icon-outline" : "btn-icon-ghost"
        if (isCurrent) {
            link.setAttribute("aria-current", "page")
        } else {
            link.removeAttribute("aria-current")
        }
    })

    setNavButtonDisabled(nav.querySelector('[data-nav="prev"]'), page <= 1)
    setNavButtonDisabled(nav.querySelector('[data-nav="next"]'), page >= totalPages)
}

function resolveTargetPage(target) {
    if (target.dataset.nav === "prev") return ratingsPagination.page - 1
    if (target.dataset.nav === "next") return ratingsPagination.page + 1
    return Number(target.dataset.page)
}

async function handlePaginationClick(event) {
    const target = event.target.closest("a[data-page], a[data-nav]")
    if (!target) return

    event.preventDefault()

    const page = resolveTargetPage(target)

    if (Number.isNaN(page) || page < 1 || page > ratingsPagination.totalPages || page === ratingsPagination.page) {
        return
    }

    ratingsPagination.page = page
    await renderRatingsPage()
}

function handleRatingPick(e) {
    const button = e.target.closest("button[id^='star-']")
    if (!button) return

    const rating = Number(button.id.split("-")[1])
    markStarAsRating(rating, "newRatingStarsFilled")
    document.getElementById("ratingInput").value = rating
}

function handleRatingInput(e) {
    markStarAsRating(Number(e.target.value), "newRatingStarsFilled")
}

async function applyCompanyRatingChange(countDelta, sumDelta) {
    ratingsPagination.ratingCount += countDelta
    ratingsPagination.ratingSum += sumDelta

    const count = ratingsPagination.ratingCount
    const average = count > 0 ? Math.min(5, round2(ratingsPagination.ratingSum / count)) : 0
    markStarAsRating(average, "starsFilled")

    try {
        const url = `/companies/${ratingsPagination.companyId}`
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating: average })
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
    } catch (error) {
        toast({ title: "Atenção", description: "Não foi possível atualizar a nota geral da empresa", category: "error" })
    }
}

function resetRatingForm() {
    document.getElementById("ratingForm").reset()
    markStarAsRating(0.0, "newRatingStarsFilled")
    ratingsPagination.editingRatingId = null
    ratingsPagination.editingOldRating = 0
    document.getElementById("submitRatingBtn").textContent = "Publicar"
}

function handleEditClick(button) {
    const rating = ratingsPagination.ratingsById[button.dataset.id]
    if (!rating) return

    ratingsPagination.editingRatingId = String(rating.id)
    ratingsPagination.editingOldRating = rating.rating

    document.getElementById("ratingInput").value = rating.rating
    markStarAsRating(rating.rating, "newRatingStarsFilled")
    document.querySelector('[name="ratingDescription"]').value = rating.description ?? ""
    document.getElementById("submitRatingBtn").textContent = "Atualizar"
    document.querySelector('[name="ratingDescription"]').focus()
}

async function handleDeleteClick(button) {
    const id = button.dataset.id
    const rating = ratingsPagination.ratingsById[id]
    if (!rating) return
    if (!confirm("Tem certeza que deseja excluir esta avaliação?")) return

    try {
        const response = await fetch(`/ratings/${id}`, { method: 'DELETE' })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        toast({ title: "Sucesso!", description: "Avaliação excluída com sucesso!", category: "success" })

        if (ratingsPagination.editingRatingId === id) resetRatingForm()

        await applyCompanyRatingChange(-1, -rating.rating)

        const totalPages = Math.max(1, Math.ceil(ratingsPagination.ratingCount / RATINGS_PER_PAGE))
        if (ratingsPagination.page > totalPages) ratingsPagination.page = totalPages
        await renderRatingsPage()
    } catch (error) {
        toast({ title: "Ocorreu um erro", description: "Ocorreu um erro ao excluir sua avaliação, tente novamente mais tarde", category: "error" })
    }
}

function handleCardActionClick(event) {
    const editButton = event.target.closest(".editrating")
    if (editButton) return handleEditClick(editButton)

    const deleteButton = event.target.closest(".deleterating")
    if (deleteButton) return handleDeleteClick(deleteButton)
}

async function submitNewRating(rating, description) {
    const body = {
        user_id: Number(CURRENT_USER_ID),
        company_id: Number(ratingsPagination.companyId),
        rating,
        description,
        created_at: new Date().toISOString(),
        updated_at: null,
    }

    try {
        const response = await fetch(`/ratings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        toast({ title: "Sucesso!", description: "Avaliação publicada com sucesso!", category: "success" })
        resetRatingForm()
        await applyCompanyRatingChange(1, rating)
    } catch (error) {
        toast({ title: "Ocorreu um erro", description: "Ocorreu um erro ao publicar sua avaliação, tente novamente mais tarde", category: "error" })
    }
}

async function submitEditedRating(rating, description) {
    const id = ratingsPagination.editingRatingId
    const oldRating = ratingsPagination.editingOldRating
    const body = {
        rating,
        description,
        updated_at: new Date().toISOString(),
    }

    try {
        const response = await fetch(`/ratings/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        toast({ title: "Sucesso!", description: "Avaliação atualizada com sucesso!", category: "success" })
        resetRatingForm()
        await applyCompanyRatingChange(0, rating - oldRating)
        await renderRatingsPage()
    } catch (error) {
        toast({ title: "Ocorreu um erro", description: "Ocorreu um erro ao atualizar sua avaliação, tente novamente mais tarde", category: "error" })
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target))
    const rating = Number(data.rating)
    const description = (data.ratingDescription ?? "").trim()

    if ((data.rating ?? "").trim() === "" || description === "") {
        toast({ title: "Campos obrigatórios", description: "Informe a nota e a descrição antes de enviar.", category: "error" })
        return
    }

    if (ratingsPagination.editingRatingId) {
        await submitEditedRating(rating, description)
    } else {
        await submitNewRating(rating, description)
    }
}

function syncFooterSpacing() {
    const footer = document.getElementById("ratingFooter")
    document.querySelector("main").style.paddingBottom = `${footer.offsetHeight}px`
}

document.getElementById("ratingsPagination").addEventListener("click", handlePaginationClick)
document.getElementById("ratingsCardsParent").addEventListener("click", handleCardActionClick)
document.getElementById("newRatingStars").addEventListener("click", handleRatingPick)
document.getElementById("ratingInput").addEventListener("blur", handleRatingInput)
document.getElementById("ratingForm").addEventListener("submit", handleFormSubmit)

// mantém o espaço reservado no fim do conteúdo igual à altura do rodapé fixo,
// pra dar scroll por trás dele quando não couber na tela
new ResizeObserver(syncFooterSpacing).observe(document.getElementById("ratingFooter"))

buildCompanyData()
markStarAsRating(0.0, "newRatingStarsFilled")