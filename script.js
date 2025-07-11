document.addEventListener('DOMContentLoaded', function () {
    const authSection = document.getElementById('auth-section');
    const chatSection = document.getElementById('chat-section');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const currentUsername = document.getElementById('current-username');
    const roomList = document.getElementById('room-list');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const currentRoom = document.getElementById('current-room');
    const createRoomBtn = document.getElementById('create-room-btn');
    const newRoomName = document.getElementById('new-room-name');

    let currentUser = null;
    let activeRoom = 'general';
    let messages = [];

    init();

    showRegister.addEventListener('click', function (e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    showLogin.addEventListener('click', function (e) {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') sendMessage();
    });

    roomList.addEventListener('click', function (e) {
        if (e.target.tagName === 'LI') switchRoom(e.target.dataset.room);
    });

    createRoomBtn.addEventListener('click', createRoom);

    function init() {
        const loggedInUser = localStorage.getItem('currentUser');
        if (loggedInUser) {
            currentUser = JSON.parse(loggedInUser);
            showChatUI();
            loadRoom(activeRoom);
        } else {
            showAuthUI();
        }
        updateActiveUsersUI();
    }

    function showAuthUI() {
        authSection.classList.add('active');
        chatSection.classList.add('hidden');
    }

    function showChatUI() {
        authSection.classList.add('hidden');
        chatSection.classList.remove('hidden');
        currentUsername.textContent = currentUser.username;
    }

    function handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
            .then(res => res.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('currentUser', JSON.stringify({ username }));
                    currentUser = { username };
                    showChatUI();
                    loadRoom(activeRoom);
                    setUserActive(username);
                    updateActiveUsersUI();
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                alert('Something went wrong');
                console.error(err);
            });
    }

    function handleRegister() {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;

        fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'User registered successfully') {
                    alert('Registration successful! Please login.');
                    registerForm.classList.add('hidden');
                    loginForm.classList.remove('hidden');
                } else {
                    alert(data.message);
                }
            })
            .catch(err => {
                alert('Something went wrong');
                console.error(err);
            });
    }

    function handleLogout() {
        setUserInactive(currentUser.username);
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateActiveUsersUI();
        window.location.href = 'index.html';
        showAuthUI();
    }

    function loadRoom(roomName) {
        activeRoom = roomName;
        currentRoom.textContent = roomName.charAt(0).toUpperCase() + roomName.slice(1);

        document.querySelectorAll('#room-list li').forEach(li => {
            li.classList.remove('active');
            if (li.dataset.room === roomName) li.classList.add('active');
        });

        // Load messages from backend
        fetch(`http://localhost:3000/api/messages/${roomName}`)
            .then(res => res.json())
            .then(data => {
                messages = data;
                renderMessages();
            })
            .catch(err => {
                console.error('Failed to load messages:', err);
            });
    }

    function switchRoom(roomName) {
        if (activeRoom !== roomName) {
            loadRoom(roomName);
        }
    }

    function renderMessages() {
        messagesContainer.innerHTML = '';
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender === currentUser.username ? 'sent' : 'received'}`;

            const senderSpan = document.createElement('div');
            senderSpan.className = 'sender';
            senderSpan.textContent = msg.sender;

            const contentSpan = document.createElement('div');
            contentSpan.className = 'content';
            contentSpan.textContent = msg.content;

            const timeSpan = document.createElement('div');
            timeSpan.className = 'timestamp';
            timeSpan.textContent = formatTime(msg.timestamp);

            messageDiv.appendChild(senderSpan);
            messageDiv.appendChild(contentSpan);
            messageDiv.appendChild(timeSpan);

            messagesContainer.appendChild(messageDiv);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function sendMessage() {
        const content = messageInput.value.trim();
        if (!content) return;

        const messageData = {
            sender: currentUser.username,
            room: activeRoom,
            content: content
        };

        fetch('http://localhost:3000/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'Message saved') {
                    loadRoom(activeRoom);
                    messageInput.value = '';
                } else {
                    alert('Failed to send message');
                }
            })
            .catch(err => {
                console.error('Error sending message:', err);
            });
    }

    function createRoom() {
        const roomName = newRoomName.value.trim().toLowerCase();
        if (!roomName) return;

        const exists = Array.from(roomList.children).some(li => li.dataset.room === roomName);
        if (exists) {
            alert('Room already exists');
            return;
        }

        const roomLi = document.createElement('li');
        roomLi.dataset.room = roomName;
        roomLi.textContent = roomName.charAt(0).toUpperCase() + roomName.slice(1);
        roomList.appendChild(roomLi);

        newRoomName.value = '';
    }
});

// Sidebar Toggle
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggle-sidebar-btn");

toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("open");
});

document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove("open");
    }
});

// Active Users Logic
function getActiveUsers() {
    return JSON.parse(localStorage.getItem('activeUsers')) || [];
}

function setUserActive(username) {
    let activeUsers = getActiveUsers();
    if (!activeUsers.includes(username)) {
        activeUsers.push(username);
        localStorage.setItem('activeUsers', JSON.stringify(activeUsers));
    }
}

function setUserInactive(username) {
    let activeUsers = getActiveUsers().filter(u => u !== username);
    localStorage.setItem('activeUsers', JSON.stringify(activeUsers));
}

function updateActiveUsersUI() {
    const activeUsers = getActiveUsers();
    const list = document.getElementById('active-user-list');
    const count = document.getElementById('active-count');

    list.innerHTML = '';
    activeUsers.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        list.appendChild(li);
    });

    count.textContent = activeUsers.length;
}

window.addEventListener("beforeunload", function () {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        setUserInactive(user.username);
        updateActiveUsersUI();
    }
});
