// System Settings Page JavaScript
// Handles saving and loading settings in-memory

const settingsForm = document.querySelector('form');
const defaultSettings = {
  course: 'Computer Science',
  year: '1st Year',
  semester: 'Fall'
};

function loadSettings() {
  settingsForm.course.value = defaultSettings.course;
  settingsForm.year.value = defaultSettings.year;
  settingsForm.semester.value = defaultSettings.semester;
}

settingsForm.onsubmit = function(e) {
  e.preventDefault();
  defaultSettings.course = settingsForm.course.value;
  defaultSettings.year = settingsForm.year.value;
  defaultSettings.semester.value = settingsForm.semester.value;
  alert('Settings saved successfully!');
};

loadSettings();
