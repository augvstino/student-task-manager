// Task list logic. Waits for auth.js to confirm a session
// (via window.onAuthReady) before loading that user's tasks.

let tasks = [];
let filter = 'all';
let currentUserId = null;

window.onAuthReady = function (session) {
  currentUserId = session.user.id;
  loadTasks();
};

async function loadTasks() {
  const { data, error } = await supabaseClient
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load tasks:', error.message);
    tasks = [];
  } else {
    tasks = data || [];
  }
  render();
}

async function addTask(title, due) {
  const { data, error } = await supabaseClient
    .from('tasks')
    .insert([{ title: title, due: due || null, done: false, user_id: currentUserId }])
    .select();

  if (error) {
    console.error('Failed to add task:', error.message);
    return;
  }
  tasks.push(data[0]);
  render();
}

async function toggleTask(task) {
  const newDone = !task.done;
  task.done = newDone; // optimistic update
  render();
  const { error } = await supabaseClient
    .from('tasks')
    .update({ done: newDone })
    .eq('id', task.id);
  if (error) {
    console.error('Failed to update task:', error.message);
    task.done = !newDone; // revert on failure
    render();
  }
}

async function deleteTask(task) {
  tasks = tasks.filter(function (t) { return t.id !== task.id; }); // optimistic
  render();
  const { error } = await supabaseClient
    .from('tasks')
    .delete()
    .eq('id', task.id);
  if (error) {
    console.error('Failed to delete task:', error.message);
    loadTasks(); // resync on failure
  }
}

function fmtDue(dateStr) {
  if (!dateStr) return { label: '', overdue: false };
  const due = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  let label;
  if (diff === 0) label = 'Due today';
  else if (diff === 1) label = 'Due tomorrow';
  else if (diff > 1) label = 'Due in ' + diff + ' days';
  else label = 'Overdue by ' + Math.abs(diff) + (Math.abs(diff) === 1 ? ' day' : ' days');
  return { label: label, overdue: diff < 0 };
}

function render() {
  const list = document.getElementById('taskList');
  const empty = document.getElementById('emptyState');
  const emptyText = document.getElementById('emptyText');
  list.innerHTML = '';

  const visible = tasks.filter(function (t) {
    if (filter === 'active') return !t.done;
    if (filter === 'done') return t.done;
    return true;
  });

  const openCount = tasks.filter(function (t) { return !t.done; }).length;
  const doneCount = tasks.filter(function (t) { return t.done; }).length;
  const overdueCount = tasks.filter(function (t) {
    return !t.done && t.due && fmtDue(t.due).overdue;
  }).length;
  document.getElementById('statOpen').textContent = openCount;
  document.getElementById('statDone').textContent = doneCount;
  document.getElementById('statOverdue').textContent = overdueCount;

  document.getElementById('countLabel').textContent =
    tasks.length === 0 ? '' : openCount + ' open / ' + tasks.length + ' total';

  if (visible.length === 0) {
    empty.style.display = 'block';
    emptyText.textContent = tasks.length === 0
      ? 'No entries. Run add-task to create one.'
      : (filter === 'done' ? 'No completed tasks yet.' : 'Queue clear.');
    return;
  }
  empty.style.display = 'none';

  visible
    .slice()
    .sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.due || '9999').localeCompare(b.due || '9999');
    })
    .forEach(function (t, i) {
      const li = document.createElement('li');
      if (t.done) li.className = 'done';

      const idx = document.createElement('span');
      idx.className = 'idx';
      idx.textContent = String(i + 1).padStart(2, '0');
      li.appendChild(idx);

      const check = document.createElement('button');
      check.className = 'check';
      check.setAttribute('aria-label', t.done ? 'Mark as not done' : 'Mark as done');
      check.innerHTML = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      check.onclick = function () { toggleTask(t); };

      const body = document.createElement('div');
      body.className = 'task-body';
      const title = document.createElement('div');
      title.className = 'task-title';
      title.textContent = t.title;
      body.appendChild(title);

      if (t.due) {
        const meta = fmtDue(t.due);
        const due = document.createElement('div');
        due.className = 'task-due' + (meta.overdue && !t.done ? ' overdue' : '');
        due.textContent = meta.label;
        body.appendChild(due);
      }

      const remove = document.createElement('button');
      remove.className = 'remove';
      remove.setAttribute('aria-label', 'Delete task');
      remove.textContent = '\u00d7';
      remove.onclick = function () { deleteTask(t); };

      li.appendChild(check);
      li.appendChild(body);
      li.appendChild(remove);
      list.appendChild(li);
    });
}

document.getElementById('addForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const input = document.getElementById('taskInput');
  const dateInput = document.getElementById('dateInput');
  const title = input.value.trim();
  if (!title) return;
  addTask(title, dateInput.value);
  input.value = '';
  dateInput.value = '';
  input.focus();
});

document.querySelectorAll('.filters button[data-filter]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    filter = btn.getAttribute('data-filter');
    document.querySelectorAll('.filters button[data-filter]').forEach(function (b) {
      b.classList.toggle('active', b === btn);
    });
    render();
  });
});

function tickClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  el.textContent = hh + ':' + mm + ':' + ss;
}
tickClock();
setInterval(tickClock, 1000);