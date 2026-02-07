// Comprehensive list of cities in India and neighboring countries
export const INDIAN_CITIES = [
    // === INDIA - METRO CITIES ===
    'Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad',

    // === INDIA - TIER 1 CITIES ===
    'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam',
    'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi',
    'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Prayagraj',
    'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur',
    'Madurai', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli-Dharwad',

    // === INDIA - TIER 2 CITIES ===
    'Mysore', 'Tiruchirappalli', 'Bareilly', 'Salem', 'Warangal', 'Guntur', 'Bhiwandi',
    'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati', 'Noida', 'Jamshedpur', 'Bhilai',
    'Cuttack', 'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun', 'Durgapur',
    'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar',
    'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar', 'Jammu', 'Mangalore', 'Erode',
    'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur',
    'Maheshtala', 'Davanagere', 'Kozhikode', 'Kurnool', 'Rajpur Sonarpur', 'Bokaro',
    'South Dumdum', 'Bellary', 'Patiala', 'Gopalpur', 'Agartala', 'Bhagalpur', 'Muzaffarnagar',
    'Bhatpara', 'Panihati', 'Latur', 'Dhule', 'Rohtak', 'Korba', 'Bhilwara', 'Berhampur',
    'Muzaffarpur', 'Ahmednagar', 'Mathura', 'Kollam', 'Bilaspur', 'Shahjahanpur', 'Thrissur',
    'Alwar', 'Kakinada', 'Nizamabad', 'Sagar', 'Tumkur', 'Hisar', 'Sangli-Miraj', 'Imphal',
    'Parbhani', 'Sikar', 'Sambalpur', 'Rampur', 'Shimoga', 'Kupwara',

    // === INDIA - ALL STATE CAPITALS ===
    'Dispur', 'Itanagar', 'Gangtok', 'Shillong', 'Aizawl', 'Kohima', 'Imphal', 'Panaji', 'Kavaratti',
    'Port Blair', 'Thiruvananthapuram', 'Bhopal', 'Raipur', 'Ranchi', 'Bhubaneswar', 'Kolkata',
    'Patna', 'Lucknow', 'Dehradun', 'Shimla', 'Chandigarh', 'Jaipur', 'Gandhi Nagar', 'Mumbai',
    'Hyderabad', 'Amaravati', 'Bengaluru', 'Chennai',

    // === INDIA - POPULAR TOURIST DESTINATIONS ===
    'Goa', 'Manali', 'Shimla', 'Ooty', 'Darjeeling', 'Munnar', 'Jaisalmer', 'Rishikesh', 'Haridwar',
    'Kedarnath', 'Badrinath', 'Amarnath', 'Vaishno Devi', 'Tirupati', 'Shirdi', 'Ajanta', 'Ellora',
    'Khajuraho', 'Hampi', 'Mahabalipuram', 'Pondicherry', 'Kodaikanal', 'Nainital', 'Mussoorie',
    'Mcleodganj', 'Dharamshala', 'Leh', 'Ladakh', 'Spiti', 'Andaman', 'Nicobar', 'Lakshadweep',

    // === INDIA - HILL STATIONS ===
    'Kullu', 'Kasol', 'Tirthan Valley', 'Bir', 'Kasauli', 'Dalhousie', 'Kufri', 'Chail', 'Naldehra',
    'Coorg', 'Wayanad', 'Yercaud', 'Coonoor', 'Shillong', 'Gangtok', 'Pelling', 'Lachung', 'Ravangla',
    'Auli', 'Chopta', 'Lansdowne', 'Ranikhet', 'Almora', 'Kausani', 'Bhimtal', 'Sattal', 'Mukteshwar',
    'Lonavala', 'Mahabaleshwar', 'Panchgani', 'Matheran', 'Mount Abu', 'Lavasa', 'Igatpuri',

    // === INDIA - BEACH DESTINATIONS ===
    'Gokarna', 'Varkala', 'Kovalam', 'Puri', 'Digha', 'Mandarmani', 'Tarkarli', 'Alibaug', 'Diu', 'Daman',
    'Puducherry', 'Kanyakumari', 'Rameswaram', 'Marari', 'Bekal', 'Ganpatipule', 'Murudeshwar',

    // === INDIA - WILDLIFE & NATURE ===
    'Ranthambore', 'Jim Corbett', 'Kaziranga', 'Bandhavgarh', 'Kanha', 'Periyar', 'Bandipur',
    'Nagarhole', 'Sundarbans', 'Gir', 'Sariska', 'Bharatpur', 'Pench', 'Tadoba', 'Dudhwa',

    // === INDIA - ADVENTURE & TREKKING ===
    'Triund', 'Valley of Flowers', 'Roopkund', 'Kedarkantha', 'Har Ki Dun', 'Sandakphu', 'Dzongri',
    'Goechala', 'Hampta Pass', 'Pin Parvati', 'Stok Kangri', 'Chadar Trek', 'Rupin Pass',

    // === INDIA - RELIGIOUS PLACES ===
    'Vrindavan', 'Mathura', 'Ayodhya', 'Dwarka', 'Puri', 'Kashi', 'Bodh Gaya', 'Sarnath', 'Rajgir',
    'Pushkar', 'Ajmer', 'Nathdwara', 'Somnath', 'Palitana', 'Madurai', 'Rameshwaram', 'Kanchipuram',
    'Chidambaram', 'Thanjavur', 'Srirangam', 'Guruvayur', 'Sabarimala', 'Velankanni', 'Shravanabelagola',

    // === INDIA - NORTHEAST ===
    'Tawang', 'Ziro', 'Bomdila', 'Dirang', 'Nameri', 'Majuli', 'Jorhat', 'Tezpur', 'Haflong',
    'Dawki', 'Cherrapunji', 'Mawlynnong', 'Mawsynram', 'Jowai', 'Kohima', 'Dzukou Valley',
    'Loktak Lake', 'Aizawl', 'Champhai', 'Lunglei', 'Tripura', 'Udaipur Tripura',

    // === NEPAL ===
    'Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Birgunj', 'Dharan', 'Bharatpur', 'Butwal',
    'Hetauda', 'Bhaktapur', 'Janakpur', 'Nepalgunj', 'Lumbini', 'Chitwan', 'Nagarkot', 'Dhulikhel',
    'Bandipur Nepal', 'Namche Bazaar', 'Lukla', 'Everest Base Camp', 'Annapurna',

    // === BHUTAN ===
    'Thimphu', 'Paro', 'Punakha', 'Bumthang', 'Phuentsholing', 'Wangdue Phodrang', 'Haa', 'Trongsa',
    'Trashigang', 'Jakar', 'Mongar', 'Zhemgang', 'Tigers Nest',

    // === BANGLADESH ===
    'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Rangpur', 'Comilla', 'Gazipur',
    'Narayanganj', 'Mymensingh', 'Barisal', 'Jessore', 'Bogra', 'Dinajpur', 'Cox Bazar',
    'Sundarbans Bangladesh', 'Saint Martin Island', 'Srimangal',

    // === SRI LANKA ===
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Anuradhapura', 'Trincomalee', 'Batticaloa',
    'Nuwara Eliya', 'Bentota', 'Hikkaduwa', 'Mirissa', 'Ella', 'Sigiriya', 'Dambulla', 'Polonnaruwa',
    'Arugam Bay', 'Tangalle', 'Unawatuna', 'Yala', 'Adam Peak',

    // === PAKISTAN (Accessible areas) ===
    'Lahore', 'Islamabad', 'Karachi', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad', 'Rawalpindi',
    'Hunza', 'Swat Valley', 'Skardu', 'Gilgit', 'Naran Kaghan', 'Murree', 'Taxila',

    // === MYANMAR ===
    'Yangon', 'Mandalay', 'Bagan', 'Inle Lake', 'Ngapali', 'Mrauk U', 'Naypyidaw', 'Pyin Oo Lwin',
    'Kyaiktiyo', 'Hpa An', 'Mawlamyine',

    // === THAILAND ===
    'Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi', 'Koh Samui', 'Koh Phi Phi', 'Hua Hin',
    'Ayutthaya', 'Kanchanaburi', 'Chiang Rai', 'Pai', 'Koh Lipe', 'Koh Tao', 'Railay Beach'
].sort();

// Filter cities based on search query
export const filterCities = (query: string): string[] => {
    if (!query || query.trim().length === 0) return [];

    const searchTerm = query.toLowerCase().trim();
    return INDIAN_CITIES.filter(city =>
        city.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Limit to 10 suggestions
};
