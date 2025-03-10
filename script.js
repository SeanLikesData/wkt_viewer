// Initialize the map
const map = L.map('map').setView([0, 0], 2);
        
// Base maps
const baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    "OpenTopoMap": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        maxZoom: 17
    }),
    "Esri WorldImagery": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    "CartoDB Dark": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    })
};

// Add OpenStreetMap as the default base layer
baseMaps["OpenStreetMap"].addTo(map);

// Add layer control to switch between base maps
L.control.layers(baseMaps, null, {position: 'topright'}).addTo(map);

// Create a layer group for the geometries
const geomLayer = L.layerGroup().addTo(map);

// DOM elements
const wktInput = document.getElementById('wktInput');
const visualizeBtn = document.getElementById('visualizeBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const errorMsg = document.getElementById('errorMsg');

// Sample WKT polygons
const samples = [
    'POLYGON((-74.0 40.7, -73.9 40.7, -73.9 40.8, -74.0 40.8, -74.0 40.7))', // NYC area
    'MULTIPOLYGON(((-122.4 37.7, -122.3 37.7, -122.3 37.8, -122.4 37.8, -122.4 37.7)), ((-118.4 34.0, -118.3 34.0, -118.3 34.1, -118.4 34.1, -118.4 34.0)))', // SF and LA - fixed spacing
    'LINESTRING(-0.1 51.5, 2.3 48.8, 12.5 41.9)', // London-Paris-Rome
    'POINT(-77.0 38.9)' // Washington DC
];

// Custom WKT parser since external libraries are having issues
function parseWKT(wktString) {
    try {
        // Basic WKT parsing for common geometry types
        wktString = wktString.trim();
        
        // Extract geometry type and coordinates
        const typeMatch = wktString.match(/^([A-Z]+)/);
        if (!typeMatch) throw new Error("Invalid WKT format: Cannot determine geometry type");
        
        const geometryType = typeMatch[1].toUpperCase();
        
        // Extract all coordinate pairs using regex
        const coordsText = wktString.substring(geometryType.length).trim();
        
        // For simple geometries
        if (geometryType === 'POINT') {
            // Extract single point coordinates
            const pointMatch = coordsText.match(/\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/);
            if (!pointMatch) throw new Error("Invalid POINT format");
            
            const x = parseFloat(pointMatch[1]);
            const y = parseFloat(pointMatch[2]);
            
            if (isNaN(x) || isNaN(y)) {
                throw new Error(`Invalid POINT coordinates: (${pointMatch[1]}, ${pointMatch[2]})`);
            }
            
            return L.marker([y, x]);
        } 
        else if (geometryType === 'LINESTRING') {
            // Extract coordinates between parentheses
            const coordsMatch = coordsText.match(/\((.*)\)/);
            if (!coordsMatch) throw new Error("Invalid LINESTRING format");
            
            // Parse coordinates with error checking
            const coordPairs = [];
            const pairs = coordsMatch[1].split(',');
            
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i].trim();
                const coords = pair.split(/\s+/);
                
                if (coords.length >= 2) {
                    const lng = parseFloat(coords[0]);
                    const lat = parseFloat(coords[1]);
                    
                    if (!isNaN(lng) && !isNaN(lat)) {
                        coordPairs.push([lat, lng]); // [lat, lng] for Leaflet
                    } else {
                        console.error("Invalid coordinate pair:", pair);
                    }
                }
            }
            
            if (coordPairs.length === 0) {
                throw new Error("Could not parse any valid coordinates from LINESTRING");
            }
            
            return L.polyline(coordPairs, {
                color: '#3388ff',
                weight: 3
            });
        }
        else if (geometryType === 'POLYGON') {
            // Extract coordinates between parentheses
            const coordsMatch = coordsText.match(/\(\((.*)\)\)/);
            let coordPairs = [];
            
            if (!coordsMatch) {
                // Try simpler format with single parentheses
                const simpleMatch = coordsText.match(/\((.*)\)/);
                if (!simpleMatch) throw new Error("Invalid POLYGON format");
                
                // Parse coordinates with error checking
                const pairs = simpleMatch[1].split(',');
                for (let i = 0; i < pairs.length; i++) {
                    const pair = pairs[i].trim();
                    const coords = pair.split(/\s+/);
                    
                    if (coords.length >= 2) {
                        const lng = parseFloat(coords[0]);
                        const lat = parseFloat(coords[1]);
                        
                        if (!isNaN(lng) && !isNaN(lat)) {
                            coordPairs.push([lat, lng]); // [lat, lng] for Leaflet
                        } else {
                            console.error("Invalid coordinate pair:", pair);
                        }
                    }
                }
            } else {
                // Parse coordinates with error checking
                const pairs = coordsMatch[1].split(',');
                for (let i = 0; i < pairs.length; i++) {
                    const pair = pairs[i].trim();
                    const coords = pair.split(/\s+/);
                    
                    if (coords.length >= 2) {
                        const lng = parseFloat(coords[0]);
                        const lat = parseFloat(coords[1]);
                        
                        if (!isNaN(lng) && !isNaN(lat)) {
                            coordPairs.push([lat, lng]); // [lat, lng] for Leaflet
                        } else {
                            console.error("Invalid coordinate pair:", pair);
                        }
                    }
                }
            }
            
            if (coordPairs.length === 0) {
                throw new Error("Could not parse any valid coordinates from POLYGON");
            }
            
            return L.polygon(coordPairs, {
                color: '#3388ff',
                weight: 2,
                fillColor: '#3388ff',
                fillOpacity: 0.2
            });
        }
        else if (geometryType === 'MULTIPOLYGON') {
            // Improved multipolygon parsing
            try {
                // First, find all the polygon definitions
                const polygons = [];
                const polygonRegex = /\(\((.*?)\)\)/g;
                let match;
                
                while ((match = polygonRegex.exec(coordsText)) !== null) {
                    const coordinates = [];
                    const coordText = match[1];
                    
                    // Process each coordinate pair
                    const pairs = coordText.split(',');
                    for (const pair of pairs) {
                        const parts = pair.trim().split(/\s+/);
                        if (parts.length >= 2) {
                            const lng = parseFloat(parts[0]);
                            const lat = parseFloat(parts[1]);
                            
                            if (!isNaN(lng) && !isNaN(lat)) {
                                coordinates.push([lat, lng]); // [lat, lng] for Leaflet
                            }
                        }
                    }
                    
                    if (coordinates.length > 0) {
                        polygons.push(coordinates);
                    }
                }
                
                if (polygons.length === 0) {
                    throw new Error("No valid polygons found in MULTIPOLYGON");
                }
                
                return L.polygon(polygons, {
                    color: '#3388ff',
                    weight: 2,
                    fillColor: '#3388ff',
                    fillOpacity: 0.2
                });
            } catch (e) {
                console.error("Error parsing MULTIPOLYGON:", e);
                throw new Error("Failed to parse MULTIPOLYGON: " + e.message);
            }
        }
        
        throw new Error(`Unsupported geometry type: ${geometryType}`);
    } catch (error) {
        throw error;
    }
}

// Function to visualize WKT
function visualizeWKT() {
    const wktString = wktInput.value.trim();
    
    if (!wktString) {
        showError('Please enter a WKT string.');
        return;
    }
    
    try {
        // Clear previous geometries and errors
        geomLayer.clearLayers();
        errorMsg.textContent = '';
        
        // Parse WKT and create Leaflet layer
        const layer = parseWKT(wktString);
        
        // Add to the map
        layer.addTo(geomLayer);
        
        // Zoom to the feature bounds
        try {
            map.fitBounds(layer.getBounds(), {
                padding: [50, 50],
                maxZoom: 16
            });
        } catch (e) {
            // For point geometries that don't have bounds
            if (layer instanceof L.Marker) {
                map.setView(layer.getLatLng(), 10);
            }
        }
    } catch (error) {
        showError('Error: ' + error.message);
        console.error(error);
    }
}

// Function to show error messages
function showError(message) {
    errorMsg.textContent = message;
}

// Clear the map and input
function clearAll() {
    wktInput.value = '';
    errorMsg.textContent = '';
    geomLayer.clearLayers();
}

// Load a random sample
function loadSample() {
    const randomIndex = Math.floor(Math.random() * samples.length);
    wktInput.value = samples[randomIndex];
    visualizeWKT();
}

// Event listeners
visualizeBtn.addEventListener('click', visualizeWKT);
clearBtn.addEventListener('click', clearAll);
sampleBtn.addEventListener('click', loadSample);

// Also visualize on Enter key press (with Ctrl or Cmd)
wktInput.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        visualizeWKT();
    }
});