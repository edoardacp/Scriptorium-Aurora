//Seletores principais e variáveis
document.addEventListener("DOMContentLoaded", () => {
  const booksContainer = document.getElementById("books-container");
  const form = document.getElementById("book-form");
  const refreshBtn = document.getElementById("refresh-btn");
  const newBookBtn = document.getElementById("new-book-btn");
  const feedback = document.getElementById("form-feedback");
  const searchInput = document.getElementById("search");

  // Inputs do formulário
  const inputId = document.getElementById("book-id");
  const inputTitle = document.getElementById("title");
  const inputAuthor = document.getElementById("author");
  const inputYear = document.getElementById("year");
  const inputGenre = document.getElementById("genre");
  const inputDesc = document.getElementById("desc");
  const cancelBtn = document.getElementById("cancel-btn");
  const clearBtn = document.getElementById("clear-btn");

  if (!booksContainer || !form) {
    return;
  }

  // Estado local
  let books = [];
  let editingId = null;

  // Salvar Storage
  function saveToLocalStorage() {
    localStorage.setItem("livros", JSON.stringify(books));
  }

  // Helpers UI
  function showMessage(msg, type = "success", duration = 3000) {
    if (!feedback) return;
    feedback.innerHTML = `<div class="${type === "error" ? "error-msg" : "hint"}">${msg}</div>`;
    setTimeout(() => (feedback.innerHTML = ""), duration);
  }

  function setGroupInvalid(groupId, isInvalid) {
    const el = document.getElementById(groupId);
    if (!el) return;
    el.classList.toggle("invalid", isInvalid);
  }

  function validateForm() {
    let valid = true;

    if (!inputTitle.value || inputTitle.value.trim().length < 3) {
      setGroupInvalid("group-title", true);
      valid = false;
    } else setGroupInvalid("group-title", false);

    if (!inputAuthor.value || inputAuthor.value.trim() === "") {
      setGroupInvalid("group-author", true);
      valid = false;
    } else setGroupInvalid("group-author", false);

    if (inputYear.value) {
      const y = Number(inputYear.value);
      if (Number.isNaN(y) || y < 1000 || y > 2100) {
        setGroupInvalid("group-year", true);
        valid = false;
      } else setGroupInvalid("group-year", false);
    } else setGroupInvalid("group-year", false);

    return valid;
  }

  // Renderização
  function renderBooks(list = books) {
    if (!booksContainer) return;
    if (!list || list.length === 0) {
      booksContainer.innerHTML = `<div class="center muted">Nenhum livro encontrado.</div>`;
      return;
    }

    booksContainer.innerHTML = list
      .map(
        (b) => `
      <article class="book" data-id="${b.id}">
        <div class="cover"></div>
        <div class="book-details">
          <div class="book-title">${escapeHtml(b.title)}</div>
          <div class="book-meta">${escapeHtml(b.author || "—")} • ${b.year || "—"} • ${b.genre || "—"}</div>
          <div class="book-desc">${escapeHtml(b.description || "Sem descrição.")}</div>
        </div>
        <div class="book-actions">
          <button class="btn small" data-action="edit">Editar</button>
          <button class="btn small" data-action="delete">Excluir</button>
        </div>
      </article>`
      )
      .join("");
  }

  function escapeHtml(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  // Fetch + LocalStorage
  async function loadBooks() {
    try {
      // ===== carregar salvos primeiro =====
      const salvos = JSON.parse(localStorage.getItem("livros"));
      if (salvos && salvos.length > 0) {
        books = salvos;
        renderBooks();
        return;
      }

      const res = await fetch("https://jsonplaceholder.typicode.com/posts");
      if (!res.ok) throw new Error("Erro ao buscar posts");
      const data = await res.json();

      books = data.slice(0, 12).map((p) => ({
        id: p.id,
        title: p.title,
        author: "Autor desconhecido",
        year: "",
        genre: "",
        description: ""
      }));

      saveToLocalStorage();
      renderBooks();

    } catch (err) {
      console.error("loadBooks:", err);
      showMessage("Falha ao carregar livros. Tente novamente.", "error");
    }
  }

  async function createBook(book) {
    const tempId = Date.now();
    const optimistic = { ...book, id: tempId };
    books.unshift(optimistic);
    saveToLocalStorage();
    renderBooks();

    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        body: JSON.stringify(book),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error("POST falhou");

      const server = await res.json();

      if (server && server.id) {
        books = books.map((b) => (b.id === tempId ? { ...b, id: server.id } : b));
      }

      saveToLocalStorage();
      renderBooks();
      showMessage("Livro adicionado!");

    } catch (err) {
      console.error("createBook:", err);

      books = books.filter((b) => b.id !== tempId);
      saveToLocalStorage();
      renderBooks();
      showMessage("Erro ao adicionar livro.", "error");
    }
  }

  async function updateBook(id, updated) {
    const snapshot = books.slice();
    books = books.map((b) => (b.id === id ? { ...b, ...updated } : b));
    saveToLocalStorage();
    renderBooks();

    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) throw new Error("PUT falhou");

      showMessage("Livro atualizado!");

    } catch (err) {
      console.error("updateBook:", err);

      books = snapshot;
      saveToLocalStorage();
      renderBooks();
      showMessage("Erro ao atualizar livro.", "error");
    }
  }

  async function deleteBook(id) {
    const snapshot = books.slice();
    books = books.filter((b) => b.id !== id);
    saveToLocalStorage();
    renderBooks();

    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("DELETE falhou");

      showMessage("Livro removido!");

    } catch (err) {
      console.error("deleteBook:", err);

      books = snapshot;
      saveToLocalStorage();
      renderBooks();
      showMessage("Erro ao excluir livro.", "error");
    }
  }

  // Eventos UI
  booksContainer.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    if (!action) return;

    const article = btn.closest(".book");
    if (!article) return;
    const id = Number(article.dataset.id);

    const book = books.find((b) => b.id === id);
    if (!book) return;

    if (action === "edit") {
      editingId = id;
      inputId.value = id;
      inputTitle.value = book.title || "";
      inputAuthor.value = book.author || "";
      inputYear.value = book.year || "";
      inputGenre.value = book.genre || "";
      inputDesc.value = book.description || "";
      showMessage("Modo edição ativado.");

    } else if (action === "delete") {
      if (confirm("Confirma exclusão deste livro?")) {
        deleteBook(id);
      }
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showMessage("Corrija os erros do formulário.", "error");
      return;
    }

    const payload = {
      title: inputTitle.value.trim(),
      author: inputAuthor.value.trim(),
      year: inputYear.value ? inputYear.value : "",
      genre: inputGenre.value || "",
      description: inputDesc.value || ""
    };

    if (editingId) {
      updateBook(editingId, payload);
      editingId = null;
    } else {
      createBook(payload);
    }

    form.reset();
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      form.reset();
      editingId = null;
      showMessage("Edição cancelada.");
    });
  }

  if (clearBtn) clearBtn.addEventListener("click", () => form.reset());
  if (refreshBtn) refreshBtn.addEventListener("click", loadBooks);

  if (newBookBtn) {
    newBookBtn.addEventListener("click", () => {
      form.reset();
      editingId = null;
      showMessage("Preencha o formulário para novo livro.");
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        renderBooks(books);
        return;
      }
      const filtered = books.filter((b) =>
        (b.title || "").toLowerCase().includes(q)
      );
      renderBooks(filtered);
    });
  }

  loadBooks();
});

// PREENCHER CATÁLOGO
if (window.location.pathname.includes("catalog.html")) {

  const grid = document.getElementById("catalog-grid");
  const livros = JSON.parse(localStorage.getItem("livros")) || [];

  grid.innerHTML = "";

  if (livros.length === 0) {
    grid.innerHTML = "<p>Nenhum livro cadastrado ainda.</p>";
  } else {
    livros.forEach(livro => {
      const card = document.createElement("article");
      card.classList.add("card");
      card.style.padding = "12px";

      card.innerHTML = `
        <div style="display:flex; gap:12px; align-items:flex-start;">
          <div class="cover" style="width:72px;height:100px;border-radius:8px;"></div>
          <div style="flex:1;">
            <div class="book-title">${livro.title}</div>
            <div class="book-meta">${livro.author || "Autor desconhecido"} • ${livro.year || "—"} • ${livro.genre || "—"}</div>
            <p class="book-desc">${livro.description || "Sem descrição."}</p>
          </div>
        </div>`;
      grid.appendChild(card);
    });
  }
}
