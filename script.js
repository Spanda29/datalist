let partyData = []; // To store the loaded JSON data
const jsonUrl = 'https://spanda29.github.io/datalist/acclist2.json';
const statusDiv = document.getElementById('status');
const searchResultsDiv = document.getElementById('searchResults');
const fullLedgerDiv = document.getElementById('fullLedger');
const ledgerContentDiv = document.getElementById('ledgerContent');

// Function to update status message
function updateStatus(message, type = 'loading') {
    statusDiv.textContent = message;
    statusDiv.className = status-message status-${type};
}

// Function to load JSON data
async function loadPartyData() {
    updateStatus('Loading party ledger data...');
    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) {
            throw new Error(HTTP error! Status: ${response.status});
        }
        partyData = await response.json();
        updateStatus('Data loaded successfully!', 'success');
        console.log('Party Data Loaded:', partyData);
        // Optionally, display all parties initially or prompt for search
        displaySearchResults(partyData);
    } catch (error) {
        updateStatus(Failed to load data: ${error.message}. Please check the JSON file and network connection., 'error');
        console.error('Error loading party data:', error);
    }
}

// Function to display search results (due balances)
function displaySearchResults(results) {
    searchResultsDiv.innerHTML = '';
    if (results.length === 0) {
        searchResultsDiv.innerHTML = '<p>No parties found.</p>';
        return;
    }

    results.forEach(party => {
        const partyItem = document.createElement('div');
        partyItem.className = 'party-item';
        partyItem.setAttribute('data-party-id', party.party_name); // Use party_name as ID for simplicity
        partyItem.innerHTML = `
            <h3>${party.party_name}</h3>
            <p>Due Balance: ₹${party.due_balance ? party.due_balance.toFixed(2) : 'N/A'}</p>
        `;
        partyItem.onclick = () => showFullLedger(party.party_name);
        searchResultsDiv.appendChild(partyItem);
    });
}

// Function to search for a party
function searchParty() {
    const searchTerm = document.getElementById('partySearch').value.toLowerCase();
    const filteredParties = partyData.filter(party =>
        party.party_name.toLowerCase().includes(searchTerm)
    );
    displaySearchResults(filteredParties);
    fullLedgerDiv.style.display = 'none'; // Hide full ledger if visible
    searchResultsDiv.style.display = 'block'; // Ensure search results are visible
}

// Function to show full ledger details for a party
function showFullLedger(partyName) {
    const selectedParty = partyData.find(party => party.party_name === partyName);

    if (!selectedParty) {
        ledgerContentDiv.innerHTML = '<p>Ledger details not found for this party.</p>';
        return;
    }

    let ledgerHtml = `
        <h3>${selectedParty.party_name}</h3>
        <p><strong>Current Due Balance:</strong> ₹${selectedParty.due_balance ? selectedParty.due_balance.toFixed(2) : 'N/A'}</p>
        <h4>Transactions:</h4>
    `;

    if (selectedParty.transactions && selectedParty.transactions.length > 0) {
        ledgerHtml += `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Debit (₹)</th>
                        <th>Credit (₹)</th>
                        <th>Balance (₹)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        selectedParty.transactions.forEach(transaction => {
            ledgerHtml += `
                <tr>
                    <td data-label="Date">${transaction.date || 'N/A'}</td>
                    <td data-label="Description">${transaction.description || 'N/A'}</td>
                    <td data-label="Debit">${transaction.debit ? transaction.debit.toFixed(2) : '-'}</td>
                    <td data-label="Credit">${transaction.credit ? transaction.credit.toFixed(2) : '-'}</td>
                    <td data-label="Balance">${transaction.balance ? transaction.balance.toFixed(2) : 'N/A'}</td>
                </tr>
            `;
        });
        ledgerHtml += `
                </tbody>
            </table>
        `;
    } else {
        ledgerHtml += '<p>No transaction details available for this party.</p>';
    }

    ledgerContentDiv.innerHTML = ledgerHtml;
    fullLedgerDiv.style.display = 'block';
    searchResultsDiv.style.display = 'none'; // Hide search results
}

// Function to hide full ledger and show search results
function hideFullLedger() {
    fullLedgerDiv.style.display = 'none';
    searchResultsDiv.style.display = 'block';
    document.getElementById('partySearch').value = ''; // Clear search
    displaySearchResults(partyData); // Redisplay all parties
}


// Function to export full ledger to PDF
async function exportLedgerToPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4'); // 'p' for portrait, 'pt' for points, 'a4' for size

    const content = document.getElementById('ledgerContent'); // Get the content to convert

    // Use html2canvas to render HTML to an image, then add to PDF
    html2canvas(content, {
        scale: 2 // Increase scale for better quality in PDF
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 595; // A4 width in points (approx)
        const pageHeight = 842; // A4 height in points (approx)
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        doc.save('party_ledger.pdf');
    }).catch(error => {
        console.error('Error generating PDF:', error);
        alert('Could not generate PDF. Please try again.');
    });
}


// Initial load of data when the page loads
loadPartyData();