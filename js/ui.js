function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._toastTimer);
  el._toastTimer = setTimeout(() => {
    el.classList.remove('show');
  }, 2000);
}

window.toast = toast;
window.showToast = toast;

function handleMainTabFab(tab) {
  if (tab === 'agenda') {
    openQuickAdd();
    return;
  }
  if (tab === 'tasks') {
    toggleTaskCreateForm(true);
    return;
  }
  if (tab === 'operations' || tab === 'batches') {
    toast('Not available yet');
    return;
  }
}

function closeTaskActionMenus() {
  document.querySelectorAll('.task-card-menu').forEach((menu) => { menu.style.display = 'none'; });
  document.querySelectorAll('.task-card.task-card-menu-open').forEach((card) => {
    card.classList.remove('task-card-menu-open');
  });
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('.task-card-actions')) closeTaskActionMenus();
});

function toggleTaskActionMenu(event, taskId) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const menu = document.getElementById(`task-menu-${taskId}`);
  if (!menu) return;
  const card = menu.closest('.task-card');
  const willOpen = menu.style.display === 'none';
  closeTaskActionMenus();
  menu.style.display = willOpen ? 'block' : 'none';
  if (card && willOpen) card.classList.add('task-card-menu-open');
}
