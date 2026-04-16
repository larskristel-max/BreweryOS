function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function handleMainTabFab(tab) {
  if (tab === 'agenda') {
    openQuickAdd();
    return;
  }
  if (tab === 'tasks') {
    toggleTaskCreateForm(true);
    return;
  }
  if (tab === 'operations' || tab === 'batches' || tab === 'financial' || tab === 'finances') {
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
