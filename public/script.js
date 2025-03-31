document.addEventListener('DOMContentLoaded', () => {
  // Инициализация главной страницы
  if (document.getElementById('startBots')) {
    initDashboard();
  }

  // Инициализация конструктора задач
  if (document.getElementById('taskForm')) {
    initTaskBuilder();
  }

  // Инициализация загрузки изображений
  if (document.getElementById('dropZone')) {
    initImageUpload();
  }
});

// ===== ГЛАВНАЯ СТРАНИЦА =====
function initDashboard() {
  // Обновление статистики
  updateStats();

  // Обработчик запуска ботов
  document.getElementById('startBots').addEventListener('click', () => {
    const count = document.getElementById('botCount').value;
    startBots(count);
  });

  // Навигация
  document.getElementById('gotoBuilder').addEventListener('click', () => {
    window.location.href = '/task-builder.html';
  });

  document.getElementById('viewLogs').addEventListener('click', () => {
    window.location.href = '/logs.html';
  });
}

async function updateStats() {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    
    document.getElementById('activeBots').textContent = data.activeBots;
    document.getElementById('completedTasks').textContent = data.completedTasks;
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
  }
}

async function startBots(count) {
  try {
    const response = await fetch('/api/start-bots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count })
    });
    
    const result = await response.json();
    alert(`Запущено ${result.started} ботов`);
    updateStats();
  } catch (error) {
    alert('Ошибка при запуске ботов: ' + error.message);
  }
}

// ===== КОНСТРУКТОР ЗАДАЧ =====
function initTaskBuilder() {
  const taskForm = document.getElementById('taskForm');
  const taskDescription = document.getElementById('taskDescription');
  const previewContainer = document.getElementById('taskPreview');
  const previewContent = document.getElementById('previewContent');

  taskDescription.addEventListener('input', updateTaskPreview);
  taskForm.addEventListener('submit', submitTask);

  function updateTaskPreview() {
    const text = taskDescription.value.trim();
    if (text) {
      previewContent.innerHTML = formatTaskText(text);
      previewContainer.classList.remove('hidden');
    } else {
      previewContainer.classList.add('hidden');
    }
  }

  function formatTaskText(text) {
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => `<div class="flex items-start py-2">
        <i class="fas fa-arrow-right text-blue-500 mt-1 mr-2"></i>
        <span>${line}</span>
      </div>`)
      .join('');
  }

  async function submitTask(e) {
    e.preventDefault();
    
    const task = {
      description: taskDescription.value,
      botCount: document.getElementById('botCount').value,
      humanLike: document.getElementById('humanLike').checked
    };

    try {
      const response = await fetch('/api/create-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task)
      });
      
      const result = await response.json();
      alert(`Задача "${task.description.substring(0, 20)}..." создана успешно!`);
      window.location.href = '/';
    } catch (error) {
      alert('Ошибка при создании задачи: ' + error.message);
    }
  }
}

// ===== ЗАГРУЗКА ИЗОБРАЖЕНИЙ =====
function initImageUpload() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const useImagesBtn = document.getElementById('useImagesBtn');

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropZone.classList.add('border-blue-500');
  }

  function unhighlight() {
    dropZone.classList.remove('border-blue-500');
  }

  dropZone.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  fileInput.addEventListener('change', function() {
    handleFiles(this.files);
  });

  useImagesBtn.addEventListener('click', () => {
    alert('Изображения будут использованы в следующей задаче');
    window.location.href = '/task-builder.html';
  });
}

function handleFiles(files) {
  const previewContainer = document.getElementById('previewContainer');
  previewContainer.innerHTML = '<h3 class="col-span-full text-lg font-medium text-gray-700">Загруженные изображения:</h3>';
  
  Array.from(files).forEach(file => {
    if (!file.type.match('image.*')) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.createElement('div');
      preview.className = 'relative group';
      preview.innerHTML = `
        <img src="${e.target.result}" class="w-full h-32 object-cover rounded">
        <button class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition">
          <i class="fas fa-times"></i>
        </button>
      `;
      previewContainer.appendChild(preview);
    };
    reader.readAsDataURL(file);
  });

  previewContainer.classList.remove('hidden');
  useImagesBtn.classList.remove('hidden');
}