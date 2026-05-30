/* ══════════════════════════════════════
   ENTRY POINT / BOOTSTRAP
══════════════════════════════════════ */
window.addEventListener('DOMContentLoaded',()=>{
  // Initialize workflow checklist listener when section is clicked
  const workflowView = document.getElementById('view-workflow');
  if (workflowView) {
    workflowView.addEventListener('click', renderWorkflowChecklist, {once:true});
  }
  
  // Clean up overlays and other elements on load
  console.log("DSR Portal initialized successfully.");
  if (window.initLucide) initLucide();

  // Global listener to default empty cells to 'NUL' on blur/focusout
  document.body.addEventListener('focusout', function(e) {
    if (e.target.tagName === 'TD' && (e.target.contentEditable === 'true' || e.target.hasAttribute('contenteditable'))) {
      const text = e.target.innerText.trim();
      if (text === '') {
        e.target.innerText = 'NUL';
        // Dispatch input event to trigger any calculation bindings attached
        const inputEvent = new Event('input', { bubbles: true });
        e.target.dispatchEvent(inputEvent);
      }
    }
  });
});
