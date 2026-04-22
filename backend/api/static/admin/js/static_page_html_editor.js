;(function () {
  function initEditor(textarea) {
    if (!textarea || textarea.dataset.tinyBound === '1') return
    if (typeof window.tinymce === 'undefined') return
    textarea.dataset.tinyBound = '1'
    window.tinymce.init({
      target: textarea,
      menubar: 'edit insert format table',
      branding: false,
      promotion: false,
      plugins: 'lists link table code fullscreen',
      toolbar:
        'undo redo | blocks | bold italic underline | bullist numlist | alignleft aligncenter alignright | table link | code fullscreen',
      height: 520,
      convert_urls: false,
      relative_urls: false,
      remove_script_host: false,
    })
  }

  function initAll() {
    var nodes = document.querySelectorAll('textarea.js-static-page-html-editor')
    for (var i = 0; i < nodes.length; i += 1) {
      initEditor(nodes[i])
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll)
  } else {
    initAll()
  }
})()
