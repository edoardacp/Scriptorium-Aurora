/* VARIÁVEIS GERAIS */
const container = document.getElementById("books-container");
const searchInput = document.getElementById("search");
const titleHelp = document.getElementById("title-help")

const btnRefresh = document.getElementById("refresh-btn");
const btnNew = document.getElementById("new-book-btn");

const btnAntes = document.getElementById("antes");
const btnDepois = document.getElementById("depois");

const form = document.getElementById("book-form");
const formID = document.getElementById("book-id");
const formFeedback = document.getElementById("form-feedback");

const inpTitle = document.getElementById("title");
const inpAuthor = document.getElementById("author");
const inpYear = document.getElementById("year");
const inpGenre = document.getElementById("genre");
const inpDesc = document.getElementById("desc");

const saveBtn = document.getElementById("save-btn");

/*  ESTADO GLOBAL */
let books = JSON.parse(localStorage.getItem("livros")) || [];
let paginaAtual = 0;

/* UTILIDADES */
function saveLS() {
  localStorage.setItem("livros", JSON.stringify(books));
}

function showMessage(msg, type = "success") {
  formFeedback.textContent = msg;
  formFeedback.style.color = type === "error" ? "red" : "#48ff8f";
}

function gerarID() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return String(Date.now()) + Math.random().toString(36).slice(2, 9);
}

/* VALIDAÇÃO */
const titulo = inpTitle;
const mensagemErro = formFeedback; 
function mostrarErro(campo, mensagem) {
  const grupo = campo.closest(".form-group");
  if (!grupo) return;
  const erro = grupo.querySelector(".error-msg");
  if (erro) erro.textContent = mensagem;
  grupo.classList.add("invalid");
  mensagemErro.innerHTML = "";
}

function esconderErro(campo) {
  const grupo = campo.closest(".form-group");
  if (!grupo) return;
  grupo.classList.remove("invalid");
}

function validarTitulo() {
  return titulo.value.trim().length >= 3;
}

function validarAutor() {
  return inpAuthor.value.trim().length > 0;
}

function validarAno() {
  const v = inpYear.value.trim();
  if (v === "") return true; 
  const n = Number(v);
  return !Number.isNaN(n) && n >= 1000 && n <= 2026;
}

function validarForm() {
  const okTitulo = validarTitulo();
  const okAutor = validarAutor();
  const okAno = validarAno();

  if (!okTitulo) mostrarErro(titulo, "Mínimo 3 caracteres."), titleHelp.innerHTML = "";
  else esconderErro(titulo);

  if (!okAutor) mostrarErro(inpAuthor, "Informe o autor.");
  else esconderErro(inpAuthor);

  if (!okAno) mostrarErro(inpYear, "Informe um ano válido (1000–2026).");
  else esconderErro(inpYear);

  return okTitulo && okAutor && okAno;
}

function atualizarBotao() {
  if (!saveBtn) return;
  saveBtn.disabled = !validarTitulo() || !validarAutor() || !validarAno();
}

titulo.addEventListener("blur", () => {
  if (!validarTitulo()) mostrarErro(titulo, "Mínimo 3 caracteres.");
});
titulo.addEventListener("input", () => {
  if (validarTitulo()) esconderErro(titulo);
  atualizarBotao();
});

inpAuthor.addEventListener("blur", () => {
  if (!validarAutor()) mostrarErro(inpAuthor, "Por favor informe o autor.");
});
inpAuthor.addEventListener("input", () => {
  if (validarAutor()) esconderErro(inpAuthor);
  atualizarBotao();
});

inpYear.addEventListener("blur", () => {
  if (!validarAno()) mostrarErro(inpYear, "Informe um ano válido (1000–2026).");
});
inpYear.addEventListener("input", () => {
  if (validarAno()) esconderErro(inpYear);
  atualizarBotao();
});

atualizarBotao();

/* GET — CARREGAR API */
async function carregarLivrosAPI() {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts");
    const data = await res.json();

    books = data.slice(0, 12).map(p => ({
      id: gerarID(),
      title: p.title,
      author: "Desconhecido",
      year: "",
      genre: "Outro",
      description: p.body
    }));

    paginaAtual = 0;
    saveLS();
    renderPage();
  } catch (e) {
    console.log("Erro no GET:", e);
    showMessage("Erro ao carregar livros", "error");
  }
}

/* RENDERIZAÇÃO */
function renderPage() {
  container.querySelectorAll(".book").forEach(el => el.style.display = "none");

  const start = paginaAtual * 3;
  const pageBooks = books.slice(start, start + 3);

  const listagemEl = document.getElementById("Listagem");
  if (!pageBooks || pageBooks.length === 0) {
    if (listagemEl) listagemEl.textContent = "Nenhum livro nesta página.";
    return;
  } else {
    if (listagemEl) listagemEl.style.display = "none";
  }

  const slots = Array.from(container.querySelectorAll(".book"));

  pageBooks.forEach((b, i) => {
    const slot = slots[i];
    if (!slot) return;
    slot.dataset.id = b.id;
    const titleEl = slot.querySelector(".book-title");
    const descEl = slot.querySelector(".book-description");
    if (titleEl) titleEl.textContent = b.title;
    if (descEl) descEl.textContent = b.description || "";
    slot.style.display = "flex";
  });
}

/* CRUD — CREATE */
async function createBook(book) {
  const tempID = book.id;

  books.unshift(book);
  saveLS();
  renderPage();

  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      body: JSON.stringify(book),
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) throw new Error();
    showMessage("Livro criado!");
  } catch (e) {
    books = books.filter(b => b.id !== tempID);
    saveLS();
    renderPage();
    showMessage("Erro ao criar livro!", "error");
  }
}

/* CRUD — UPDATE */
async function updateBook(book) {
  const idx = books.findIndex(b => b.id === book.id);
  if (idx === -1) return;

  const snapshot = [...books];

  books[idx] = book;
  saveLS();
  renderPage();

  try {
    const fakeID = 1;
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${fakeID}`, {
      method: "PUT",
      body: JSON.stringify(book),
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) throw new Error();
    showMessage("Livro atualizado!");
  } catch {
    books = snapshot;
    saveLS();
    renderPage();
    showMessage("Erro ao editar livro!", "error");
  }
}

/* CRUD — DELETE */
async function deleteBook(id) {
  const snapshot = [...books];

  books = books.filter(b => b.id !== id);
  saveLS();
  renderPage();

  try {
    const res = await fetch(`https://jsonplaceholder.typicode.com/posts/1`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error();

    showMessage("Livro removido!");
  } catch {
    books = snapshot;
    saveLS();
    renderPage();
    showMessage("Erro ao excluir!", "error");
  }
}

/* FORMULÁRIO */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validarForm()) {
    showMessage("Corrija os erros do formulário.", "error");
    return;
  }

  const book = {
    id: formID.value || gerarID(),
    title: inpTitle.value.trim(),
    author: inpAuthor.value.trim(),
    year: inpYear.value || 2025,
    genre: inpGenre.value || "Outro",
    description: inpDesc.value.trim()
  };

  if (formID.value) {
    updateBook(book);
  } else {
    createBook(book);
  }

  form.reset();
  formID.value = "";
  atualizarBotao();
});

/* LISTENERS NO CONTAINER (editar/excluir) */
container.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const article = e.target.closest(".book");
  if (!article) return;
  const id = article.dataset.id;

  if (btn.dataset.action === "delete") {
    deleteBook(id);
  }

  if (btn.dataset.action === "edit") {
    const livro = books.find(b => b.id === id);
    if (!livro) return;

    formID.value = livro.id;
    inpTitle.value = livro.title;
    inpAuthor.value = livro.author;
    inpYear.value = livro.year;
    inpGenre.value = livro.genre;
    inpDesc.value = livro.description;

    showMessage("Editando...");
    atualizarBotao();
  }
});

/* PAGINAÇÃO */
btnDepois.addEventListener("click", () => {
  if ((paginaAtual + 1) * 3 < books.length) {
    paginaAtual++;
    renderPage();
  }
});

btnAntes.addEventListener("click", () => {
  if (paginaAtual > 0) {
    paginaAtual--;
    renderPage();
  }
});

/* BUSCA POR TÍTULO */
searchInput.addEventListener("input", () => {
  const termo = searchInput.value.toLowerCase().trim();

  if (!termo) {
    renderPage();
    return;
  }

  const filtrados = books.filter(b => b.title.toLowerCase().includes(termo));

  container.querySelectorAll(".book").forEach(el => el.style.display = "none");
  filtrados.slice(0, 3).forEach((b, i) => {
    const slot = container.querySelectorAll(".book")[i];
    if (!slot) return;
    slot.style.display = "flex";
    slot.dataset.id = b.id;
    slot.querySelector(".book-title").textContent = b.title;
    slot.querySelector(".book-description").textContent = b.description;
  });
});

/* BOTÕES AUXILIARES */
btnRefresh.addEventListener("click", carregarLivrosAPI);

btnNew.addEventListener("click", () => {
  form.reset();
  formID.value = "";
  showMessage("Novo livro...");
  atualizarBotao();
});

/* BOTÕES CANCELAR E LIMPAR */

document.getElementById("clear-btn").addEventListener("click", () => {
  form.reset();

  form.querySelectorAll(".form-group").forEach(g => g.classList.remove("invalid"));

  titleHelp.innerHTML = "Mínimo 3 caracteres.";

  showMessage("Campos limpos.");
  atualizarBotao();
});

document.getElementById("cancel-btn").addEventListener("click", () => {
  form.reset();
  formID.value = "";

  form.querySelectorAll(".form-group").forEach(g => g.classList.remove("invalid"));

  titleHelp.innerHTML = "Mínimo 3 caracteres.";

  showMessage("Edição cancelada.");
  atualizarBotao();
});

/* INICIALIZAÇÃO */
if (!books || books.length === 0) {
  carregarLivrosAPI();
} else {
  renderPage();
  atualizarBotao();
}
