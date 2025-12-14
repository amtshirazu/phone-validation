const API_URL = 'http://localhost:3000/api';

document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };

    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Processing...';
    messageDiv.className = 'message processing';

    try {
        const response = await fetch(`${API_URL}/registration`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.status === 'accepted') {
            messageDiv.textContent = `✅ ${result.message}`;
            messageDiv.className = 'message success';
            document.getElementById('registrationForm').reset();
            loadRegistrations();
            loadStats();
        } else {
            messageDiv.textContent = `❌ ${result.message || 'Registration failed'}`;
            messageDiv.className = 'message error';
        }
    } catch {
        messageDiv.textContent = '❌ Network error. Check if API is running.';
        messageDiv.className = 'message error';
    }
});

async function loadRegistrations() {
    try {
        const response = await fetch(`${API_URL}/registrations`);
        const data = await response.json();

        const container = document.getElementById('registrations');
        if (!data.length) {
            container.innerHTML = '<p>No registrations yet</p>';
            return;
        }

        let html = `
        <table>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Date</th>
            </tr>`;

        data.forEach(r => {
            html += `
            <tr>
                <td>${r.name}</td>
                <td>${r.email}</td>
                <td><strong>${r.phone}</strong></td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
            </tr>`;
        });

        html += '</table>';
        container.innerHTML = html;

    } catch {
        document.getElementById('registrations').innerHTML = '<p>Error loading registrations</p>';
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/phone/count`);
        const data = await response.json();

        document.getElementById('stats').innerHTML = `
            <p>Total possible valid numbers: <strong>${data.totalPossibleValidNumbers}</strong></p>
            <p>Registered numbers: <strong>${data.registeredValidNumbers || 0}</strong></p>
        `;
    } catch {
        document.getElementById('stats').innerHTML = '<p>Error loading stats</p>';
    }
}

loadRegistrations();
loadStats();
