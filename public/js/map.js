// Ensure Leaflet is loaded before this script runs
// The 'eventLocation' variable is expected to be defined in the EJS template

document.addEventListener('DOMContentLoaded', () => {
    // Check if the map container and eventLocation data exist
    const mapElement = document.getElementById('map');
    if (mapElement && typeof L !== 'undefined' && typeof eventLocation !== 'undefined') {

        // Initialize the map and set its view to the event's coordinates
        // L is the Leaflet object (loaded from CDN/local file)
        const map = L.map('map').setView([eventLocation.lat, eventLocation.lng], 13); // 13 is zoom level

        // Add a tile layer (map background). Using OpenStreetMap here.
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add a marker at the event location
        const marker = L.marker([eventLocation.lat, eventLocation.lng]).addTo(map);

        // Add a popup to the marker (optional)
        if (eventLocation.popupText) {
            marker.bindPopup(eventLocation.popupText).openPopup();
        }

    } else {
        if (!mapElement) console.error("Map container element with ID 'map' not found.");
        if (typeof L === 'undefined') console.error("Leaflet library (L) is not loaded.");
        if (typeof eventLocation === 'undefined') console.error("eventLocation data is not defined in the view.");
        // Optionally hide the map section or display a message if setup fails
    }
});
