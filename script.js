// Store selected approaches
let selectedApproaches = {};

// When the page loads, fetch data from JSON and populate the collapsibles
document.addEventListener("DOMContentLoaded", function() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            if (!data) throw new Error('No data found in JSON');

            // Populate Social Presence
            document.getElementById('emotional-expression').innerHTML = generateApproachList(data['Social Presence']?.['Emotional Expression'], 'Social Presence', 'Emotional Expression');
            document.getElementById('open-communication').innerHTML = generateApproachList(data['Social Presence']?.['Open Communication'], 'Social Presence', 'Open Communication');
            document.getElementById('group-cohesion').innerHTML = generateApproachList(data['Social Presence']?.['Group Cohesion'], 'Social Presence', 'Group Cohesion');

            // Populate Teaching Presence
            document.getElementById('design-organization').innerHTML = generateApproachList(data['Teaching Presence']?.['Design and Organization'], 'Teaching Presence', 'Design and Organization');
            document.getElementById('facilitating-discourse').innerHTML = generateApproachList(data['Teaching Presence']?.['Facilitating Discourse'], 'Teaching Presence', 'Facilitating Discourse');
            document.getElementById('direct-instruction').innerHTML = generateApproachList(data['Teaching Presence']?.['Direct Instruction'], 'Teaching Presence', 'Direct Instruction');

            // Populate Cognitive Presence
            document.getElementById('triggering-event').innerHTML = generateApproachList(data['Cognitive Presence']?.['Triggering Event'], 'Cognitive Presence', 'Triggering Event');
            document.getElementById('exploration').innerHTML = generateApproachList(data['Cognitive Presence']?.['Exploration'], 'Cognitive Presence', 'Exploration');
            document.getElementById('integration').innerHTML = generateApproachList(data['Cognitive Presence']?.['Integration'], 'Cognitive Presence', 'Integration');
            document.getElementById('resolution').innerHTML = generateApproachList(data['Cognitive Presence']?.['Resolution'], 'Cognitive Presence', 'Resolution');
        })
        .catch(error => console.error('Error loading JSON:', error));

    // Copy to Clipboard button functionality
    document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
});

// Generate list of approaches for each subcategory with "Add to List" button
function generateApproachList(subcategoryData, presence, subpresence) {
    if (!subcategoryData || !subcategoryData['Approaches']) {
        return '<p>No approaches available.</p>';
    }

    let contentHTML = '<ul>';
    subcategoryData['Approaches'].forEach(approach => {
        contentHTML += `
            <li>
                ${approach}
                <button class="btn btn-sm btn-outline-primary ml-2" onclick="addToSelected('${presence}', '${subpresence}', '${approach}')">
                    Add to List
                </button>
            </li>`;
    });
    contentHTML += '</ul>';

    return contentHTML;
}

// Add the selected approach to the user's list
function addToSelected(presence, subpresence, approach) {
    if (!selectedApproaches[presence]) {
        selectedApproaches[presence] = {};
    }
    if (!selectedApproaches[presence][subpresence]) {
        selectedApproaches[presence][subpresence] = [];
    }
    // Avoid duplicates
    if (!selectedApproaches[presence][subpresence].includes(approach)) {
        selectedApproaches[presence][subpresence].push(approach);
    }

    updateSelectedApproaches();
}

// Update the selected approaches display
function updateSelectedApproaches() {
    const container = document.getElementById('selected-approaches');
    let listHTML = '';

    Object.keys(selectedApproaches).forEach(presence => {
        listHTML += `<h4>${presence}</h4>`;
        Object.keys(selectedApproaches[presence]).forEach(subpresence => {
            listHTML += `<h5>${subpresence}</h5><ul>`;
            selectedApproaches[presence][subpresence].forEach(approach => {
                listHTML += `<li>${approach}</li>`;
            });
            listHTML += '</ul>';
        });
    });

    container.innerHTML = listHTML;
}

// Copy the selected approaches to the clipboard
function copyToClipboard() {
    let textToCopy = '';

    Object.keys(selectedApproaches).forEach(presence => {
        textToCopy += `${presence}\n`;
        Object.keys(selectedApproaches[presence]).forEach(subpresence => {
            textToCopy += `  ${subpresence}\n`;
            selectedApproaches[presence][subpresence].forEach(approach => {
                textToCopy += `    - ${approach}\n`;
            });
        });
    });

    // Create a temporary textarea to hold the text
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = textToCopy;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextarea);

    alert('Selected approaches copied to clipboard!');
}
