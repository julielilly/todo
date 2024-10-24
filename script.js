// DOM elements selection
const newTaskButton = document.getElementById("add_task_button");
const tasksSort = document.getElementById("sort_tasks");
const tasksFilter = document.getElementById("filter_tasks");
const searchInput = document.getElementById("search_input");
const toDoList = document.getElementById("todo_list");
const finishedTasksContainer = document.getElementById("finished_tasks_container");
const taskModal = document.getElementById("task_modal");
const closeBtn = document.getElementById("close_btn");
const addTaskBtn = document.getElementById("submit_btn");
const titleInput = document.getElementById("new_task_title");
const categoryInput = document.getElementById("new_task_category");
const dateInput = document.getElementById("new_task_date");
const taskForm = document.getElementById("task_form");
const modalOverlay = document.getElementById("modal_overlay");
const confirmDeleteDialog = document.getElementById("confirm_delete_dialog");
const cancelBtn = document.getElementById("cancel_btn");
const discardBtn = document.getElementById("discard_btn");

let taskData = JSON.parse(localStorage.getItem("data")) || []; // Load task data from localStorage or initialize an empty array
let currentTask = {}; // Holds the task currently being edited

let currentSortType = "date"; // Default to sorting by date
let currentFilterType = "all"; // Default filter type
let searchQuery = ""; // Store the current search query

// Add or update a task in the list and save to localStorage
function addOrUpdateTask() {
  const dataArrIndex = taskData.findIndex((item) => item.id === currentTask.id);

  // Create new task object or update existing one
  const taskObj = {
    id: `${titleInput.value.replace(/"/g, "").toLowerCase().split(" ").join("-")}-${Date.now()}`, // Unique ID based on title and timestamp

    title: titleInput.value,
    date: dateInput.value,
    category: categoryInput.value,
    isFinished: false,
  };

  if (dataArrIndex === -1) {
    // If the task is new, add it to the beginning of the task array
    taskData.unshift(taskObj);
  } else {
    // If editing an existing task, update it in the array
    taskData[dataArrIndex] = taskObj;
  }

  // Sort tasks using the current sorting preference
  taskData = sortTasks(taskData, currentSortType);

  // Save the updated task list to localStorage
  localStorage.setItem("data", JSON.stringify(taskData));

  // Update the UI to reflect the changes
  updateToDoList();

  // Reset the modal and fields
  reset();
}

// Function to refresh the task lists (both active and finished tasks)
function updateToDoList() {
  const filteredTasks = filterTasks(taskData, currentFilterType);
  const searchedTasks = searchTasks(filteredTasks, searchQuery);
  const sortedTasks = sortTasks(searchedTasks, currentSortType);

  toDoList.innerHTML = ""; // Clear the current active task list
  finishedTasksContainer.innerHTML = ""; // Clear the current finished task list

  // Loop through all tasks in taskData
  sortedTasks.forEach(({ id, title, date, category, isFinished }) => {
    const taskHTML = `
    <li class="task ${category} ${isFinished ? "finished" : ""}" id="${id}">
      <div class="checkbox ${isFinished ? "checked" : ""}" onclick="toggleTask(this)"></div>
      <div class="task_content">
        <div class="task_title">${title}</div>
        <p class="task_category">${date} · ${category}</p>
      </div>
      <button class="edit_btn ${isFinished ? "hidden" : ""}" type="button" onclick="editTask(this)">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
          <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
        </svg>
      </button>
      <button class="delete_btn" type="button" onclick="confirmDelete(this)">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
          <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
        </svg>
      </button>
    </li>
`;

    if (isFinished) {
      // If the task is finished, add it to the finished tasks container
      finishedTasksContainer.innerHTML += taskHTML;
    } else {
      // If the task is still active, add it to the main to-do list
      toDoList.innerHTML += taskHTML;
    }
  });

  // Add a header to the finished tasks list if there are any finished tasks
  if (finishedTasksContainer.children.length) {
    finishedTasksContainer.innerHTML = '<h2 class="list_title">Finished Tasks</h2>' + finishedTasksContainer.innerHTML;
  }
}

// Toggle the finished/active state of a task
function toggleTask(element) {
  const dataArrIndex = taskData.findIndex((item) => item.id === element.parentElement.id);

  // Toggle the isFinished state for the clicked task
  taskData[dataArrIndex].isFinished = !taskData[dataArrIndex].isFinished;

  // Update localStorage and refresh the displayed task lists
  localStorage.setItem("data", JSON.stringify(taskData));
  updateToDoList();
}

// Give user an extra chance before deleting the task
function confirmDelete(element) {
  const taskId = element.parentElement.id; // Get the task ID

  confirmDeleteDialog.showModal();

  discardBtn.onclick = () => {
    confirmDeleteDialog.close();
    deleteTask(taskId); // Pass the task ID
  };
}

cancelBtn.addEventListener("click", () => confirmDeleteDialog.close()); // Close dialog on cancel

discardBtn.addEventListener("click", () => {
  confirmDeleteDialog.close();
  deleteTask();
});

function deleteTask(taskId) {
  const dataArrIndex = taskData.findIndex((item) => item.id === taskId);

  // If dataArrIndex is not -1, it means the task exists in the array. Proceed to remove it.
  if (dataArrIndex !== -1) {
    taskData.splice(dataArrIndex, 1); // Remove from array

    localStorage.setItem("data", JSON.stringify(taskData)); // Update storage

    updateToDoList(); // Refresh UI
  }
}

// Edit an existing task
function editTask(buttonEl) {
  const dataArrIndex = taskData.findIndex((item) => item.id === buttonEl.parentElement.id);

  // Set the current task to be edited
  currentTask = taskData[dataArrIndex];

  // Pre-fill the form with the task's current data
  titleInput.value = currentTask.title;
  dateInput.value = currentTask.date;
  categoryInput.value = currentTask.category;

  // Update the button text to indicate an edit action
  addTaskBtn.innerText = "Update Task";

  // Show the modal for editing
  taskModal.classList.remove("hidden");
  modalOverlay.classList.remove("hidden");
}

// Reset the modal fields after adding/updating a task
function reset() {
  addTaskBtn.innerText = "Add Task";
  titleInput.value = "";
  dateInput.value = "";
  categoryInput.value = "work";
  taskModal.classList.add("hidden");
  modalOverlay.classList.add("hidden");
  currentTask = {};
}

// Check if there are tasks in localStorage to display on load
if (taskData.length) {
  updateToDoList();
}

// Event listener to open the task modal
newTaskButton.addEventListener("click", () => {
  taskModal.classList.remove("hidden");
  modalOverlay.classList.remove("hidden");
});

// Event listener to close the task modal
closeBtn.addEventListener("click", reset);

// Event listener for form submission to add/update a task
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addOrUpdateTask();
});

// Event listener to filter the tasks
tasksFilter.addEventListener("change", (e) => {
  currentFilterType = e.target.value; // Update the global variable to the new filter type
  updateToDoList(); // Update the list with the filtered and sorted tasks
});

// Function to filter tasks based on the selected category
function filterTasks(tasks, filterType) {
  return filterType === "all" ? tasks : tasks.filter((task) => task.category === filterType); // Filter by category
}

// Event listener for the search input
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value; // Update the search query with the current input
  updateToDoList(); // Update the list with filtered, searched, and sorted tasks
});

// Function to search tasks based on the input query
function searchTasks(tasks, query) {
  if (!query) return tasks; // If the search query is empty, return all tasks
  return tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase())); // Filter tasks based on title
}

// Event listener for sorting tasks
tasksSort.addEventListener("change", (e) => {
  currentSortType = e.target.value; // Update the global variable to the new sort type
  updateToDoList(); // Update the UI with sorted tasks
});

// Function to sort tasks
function sortTasks(tasks, sortType) {
  // Define sorting logic for each sortType
  const sortingMethods = {
    date: (a, b) => new Date(a.date) - new Date(b.date),
    title: (a, b) => {
      // Sort titles alphabetically, case-insensitive
      if (a.title.toLowerCase() < b.title.toLowerCase()) return -1;
      if (a.title.toLowerCase() > b.title.toLowerCase()) return 1;
      return 0; // Titles are equal
    },
  };

  // Sort tasks using the specified sortType
  return tasks.sort(sortingMethods[sortType]);
}
