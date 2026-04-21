/**
 * Единый UX для полей "URL изображения" в админке:
 * live-предпросмотр и аккуратный fallback при невалидной ссылке.
 */
(function () {
  "use strict";

  function bindWidget(root) {
    if (!root || root.dataset.adminImageUrlBound === "1") return;
    root.dataset.adminImageUrlBound = "1";
    const input = root.querySelector('input[data-admin-image-url-input="1"]');
    const preview = root.querySelector("[data-admin-image-url-preview]");
    const empty = root.querySelector("[data-admin-image-url-empty]");
    if (!input || !preview || !empty) return;

    function update() {
      const val = (input.value || "").trim();
      if (!val) {
        preview.classList.add("hidden");
        empty.classList.remove("hidden");
        preview.removeAttribute("src");
        return;
      }
      preview.setAttribute("src", val);
      preview.classList.remove("hidden");
      empty.classList.add("hidden");
    }

    preview.addEventListener("error", function () {
      preview.classList.add("hidden");
      empty.classList.remove("hidden");
    });
    preview.addEventListener("load", function () {
      preview.classList.remove("hidden");
      empty.classList.add("hidden");
    });
    input.addEventListener("input", update);
    input.addEventListener("change", update);
    update();
  }

  function scan() {
    document.querySelectorAll(".admin-image-url-root").forEach(bindWidget);
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
