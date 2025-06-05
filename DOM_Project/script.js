document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('studentForm');
    const tableBody = document.querySelector('#studentTable tbody');
    const registrationSection = document.getElementById('registration');
    const recordsSection = document.getElementById('records');
    const navLinks = document.querySelectorAll('nav a');
    

let students = JSON.parse(localStorage.getItem('students')) || [];
let editIndex = null;

    displayRecords();
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        const newStudent = {
            name: document.getElementById('studentName').value.trim(),
            id: document.getElementById('studentID').value.trim(),
            email: document.getElementById('email').value.trim(),
            contact: document.getElementById('contact').value.trim()
        };
        
        if (editIndex !== null) {
            // Update existing student
            students[editIndex] = newStudent;
            editIndex = null;
            document.querySelector('button[type="submit"]').textContent = 'Register Student';
        } else {
            // Add new student
            students.push(newStudent);
        }
        
        saveToLocalStorage();
        displayRecords();
        form.reset();
    });
    
    // Navigation handling
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
    
    function displayRecords() {
        tableBody.innerHTML = '';
        
        if (students.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" class="no-records">No student records found</td>';
            tableBody.appendChild(row);
            return;
        }
        
        students.forEach((student, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${student.id}</td>
                <td>${student.email}</td>
                <td>${student.contact}</td>
                <td class="actions">
                    <button class="edit-btn" data-index="${index}">Edit</button>
                    <button class="delete-btn" data-index="${index}">Delete</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', editStudent);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteStudent);
        });
        
        // Add vertical scrollbar if needed
        addScrollbarIfNeeded();
    }
    
    function editStudent(e) {
        const index = e.target.getAttribute('data-index');
        const student = students[index];
        
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentID').value = student.id;
        document.getElementById('email').value = student.email;
        document.getElementById('contact').value = student.contact;
        
        editIndex = index;
        document.querySelector('button[type="submit"]').textContent = 'Update Student';
        showSection('registration');
    }
    
    function deleteStudent(e) {
        if (confirm('Are you sure you want to delete this student record?')) {
            const index = e.target.getAttribute('data-index');
            students.splice(index, 1);
            saveToLocalStorage();
            displayRecords();
        }
    }
    
    function validateForm() {
        const name = document.getElementById('studentName').value.trim();
        const id = document.getElementById('studentID').value.trim();
        const email = document.getElementById('email').value.trim();
        const contact = document.getElementById('contact').value.trim();
    //Validation part    
        // Validate empty fields
        if (!name || !id || !email || !contact) {
            alert('Please fill in all fields');
            return false;
        }
        
        // Validate name (only letters and spaces)
        if (!/^[a-zA-Z\s]+$/.test(name)) {
            alert('Student name should contain only letters');
            return false;
        }
        
        // Validate student ID (only numbers)
        if (!/^\d+$/.test(id)) {
            alert('Student ID should contain only numbers');
            return false;
        }
        
        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Please enter a valid email address');
            return false;
        }
        
        // Validate contact number (only numbers)
        if (!/^\d+$/.test(contact)) {
            alert('Contact number should contain only numbers');
            return false;
        }
        
        return true;
    }
    
    function saveToLocalStorage() {
        localStorage.setItem('students', JSON.stringify(students));
    }
    
    function showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.container > section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(sectionId).classList.add('active');
        
        // Update active nav link
        navLinks.forEach(link => {
            link.style.fontWeight = link.getAttribute('href') === `#${sectionId}` ? 'bold' : 'normal';
        });
    }
    
    function addScrollbarIfNeeded() {
        const recordsContainer = document.querySelector('.records-container');
        const table = document.getElementById('studentTable');
        
        if (table.offsetHeight > recordsContainer.offsetHeight) {
            recordsContainer.style.overflowY = 'scroll';
        } else {
            recordsContainer.style.overflowY = 'hidden';
        }
    }
    
    // Registration section by default
    showSection('registration');
    
    // Add scrollbar when window side changes
    window.addEventListener('resize', addScrollbarIfNeeded);
});