/**
 * Drag-and-drop для зон с data-admin-file-dropzone (шаблоны unfold/widgets/clearable_file_input*.html).
 * Подсветка через outline — без ring-offset, чтобы не было сдвига вёрстки.
 */
(function () {
  "use strict";

  function placeholderInput(fileInput) {
    const wrap = fileInput.closest("[data-admin-file-dropzone]");
    if (!wrap) return null;
    return wrap.querySelector('input[type="text"][disabled]');
  }

  function setPlaceholderName(fileInput, name) {
    const ph = placeholderInput(fileInput);
    if (ph) ph.setAttribute("value", name || "");
  }

  function acceptFile(file, input) {
    const acc = (input.getAttribute("accept") || "").trim();
    if (!acc) return true;
    if (acc === "image/*") return file.type.startsWith("image/");
    return true;
  }

  function bindDropzone(wrap) {
    if (wrap.dataset.adminDropzoneBound === "1") return;
    const input = wrap.querySelector('input[type="file"]');
    if (!input) return;
    wrap.dataset.adminDropzoneBound = "1";

    function highlight() {
      wrap.classList.add("border-primary-500", "bg-primary-50/50", "dark:border-primary-500", "dark:bg-primary-950/30");
    }

    function unhighlight() {
      wrap.classList.remove("border-primary-500", "bg-primary-50/50", "dark:border-primary-500", "dark:bg-primary-950/30");
    }

    wrap.addEventListener("dragenter", function (e) {
      e.preventDefault();
      e.stopPropagation();
      highlight();
    });

    wrap.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      highlight();
    });

    wrap.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const next = e.relatedTarget;
      if (next && wrap.contains(next)) return;
      unhighlight();
    });

    wrap.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      unhighlight();
      const files = e.dataTransfer.files;
      if (!files || !files.length) return;
      const f = files[0];
      if (!acceptFile(f, input)) return;
      try {
        const dt = new DataTransfer();
        dt.items.add(f);
        input.files = dt.files;
      } catch (err) {
        return;
      }
      setPlaceholderName(input, f.name);
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function scan() {
    document.querySelectorAll("[data-admin-file-dropzone]").forEach(bindDropzone);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }

  new MutationObserver(scan).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
