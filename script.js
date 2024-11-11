let selectedApproaches = {};
let currentFilter = 'All'; // Default filter to show all approaches

document.addEventListener("DOMContentLoaded", function() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            if (!data) throw new Error('No data found in JSON');
            populateApproaches(data);
        })
        .catch(error => console.error('Error loading JSON:', error));

    document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
});

// Function to populate approaches based on current filter
function populateApproaches(data) {
    // Populate Social Presence
    document.getElementById('emotional-expression').innerHTML = generateApproachList(data['Social Presence']?.['Emotional Expression'], 'Social Presence', 'Emotional Expression');
    document.getElementById('open-communication').innerHTML = generateApproachList(data['Social Presence']?.['Open Communication'], 'Social Presence', 'Open Communication');
    document.getElementById('group-cohesion').innerHTML = generateApproachList(data['Social Presence']?.['Group Cohesion'], 'Social Presence', 'Group Cohesion');

    // Populate Teaching Presence
    document.getElementById('design-organization').innerHTML = generateApproachList(data['Teaching Presence']?.['Design and Organization'], 'Teaching Presence', 'Design and Organization');
    document.getElementById('facilitation').innerHTML = generateApproachList(data['Teaching Presence']?.['Facilitation'], 'Teaching Presence', 'Facilitation');
    document.getElementById('direct-instruction').innerHTML = generateApproachList(data['Teaching Presence']?.['Direct Instruction'], 'Teaching Presence', 'Direct Instruction');

    // Populate Cognitive Presence
    document.getElementById('triggering-event').innerHTML = generateApproachList(data['Cognitive Presence']?.['Triggering Event'], 'Cognitive Presence', 'Triggering Event');
    document.getElementById('exploration').innerHTML = generateApproachList(data['Cognitive Presence']?.['Exploration'], 'Cognitive Presence', 'Exploration');
    document.getElementById('integration').innerHTML = generateApproachList(data['Cognitive Presence']?.['Integration'], 'Cognitive Presence', 'Integration');
    document.getElementById('resolution').innerHTML = generateApproachList(data['Cognitive Presence']?.['Resolution'], 'Cognitive Presence', 'Resolution');
}

// Filter function to set the current filter and refresh the approach lists
function filterApproaches(source) {
    currentFilter = source;
    fetch('data.json')
        .then(response => response.json())
        .then(data => populateApproaches(data))
        .catch(error => console.error('Error loading JSON:', error));
}

// Generate list of approaches for each subcategory, filtered by source
function generateApproachList(subcategoryData, presence, subpresence) {
    if (!subcategoryData || !subcategoryData['Approaches']) {
        return '<p>No approaches available.</p>';
    }

    let contentHTML = '<ul>';
    subcategoryData['Approaches'].forEach(approach => {
        // Only show approaches that match the current filter
        if (currentFilter === 'All' || approach.Source === currentFilter) {
            let approachText = approach.Description;
            
            // Check if Source is "A" and add citation icon if true
            if (approach.Source === "A") {
                const citationText = approach.Citation || 'Citation not provided';

                // Match the URL in the citation, without any trailing punctuation
                const urlMatch = citationText.match(/(https?:\/\/[^\s\)\]\}]+)/);
                if (urlMatch) {
                    const url = urlMatch[0]; // Clean URL without trailing punctuation
                    approachText += `
                        <a href="${url}" target="_blank" class="citation-icon" title="${citationText}">
                            &#128712;
                        </a>`;
                } else {
                    // If there's no link, just show the icon with the citation as a tooltip
                    approachText += `<span class="citation-icon" title="${citationText}">&#128712;</span>`;
                }
            }

            contentHTML += `
                <li>
                    ${approachText}
                    <button class="btn btn-sm btn-outline-primary ml-2" onclick="addToSelected('${presence}', '${subpresence}', '${approach.Description}')">
                        Add to List
                    </button>
                </li>`;
        }
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
