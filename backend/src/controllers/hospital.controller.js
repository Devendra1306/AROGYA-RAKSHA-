const aiGateway = require('../services/aiGateway.service');

const MOCK_HOSPITALS = [
  {
    _id: 'hosp1',
    name: 'Apollo Hospital Secunderabad',
    address: 'Secunderabad, Hyderabad, Telangana',
    latitude: 17.4420,
    longitude: 78.4960,
    phone: '+91 40 2771 8888',
    rating: 4.6,
    reviewCount: 1245,
    category: 'Hospitals',
    specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Emergency Medicine', 'General Medicine', 'ENT'],
    services: ['Emergency Care', 'ICU', 'Ambulance', 'Pharmacy', 'Laboratory', 'Radiology', 'Blood Bank'],
    emergencyAvailable: true,
    open24_7: true,
    openingHours: '24 Hours',
    website: 'https://www.apollohospitals.com',
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=60',
    reviewSummary: 'Highly recommended for emergency cardiology treatments and round-the-clock intensive care unit facilities.',
    reviews: [
      { author: 'Rahul Sharma', rating: 5, text: 'Swiftest emergency care! Admitted my father during a cardiac event and the doctors acted instantly.', date: '2026-05-12' },
      { author: 'Sneha Reddy', rating: 4, text: 'Very clean and professional. The pharmacy is fully functional 24/7.', date: '2026-05-22' },
      { author: 'Vikram Rao', rating: 5, text: 'Superb doctors, especially in cardiology. Support staff was very helpful.', date: '2026-05-30' }
    ]
  },
  {
    _id: 'hosp2',
    name: 'Care Hospital Banjara Hills',
    address: 'Road No 1, Banjara Hills, Hyderabad, Telangana',
    latitude: 17.4143,
    longitude: 78.4482,
    phone: '+91 40 6165 6565',
    rating: 4.4,
    reviewCount: 932,
    category: 'Hospitals',
    specialties: ['Cardiology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Emergency Medicine'],
    services: ['Emergency Care', 'ICU', 'Pharmacy', 'Laboratory', 'Radiology'],
    emergencyAvailable: true,
    open24_7: true,
    openingHours: '24 Hours',
    website: 'https://www.carehospitals.com',
    image: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=600&auto=format&fit=crop&q=60',
    reviewSummary: 'Great clinical staff and comfortable pediatric wards. Fast radiology turnaround.',
    reviews: [
      { author: 'Kiran Goud', rating: 4, text: 'Excellent pediatrician checkups. The waiting area is spacious and clean.', date: '2026-04-18' },
      { author: 'Ananya Deshmukh', rating: 5, text: 'Outstanding orthopedic wing. Clean and friendly environment.', date: '2026-05-05' }
    ]
  },
  {
    _id: 'hosp3',
    name: 'Yashoda Hospital Secunderabad',
    address: 'Alexander Road, Secunderabad, Hyderabad, Telangana',
    latitude: 17.4475,
    longitude: 78.4990,
    phone: '+91 40 4567 4567',
    rating: 4.7,
    reviewCount: 1845,
    category: 'Hospitals',
    specialties: ['Neurology', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Emergency Medicine', 'ENT'],
    services: ['Emergency Care', 'ICU', 'Ambulance', 'Pharmacy', 'Laboratory', 'Blood Bank'],
    emergencyAvailable: true,
    open24_7: true,
    openingHours: '24 Hours',
    website: 'https://www.yashodahospitals.com',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=60',
    reviewSummary: 'Top-tier neurology surgeries and state-of-the-art diagnostic imaging scans.',
    reviews: [
      { author: 'Siddharth Nair', rating: 5, text: 'My mother underwent a complex brain surgery here. The neurosurgery team is stellar.', date: '2026-05-10' },
      { author: 'Priyanka Sen', rating: 4, text: 'Efficient diagnostics. We got our laboratory test results online in 3 hours.', date: '2026-05-24' }
    ]
  },
  {
    _id: 'hosp4',
    name: 'Begumpet Childrens & Family Clinic',
    address: 'Begumpet Main Road, Hyderabad, Telangana',
    latitude: 17.4410,
    longitude: 78.4895,
    phone: '+91 40 2341 5566',
    rating: 4.3,
    reviewCount: 156,
    category: 'Clinics',
    specialties: ['Pediatrics', 'General Medicine', 'Dermatology'],
    services: ['Pharmacy', 'Laboratory'],
    emergencyAvailable: false,
    open24_7: false,
    openingHours: '9:00 AM - 8:00 PM',
    website: 'https://www.begumpetclinic.com',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=60',
    reviewSummary: 'Empathetic child specialists with excellent outpatient care timelines.',
    reviews: [
      { author: 'Meera Rao', rating: 5, text: 'Dr. Ramesh is fantastic with kids. Highly recommended pediatrician.', date: '2026-05-02' },
      { author: 'David Kumar', rating: 4, text: 'Very short wait times and affordable consultation charges.', date: '2026-05-18' }
    ]
  },
  {
    _id: 'hosp5',
    name: 'Ameerpet Skin & Dermatology Clinic',
    address: 'Ameerpet Cross Roads, Hyderabad, Telangana',
    latitude: 17.4360,
    longitude: 78.4550,
    phone: '+91 40 4004 8899',
    rating: 4.5,
    reviewCount: 204,
    category: 'Clinics',
    specialties: ['Dermatology'],
    services: ['Laboratory'],
    emergencyAvailable: false,
    open24_7: false,
    openingHours: '10:00 AM - 7:00 PM',
    website: 'https://www.ameerpeetskinclinic.com',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=60',
    reviewSummary: 'Highly detailed consultations and effective clinical dermatology treatments.',
    reviews: [
      { author: 'Tanmay Gupta', rating: 5, text: 'Cleared up my acne issues in just three visits. Highly professional doctor.', date: '2026-04-29' },
      { author: 'Jyothi Naidu', rating: 4, text: 'Neat clinic layout. Standard pricing structure.', date: '2026-05-11' }
    ]
  },
  {
    _id: 'hosp6',
    name: 'MedPlus Pharmacy & Wellness',
    address: 'Begumpet Main Road, Hyderabad, Telangana',
    latitude: 17.4430,
    longitude: 78.4900,
    phone: '+91 40 2341 9999',
    rating: 4.1,
    reviewCount: 310,
    category: 'Pharmacies',
    specialties: ['General Medicine'],
    services: ['Pharmacy'],
    emergencyAvailable: false,
    open24_7: true,
    openingHours: '24 Hours',
    website: 'https://www.medplusindia.com',
    image: 'https://images.unsplash.com/photo-1607619056574-7b8f304b3c93?w=600&auto=format&fit=crop&q=60',
    reviewSummary: 'Extremely quick service, 24/7 delivery options, and fully-stocked shelves.',
    reviews: [
      { author: 'Harish Babu', rating: 5, text: 'They always have all the prescribed medicines in stock. 24 hours open!', date: '2026-05-14' },
      { author: 'Nalini V', rating: 3, text: 'Home delivery takes some time, but store pickup is immediate.', date: '2026-05-20' }
    ]
  },
  {
    _id: 'hosp7',
    name: 'Apollo Pharmacy 24/7',
    address: 'Sardar Patel Road, Secunderabad, Telangana',
    latitude: 17.4395,
    longitude: 78.4975,
    phone: '+91 40 2772 1100',
    rating: 4.3,
    reviewCount: 420,
    category: 'Pharmacies',
    specialties: ['General Medicine'],
    services: ['Pharmacy'],
    emergencyAvailable: false,
    open24_7: true,
    openingHours: '24 Hours',
    website: 'https://www.apollopharmacy.in',
    image: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600&auto=format&fit=crop&q=60',
    reviewSummary: 'Professional pharmacists, offering instant generic alternatives and drug guidelines.',
    reviews: [
      { author: 'Manish Verma', rating: 5, text: 'Great discounts on healthcare products and prompt support.', date: '2026-05-02' }
    ]
  },
  {
    _id: 'hosp8',
    name: 'Vijaya Diagnostic Center',
    address: 'Begumpet Pillar 124, Hyderabad, Telangana',
    latitude: 17.4350,
    longitude: 78.4850,
    phone: '+91 40 4848 9999',
    rating: 4.2,
    reviewCount: 512,
    category: 'Diagnostic Centers',
    specialties: ['General Medicine'],
    services: ['Laboratory', 'Radiology'],
    emergencyAvailable: false,
    open24_7: false,
    openingHours: '7:00 AM - 9:00 PM',
    website: 'https://www.vijayadiagnostic.com',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=60',
    reviewSummary: 'Extremely accurate lab reporting. Best imaging machinery in Secunderabad.',
    reviews: [
      { author: 'Pranav Shah', rating: 4, text: 'Very efficient blood sample collection. Got the report on WhatsApp.', date: '2026-05-15' }
    ]
  },
  {
    _id: 'hosp9',
    name: 'Red Cross Emergency Ambulance Services',
    address: 'Nampally Station Road, Hyderabad, Telangana',
    latitude: 17.4380,
    longitude: 78.4930,
    phone: '+91 40 2465 7777',
    rating: 4.5,
    reviewCount: 88,
    category: 'Ambulance Services',
    specialties: ['Emergency Medicine'],
    services: ['Ambulance'],
    emergencyAvailable: true,
    open24_7: true,
    openingHours: '24 Hours',
    website: 'https://www.redcross.org.in',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=60',
    reviewSummary: 'Rapid ambulance dispatch within Begumpet. Cardiac life support ready.',
    reviews: [
      { author: 'Lokesh Gowda', rating: 5, text: 'Dispatched cardiac ICU ambulance within 8 minutes of calling.', date: '2026-05-19' }
    ]
  },
  {
    _id: 'hosp10',
    name: 'Lifeline 24/7 Cardiac Ambulance Services',
    address: 'Jubilee Hills Check Post, Hyderabad, Telangana',
    latitude: 17.4320,
    longitude: 78.4350,
    phone: '+91 99887 76655',
    rating: 4.8,
    reviewCount: 65,
    category: 'Ambulance Services',
    specialties: ['Emergency Medicine'],
    services: ['Ambulance'],
    emergencyAvailable: true,
    open24_7: true,
    openingHours: '24 Hours',
    website: 'https://www.lifelineambulances.com',
    image: 'https://images.unsplash.com/photo-1617462181514-6bb7f7f8ea69?w=600&auto=format&fit=crop&q=60',
    reviewSummary: 'Highly equipped life support systems and paramedics who handle trauma shifts expertly.',
    reviews: [
      { author: 'Arjun Sen', rating: 5, text: 'Outstanding support during transfer of patient on ventilator support.', date: '2026-05-22' }
    ]
  }
];

function getDistance(lat1, lon1, lat2, lon2) {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const dist = Math.sqrt(dLat * dLat + dLon * dLon) * 111.32;
  return Number(dist.toFixed(1));
}

const hospitalController = {
  getNearby: async (req, res) => {
    const { lat, lng, category } = req.query;
    
    const userLat = lat ? Number(lat) : 17.4399;
    const userLng = lng ? Number(lng) : 78.4983;

    try {
      let list = MOCK_HOSPITALS.map(h => ({
        ...h,
        distance: getDistance(userLat, userLng, h.latitude, h.longitude)
      }));

      // Sort by distance
      list.sort((a, b) => a.distance - b.distance);

      // Filter by category if specified
      if (category) {
        list = list.filter(h => h.category.toLowerCase() === category.toLowerCase());
      }

      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getDetails: async (req, res) => {
    const { id } = req.params;
    try {
      const hospital = MOCK_HOSPITALS.find(h => h._id === id);
      if (!hospital) return res.status(404).json({ error: 'Healthcare facility not found.' });
      
      const distance = getDistance(17.4399, 78.4983, hospital.latitude, hospital.longitude);

      res.json({
        ...hospital,
        distance
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  aiSearch: async (req, res) => {
    const { query, lat, lng } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const userLat = lat ? Number(lat) : 17.4399;
    const userLng = lng ? Number(lng) : 78.4983;

    try {
      const prompt = `Analyze this user query for finding healthcare facilities near them:
      "${query}"
      
      Extract the search filters into a clean JSON block. The JSON block should match this schema exactly:
      {
        "category": "Hospitals" | "Clinics" | "Pharmacies" | "Diagnostic Centers" | "Ambulance Services" | null,
        "specialty": "Cardiology" | "Neurology" | "Orthopedics" | "Pediatrics" | "Dermatology" | "Emergency Medicine" | "ENT" | "General Medicine" | "Ophthalmology" | null,
        "openNow": boolean,
        "emergencyAvailable": boolean,
        "open24_7": boolean,
        "minRating": number | null,
        "searchKeyword": string | null
      }
      Return ONLY the raw JSON block without markdown formatting or backticks.`;

      const aiResponse = await aiGateway.generateRaw(null, prompt);
      let text = aiResponse.trim();
      if (text.startsWith('```json')) {
        text = text.substring(7, text.length - 3).trim();
      } else if (text.startsWith('```')) {
        text = text.substring(3, text.length - 3).trim();
      }

      let filters = {};
      try {
        filters = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse AI search filters:', err.message);
        // Basic keyword fallbacks
        const queryLower = query.toLowerCase();
        filters = {
          category: queryLower.includes('pharmacy') ? 'Pharmacies' : queryLower.includes('clinic') ? 'Clinics' : queryLower.includes('ambulance') ? 'Ambulance Services' : queryLower.includes('diagnostic') ? 'Diagnostic Centers' : 'Hospitals',
          emergencyAvailable: queryLower.includes('emergency') || queryLower.includes('er') || queryLower.includes('icu'),
          open24_7: queryLower.includes('24 hour') || queryLower.includes('24/7') || queryLower.includes('night')
        };
      }

      // Query mock data and filter
      let list = MOCK_HOSPITALS.map(h => ({
        ...h,
        distance: getDistance(userLat, userLng, h.latitude, h.longitude)
      }));

      // Apply Filters
      if (filters.category) {
        list = list.filter(h => h.category.toLowerCase() === filters.category.toLowerCase());
      }
      if (filters.specialty) {
        list = list.filter(h => h.specialties?.some(s => s.toLowerCase() === filters.specialty.toLowerCase()));
      }
      if (filters.emergencyAvailable) {
        list = list.filter(h => h.emergencyAvailable === true);
      }
      if (filters.open24_7) {
        list = list.filter(h => h.open24_7 === true);
      }
      if (filters.minRating) {
        list = list.filter(h => h.rating >= filters.minRating);
      }
      if (filters.searchKeyword) {
        const stopWords = new Set(['find', 'show', 'best', 'near', 'me', 'nearby', 'for', 'with', 'and', 'a', 'the', 'of', 'in', 'at']);
        const words = filters.searchKeyword
          .toLowerCase()
          .split(/[\s,]+/)
          .filter(w => w.length > 2 && !stopWords.has(w));
          
        if (words.length > 0) {
          list = list.filter(h => {
            const name = h.name.toLowerCase();
            const address = h.address.toLowerCase();
            const category = h.category.toLowerCase();
            const specialties = h.specialties?.map(s => s.toLowerCase()) || [];
            const services = h.services?.map(s => s.toLowerCase()) || [];
            
            return words.some(word => 
              name.includes(word) || 
              address.includes(word) || 
              category.includes(word) ||
              specialties.some(s => s.includes(word)) ||
              services.some(s => s.includes(word))
            );
          });
        }
      }

      list.sort((a, b) => a.distance - b.distance);

      res.json({
        filters,
        results: list
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = hospitalController;
