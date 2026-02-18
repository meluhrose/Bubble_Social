// Shared utility functions for the application

/**
 * Shows a styled alert message that auto-dismisses after 4 seconds
 * @param {string} message - The message to display
 * @param {string} type - The alert type: 'success', 'error', 'warning', or 'info'
 */
export function showAlert(message, type = "info") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `custom-alert ${type}`;
  alertDiv.textContent = message;
  
  const app = document.getElementById("app");
  app.insertBefore(alertDiv, app.firstChild);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    alertDiv.style.transition = "opacity 0.3s ease-out";
    alertDiv.style.opacity = "0";
    setTimeout(() => alertDiv.remove(), 300);
  }, 4000);
}

/**
 * Shows a styled confirm dialog and returns a Promise
 * @param {string} message - The confirmation message to display
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-confirm-overlay";
    
    const dialog = document.createElement("div");
    dialog.className = "custom-confirm-dialog";
    
    dialog.innerHTML = `
      <p>${message}</p>
      <div class="custom-confirm-buttons">
        <button class="confirm-yes">Yes</button>
        <button class="confirm-no">No</button>
      </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    const yesBtn = dialog.querySelector(".confirm-yes");
    const noBtn = dialog.querySelector(".confirm-no");
    
    yesBtn.addEventListener("click", () => {
      overlay.remove();
      resolve(true);
    });
    
    noBtn.addEventListener("click", () => {
      overlay.remove();
      resolve(false);
    });
    
    // Allow clicking overlay to cancel
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    });
  });
}
