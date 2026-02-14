const dbInput = document.getElementById('dbInput');
const collectionInput = document.getElementById('collectionInput');
const limitInput = document.getElementById('limitInput');
const loadBtn = document.getElementById('loadBtn');
const statusEl = document.getElementById('status');
const tableContainer = document.getElementById('tableContainer');

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function renderTable(rows) {
    if (!rows.length) {
        tableContainer.innerHTML = '<p>No documents found.</p>';
        return;
    }

    const allKeys = new Set();
    rows.forEach((row) => {
        Object.keys(row).forEach((k) => allKeys.add(k));
    });
    const headers = Array.from(allKeys);

    const thead = `<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows
        .map((row) => `<tr>${headers
            .map((key) => {
                const value = row[key] === undefined ? '' : JSON.stringify(row[key]);
                return `<td>${escapeHtml(value)}</td>`;
            })
            .join('')}</tr>`)
        .join('')}</tbody>`;

    tableContainer.innerHTML = `<table>${thead}${tbody}</table>`;
}

async function loadData() {
    const db = dbInput.value.trim();
    const collection = collectionInput.value.trim();
    const limit = limitInput.value.trim() || '20';

    if (!collection) {
        statusEl.textContent = 'Please enter a collection name.';
        tableContainer.innerHTML = '';
        return;
    }

    const params = new URLSearchParams({ collection, limit });
    if (db) params.set('db', db);

    statusEl.textContent = 'Loading...';
    tableContainer.innerHTML = '';

    try {
        const response = await fetch(`/api/table?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        statusEl.textContent = `Loaded ${data.count} document(s) from ${data.db}.${data.collection}`;
        renderTable(data.rows);
    } catch (error) {
        statusEl.textContent = `Error: ${error.message}`;
        tableContainer.innerHTML = '';
    }
}

loadBtn.addEventListener('click', loadData);