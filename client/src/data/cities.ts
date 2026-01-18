// Popular Indian cities for autocomplete
export const INDIAN_CITIES = [
    // Metro Cities
    'Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad',

    // Tier 1 Cities
    'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
    'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi',
    'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad',
    'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada',

    // Popular Tourist Destinations
    'Goa', 'Manali', 'Shimla', 'Ooty', 'Darjeeling', 'Munnar', 'Udaipur', 'Jaisalmer',
    'Rishikesh', 'Haridwar', 'Kedarnath', 'Badrinath', 'Amarnath', 'Vaishno Devi',
    'Tirupati', 'Shirdi', 'Ajanta', 'Ellora', 'Khajuraho', 'Hampi', 'Mahabalipuram',
    'Pondicherry', 'Kodaikanal', 'Nainital', 'Mussoorie', 'Mcleodganj', 'Dharamshala',
    'Leh', 'Ladakh', 'Spiti', 'Andaman', 'Nicobar', 'Lakshadweep',

    // Hill Stations
    'Kullu', 'Kasol', 'Tirthan Valley', 'Bir', 'Kasauli', 'Dalhousie', 'Kufri',
    'Coorg', 'Wayanad', 'Yercaud', 'Coonoor', 'Shillong', 'Gangtok', 'Pelling',
    'Auli', 'Chopta', 'Lansdowne', 'Ranikhet', 'Almora', 'Kausani', 'Bhimtal',
    'Lonavala', 'Mahabaleshwar', 'Panchgani', 'Matheran', 'Mount Abu',

    // Beach Destinations
    'Gokarna', 'Varkala', 'Kovalam', 'Puri', 'Digha', 'Mandarmani', 'Tarkarli',
    'Alibaug', 'Diu', 'Daman', 'Puducherry', 'Kanyakumari', 'Rameswaram',

    // Adventure & Trekking
    'Triund', 'Valley of Flowers', 'Roopkund', 'Kedarkantha', 'Har Ki Dun',
    'Sandakphu', 'Dzongri', 'Goechala', 'Hampta Pass', 'Pin Parvati',

    // Wildlife & Nature
    'Ranthambore', 'Jim Corbett', 'Kaziranga', 'Bandhavgarh', 'Kanha',
    'Periyar', 'Bandipur', 'Nagarhole', 'Sundarbans', 'Gir',

    // Other Cities
    'Jodhpur', 'Bikaner', 'Pushkar', 'Ajmer', 'Mathura', 'Vrindavan',
    'Mysore', 'Madurai', 'Kochi', 'Trivandrum', 'Calicut', 'Mangalore',
    'Surat', 'Bhubaneswar', 'Cuttack', 'Imphal', 'Kohima', 'Itanagar',
    'Chandigarh', 'Dehradun', 'Jammu', 'Pathankot', 'Siliguri', 'Jalpaiguri'
].sort();

// Filter cities based on search query
export const filterCities = (query: string): string[] => {
    if (!query || query.trim().length === 0) return [];

    const searchTerm = query.toLowerCase().trim();
    return INDIAN_CITIES.filter(city =>
        city.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Limit to 10 suggestions
};
