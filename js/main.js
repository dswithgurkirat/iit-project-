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
});
