/**
 * Drag-and-drop для зон с data-admin-file-dropzone (шаблоны unfold/widgets/clearable_file_input*.html).
 * Подсветка через outline — без ring-offset, чтобы не было сдвига вёрстки.
 * Предпросмотр выбранного файла до сохранения (blob URL), отзыв при смене файла.
 * В табличном инлайне: перетащите несколько изображений сразу — заполнятся подряд идущие строки с полем файла.
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

  function clearClientPreview(fileInput) {
    const wrap = fileInput.closest("[data-admin-file-dropzone]");
    if (!wrap) return;
    const root = wrap.closest(".admin-file-dropzone-root") || wrap.parentElement;
    if (!root) return;
    root.querySelectorAll("[data-admin-file-client-preview]").forEach(function (el) {
      el.querySelectorAll("video, img").forEach(function (media) {
        const u = media.getAttribute("src");
        if (u && u.indexOf("blob:") === 0) {
          try {
            URL.revokeObjectURL(u);
          } catch (e) {
            /* ignore */
          }
        }
      });
      el.remove();
    });
  }

  function insertClientPreviewBeforeDropzone(fileInput, url, kind) {
    const wrap = fileInput.closest("[data-admin-file-dropzone]");
    if (!wrap || !wrap.parentElement) return;
    const box = document.createElement("div");
    box.setAttribute("data-admin-file-client-preview", "1");
    box.className = "fabric-admin-file-client-preview";
    const cap = document.createElement("p");
    cap.className = "fabric-admin-file-client-preview__caption";
    cap.textContent =
      kind === "image"
        ? "Предпросмотр изображения (после «Сохранить» файл попадёт на сайт)"
        : "Предпросмотр видео (после «Сохранить» файл попадёт на сайт)";
    box.appendChild(cap);
    if (kind === "image") {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.className = "fabric-admin-file-client-preview__media";
      img.loading = "lazy";
      box.appendChild(img);
    } else {
      const video = document.createElement("video");
      video.src = url;
      video.className = "fabric-admin-file-client-preview__media fabric-admin-file-client-preview__media--video";
      video.setAttribute("controls", "controls");
      video.setAttribute("muted", "muted");
      video.setAttribute("playsinline", "playsinline");
      box.appendChild(video);
    }
    wrap.parentElement.insertBefore(box, wrap);
  }

  function updateClientPreview(fileInput) {
    clearClientPreview(fileInput);
    if (!fileInput.files || !fileInput.files.length) return;
    const f = fileInput.files[0];
    if (f.type && f.type.indexOf("image/") === 0) {
      insertClientPreviewBeforeDropzone(fileInput, URL.createObjectURL(f), "image");
      return;
    }
    if (f.type && f.type.indexOf("video/") === 0) {
      insertClientPreviewBeforeDropzone(fileInput, URL.createObjectURL(f), "video");
      return;
    }
    const name = (f.name || "").toLowerCase();
    if (/\.(mp4|webm|ogv|ogg|mov|m4v)$/.test(name)) {
      insertClientPreviewBeforeDropzone(fileInput, URL.createObjectURL(f), "video");
    }
  }

  function tabularFileInputsFromTbody(tbody) {
    const out = [];
    tbody.querySelectorAll("tr").forEach(function (tr) {
      const w = tr.querySelector("[data-admin-file-dropzone]");
      if (!w) return;
      const inp = w.querySelector('input[type="file"]');
      if (inp) out.push(inp);
    });
    return out;
  }

  /**
   * Несколько файлов-картинок в табличном инлайне: заполняем текущую и следующие строки.
   * @returns {boolean} true если обработано больше одного файла
   */
  function tryDispatchMultiFileToTabular(wrap, fileList, primaryInput) {
    if (!fileList || fileList.length < 2) return false;
    const tbody = wrap.closest("tbody");
    if (!tbody) return false;
    const inputs = tabularFileInputsFromTbody(tbody);
    if (inputs.length < 2) return false;
    const idx = inputs.indexOf(primaryInput);
    if (idx < 0) return false;
    const files = Array.prototype.slice.call(fileList, 0);
    const allImages = files.every(function (f) {
      return f.type && f.type.indexOf("image/") === 0;
    });
    if (!allImages) return false;
    let placed = 0;
    for (var j = 0; j < files.length && idx + j < inputs.length; j += 1) {
      var target = inputs[idx + j];
      var dt = new DataTransfer();
      try {
        dt.items.add(files[j]);
        target.files = dt.files;
      } catch (err) {
        break;
      }
      setPlaceholderName(target, files[j].name);
      target.dispatchEvent(new Event("change", { bubbles: true }));
      placed += 1;
    }
    return placed > 1;
  }

  function bindDropzone(wrap) {
    if (wrap.dataset.adminDropzoneBound === "1") return;
    const input = wrap.querySelector('input[type="file"]');
    if (!input) return;
    wrap.dataset.adminDropzoneBound = "1";

    if (!input.dataset.adminClientPreviewBound) {
      input.dataset.adminClientPreviewBound = "1";
      input.addEventListener("change", function () {
        updateClientPreview(input);
      });
    }

    function highlight() {
      wrap.classList.add(
        "border-primary-500",
        "bg-primary-50/50",
        "dark:border-primary-500",
        "dark:bg-primary-950/30"
      );
    }

    function unhighlight() {
      wrap.classList.remove(
        "border-primary-500",
        "bg-primary-50/50",
        "dark:border-primary-500",
        "dark:bg-primary-950/30"
      );
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

      if (tryDispatchMultiFileToTabular(wrap, files, input)) {
        return;
      }

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
