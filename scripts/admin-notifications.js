// Notifications Page JavaScript
// Handles notification display and auto-hide

const notifications = document.querySelectorAll('.notification');
notifications.forEach(note => {
  setTimeout(() => {
    note.style.display = 'none';
  }, 4000);
});
