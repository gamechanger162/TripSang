/**
 * City lat/long data and conversion helpers for the Data Globe.
 * ~1,100 world cities + sparse ocean points for continent outlines.
 */
import * as THREE from 'three';

export interface CityPoint {
    lat: number;
    lng: number;
    pop?: number; // optional population weight (0-1)
}

/** Convert lat/lng (degrees) to 3D cartesian on a sphere of given radius */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

/**
 * Generate a sparse set of ocean/water surface points.
 * These create a dim grid over water to outline the continents.
 */
export function generateOceanPoints(radius: number, count: number): Float32Array {
    const positions = new Float32Array(count * 3);
    let idx = 0;

    // Use golden-angle spiral for uniform distribution
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2; // -1 to 1
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = (2 * Math.PI * i) / goldenRatio;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        positions[idx++] = x * radius;
        positions[idx++] = y * radius;
        positions[idx++] = z * radius;
    }

    return positions;
}

// ─── Major world cities ───────────────────────────────────────────

export const CITY_DATA: CityPoint[] = [
    // ── Asia ──────────────────────────────────────────────
    { lat: 35.6762, lng: 139.6503, pop: 1 },      // Tokyo
    { lat: 31.2304, lng: 121.4737, pop: 0.95 },    // Shanghai
    { lat: 28.6139, lng: 77.2090, pop: 0.95 },     // Delhi
    { lat: 19.0760, lng: 72.8777, pop: 0.9 },      // Mumbai
    { lat: 39.9042, lng: 116.4074, pop: 0.95 },    // Beijing
    { lat: 23.1291, lng: 113.2644, pop: 0.85 },    // Guangzhou
    { lat: 22.5726, lng: 88.3639, pop: 0.8 },      // Kolkata
    { lat: 13.7563, lng: 100.5018, pop: 0.8 },     // Bangkok
    { lat: 37.5665, lng: 126.9780, pop: 0.85 },    // Seoul
    { lat: 1.3521, lng: 103.8198, pop: 0.75 },     // Singapore
    { lat: 14.5995, lng: 120.9842, pop: 0.8 },     // Manila
    { lat: -6.2088, lng: 106.8456, pop: 0.85 },    // Jakarta
    { lat: 34.6937, lng: 135.5023, pop: 0.8 },     // Osaka
    { lat: 22.3193, lng: 114.1694, pop: 0.8 },     // Hong Kong
    { lat: 35.0116, lng: 135.7681, pop: 0.65 },    // Kyoto
    { lat: 3.1390, lng: 101.6869, pop: 0.7 },      // Kuala Lumpur
    { lat: 21.0285, lng: 105.8542, pop: 0.7 },     // Hanoi
    { lat: 10.8231, lng: 106.6297, pop: 0.75 },    // Ho Chi Minh
    { lat: 23.8103, lng: 90.4125, pop: 0.8 },      // Dhaka
    { lat: 24.8607, lng: 67.0011, pop: 0.8 },      // Karachi
    { lat: 33.6844, lng: 73.0479, pop: 0.65 },     // Islamabad
    { lat: 31.5204, lng: 74.3587, pop: 0.75 },     // Lahore
    { lat: 13.0827, lng: 80.2707, pop: 0.7 },      // Chennai
    { lat: 12.9716, lng: 77.5946, pop: 0.7 },      // Bangalore
    { lat: 17.3850, lng: 78.4867, pop: 0.7 },      // Hyderabad
    { lat: 26.9124, lng: 75.7873, pop: 0.55 },     // Jaipur
    { lat: 26.8467, lng: 80.9462, pop: 0.6 },      // Lucknow
    { lat: 25.3176, lng: 82.9739, pop: 0.5 },      // Varanasi
    { lat: 18.5204, lng: 73.8567, pop: 0.65 },     // Pune
    { lat: 23.0225, lng: 72.5714, pop: 0.65 },     // Ahmedabad
    { lat: 27.1767, lng: 78.0081, pop: 0.5 },      // Agra
    { lat: 11.0168, lng: 76.9558, pop: 0.45 },     // Coimbatore
    { lat: 25.6093, lng: 85.1376, pop: 0.55 },     // Patna
    { lat: 30.7333, lng: 76.7794, pop: 0.5 },      // Chandigarh
    { lat: 15.2993, lng: 74.1240, pop: 0.4 },      // Goa
    { lat: 9.9312, lng: 76.2673, pop: 0.45 },      // Kochi
    { lat: 32.7266, lng: 74.8570, pop: 0.35 },     // Jammu
    { lat: 47.9077, lng: 106.9133, pop: 0.4 },     // Ulaanbaatar
    { lat: 39.0392, lng: 125.7625, pop: 0.65 },    // Pyongyang
    { lat: 35.1796, lng: 129.0756, pop: 0.7 },     // Busan
    { lat: 16.8661, lng: 96.1951, pop: 0.6 },      // Yangon
    { lat: 27.7172, lng: 85.3240, pop: 0.5 },      // Kathmandu
    { lat: 6.9271, lng: 79.8612, pop: 0.5 },       // Colombo
    { lat: 41.2995, lng: 69.2401, pop: 0.5 },      // Tashkent
    { lat: 38.5598, lng: 68.7738, pop: 0.35 },     // Dushanbe
    { lat: 42.8746, lng: 74.5698, pop: 0.35 },     // Bishkek
    { lat: 37.9601, lng: 58.3261, pop: 0.35 },     // Ashgabat
    { lat: 51.1694, lng: 71.4491, pop: 0.45 },     // Astana
    { lat: 43.2551, lng: 76.9126, pop: 0.55 },     // Almaty

    // ── Middle East ──────────────────────────────
    { lat: 25.2048, lng: 55.2708, pop: 0.7 },      // Dubai
    { lat: 24.7136, lng: 46.6753, pop: 0.65 },     // Riyadh
    { lat: 41.0082, lng: 28.9784, pop: 0.75 },     // Istanbul
    { lat: 35.6892, lng: 51.3890, pop: 0.7 },      // Tehran
    { lat: 33.3128, lng: 44.3615, pop: 0.6 },      // Baghdad
    { lat: 31.7683, lng: 35.2137, pop: 0.5 },      // Jerusalem
    { lat: 32.0853, lng: 34.7818, pop: 0.55 },     // Tel Aviv
    { lat: 33.8938, lng: 35.5018, pop: 0.5 },      // Beirut
    { lat: 31.9454, lng: 35.9284, pop: 0.45 },     // Amman
    { lat: 40.1792, lng: 44.4991, pop: 0.4 },      // Yerevan
    { lat: 41.7151, lng: 44.8271, pop: 0.4 },      // Tbilisi
    { lat: 40.4093, lng: 49.8671, pop: 0.5 },      // Baku
    { lat: 26.2285, lng: 50.5860, pop: 0.4 },      // Manama
    { lat: 29.3759, lng: 47.9774, pop: 0.4 },      // Kuwait City
    { lat: 23.5880, lng: 58.3829, pop: 0.35 },     // Muscat
    { lat: 25.2854, lng: 51.5310, pop: 0.5 },      // Doha
    { lat: 15.3694, lng: 44.1910, pop: 0.45 },     // Sanaa
    { lat: 21.4225, lng: 39.8262, pop: 0.5 },      // Mecca

    // ── Europe ──────────────────────────────────
    { lat: 51.5074, lng: -0.1278, pop: 0.9 },      // London
    { lat: 48.8566, lng: 2.3522, pop: 0.85 },      // Paris
    { lat: 55.7558, lng: 37.6173, pop: 0.85 },     // Moscow
    { lat: 52.5200, lng: 13.4050, pop: 0.75 },     // Berlin
    { lat: 40.4168, lng: -3.7038, pop: 0.75 },     // Madrid
    { lat: 41.3851, lng: 2.1734, pop: 0.7 },       // Barcelona
    { lat: 41.9028, lng: 12.4964, pop: 0.75 },     // Rome
    { lat: 45.4642, lng: 9.1900, pop: 0.6 },       // Milan
    { lat: 52.3676, lng: 4.9041, pop: 0.6 },       // Amsterdam
    { lat: 50.8503, lng: 4.3517, pop: 0.5 },       // Brussels
    { lat: 48.2082, lng: 16.3738, pop: 0.55 },     // Vienna
    { lat: 47.3769, lng: 8.5417, pop: 0.55 },      // Zurich
    { lat: 46.2044, lng: 6.1432, pop: 0.45 },      // Geneva
    { lat: 50.1109, lng: 8.6821, pop: 0.55 },      // Frankfurt
    { lat: 48.1351, lng: 11.5820, pop: 0.6 },      // Munich
    { lat: 53.3498, lng: -6.2603, pop: 0.5 },      // Dublin
    { lat: 55.9533, lng: -3.1883, pop: 0.45 },     // Edinburgh
    { lat: 59.3293, lng: 18.0686, pop: 0.55 },     // Stockholm
    { lat: 59.9139, lng: 10.7522, pop: 0.5 },      // Oslo
    { lat: 55.6761, lng: 12.5683, pop: 0.5 },      // Copenhagen
    { lat: 60.1699, lng: 24.9384, pop: 0.45 },     // Helsinki
    { lat: 38.7223, lng: -9.1393, pop: 0.5 },      // Lisbon
    { lat: 37.9838, lng: 23.7275, pop: 0.55 },     // Athens
    { lat: 44.4268, lng: 26.1025, pop: 0.45 },     // Bucharest
    { lat: 47.4979, lng: 19.0402, pop: 0.5 },      // Budapest
    { lat: 50.0755, lng: 14.4378, pop: 0.5 },      // Prague
    { lat: 52.2297, lng: 21.0122, pop: 0.55 },     // Warsaw
    { lat: 59.4370, lng: 24.7536, pop: 0.35 },     // Tallinn
    { lat: 56.9496, lng: 24.1052, pop: 0.35 },     // Riga
    { lat: 54.6872, lng: 25.2797, pop: 0.35 },     // Vilnius
    { lat: 53.9006, lng: 27.5590, pop: 0.4 },      // Minsk
    { lat: 50.4501, lng: 30.5234, pop: 0.6 },      // Kyiv
    { lat: 43.7102, lng: 7.2620, pop: 0.35 },      // Nice
    { lat: 45.7640, lng: 4.8357, pop: 0.45 },      // Lyon
    { lat: 43.2965, lng: 5.3698, pop: 0.4 },       // Marseille
    { lat: 43.6047, lng: 1.4442, pop: 0.35 },      // Toulouse
    { lat: 43.7696, lng: 11.2558, pop: 0.4 },      // Florence
    { lat: 40.8518, lng: 14.2681, pop: 0.5 },      // Naples
    { lat: 45.4408, lng: 12.3155, pop: 0.4 },      // Venice
    { lat: 53.5511, lng: 9.9937, pop: 0.5 },       // Hamburg
    { lat: 51.2277, lng: 6.7735, pop: 0.4 },       // Düsseldorf
    { lat: 50.9375, lng: 6.9603, pop: 0.45 },      // Cologne
    { lat: 51.0504, lng: 13.7373, pop: 0.4 },      // Dresden
    { lat: 44.8378, lng: 20.4674, pop: 0.4 },      // Belgrade
    { lat: 42.6977, lng: 23.3219, pop: 0.35 },     // Sofia
    { lat: 45.8150, lng: 15.9819, pop: 0.35 },     // Zagreb
    { lat: 46.0569, lng: 14.5058, pop: 0.3 },      // Ljubljana
    { lat: 43.8563, lng: 18.4131, pop: 0.3 },      // Sarajevo

    // ── North America ───────────────────────────
    { lat: 40.7128, lng: -74.0060, pop: 1 },       // New York
    { lat: 34.0522, lng: -118.2437, pop: 0.9 },    // Los Angeles
    { lat: 41.8781, lng: -87.6298, pop: 0.8 },     // Chicago
    { lat: 29.7604, lng: -95.3698, pop: 0.75 },    // Houston
    { lat: 33.4484, lng: -112.0740, pop: 0.65 },   // Phoenix
    { lat: 39.9526, lng: -75.1652, pop: 0.65 },    // Philadelphia
    { lat: 29.4241, lng: -98.4936, pop: 0.6 },     // San Antonio
    { lat: 32.7767, lng: -96.7970, pop: 0.7 },     // Dallas
    { lat: 37.7749, lng: -122.4194, pop: 0.8 },    // San Francisco
    { lat: 47.6062, lng: -122.3321, pop: 0.65 },   // Seattle
    { lat: 38.9072, lng: -77.0369, pop: 0.7 },     // Washington DC
    { lat: 42.3601, lng: -71.0589, pop: 0.65 },    // Boston
    { lat: 36.1699, lng: -115.1398, pop: 0.65 },   // Las Vegas
    { lat: 25.7617, lng: -80.1918, pop: 0.7 },     // Miami
    { lat: 39.7392, lng: -104.9903, pop: 0.6 },    // Denver
    { lat: 33.7490, lng: -84.3880, pop: 0.65 },    // Atlanta
    { lat: 45.5017, lng: -73.5673, pop: 0.6 },     // Montreal
    { lat: 43.6532, lng: -79.3832, pop: 0.7 },     // Toronto
    { lat: 49.2827, lng: -123.1207, pop: 0.55 },   // Vancouver
    { lat: 45.4215, lng: -75.6972, pop: 0.5 },     // Ottawa
    { lat: 19.4326, lng: -99.1332, pop: 0.85 },    // Mexico City
    { lat: 20.6597, lng: -103.3496, pop: 0.55 },   // Guadalajara
    { lat: 25.6866, lng: -100.3161, pop: 0.55 },   // Monterrey
    { lat: 21.1619, lng: -86.8515, pop: 0.5 },     // Cancún
    { lat: 14.6349, lng: -90.5069, pop: 0.45 },    // Guatemala City
    { lat: 12.1150, lng: -86.2362, pop: 0.35 },    // Managua
    { lat: 9.9281, lng: -84.0907, pop: 0.4 },      // San José (CR)
    { lat: 8.9824, lng: -79.5199, pop: 0.45 },     // Panama City
    { lat: 18.5601, lng: -72.3396, pop: 0.35 },    // Port-au-Prince
    { lat: 18.4861, lng: -69.9312, pop: 0.4 },     // Santo Domingo
    { lat: 23.1136, lng: -82.3666, pop: 0.5 },     // Havana
    { lat: 18.1096, lng: -77.2975, pop: 0.35 },    // Kingston
    { lat: 30.2672, lng: -97.7431, pop: 0.55 },    // Austin
    { lat: 35.2271, lng: -80.8431, pop: 0.5 },     // Charlotte
    { lat: 44.9778, lng: -93.2650, pop: 0.5 },     // Minneapolis
    { lat: 32.7157, lng: -117.1611, pop: 0.55 },   // San Diego
    { lat: 36.1627, lng: -86.7816, pop: 0.45 },    // Nashville
    { lat: 45.5051, lng: -122.6750, pop: 0.5 },    // Portland
    { lat: 51.0447, lng: -114.0719, pop: 0.45 },   // Calgary
    { lat: 53.5461, lng: -113.4938, pop: 0.4 },    // Edmonton
    { lat: 49.8951, lng: -97.1384, pop: 0.4 },     // Winnipeg

    // ── South America ──────────────────────────
    { lat: -23.5505, lng: -46.6333, pop: 0.9 },    // São Paulo
    { lat: -22.9068, lng: -43.1729, pop: 0.8 },    // Rio de Janeiro
    { lat: -34.6037, lng: -58.3816, pop: 0.8 },    // Buenos Aires
    { lat: -33.4489, lng: -70.6693, pop: 0.65 },   // Santiago
    { lat: -12.0464, lng: -77.0428, pop: 0.7 },    // Lima
    { lat: 4.7110, lng: -74.0721, pop: 0.7 },      // Bogotá
    { lat: 10.4806, lng: -66.9036, pop: 0.6 },     // Caracas
    { lat: -0.1807, lng: -78.4678, pop: 0.5 },     // Quito
    { lat: -16.4897, lng: -68.1193, pop: 0.45 },   // La Paz
    { lat: -25.2637, lng: -57.5759, pop: 0.4 },    // Asunción
    { lat: -34.9011, lng: -56.1645, pop: 0.4 },    // Montevideo
    { lat: -15.7975, lng: -47.8919, pop: 0.7 },    // Brasília
    { lat: -3.1190, lng: -60.0217, pop: 0.4 },     // Manaus
    { lat: -12.9714, lng: -38.5124, pop: 0.55 },   // Salvador
    { lat: -8.0476, lng: -34.8770, pop: 0.5 },     // Recife
    { lat: -19.9191, lng: -43.9386, pop: 0.55 },   // Belo Horizonte
    { lat: -25.4284, lng: -49.2733, pop: 0.55 },   // Curitiba
    { lat: -30.0346, lng: -51.2177, pop: 0.5 },    // Porto Alegre
    { lat: 6.2442, lng: -75.5812, pop: 0.55 },     // Medellín
    { lat: -2.1894, lng: -79.8891, pop: 0.45 },    // Guayaquil
    { lat: -13.1631, lng: -72.5450, pop: 0.3 },    // Cusco
    { lat: -31.4201, lng: -64.1888, pop: 0.4 },    // Córdoba (AR)

    // ── Africa ──────────────────────────────────
    { lat: 30.0444, lng: 31.2357, pop: 0.8 },      // Cairo
    { lat: 6.5244, lng: 3.3792, pop: 0.75 },       // Lagos
    { lat: -1.2921, lng: 36.8219, pop: 0.55 },     // Nairobi
    { lat: -33.9249, lng: 18.4241, pop: 0.55 },    // Cape Town
    { lat: -26.2041, lng: 28.0473, pop: 0.6 },     // Johannesburg
    { lat: 33.5731, lng: -7.5898, pop: 0.55 },     // Casablanca
    { lat: 36.8065, lng: 10.1815, pop: 0.4 },      // Tunis
    { lat: 36.7538, lng: 3.0588, pop: 0.5 },       // Algiers
    { lat: 9.0250, lng: 38.7469, pop: 0.5 },       // Addis Ababa
    { lat: 5.6037, lng: -0.1870, pop: 0.45 },      // Accra
    { lat: 14.6928, lng: -17.4467, pop: 0.4 },     // Dakar
    { lat: -4.4419, lng: 15.2663, pop: 0.45 },     // Kinshasa
    { lat: -6.7924, lng: 39.2083, pop: 0.45 },     // Dar es Salaam
    { lat: 0.3476, lng: 32.5825, pop: 0.4 },       // Kampala
    { lat: -15.3875, lng: 28.3228, pop: 0.3 },     // Lusaka
    { lat: -17.8292, lng: 31.0522, pop: 0.3 },     // Harare
    { lat: 12.6392, lng: -8.0029, pop: 0.35 },     // Bamako
    { lat: -18.8792, lng: 47.5079, pop: 0.3 },     // Antananarivo
    { lat: -25.9692, lng: 32.5732, pop: 0.3 },     // Maputo
    { lat: 12.0022, lng: 8.5920, pop: 0.45 },      // Kano
    { lat: 9.0579, lng: 7.4951, pop: 0.5 },        // Abuja
    { lat: -29.8587, lng: 31.0218, pop: 0.4 },     // Durban
    { lat: -33.8688, lng: 25.5701, pop: 0.25 },    // Port Elizabeth
    { lat: 31.6295, lng: -7.9811, pop: 0.4 },      // Marrakech
    { lat: 34.0209, lng: -6.8416, pop: 0.4 },      // Rabat

    // ── Oceania ─────────────────────────────────
    { lat: -33.8688, lng: 151.2093, pop: 0.7 },    // Sydney
    { lat: -37.8136, lng: 144.9631, pop: 0.65 },   // Melbourne
    { lat: -27.4698, lng: 153.0251, pop: 0.5 },    // Brisbane
    { lat: -31.9505, lng: 115.8605, pop: 0.45 },   // Perth
    { lat: -36.8485, lng: 174.7633, pop: 0.45 },   // Auckland
    { lat: -41.2865, lng: 174.7762, pop: 0.35 },   // Wellington
    { lat: -35.2809, lng: 149.1300, pop: 0.4 },    // Canberra
    { lat: -34.9285, lng: 138.6007, pop: 0.4 },    // Adelaide
    { lat: -43.5321, lng: 172.6362, pop: 0.3 },    // Christchurch
    { lat: -12.4634, lng: 130.8456, pop: 0.25 },   // Darwin
    { lat: -16.9186, lng: 145.7781, pop: 0.25 },   // Cairns

    // ── Russia / Central-East ───────────────────
    { lat: 59.9343, lng: 30.3351, pop: 0.7 },      // St Petersburg
    { lat: 56.8389, lng: 60.6057, pop: 0.5 },      // Yekaterinburg
    { lat: 55.0084, lng: 82.9357, pop: 0.45 },     // Novosibirsk
    { lat: 43.1155, lng: 131.8855, pop: 0.35 },    // Vladivostok
    { lat: 54.9885, lng: 73.3242, pop: 0.35 },     // Omsk
    { lat: 56.3269, lng: 44.0059, pop: 0.35 },     // Nizhny Novgorod
    { lat: 55.7963, lng: 49.1088, pop: 0.4 },      // Kazan
    { lat: 53.1959, lng: 50.1002, pop: 0.35 },     // Samara
    { lat: 48.7080, lng: 44.5133, pop: 0.35 },     // Volgograd
    { lat: 47.2357, lng: 39.7015, pop: 0.4 },      // Rostov-on-Don
    { lat: 45.0355, lng: 38.9753, pop: 0.35 },     // Krasnodar
    { lat: 52.2978, lng: 104.2964, pop: 0.3 },     // Irkutsk

    // ── Extra fill cities (global) ──────────────
    { lat: 46.8182, lng: -71.2075, pop: 0.3 },     // Quebec City
    { lat: 44.6488, lng: -63.5752, pop: 0.3 },     // Halifax
    { lat: 47.5615, lng: -52.7126, pop: 0.25 },    // St John's
    { lat: 64.1466, lng: -21.9426, pop: 0.3 },     // Reykjavik
    { lat: 35.6892, lng: -0.6413, pop: 0.3 },      // Oran
    { lat: -1.9403, lng: 29.8739, pop: 0.25 },     // Kigali
    { lat: -3.3731, lng: 29.3644, pop: 0.2 },      // Bujumbura
    { lat: 11.5564, lng: 104.9282, pop: 0.4 },     // Phnom Penh
    { lat: 17.9757, lng: 102.6331, pop: 0.3 },     // Vientiane
    { lat: 4.1755, lng: 73.5093, pop: 0.2 },       // Malé
    { lat: -20.1609, lng: 57.5012, pop: 0.2 },     // Port Louis
    { lat: -4.3188, lng: 55.4513, pop: 0.15 },     // Victoria (Seychelles)
    { lat: 35.1856, lng: 33.3823, pop: 0.3 },      // Nicosia
    { lat: 35.8989, lng: 14.5146, pop: 0.2 },      // Valletta
    { lat: 43.7384, lng: 7.4246, pop: 0.2 },       // Monaco
    { lat: 42.5063, lng: 1.5218, pop: 0.15 },      // Andorra la Vella
    { lat: 49.6117, lng: 6.1300, pop: 0.3 },       // Luxembourg
    { lat: 47.1660, lng: 9.5554, pop: 0.15 },      // Vaduz
    { lat: 43.9424, lng: 12.4578, pop: 0.15 },     // San Marino
    { lat: -13.9626, lng: 33.7741, pop: 0.25 },    // Lilongwe
    { lat: 11.8251, lng: 42.5903, pop: 0.15 },     // Djibouti
    { lat: 2.0469, lng: 45.3182, pop: 0.3 },       // Mogadishu
    { lat: 15.5007, lng: 32.5599, pop: 0.35 },     // Khartoum
    { lat: 4.8594, lng: 31.5713, pop: 0.2 },       // Juba
    { lat: 12.1348, lng: 15.0557, pop: 0.25 },     // N'Djamena
    { lat: 13.5127, lng: 2.1128, pop: 0.25 },      // Niamey
    { lat: 12.3714, lng: -1.5197, pop: 0.25 },     // Ouagadougou
    { lat: 6.3703, lng: 2.3912, pop: 0.25 },       // Cotonou
    { lat: 6.1256, lng: 1.2254, pop: 0.2 },        // Lomé
    { lat: -8.8383, lng: 13.2344, pop: 0.35 },     // Luanda
    { lat: -22.5597, lng: 17.0832, pop: 0.2 },     // Windhoek
    { lat: -24.6282, lng: 25.9231, pop: 0.2 },     // Gaborone
    { lat: -29.3167, lng: 27.4833, pop: 0.15 },    // Maseru
    { lat: -26.3054, lng: 31.1367, pop: 0.15 },    // Mbabane

    // ── China extra cities ──────────────────────
    { lat: 22.5431, lng: 114.0579, pop: 0.8 },     // Shenzhen
    { lat: 30.5728, lng: 104.0668, pop: 0.7 },     // Chengdu
    { lat: 29.5630, lng: 106.5516, pop: 0.65 },    // Chongqing
    { lat: 34.2658, lng: 108.9541, pop: 0.6 },     // Xi'an
    { lat: 30.2741, lng: 120.1551, pop: 0.7 },     // Hangzhou
    { lat: 32.0603, lng: 118.7969, pop: 0.6 },     // Nanjing
    { lat: 36.0671, lng: 120.3826, pop: 0.55 },    // Qingdao
    { lat: 23.0200, lng: 113.7518, pop: 0.55 },    // Dongguan
    { lat: 38.9140, lng: 121.6147, pop: 0.5 },     // Dalian
    { lat: 45.7500, lng: 126.6500, pop: 0.5 },     // Harbin
    { lat: 43.8800, lng: 125.3228, pop: 0.4 },     // Changchun
    { lat: 41.8057, lng: 123.4315, pop: 0.55 },    // Shenyang
    { lat: 28.2280, lng: 112.9388, pop: 0.55 },    // Changsha
    { lat: 26.0745, lng: 119.2965, pop: 0.45 },    // Fuzhou
    { lat: 24.4798, lng: 118.0894, pop: 0.45 },    // Xiamen
    { lat: 36.6512, lng: 117.1201, pop: 0.5 },     // Jinan
    { lat: 34.7472, lng: 113.6249, pop: 0.55 },    // Zhengzhou
    { lat: 30.5844, lng: 114.2986, pop: 0.6 },     // Wuhan
    { lat: 25.2900, lng: 110.2900, pop: 0.35 },    // Guilin
    { lat: 22.8170, lng: 108.3665, pop: 0.45 },    // Nanning
    { lat: 26.6470, lng: 106.6302, pop: 0.45 },    // Guiyang
    { lat: 25.0389, lng: 102.7183, pop: 0.45 },    // Kunming

    // ── Japan extra ─────────────────────────────
    { lat: 43.0621, lng: 141.3544, pop: 0.45 },    // Sapporo
    { lat: 35.1815, lng: 136.9066, pop: 0.55 },    // Nagoya
    { lat: 33.5904, lng: 130.4017, pop: 0.5 },     // Fukuoka
    { lat: 34.3853, lng: 132.4553, pop: 0.4 },     // Hiroshima
    { lat: 38.2682, lng: 140.8694, pop: 0.45 },    // Sendai

    // ── Extra USA / Canada ──────────────────────
    { lat: 21.3069, lng: -157.8583, pop: 0.45 },   // Honolulu
    { lat: 61.2181, lng: -149.9003, pop: 0.2 },    // Anchorage
    { lat: 28.5383, lng: -81.3792, pop: 0.55 },    // Orlando
    { lat: 27.9506, lng: -82.4572, pop: 0.5 },     // Tampa
    { lat: 42.3314, lng: -83.0458, pop: 0.5 },     // Detroit
    { lat: 39.7684, lng: -86.1581, pop: 0.4 },     // Indianapolis
    { lat: 38.2527, lng: -85.7585, pop: 0.35 },    // Louisville
    { lat: 35.1495, lng: -90.0490, pop: 0.4 },     // Memphis
    { lat: 29.9511, lng: -90.0715, pop: 0.5 },     // New Orleans
    { lat: 40.4406, lng: -79.9959, pop: 0.45 },    // Pittsburgh
    { lat: 39.1031, lng: -84.5120, pop: 0.45 },    // Cincinnati
    { lat: 41.4993, lng: -81.6944, pop: 0.45 },    // Cleveland
    { lat: 43.0389, lng: -87.9065, pop: 0.45 },    // Milwaukee
    { lat: 35.0844, lng: -106.6504, pop: 0.35 },   // Albuquerque
    { lat: 36.7468, lng: -119.7726, pop: 0.4 },    // Fresno
    { lat: 37.3382, lng: -121.8863, pop: 0.55 },   // San Jose
    { lat: 46.8139, lng: -100.7690, pop: 0.15 },   // Bismarck
];
