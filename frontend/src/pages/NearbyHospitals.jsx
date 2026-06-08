import React, { useState, useEffect, useRef } from 'react';
import { api } from '../context/AuthContext';

// Hardcoded specialists matching the MAPSS template images & details
const TOP_SPECIALISTS = [
  { 
    name: 'Dr. Alok Sharma', 
    specialty: 'Cardiology', 
    exp: '15 Yrs Exp', 
    rating: '4.9', 
    reviews: '120 reviews', 
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgscPW5JrGAMiQeouB-8pAiMu3432k0Y4a0E5XAEmfO5ZkCp0oc8sUcO8Iwm90nhN5ciM-mmD39CutKgnEQ2KsBU5WFik9z8qQ-cGlSUoxUPrHGyybX5LAMxWBTKlfb71RoDclqXEiqUtA9pTMDB_YCfaichDm7i_cxSA0PZQyKUxgYcfvRaTWDqeOe_7TiMrSn5hVR9dON1YB0azXQ2TLYAJeQDMUzSRCN3pTaquZe4XmyMwv3Lr-wbVvG0evqUhXU4Q9J-yLihk' 
  },
  { 
    name: 'Dr. Priya Iyer', 
    specialty: 'Pediatrics', 
    exp: '10 Yrs Exp', 
    rating: '4.8', 
    reviews: '85 reviews', 
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjNEsr8TmQjByMwb2Xuh5L9UgldUPIMGLi802lGa4Ae54SZ6bN0b2p0OuT2yTMcU1DSPxWz8uSlnexhyY0ddB5z-WVIIANkP_N1Yz0gAl0SLaTg0tFFp9gDBKsSxjiG-5FZTuSRzzd1NgouJ2srlEXxI_fJKaurC0EOiJkCdGxoLrC5bGnvuLSZ-Uo-ytO92IpSxPBp19vuqPa2UkEjSKxbQuzQzjFaib1BujP0TghfzagKnY3albtDGos6AyRNPpAnmd5NfQLF3M' 
  },
  { 
    name: 'Dr. Robert Chen', 
    specialty: 'Neurology', 
    exp: '22 Yrs Exp', 
    rating: '5.0', 
    reviews: '210 reviews', 
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZfgbTGZxQ5R899fmEDBATERwY5Jjd5cU-Xvpvb4isWDtEgo4pXCqx5voBvdq8BD_UaDB5yiH-RSxSGSFP9YKk2c1nVX4GfByweKNEJfkKNKzUF53orSOc-9ChUzZRhG3Eb7Mt0XbGkPmUsFSXVKAmI5Pul4x2ImI53-5zjoSFkR5RETPADMWFElOzrVCOhzsXXqhlTjZ8c7NjHDlBcQp3DPyPjXzuKtV_YgT6Z21-PvESALvSaxrdioMn3TAe9pzi4RB62snm8F0' 
  }
];

// Live Alerts matching the templates
const LIVE_ALERTS = [
  { 
    type: 'HIGH ALERT', 
    title: 'Flu Season Spike', 
    desc: 'Case numbers up 25% this week. Vaccinations recommended for seniors.', 
    badgeClass: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' 
  },
  { 
    type: 'COMMUNITY', 
    title: 'Blood Donation Drive', 
    desc: 'City Hospital is facing O-ve shortage. Walk-ins open until 8 PM.', 
    badgeClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50' 
  },
  { 
    type: 'HEALTH TIPS', 
    title: 'Hydration Guidelines', 
    desc: 'Heatwave alert: Increase water intake by 1L during daylight hours.', 
    badgeClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50' 
  }
];

// Care History matching the templates
const CARE_HISTORY = [
  { title: 'Antibiotic Course', status: 'Ends in 2 days', icon: 'pill', iconColor: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/30' },
  { title: 'Blood Test Result', status: 'Verified by Dr. Sharma', icon: 'check_circle', iconColor: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/30' }
];

// Dynamically generate clinical stats and capacities based on place id/name
const getFacilityMetrics = (hosp) => {
  if (!hosp) return null;
  
  const getHash = (str, seed = 0) => {
    let hash = seed;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const id = hosp.place_id || hosp._id || 'default';
  const hashVal = getHash(id);
  const category = hosp.category || 'Hospitals';
  
  let stats = {
    beds: '1,200+',
    specialists: '450+',
    years: '45 Years'
  };
  
  let capacity = {
    icuAvailable: 12,
    icuOccupancy: 85,
    generalAvailable: 48,
    generalOccupancy: 62,
    ventAvailable: 8,
    ventOccupancy: 40
  };

  let departments = [];
  let journey = [];

  if (category === 'Hospitals') {
    stats = {
      beds: `${300 + (hashVal % 900)}+`,
      specialists: `${120 + (hashVal % 330)}+`,
      years: `${10 + (hashVal % 40)} Years`
    };
    capacity = {
      icuAvailable: 2 + (hashVal % 18),
      icuOccupancy: 65 + (hashVal % 30),
      generalAvailable: 15 + (hashVal % 75),
      generalOccupancy: 45 + (hashVal % 45),
      ventAvailable: 1 + (hashVal % 11),
      ventOccupancy: 25 + (hashVal % 65)
    };
    departments = [
      { name: 'Advanced Cardiology', icon: 'cardiology', desc: 'Robotic heart surgery, coronary care, and high-precision imaging.', head: 'Dr. Sarah Mitchell', headExp: 'Head of Dept, 22yrs Exp', headImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNuhLpEdIAuP-bIvdla3zozISMiDp52R028Ap-X1VQkAAlFQKHDljHtEVoLaemTg-1AaADSHKvSidh1XDsFl8CAEEdV2yaVT7wuQrk4lSi2xSe56xHT7_c409BTpnRagDz1Odn3HRxhzUJ2sVtMeaS1avWCjJUsfecvjcmtnExrRhySo282nMu8t1Q_4khKnFKfMh9n8Q3148eIiMXqa3oeso22BNIEQtPf2u3PkQewXJwWlASAtQ1aTPogU9QVu_196dxFk6N6Z4' },
      { name: 'Neurology & Spine', icon: 'psychology', desc: 'Expert treatment for strokes, epilepsy, spinal surgeries, and neurological pain.' },
      { name: 'Oncology Center', icon: 'microwave', desc: 'Targeted radiation therapy, chemotherapy, and custom clinical oncology.' },
      { name: 'Pediatrics', icon: 'child_care', desc: 'Compassionate medical care, growth tracking, and child immunization courses.' }
    ];
    journey = [
      { step: 'Check-in', desc: 'Seamless digital registration and initial triage assessment upon arrival.' },
      { step: 'Clinical Assessment', desc: 'Immediate consultation and diagnosis with a certified clinical specialist.' },
      { step: 'Treatment', desc: 'Execution of planned clinical interventions, medication, or outpatient care.' },
      { step: 'Discharge', desc: 'Final review briefing, post-care prescriptions, and digital records sync.' }
    ];
  } else if (category === 'Clinics') {
    stats = {
      beds: 'N/A',
      specialists: `${4 + (hashVal % 12)} Practitioners`,
      years: `${5 + (hashVal % 15)} Years`
    };
    capacity = {
      icuAvailable: 0,
      icuOccupancy: 0,
      generalAvailable: 2 + (hashVal % 6),
      generalOccupancy: 50 + (hashVal % 35),
      ventAvailable: 0,
      ventOccupancy: 0
    };
    departments = [
      { name: 'General Consultation', icon: 'stethoscope', desc: 'Primary diagnostics, physical health checks, and general medicine.', head: 'Dr. Priya Iyer', headExp: 'Senior Consultant, 10yrs Exp', headImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjNEsr8TmQjByMwb2Xuh5L9UgldUPIMGLi802lGa4Ae54SZ6bN0b2p0OuT2yTMcU1DSPxWz8uSlnexhyY0ddB5z-WVIIANkP_N1Yz0gAl0SLaTg0tFFp9gDBKsSxjiG-5FZTuSRzzd1NgouJ2srlEXxI_fJKaurC0EOiJkCdGxoLrC5bGnvuLSZ-Uo-ytO92IpSxPBp19vuqPa2UkEjSKxbQuzQzjFaib1BujP0TghfzagKnY3albtDGos6AyRNPpAnmd5NfQLF3M' },
      { name: 'Family Health', icon: 'family_restroom', desc: 'Continuous and comprehensive healthcare for individuals and families.' },
      { name: 'Immunization Desk', icon: 'vaccines', desc: 'Standard vaccine distribution, booster logs, and preventative health.' },
      { name: 'Minor Procedures', icon: 'medical_services', desc: 'Local wound dressing, basic sutures, and minor outpatient treatment.' }
    ];
    journey = [
      { step: 'Reception Log', desc: 'Log in digitally with health ID or phone number at the clinic counter.' },
      { step: 'Vitals Inspection', desc: 'Routine screening of blood pressure, temperature, and current symptoms.' },
      { step: 'Consultation', desc: 'Detailed physical evaluation and prescription counseling with the doctor.' },
      { step: 'Medication Delivery', desc: 'Pick up prescribed medicines directly at the clinic pharmacy desk.' }
    ];
  } else if (category === 'Pharmacies') {
    stats = {
      beds: 'N/A',
      specialists: `${2 + (hashVal % 4)} Pharmacists`,
      years: `${3 + (hashVal % 12)} Years`
    };
    capacity = {
      icuAvailable: 0,
      icuOccupancy: 0,
      generalAvailable: 0,
      generalOccupancy: 0,
      ventAvailable: 0,
      ventOccupancy: 0
    };
    departments = [
      { name: 'Prescription Drugs', icon: 'pill', desc: 'Fulfillment of regulated clinical formulas, antibiotics, and special doses.', head: 'Mr. Rajesh Kumar', headExp: 'Chief Pharmacist, 12yrs Exp', headImg: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&auto=format&fit=crop&q=60' },
      { name: 'OTC Medicines', icon: 'medical_information', desc: 'Over-the-counter tablets, pain relievers, fever medication, and syrups.' },
      { name: 'First Aid & Surgical', icon: 'band_aid', desc: 'Surgical bandages, medical braces, antiseptic lotions, and trauma kits.' },
      { name: 'Health Supplements', icon: 'nutrition', desc: 'Vitamin courses, dietary supplements, protein formulas, and wellness herbs.' }
    ];
    journey = [
      { step: 'Ticket Drop', desc: 'Submit doctor prescription digital copy or sheet at the pharmacist entry desk.' },
      { step: 'Safety Review', desc: 'Pharmacist checks drug interactions, dosage matches, and allergies logs.' },
      { step: 'Billing & TPA', desc: 'Apply insurance coverage discount, corporate coupons, or direct payments.' },
      { step: 'Dispensation', desc: 'Receive wrapped medicines with dosage timing stickers and counselor guidance.' }
    ];
  } else if (category === 'Diagnostic Centers') {
    stats = {
      beds: 'N/A',
      specialists: `${6 + (hashVal % 15)} Lab Technologists`,
      years: `${4 + (hashVal % 15)} Years`
    };
    capacity = {
      icuAvailable: 0,
      icuOccupancy: 0,
      generalAvailable: 0,
      generalOccupancy: 0,
      ventAvailable: 0,
      ventOccupancy: 0
    };
    departments = [
      { name: 'Pathology Lab', icon: 'biotech', desc: 'Advanced blood examinations, urine tests, biochemistry, and microbiology.', head: 'Dr. Robert Chen', headExp: 'Lab Director, 22yrs Exp', headImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZfgbTGZxQ5R899fmEDBATERwY5Jjd5cU-Xvpvb4isWDtEgo4pXCqx5voBvdq8BD_UaDB5yiH-RSxSGSFP9YKk2c1nVX4GfByweKNEJfkKNKzUF53orSOc-9ChUzZRhG3Eb7Mt0XbGkPmUsFSXVKAmI5Pul4x2ImI53-5zjoSFkR5RETPADMWFElOzrVCOhzsXXqhlTjZ8c7NjHDlBcQp3DPyPjXzuKtV_YgT6Z21-PvESALvSaxrdioMn3TAe9pzi4RB62snm8F0' },
      { name: 'Imaging (X-Ray & MRI)', icon: 'radiology', desc: 'Digital radiography, high-resolution MRI scan, and abdominal ultrasound.' },
      { name: 'Cardiology Diagnostics', icon: 'heart_check', desc: 'Electrocardiogram (ECG), treadmill stress tests, and 24h Holter monitoring.' },
      { name: 'Hormone & Tumor Markers', icon: 'genetics', desc: 'Specialized thyroid logs, diabetic profiles, and early tumor antigen screenings.' }
    ];
    journey = [
      { step: 'Registration', desc: 'Validate selected diagnostic package booking and submit doctor reference.' },
      { step: 'Sample Collection', desc: 'Blood draw, swap collection, or imaging setup by sterile clinical lab assistant.' },
      { step: 'Lab Processing', desc: 'Sample analysis in automated pathology machinery and verification by pathologist.' },
      { step: 'Digital Report', desc: 'Sync pdf health records to user portal and secure online delivery in 6-12 hours.' }
    ];
  } else {
    // Default / Ambulance Services
    stats = {
      beds: `${2 + (hashVal % 8)} Ambulances`,
      specialists: `${4 + (hashVal % 10)} EMTs`,
      years: `${2 + (hashVal % 10)} Years`
    };
    capacity = {
      icuAvailable: 0,
      icuOccupancy: 0,
      generalAvailable: 0,
      generalOccupancy: 0,
      ventAvailable: 0,
      ventOccupancy: 0
    };
    departments = [
      { name: 'Cardiac Ambulances', icon: 'emergency', desc: 'Advanced life support vehicles equipped with defibrillators and oxygen rigs.', head: 'Mr. Sunil Sharma', headExp: 'Operations Lead, 10yrs Exp', headImg: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=60' },
      { name: 'Basic Life Support', icon: 'airport_shuttle', desc: 'Standard patient transfer vehicles with trauma response bags and stretchers.' },
      { name: 'Disaster Transport', icon: 'group', desc: 'High capacity trauma response units for multi-casualty incident mitigation.' },
      { name: 'Tele-triage Hub', icon: 'call', desc: 'Direct radio dispatch linking on-road EMTs with emergency department doctors.' }
    ];
    journey = [
      { step: 'Emergency Call', desc: 'Call dispatcher log: coordinate location pinpointing and symptoms.' },
      { step: 'Unit Dispatch', desc: 'Immediate sirens-on ambulance routing to patient coordinates within 2 mins.' },
      { step: 'Field Stabilization', desc: 'Oxygen support, IV setup, and primary trauma stabilization by on-board EMTs.' },
      { step: 'Trauma Transfer', desc: 'Fast transit to nearest hospital ER while streaming live patient vitals.' }
    ];
  }

  return { stats, capacity, departments, journey };
};

export default function NearbyHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: 17.4399, lng: 78.4983 }); // Begumpet default
  const [locationName, setLocationName] = useState('Begumpet, Hyderabad (Default)');
  const [permissionGranted, setPermissionGranted] = useState(null); // null = ask, true = granted, false = denied

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxDistance, setMaxDistance] = useState(10); // in km
  const [minRating, setMinRating] = useState(0);
  const [openNow, setOpenNow] = useState(false);
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [open24_7, setOpen24_7] = useState(false);

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualArea, setManualArea] = useState('');
  const [manualPincode, setManualPincode] = useState('');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [savedFavorites, setSavedFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // AI Assistant Search State
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // Search Input focus ref for symptom checker widget shortcut
  const searchInputRef = useRef(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const leafletMapRef = useRef(null);
  const leafletMarkersRef = useRef([]);
  const tileLayerRef = useRef(null);

  const [hospitalDetails, setHospitalDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Geolocation Haversine Distance helper
  const getHaversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in km
  };

  // Immediate Location Geolocation request
  const requestLocation = () => {
    setPermissionGranted(true);
    if (!navigator.geolocation) {
      setPermissionGranted(false);
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserCoords({ lat, lng });
        setLocationName('📍 Your Current Location');
        setPermissionGranted(true);
      },
      (err) => {
        console.warn('Geolocation denied or timed out.', err);
        setPermissionGranted(false);
        // Fallback default coordinates
        setUserCoords({ lat: 17.4399, lng: 78.4983 }); // Begumpet default
        setLocationName('Begumpet, Hyderabad (Default)');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Generate mock places fallback centered around current coordinates
  const generateMockPlaces = (lat, lng) => {
    console.log("Generating nearby mock health facilities...");
    const mockNames = [
      { name: 'City General Hospital', category: 'Hospitals', spec: ['Cardiology', 'Pediatrics', 'Radiology', 'Neurology'], serv: ['Emergency Care', 'Pharmacy', 'ICU'], emg: true, open24: true, hrs: '24 Hours', rating: 4.8 },
      { name: 'Green Valley Pediatrics', category: 'Clinics', spec: ['Pediatrics', 'General Medicine', 'Immunization', 'Asthma Care'], serv: ['Outpatient Consults', 'Pediatric ICU'], emg: false, open24: false, hrs: '8:00 AM - 8:00 PM', rating: 4.6 },
      { name: 'Arogya Medical Diagnostics', category: 'Diagnostic Centers', spec: ['Pathology', 'Radiology', 'Hormones screening'], serv: ['Blood Testing', 'X-Ray Scan'], emg: false, open24: false, hrs: '7:30 AM - 7:00 PM', rating: 4.4 },
      { name: 'Apollo Pharmacy 24/7', category: 'Pharmacies', spec: ['Prescriptions', 'OTC medicines'], serv: ['Drug Dispensation', 'Home Delivery'], emg: false, open24: true, hrs: '24 Hours', rating: 4.7 },
      { name: 'Sri Sai Emergency Clinic', category: 'Clinics', spec: ['General Medicine', 'Trauma First Aid'], serv: ['Outpatient consults', 'Emergency dressing'], emg: true, open24: false, hrs: '9:00 AM - 9:00 PM', rating: 4.3 },
      { name: 'Red Cross Trauma Ambulance Station', category: 'Ambulance Services', spec: ['Cardiac ALS', 'Basic Transfer'], serv: ['Emergency Rescue Transport'], emg: true, open24: true, hrs: '24 Hours', rating: 4.9 }
    ];

    const currentLocLabel = locationName ? locationName.replace('📍 ', '') : 'Ramannagudem';

    const mockFormatted = mockNames.map((m, idx) => {
      // Generate offsets roughly between 0.5km to 4km
      const latOffset = (Math.sin(idx * 2.3 + 1.2) * 0.022);
      const lngOffset = (Math.cos(idx * 1.9 + 0.8) * 0.022);
      const latVal = lat + latOffset;
      const lngVal = lng + lngOffset;
      const dist = getHaversineDistance(lat, lng, latVal, lngVal);

      const mockId = `mock_place_${idx}_${latVal.toFixed(4)}_${lngVal.toFixed(4)}`;

      return {
        _id: mockId,
        name: `${m.name} (${currentLocLabel})`,
        address: `Sector ${idx + 2}, Near Main Highway, ${currentLocLabel}`,
        latitude: latVal,
        longitude: lngVal,
        category: m.category,
        rating: m.rating,
        reviewCount: Math.floor(Math.random() * 200) + 45,
        distance: Number(dist.toFixed(1)),
        open24_7: m.open24,
        openingHours: m.hrs,
        isOpen: m.open24 ? true : new Date().getHours() >= 8 && new Date().getHours() < 20,
        emergencyAvailable: m.emg,
        place_id: mockId,
        image: `https://images.unsplash.com/photo-${idx % 2 === 0 ? '1587351021759-3e566b6af7cc' : '1579684389782-64d84b5e901a'}?w=600&auto=format&fit=crop&q=60`,
        specialties: m.spec,
        services: m.serv
      };
    });

    mockFormatted.sort((a, b) => a.distance - b.distance);
    setHospitals(mockFormatted);
    setLoading(false);
  };

  // Google Places API search
  const performPlacesSearch = (lat, lng, radiusKm) => {
    setLoading(true);

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.warn("Google Maps Places library not loaded. Executing mock fallback...");
      generateMockPlaces(lat, lng);
      return;
    }

    try {
      const pyrmont = new window.google.maps.LatLng(lat, lng);
      const dummyDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(dummyDiv);
      
      const types = ['hospital', 'pharmacy', 'doctor', 'clinic'];
      let combinedResults = [];
      let completedQueries = 0;

      types.forEach(type => {
        const request = {
          location: pyrmont,
          radius: radiusKm * 1000,
          type: type
        };

        service.nearbySearch(request, (results, status) => {
          completedQueries++;
          
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            combinedResults = [...combinedResults, ...results];
          }

          if (completedQueries === types.length) {
            if (combinedResults.length === 0) {
              generateMockPlaces(lat, lng);
              return;
            }

            const uniquePlaces = [];
            const placeIds = new Set();
            
            combinedResults.forEach(place => {
              if (!placeIds.has(place.place_id)) {
                placeIds.add(place.place_id);
                uniquePlaces.push(place);
              }
            });

            const formatted = uniquePlaces.map(place => {
              const latVal = place.geometry.location.lat();
              const lngVal = place.geometry.location.lng();
              const dist = getHaversineDistance(lat, lng, latVal, lngVal);

              let category = 'Hospitals';
              if (place.types.includes('pharmacy')) {
                category = 'Pharmacies';
              } else if (place.types.includes('clinic') || place.types.includes('doctor')) {
                category = 'Clinics';
              } else if (place.name.toLowerCase().includes('diagnostic') || place.name.toLowerCase().includes('lab') || place.name.toLowerCase().includes('pathology')) {
                category = 'Diagnostic Centers';
              } else if (place.name.toLowerCase().includes('ambulance') || place.name.toLowerCase().includes('emergency')) {
                category = 'Ambulance Services';
              }

              const isEmergency = place.types.includes('emergency_room') || 
                                  place.name.toLowerCase().includes('emergency') || 
                                  place.name.toLowerCase().includes('ambulance');

              let image = null;
              if (place.photos && place.photos.length > 0) {
                image = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
              }

              return {
                _id: place.place_id,
                name: place.name,
                address: place.vicinity || place.formatted_address || '',
                latitude: latVal,
                longitude: lngVal,
                category: category,
                rating: place.rating || 4.2,
                reviewCount: place.user_ratings_total || 25,
                distance: Number(dist.toFixed(1)),
                open24_7: place.types.includes('emergency_room') || isEmergency,
                openingHours: place.opening_hours?.isOpen() ? 'Open Now' : 'Closed',
                isOpen: place.opening_hours?.isOpen(),
                emergencyAvailable: isEmergency,
                place_id: place.place_id,
                image: image
              };
            });

            formatted.sort((a, b) => a.distance - b.distance);
            setHospitals(formatted);
            setLoading(false);
          }
        });
      });
    } catch (err) {
      console.warn("Google Places API error, executing mock fallback:", err);
      generateMockPlaces(lat, lng);
    }
  };

  // Google Places Details on-demand fetch
  const fetchPlaceDetails = (placeId) => {
    if (placeId && placeId.startsWith('mock_place_')) {
      setDetailsLoading(true);
      setTimeout(() => {
        const hosp = hospitals.find(h => h._id === placeId) || selectedHospital;
        const details = {
          _id: placeId,
          name: hosp?.name || 'Local Health Facility',
          address: hosp?.address || 'Main Road, Ramannagudem',
          phone: hosp?.category === 'Pharmacies' ? '+91 800 555 0192' : '+91 800 555 0147',
          website: 'https://arogyaraksha.gov.in',
          rating: hosp?.rating || 4.5,
          reviewCount: hosp?.reviewCount || 45,
          openingHours: hosp?.openingHours || '24 Hours',
          isOpen: hosp?.isOpen || true,
          reviews: [
            { author: 'Prasad Rao', rating: 5, text: 'Very essential healthcare facility in our rural area. Doctors are very cooperative.', date: '2026-05-10', avatar: '' },
            { author: 'Lakshmi Devi', rating: 4, text: 'Well maintained, staff is supportive. Pharmacy is always stocked.', date: '2026-05-24', avatar: '' }
          ],
          photos: [
            'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=800&auto=format&fit=crop&q=80'
          ],
          services: hosp?.services || ['Emergency Room Services', 'General Outpatient Medicine', 'Clinical Consultations'],
          departments: hosp?.specialties || ['General Internal Medicine', 'Trauma & Emergency Care'],
          latitude: hosp?.latitude,
          longitude: hosp?.longitude,
          distance: hosp?.distance,
          category: hosp?.category,
          emergencyAvailable: hosp?.emergencyAvailable
        };
        setHospitalDetails(details);
        setShowDetailModal(true);
        setDetailsLoading(false);
      }, 300);
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) return;
    
    setDetailsLoading(true);
    const dummyDiv = document.createElement('div');
    const service = new window.google.maps.places.PlacesService(dummyDiv);
    
    const request = {
      placeId: placeId,
      fields: ['name', 'rating', 'formatted_address', 'formatted_phone_number', 'website', 'opening_hours', 'reviews', 'photos', 'types', 'user_ratings_total']
    };

    service.getDetails(request, (place, status) => {
      setDetailsLoading(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const photos = place.photos ? place.photos.slice(0, 5).map(p => p.getUrl({ maxWidth: 800, maxHeight: 400 })) : [];
        const reviews = place.reviews ? place.reviews.slice(0, 5).map(r => ({
          author: r.author_name,
          rating: r.rating,
          text: r.text,
          date: new Date(r.time * 1000).toLocaleDateString(),
          avatar: r.profile_photo_url
        })) : [];

        const typesLower = place.types || [];
        let services = ['Emergency Room Services', 'General Outpatient Medicine', '24/7 Diagnostics Access', 'Surgical Facilities'];
        let departments = ['Pediatrics', 'Cardiology & Vascular', 'General Internal Medicine', 'Trauma & Emergency Care'];

        if (typesLower.includes('pharmacy')) {
          services = ['Prescription Fulfillment', 'Vaccination Clinic', 'Over-the-Counter Consultation', 'Health Screenings'];
          departments = ['Pharmaceutical Chemistry', 'Over-the-Counter Care', 'First-Aid Medical Supplies'];
        }

        const details = {
          _id: placeId,
          name: place.name,
          address: place.formatted_address || '',
          phone: place.formatted_phone_number || '+91 800 555 0147',
          website: place.website || 'https://arogyaraksha.gov.in',
          rating: place.rating || 4.2,
          reviewCount: place.user_ratings_total || 25,
          openingHours: place.opening_hours?.weekday_text?.join('\n') || (place.opening_hours?.isOpen() ? 'Open Now' : 'Closed'),
          isOpen: place.opening_hours?.isOpen(),
          reviews,
          photos,
          services,
          departments,
          latitude: selectedHospital?.latitude,
          longitude: selectedHospital?.longitude,
          distance: selectedHospital?.distance,
          category: selectedHospital?.category,
          emergencyAvailable: selectedHospital?.emergencyAvailable
        };
        
        setHospitalDetails(details);
        setShowDetailModal(true);
      } else {
        alert('Failed to retrieve place details from Google Places API.');
      }
    });
  };

  // Call facility helper
  const handleCall = (placeId) => {
    if (placeId && placeId.startsWith('mock_place_')) {
      window.location.href = `tel:+918005550147`;
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) return;
    const dummyDiv = document.createElement('div');
    const service = new window.google.maps.places.PlacesService(dummyDiv);
    service.getDetails({ placeId, fields: ['formatted_phone_number'] }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.formatted_phone_number) {
        window.location.href = `tel:${place.formatted_phone_number}`;
      } else {
        alert('Phone number not available for this facility.');
      }
    });
  };

  // Initial Check for Emergency Parameter & Geolocation Consent
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('emergency') === 'true') {
      setIsEmergencyMode(true);
      setEmergencyAvailable(true);
      setSelectedCategory('All');
    }

    // Load saved favorites
    const saved = localStorage.getItem('arogya_favorites_hospitals');
    if (saved) {
      setSavedFavorites(JSON.parse(saved));
    }

    // Request location immediately on mount
    requestLocation();
  }, []);

  // Google Maps Load Script
  useEffect(() => {
    const loadScript = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setMapLoaded(true);
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBGCJ2yDH6sAof84-_kvrDs25izZ2CPjR4&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };
    loadScript();
  }, []);

  // Dynamic live places search on userCoords, maxDistance, or mapLoaded change
  useEffect(() => {
    performPlacesSearch(userCoords.lat, userCoords.lng, maxDistance);
  }, [userCoords, maxDistance, mapLoaded]);

  // Apply filters client-side
  useEffect(() => {
    let result = [...hospitals];

    // Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(h => h.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Distance Filter
    result = result.filter(h => h.distance <= maxDistance);

    // Rating Filter
    if (minRating > 0) {
      result = result.filter(h => h.rating >= minRating);
    }

    // Open Now Filter
    if (openNow) {
      result = result.filter(h => {
        if (h.open24_7) return true;
        const hour = new Date().getHours();
        return hour >= 8 && hour < 20; // assumed 8am to 8pm
      });
    }

    // Emergency Available Filter
    if (emergencyAvailable) {
      result = result.filter(h => h.emergencyAvailable);
    }

    // 24/7 Services Filter
    if (open24_7) {
      result = result.filter(h => h.open24_7);
    }

    // Keyword/Specialties Search Box
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(h => 
        h.name.toLowerCase().includes(query) ||
        h.address.toLowerCase().includes(query) ||
        h.specialties?.some(s => s.toLowerCase().includes(query))
      );
    }

    // Saved Favorites Only
    if (showFavoritesOnly) {
      result = result.filter(h => savedFavorites.includes(h._id));
    }

    // Apply emergency Mode filtering: show only Hospitals, Ambulances, and Pharmacies
    if (isEmergencyMode) {
      result = result.filter(h => 
        h.category === 'Hospitals' || 
        h.category === 'Ambulance Services' || 
        h.category === 'Pharmacies'
      );
    }

    // Sorting: Closest first (proportional to travel time)
    result.sort((a, b) => a.distance - b.distance);

    setFilteredHospitals(result);
  }, [hospitals, selectedCategory, maxDistance, minRating, openNow, emergencyAvailable, open24_7, searchQuery, showFavoritesOnly, savedFavorites, isEmergencyMode]);

  // Leaflet Load Script
  useEffect(() => {
    let cssLink = document.getElementById('leaflet-css-cdn');
    if (!cssLink) {
      cssLink = document.createElement('link');
      cssLink.id = 'leaflet-css-cdn';
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);
    }

    if (!window.L) {
      let jsScript = document.getElementById('leaflet-js-cdn');
      if (!jsScript) {
        jsScript = document.createElement('script');
        jsScript.id = 'leaflet-js-cdn';
        jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        jsScript.async = true;
        document.head.appendChild(jsScript);
      }
    }

    const checkL = setInterval(() => {
      if (window.L) {
        setLeafletLoaded(true);
        clearInterval(checkL);
      }
    }, 100);

    return () => clearInterval(checkL);
  }, []);

  // Handle Leaflet Map Initialization and dark theme updates
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;

    const tileUrl = isDarkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const tileAttr = '© OpenStreetMap contributors, © CartoDB';

    if (!leafletMapRef.current) {
      leafletMapRef.current = window.L.map(mapRef.current, {
        center: [userCoords.lat, userCoords.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      tileLayerRef.current = window.L.tileLayer(tileUrl, {
        attribution: tileAttr,
        maxZoom: 19
      }).addTo(leafletMapRef.current);
    } else {
      if (tileLayerRef.current) {
        tileLayerRef.current.setUrl(tileUrl);
      }
    }
  }, [leafletLoaded, isDarkMode]);

  // Smooth pan to coordinates
  useEffect(() => {
    if (leafletMapRef.current && leafletLoaded) {
      leafletMapRef.current.panTo([userCoords.lat, userCoords.lng]);
    }
  }, [userCoords, leafletLoaded]);

  // Sync Markers when filtered list updates
  useEffect(() => {
    if (!leafletLoaded || !leafletMapRef.current) return;

    // Clear old markers
    leafletMarkersRef.current.forEach(m => m.remove());
    leafletMarkersRef.current = [];

    // Pulser location marker
    const pulsingUserIcon = window.L.divIcon({
      html: `
        <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: rgba(0, 82, 204, 0.25); animation: leaflet-pulsate 2s infinite ease-out;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #0052cc; border: 2.5px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3); margin-top: 5px;"></div>
        </div>
      `,
      className: 'custom-leaflet-user-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const userMarker = window.L.marker([userCoords.lat, userCoords.lng], {
      icon: pulsingUserIcon,
      title: '📍 Your Current Location'
    }).addTo(leafletMapRef.current);
    leafletMarkersRef.current.push(userMarker);

    // Custom SVG Marker Generator matching design guidelines
    const getLeafletMarkerIcon = (category, isSelected) => {
      const color = category === 'Hospitals' ? '#003d9b' : category === 'Ambulance Services' ? '#ba1a1a' : '#006c49';
      const emoji = category === 'Hospitals' ? '🏥' :
                    category === 'Pharmacies' ? '💊' :
                    category === 'Clinics' ? '🩺' :
                    category === 'Diagnostic Centers' ? '🧪' : '🚑';
      
      const width = isSelected ? 46 : 38;
      const height = isSelected ? 46 : 38;

      const htmlContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 40 40" style="filter: drop-shadow(0px 2.5px 4px rgba(0,0,0,0.3)); transition: all 0.2s ease;">
          <rect x="2" y="2" width="36" height="36" rx="8" fill="white" stroke="${color}" stroke-width="${isSelected ? 3.5 : 2}"/>
          <rect x="6" y="6" width="28" height="28" rx="6" fill="${color}"/>
          <text x="20" y="25" font-size="16" font-family="Arial" text-anchor="middle" fill="white">${emoji}</text>
        </svg>
      `;

      return window.L.divIcon({
        html: htmlContent,
        className: 'custom-leaflet-facility-marker',
        iconSize: [width, height],
        iconAnchor: [width / 2, height]
      });
    };

    // Add facility markers
    filteredHospitals.forEach(h => {
      const isSelected = selectedHospital && selectedHospital._id === h._id;
      const marker = window.L.marker([h.latitude, h.longitude], {
        icon: getLeafletMarkerIcon(h.category, isSelected),
        title: h.name
      }).addTo(leafletMapRef.current);

      const contentString = `
        <div style="font-family: 'Inter', sans-serif; color: #0b1c30; padding: 6px; min-width: 180px;">
          <h4 style="margin: 0 0 2px 0; font-weight: bold; font-size: 13px;">${h.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 10px; color: #64748b;">${h.address}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: bold; color: #003d9b;">
            <span>★ ${h.rating}</span>
            <span style="color: #64748b;">${h.distance} km away</span>
          </div>
        </div>
      `;

      marker.bindPopup(contentString, {
        closeButton: false,
        offset: [0, -10]
      });

      marker.on('click', () => {
        setSelectedHospital(h);
        setShowDetailModal(false);
      });

      if (isSelected) {
        leafletMapRef.current.panTo([h.latitude, h.longitude]);
        setTimeout(() => {
          marker.openPopup();
        }, 100);
      }

      leafletMarkersRef.current.push(marker);
    });

  }, [filteredHospitals, leafletLoaded, userCoords, selectedHospital]);

  // Manual Coordinates Resolver (Hyderabad areas mapping)
  const executeManualSearch = (e) => {
    e.preventDefault();
    let term = '';
    if (manualPincode.trim()) term = manualPincode.trim();
    else if (manualArea.trim()) term = manualArea.trim();
    else if (manualCity.trim()) term = manualCity.trim();

    if (!term) return;

    const query = term.toLowerCase();
    let coords = { lat: 17.4399, lng: 78.4983 }; // Default Begumpet
    let label = 'Begumpet, Hyderabad';

    if (query.includes('secunderabad') || query.includes('500003')) {
      coords = { lat: 17.4475, lng: 78.4990 };
      label = 'Secunderabad, Hyderabad';
    } else if (query.includes('banjara') || query.includes('500034')) {
      coords = { lat: 17.4143, lng: 78.4482 };
      label = 'Banjara Hills, Hyderabad';
    } else if (query.includes('madhapur') || query.includes('500081')) {
      coords = { lat: 17.4485, lng: 78.3908 };
      label = 'Madhapur, Hyderabad';
    } else if (query.includes('jubilee') || query.includes('500033')) {
      coords = { lat: 17.4320, lng: 78.4350 };
      label = 'Jubilee Hills, Hyderabad';
    } else if (query.includes('ameerpet') || query.includes('500018')) {
      coords = { lat: 17.4360, lng: 78.4550 };
      label = 'Ameerpet, Hyderabad';
    } else if (query.includes('nampally') || query.includes('500001')) {
      coords = { lat: 17.3912, lng: 78.4682 };
      label = 'Nampally, Hyderabad';
    } else {
      label = `${term}, Hyderabad`;
    }

    setUserCoords(coords);
    setLocationName(label);
    setPermissionGranted(true);
  };

  // AI Search Assistant Trigger
  const handleAISearch = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiMessage('');
    try {
      const res = await api.post('/hospitals/ai-search', {
        query: aiQuery,
        lat: userCoords.lat,
        lng: userCoords.lng
      });

      const filters = res.data.filters;
      // Auto-apply AI-extracted filters to state
      if (filters.category) setSelectedCategory(filters.category);
      if (filters.emergencyAvailable) setEmergencyAvailable(true);
      if (filters.open24_7) setOpen24_7(true);
      if (filters.minRating) setMinRating(filters.minRating);
      if (filters.searchKeyword) setSearchQuery(filters.searchKeyword);

      setAiMessage(`AI applied filters: Category: ${filters.category || 'Any'}, Emergency: ${filters.emergencyAvailable ? 'Yes' : 'No'}, 24x7: ${filters.open24_7 ? 'Yes' : 'No'}`);
      setAiQuery('');
    } catch (err) {
      console.error(err);
      setAiMessage('AI Search Assistant failed to parse query. Basic filter reset.');
    } finally {
      setAiLoading(false);
    }
  };

  // Favorites toggle
  const toggleFavorite = (hospId) => {
    let updated;
    if (savedFavorites.includes(hospId)) {
      updated = savedFavorites.filter(id => id !== hospId);
    } else {
      updated = [...savedFavorites, hospId];
    }
    setSavedFavorites(updated);
    localStorage.setItem('arogya_favorites_hospitals', JSON.stringify(updated));
  };

  // Shortcut symptom checker click
  const handleFocusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-margin-desktop py-stack-sm text-slate-800 dark:text-slate-100 transition-colors animate-fadeIn relative">
      <style>{`
        .glass-panel {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .dark .glass-panel {
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .leaflet-container {
            font-family: 'Inter', sans-serif;
            background-color: transparent !important;
            height: 100% !important;
            width: 100% !important;
            z-index: 1;
        }
        @keyframes leaflet-pulsate {
            0% { transform: scale(0.1); opacity: 0.0; }
            50% { opacity: 1.0; }
            100% { transform: scale(1.2); opacity: 0.0; }
        }
        .custom-leaflet-user-marker {
            background: none !important;
            border: none !important;
        }
        .custom-leaflet-facility-marker {
            background: none !important;
            border: none !important;
        }
        .leaflet-popup-content-wrapper {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(8px) !important;
            border-radius: 16px !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
            border: 1px solid rgba(226, 232, 240, 0.8) !important;
            padding: 2px !important;
        }
        .dark .leaflet-popup-content-wrapper {
            background: rgba(15, 23, 42, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            color: #f1f5f9 !important;
        }
        .leaflet-popup-content {
            margin: 8px 12px !important;
        }
        .leaflet-popup-tip {
            background: rgba(255, 255, 255, 0.95) !important;
        }
        .dark .leaflet-popup-tip {
            background: rgba(15, 23, 42, 0.95) !important;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .glass-card-premium {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(226, 232, 240, 1);
            box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.04);
        }
        .dark .glass-card-premium {
            background: rgba(30, 41, 59, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.2);
        }
      `}</style>
      
      {/* Location Access Consent Modal */}
      {permissionGranted === null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary text-3xl">📍</div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Find Healthcare Near You</h2>
              <p className="text-sm text-outline mt-2 leading-relaxed">
                Arogya Raksha would like to access your location to find nearby hospitals, clinics, pharmacies, and emergency services.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={requestLocation}
                className="w-full bg-primary hover:opacity-95 dark:bg-secondary dark:text-slate-900 text-white font-bold py-3 rounded-xl transition-all shadow"
              >
                Allow Location Access
              </button>
              <button 
                onClick={() => setPermissionGranted(false)}
                className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 font-bold py-3 rounded-xl transition-all text-slate-700 dark:text-slate-200"
              >
                Search Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Search Form if permission is denied */}
      {permissionGranted === false && (
        <div className="mb-6 p-6 bg-yellow-50 dark:bg-slate-800/80 border border-yellow-200 dark:border-slate-700 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
            <span className="text-xl">⚠️</span>
            <h3 className="font-bold">Location Permission Denied</h3>
          </div>
          <p className="text-xs text-outline">
            Please search for facilities manually by typing a city, region, or pincode in Hyderabad (e.g. Secunderabad, Banjara Hills, 500034).
          </p>
          <form onSubmit={executeManualSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input 
              type="text" 
              placeholder="City (e.g. Hyderabad)" 
              value={manualCity} 
              onChange={e => setManualCity(e.target.value)}
              className="p-2.5 rounded-xl border border-outline-variant bg-white dark:bg-slate-900 text-xs"
            />
            <input 
              type="text" 
              placeholder="Area (e.g. Banjara Hills)" 
              value={manualArea} 
              onChange={e => setManualArea(e.target.value)}
              className="p-2.5 rounded-xl border border-outline-variant bg-white dark:bg-slate-900 text-xs"
            />
            <input 
              type="text" 
              placeholder="Pincode (e.g. 500034)" 
              value={manualPincode} 
              onChange={e => setManualPincode(e.target.value)}
              className="p-2.5 rounded-xl border border-outline-variant bg-white dark:bg-slate-900 text-xs"
            />
            <button type="submit" className="bg-primary text-white font-bold py-2.5 rounded-xl text-xs hover:opacity-90">
              Apply Location
            </button>
          </form>
        </div>
      )}

      {/* Emergency Mode Alert Banner */}
      {isEmergencyMode && (
        <div className="mb-4 p-4 bg-red-600 text-white rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-extrabold text-sm uppercase tracking-wider">Emergency Mode Active</p>
              <p className="text-xs opacity-90">Displaying nearest emergency ready hospitals, ambulance coordinates, and pharmacies sorted by Driving Travel Time.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsEmergencyMode(false);
              setEmergencyAvailable(false);
            }} 
            className="bg-white/20 hover:bg-white/30 text-white text-[10px] uppercase font-bold py-1 px-3.5 rounded-lg"
          >
            Disable
          </button>
        </div>
      )}

      {/* Main Content Layout: Split-screen Map & List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter h-[calc(100vh-100px)] min-h-[580px] overflow-hidden mt-1">
        
        {/* Left Side Panel: Facility Cards & Dashboards Scrollable Feed */}
        <section className="lg:col-span-5 flex flex-col h-full overflow-hidden relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          
          <div className="flex-grow overflow-y-auto space-y-6 pr-2 -mr-2 no-scrollbar">
            
            {/* Find Excellence in Care - Hero Search Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Find Excellence in Care
                </h1>
                <button 
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all shrink-0 mt-1 flex items-center gap-1 ${
                    showFavoritesOnly 
                      ? 'bg-amber-500 text-white border-amber-500' 
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>⭐</span> Saved ({savedFavorites.length})
                </button>
              </div>

              {/* Dynamic location label */}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Active Location: <span className="font-semibold text-slate-800 dark:text-slate-200">{locationName}</span>
              </p>

              {/* Sleek Search Box */}
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search by specialties, doctors, or hospitals..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-surface-low dark:bg-slate-800/80 border-none rounded-xl focus:ring-2 focus:ring-primary text-xs shadow-sm text-slate-800 dark:text-white"
                />
              </div>

              {/* AI Search Assistant Form */}
              <form onSubmit={handleAISearch} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-200/60 dark:border-slate-700">
                <span className="text-sm" title="AI Search Assistant">🤖</span>
                <input 
                  type="text" 
                  placeholder="Ask AI: 'Find a 24 hour hospital near me'..." 
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  className="flex-grow bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100"
                />
                <button 
                  type="submit" 
                  disabled={aiLoading}
                  className="bg-primary dark:bg-emerald-500 dark:text-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold shrink-0 shadow-sm"
                >
                  {aiLoading ? 'AI...' : 'Ask AI'}
                </button>
              </form>
            </div>

            {/* Smart Filters section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Smart Filters:</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-semibold">Radius:</span>
                  <select 
                    value={maxDistance}
                    onChange={e => setMaxDistance(Number(e.target.value))}
                    className="bg-transparent border-none focus:ring-0 rounded-lg p-0 text-[10px] font-bold text-primary dark:text-secondary-fixed-dim"
                  >
                    <option value={2}>2 km</option>
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={20}>20 km</option>
                  </select>
                </div>
              </div>

              {/* Category selector chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                {['All', 'Hospitals', 'Clinics', 'Pharmacies', 'Diagnostic Centers', 'Ambulance Services'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold border whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-primary text-white border-primary dark:bg-emerald-500 dark:text-slate-900'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat === 'All' ? '🌐 All' : cat}
                  </button>
                ))}
              </div>

              {/* Checkboxes & Extra Filters */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-surface-low dark:bg-slate-800/40 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 text-[10px]">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-red-600 dark:text-red-400">
                  <input 
                    type="checkbox" 
                    checked={isEmergencyMode}
                    onChange={(e) => {
                      setIsEmergencyMode(e.target.checked);
                      if (e.target.checked) {
                        setEmergencyAvailable(true);
                        setSelectedCategory('All');
                      } else {
                        setEmergencyAvailable(false);
                      }
                    }}
                    className="rounded text-red-600 focus:ring-red-650 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>🚨 Emergency Mode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={emergencyAvailable} 
                    onChange={e => setEmergencyAvailable(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>🏥 ER Facility</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={open24_7} 
                    onChange={e => setOpen24_7(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>🏪 24/7 Services</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={openNow} 
                    onChange={e => setOpenNow(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>🕒 Open Now</span>
                </label>
              </div>
            </div>

            {/* AI Assistant Applied Message */}
            {aiMessage && (
              <div className="p-2 px-3 bg-primary/10 text-primary dark:text-emerald-400 dark:bg-slate-800/40 rounded-xl text-[10px] border border-primary/20 animate-fadeIn">
                ✨ {aiMessage}
              </div>
            )}

            {/* Top Specialists Nearby Carousel */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Top Specialists Nearby
                </h2>
                <button onClick={handleFocusSearch} className="text-primary dark:text-emerald-400 text-xs font-bold hover:underline">
                  View All
                </button>
              </div>

              <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1.5 -mx-1 px-1">
                {TOP_SPECIALISTS.map((dr, idx) => (
                  <div key={idx} className="flex-shrink-0 w-44 glass-card-premium rounded-2xl p-3 flex flex-col items-center text-center transition-all hover:scale-[1.02]">
                    <div className="w-16 h-16 rounded-full mb-2 border-2 border-secondary-container overflow-hidden">
                      <img alt={dr.name} className="w-full h-full object-cover" src={dr.image} />
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-900 dark:text-white truncate w-full">{dr.name}</h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{dr.specialty} • {dr.exp}</p>
                    
                    <div className="mt-1 flex items-center gap-0.5 text-secondary">
                      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-[9px] font-bold">{dr.rating} ({dr.reviews.split(' ')[0]})</span>
                    </div>

                    <button 
                      onClick={() => {
                        setSearchQuery(dr.specialty);
                        if (searchInputRef.current) searchInputRef.current.focus();
                      }}
                      className="mt-2.5 w-full py-1 bg-primary hover:opacity-90 text-white rounded-lg text-[9px] font-bold transition-all"
                    >
                      Search Specialty
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby Medical Facilities Directory List */}
            <div className="space-y-4 pt-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Nearby Medical Facilities
              </h2>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : filteredHospitals.length > 0 ? (
                <div className="space-y-4">
                  {filteredHospitals.map(h => {
                    const isSaved = savedFavorites.includes(h._id);
                    const hashVal = h.place_id ? h.place_id.charCodeAt(h.place_id.length - 1) : 0;
                    const waitMins = hashVal % 2 === 0 ? `Wait: < 5 mins` : `ER: ${5 + (hashVal % 15)} min wait`;
                    const waitColor = hashVal % 2 === 0 
                      ? 'bg-secondary text-white' 
                      : 'bg-red-600 text-white';

                    return (
                      <div 
                        key={h._id}
                        onClick={() => {
                          setSelectedHospital(h);
                          setShowDetailModal(false);
                        }}
                        className={`group glass-card-premium rounded-2xl overflow-hidden flex flex-col sm:flex-row transition-all duration-300 cursor-pointer relative border-l-4 ${
                          selectedHospital?._id === h._id 
                            ? 'border-primary dark:border-emerald-500 border-l-primary dark:border-l-emerald-500' 
                            : 'border-slate-200/60 dark:border-slate-700/60 hover:border-primary/40 border-l-transparent'
                        }`}
                      >
                        {/* Image wrapper */}
                        <div className="sm:w-1/3 relative h-28 sm:h-auto min-h-[90px] bg-slate-100 dark:bg-slate-950">
                          <img 
                            alt={h.name} 
                            className="w-full h-full object-cover" 
                            src={h.image || "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=300&auto=format&fit=crop&q=60"}
                          />
                          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase flex items-center gap-1 ${waitColor}`}>
                            <span className="material-symbols-outlined text-[10px]">timer</span>
                            {waitMins}
                          </div>
                        </div>

                        {/* Text details */}
                        <div className="sm:w-2/3 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors text-xs leading-snug truncate">
                                  {h.name}
                                </h3>
                                <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} title="Verified Institution">verified</span>
                              </div>
                              <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shrink-0">
                                ★ {h.rating}
                              </span>
                            </div>

                            <p className="text-slate-500 dark:text-slate-400 text-[9px] mt-0.5">
                              {h.category} • {h.address}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50">
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                              <span className="material-symbols-outlined text-[12px]">distance</span>
                              {h.distance} km away
                            </span>

                            <div className="flex gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedHospital(h);
                                  fetchPlaceDetails(h.place_id);
                                }}
                                className="px-2.5 py-1 text-[9px] font-bold bg-primary text-white rounded-lg hover:opacity-90 transition-all shadow-sm"
                              >
                                Book
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedHospital(h);
                                  fetchPlaceDetails(h.place_id);
                                }}
                                className="px-2 py-0.5 border border-secondary text-secondary rounded-lg text-[9px] font-bold hover:bg-secondary/5 transition-all flex items-center gap-0.5"
                              >
                                <span className="material-symbols-outlined text-[10px]">smart_toy</span>
                                Consult AI
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Favorite Star Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(h._id);
                          }}
                          className="absolute top-2 right-2 text-xs hover:scale-110 transition-transform z-10 p-1 bg-white/70 dark:bg-slate-800/70 rounded-full flex items-center justify-center shadow-sm"
                        >
                          {isSaved ? '⭐' : '☆'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 px-4 text-xs text-slate-500 italic space-y-4">
                  <p>No healthcare facilities found matching your filters.</p>
                  <button 
                    onClick={() => {
                      setUserCoords({ lat: 17.4399, lng: 78.4983 });
                      setLocationName('Begumpet, Hyderabad (Demo)');
                      setPermissionGranted(true);
                    }}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all font-sans text-[10px]"
                  >
                    Switch to Hyderabad (Demo)
                  </button>
                </div>
              )}
            </div>

            {/* Widgets Section: Alerts, Check Symptoms & History */}
            <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              
              {/* Live Alerts Widget */}
              <div className="glass-card-premium rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary dark:text-emerald-400">
                  <span className="material-symbols-outlined">campaign</span>
                  <h3 className="font-extrabold text-xs">Live Alerts & Announcements</h3>
                </div>
                <div className="space-y-3.5">
                  {LIVE_ALERTS.map((alertItem, idx) => (
                    <div key={idx} className="border-l-2 border-slate-200 dark:border-slate-700 pl-3.5 space-y-0.5">
                      <span className={`text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded border inline-block ${alertItem.badgeClass}`}>
                        {alertItem.type}
                      </span>
                      <h4 className="text-[10px] font-bold text-slate-900 dark:text-white mt-1">{alertItem.title}</h4>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">{alertItem.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Check Symptoms AI Shortcut Widget */}
              <div className="bg-primary text-white rounded-2xl p-4 shadow-md relative overflow-hidden flex flex-col justify-between h-32">
                <div className="z-10">
                  <h3 className="font-bold text-sm">Check Symptoms AI</h3>
                  <p className="text-[10px] text-blue-100 mt-1 max-w-[80%]">
                    Describe how you feel to our AI assistant to instantly filter nearby specialties.
                  </p>
                </div>
                <button 
                  onClick={handleFocusSearch}
                  className="z-10 w-full py-1.5 bg-white text-primary rounded-lg font-bold text-[10px] shadow hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">chat</span> Start Query
                </button>
                <div className="absolute -right-2 -bottom-2 opacity-10">
                  <span className="material-symbols-outlined text-[80px]">medical_services</span>
                </div>
              </div>

              {/* Care History Widget */}
              <div className="glass-card-premium rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">My Care History</h3>
                <div className="space-y-2.5">
                  {CARE_HISTORY.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.iconColor}`}>
                        <span className="material-symbols-outlined text-sm">{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                        <p className="text-[8px] text-slate-500 dark:text-slate-400">{item.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Right Side Panel: Map View */}
        <section className="lg:col-span-7 bg-slate-100 dark:bg-slate-950 border border-outline-variant/30 dark:border-slate-800 rounded-3xl overflow-hidden relative shadow-inner h-full min-h-[300px]">
          
          {/* Map Container Element */}
          <div ref={mapRef} className="w-full h-full"></div>
          
          {/* Headless div container for PlacesService */}
          <div style={{ display: 'none' }}></div>

          {(!mapLoaded || !leafletLoaded) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 dark:bg-slate-900/90 z-10 gap-2">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
              <span className="text-xs font-bold text-outline">Initializing Interactive Map...</span>
            </div>
          )}

          {/* Travel Info Overlay (Bottom) */}
          {selectedHospital && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-[400px]">
              <div className="glass-panel p-5 rounded-3xl shadow-2xl border border-white/50 dark:border-slate-800/40">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedHospital.image || "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=100&auto=format&fit=crop&q=60"} 
                      alt={selectedHospital.name} 
                      className="w-10 h-10 rounded-lg object-cover" 
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-snug truncate">{selectedHospital.name}</h4>
                      <p className="text-[10px] text-emerald-500 font-bold">Fastest Route Available</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedHospital(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-850 dark:hover:text-slate-200 transition-colors shrink-0 ml-2"
                  >
                    <span>❌</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-primary/5 rounded-xl p-2.5 border border-primary/10 flex items-center gap-2">
                    <div className="bg-primary w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0">
                      <span className="text-sm">🚗</span>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Driving</p>
                      <p className="font-bold text-sm text-primary">{Math.max(1, Math.round(selectedHospital.distance * 2))} mins</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 border border-slate-200/40 flex items-center gap-2">
                    <div className="bg-slate-500 w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0">
                      <span className="text-sm">🚶</span>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Walking</p>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{Math.round(selectedHospital.distance * 12)} mins</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => fetchPlaceDetails(selectedHospital.place_id)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                  >
                    ℹ️ Details
                  </button>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${selectedHospital.latitude},${selectedHospital.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-grow-[2] bg-primary text-white font-bold py-3 rounded-xl text-xs shadow hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">near_me</span> Start Route
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* Redesigned Bento Hospital Detail Modal */}
      {selectedHospital && showDetailModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh] border border-slate-200/60 dark:border-slate-800 flex flex-col relative animate-scaleUp scrollbar-thin">
            
            {detailsLoading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
                <span className="text-xs font-bold text-outline">Loading Clinical Profile...</span>
              </div>
            ) : hospitalDetails ? (() => {
              // Retrieve dynamic metrics based on hospital details name/category
              const metrics = getFacilityMetrics(hospitalDetails);
              return (
                <>
                  {/* Hero Cover Section */}
                  <div className="relative w-full h-64 md:h-72 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-950">
                    <img 
                      src={hospitalDetails.photos && hospitalDetails.photos.length > 0 ? hospitalDetails.photos[0] : (selectedHospital.image || "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80")} 
                      alt={hospitalDetails.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent"></div>
                    
                    {/* Floating top bar */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                      <button 
                        onClick={() => setShowDetailModal(false)}
                        className="bg-white/95 dark:bg-slate-800/95 hover:scale-105 text-slate-800 dark:text-white p-2 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow"
                      >
                        <span className="material-symbols-outlined text-sm font-extrabold">arrow_back</span>
                        Back to Map
                      </button>
                      <button 
                        onClick={() => toggleFavorite(hospitalDetails._id)}
                        className="p-2 px-3.5 bg-white/95 dark:bg-slate-800/95 text-slate-800 dark:text-white rounded-xl text-xs font-bold shadow hover:scale-105 transition-all flex items-center gap-1"
                      >
                        {savedFavorites.includes(hospitalDetails._id) ? '⭐ Saved' : '☆ Save'}
                      </button>
                    </div>

                    {/* Banner bottom titles */}
                    <div className="absolute bottom-4 left-6 right-6 text-white">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="bg-emerald-500 text-slate-900 px-3 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-[12px] font-extrabold" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Verified Facility
                        </span>
                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full font-bold text-[10px]">
                          <span className="material-symbols-outlined text-yellow-400 text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {hospitalDetails.rating} ({hospitalDetails.reviewCount} Reviews)
                        </div>
                      </div>
                      <h1 className="text-xl md:text-3xl font-extrabold tracking-tight drop-shadow-sm">{hospitalDetails.name}</h1>
                    </div>
                  </div>

                  {/* Body Bento Container */}
                  <div className="p-6 md:p-8 space-y-8">
                    
                    {/* Clinical Stats Info Row */}
                    <div className="grid grid-cols-3 gap-3 bg-surface-low dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-700/40 text-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Clinical Size</span>
                        <span className="font-extrabold text-sm md:text-lg text-primary dark:text-emerald-400 mt-1">{metrics.stats.beds}</span>
                      </div>
                      <div className="flex flex-col border-x border-slate-200/60 dark:border-slate-700/50">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Specialists</span>
                        <span className="font-extrabold text-sm md:text-lg text-primary dark:text-emerald-400 mt-1">{metrics.stats.specialists}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Experience</span>
                        <span className="font-extrabold text-sm md:text-lg text-primary dark:text-emerald-400 mt-1">{metrics.stats.years}</span>
                      </div>
                    </div>

                    {/* Address & Quick Timings */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location Address</h4>
                        <p className="text-xs text-slate-800 dark:text-slate-100 mt-1 font-medium">{hospitalDetails.address}</p>
                      </div>
                      <div className="shrink-0 text-left md:text-right">
                        <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Operating Status</h4>
                        <p className="text-xs font-bold mt-1">
                          <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${hospitalDetails.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          <span className={hospitalDetails.isOpen ? 'text-emerald-500' : 'text-red-500'}>
                            {hospitalDetails.isOpen ? 'Open Now' : 'Closed'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Clinical Capacity Occupancy Grid */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className="font-extrabold text-sm text-primary dark:text-emerald-400 uppercase tracking-wider">Clinical Capacity</h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Real-time resource occupancy & availability</p>
                        </div>
                        <span className="text-[9px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          Live Updated
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* ICU Beds progress */}
                        <div className="glass-card-premium p-4 rounded-xl flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <span className="material-symbols-outlined text-primary text-2xl bg-primary/15 p-2 rounded-lg">emergency</span>
                            <div className="text-right">
                              <div className="font-extrabold text-xl text-primary">{metrics.capacity.icuAvailable > 0 ? metrics.capacity.icuAvailable : 'N/A'}</div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400">Available ICU Beds</div>
                            </div>
                          </div>
                          {metrics.capacity.icuAvailable > 0 ? (
                            <>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${metrics.capacity.icuOccupancy}%` }}></div>
                              </div>
                              <div className="flex justify-between text-[9px] font-bold">
                                <span className="text-slate-500">Occupancy</span>
                                <span className="text-slate-800 dark:text-slate-200">{metrics.capacity.icuOccupancy}% Full</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-[9px] text-slate-400 italic py-1">No emergency ICU ward configured.</div>
                          )}
                        </div>

                        {/* General Beds progress */}
                        <div className="glass-card-premium p-4 rounded-xl flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <span className="material-symbols-outlined text-emerald-500 text-2xl bg-emerald-500/15 p-2 rounded-lg">bed</span>
                            <div className="text-right">
                              <div className="font-extrabold text-xl text-emerald-500">{metrics.capacity.generalAvailable > 0 ? metrics.capacity.generalAvailable : 'N/A'}</div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400">General Ward Beds</div>
                            </div>
                          </div>
                          {metrics.capacity.generalAvailable > 0 ? (
                            <>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${metrics.capacity.generalOccupancy}%` }}></div>
                              </div>
                              <div className="flex justify-between text-[9px] font-bold">
                                <span className="text-slate-500">Occupancy</span>
                                <span className="text-slate-800 dark:text-slate-200">{metrics.capacity.generalOccupancy}% Full</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-[9px] text-slate-400 italic py-1">Direct dispensing / No ward beds.</div>
                          )}
                        </div>

                        {/* Ventilators progress */}
                        <div className="glass-card-premium p-4 rounded-xl flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <span className="material-symbols-outlined text-slate-500 text-2xl bg-slate-500/15 p-2 rounded-lg">escalator</span>
                            <div className="text-right">
                              <div className="font-extrabold text-xl text-slate-600 dark:text-slate-355">{metrics.capacity.ventAvailable > 0 ? `0${metrics.capacity.ventAvailable}` : '00'}</div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400">Ventilators Ready</div>
                            </div>
                          </div>
                          {metrics.capacity.ventAvailable > 0 ? (
                            <>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                <div className="bg-slate-500 h-1.5 rounded-full" style={{ width: `${metrics.capacity.ventOccupancy}%` }}></div>
                              </div>
                              <div className="flex justify-between text-[9px] font-bold">
                                <span className="text-slate-500">Utilization</span>
                                <span className="text-slate-800 dark:text-slate-200">{metrics.capacity.ventOccupancy}% In Use</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-[9px] text-slate-400 italic py-1">No emergency ventilators on site.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Specialized Departments Bento Grid */}
                    <div className="space-y-4">
                      <div className="text-left">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Specialized Departments</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Clinical expertise across multiple disciplines</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4">
                        {/* Large Bento Card (Primary specialty e.g. Cardiology) */}
                        {metrics.departments[0] && (
                          <div className="md:col-span-2 md:row-span-2 glass-card-premium p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute -right-8 -bottom-8 opacity-5 dark:opacity-[0.02]">
                              <span className="material-symbols-outlined text-[140px]" style={{ fontVariationSettings: "'FILL' 1" }}>cardiology</span>
                            </div>
                            <div className="relative z-10 space-y-3">
                              <div className="flex items-center gap-2 text-primary dark:text-emerald-400">
                                <span className="material-symbols-outlined text-3xl">{metrics.departments[0].icon}</span>
                                <h4 className="font-extrabold text-sm">{metrics.departments[0].name}</h4>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
                                {metrics.departments[0].desc}
                              </p>
                            </div>
                            {metrics.departments[0].head && (
                              <div className="mt-8 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3 relative z-10">
                                <img 
                                  src={metrics.departments[0].headImg} 
                                  alt={metrics.departments[0].head} 
                                  className="w-12 h-12 rounded-full object-cover border border-primary/20"
                                />
                                <div>
                                  <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-none">{metrics.departments[0].head}</p>
                                  <p className="text-[9px] text-slate-550 dark:text-slate-400 mt-1">{metrics.departments[0].headExp}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Standard Bento Card 2 */}
                        {metrics.departments[1] && (
                          <div className="md:col-span-2 glass-card-premium p-5 rounded-2xl flex items-center gap-4">
                            <div className="bg-primary/10 dark:bg-emerald-500/10 p-2.5 rounded-xl shrink-0">
                              <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-2xl">{metrics.departments[1].icon}</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white">{metrics.departments[1].name}</h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{metrics.departments[1].desc}</p>
                            </div>
                          </div>
                        )}

                        {/* Small Bento Card 3 */}
                        {metrics.departments[2] && (
                          <div className="glass-card-premium p-4 rounded-2xl flex flex-col justify-center text-center items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-2xl">{metrics.departments[2].icon}</span>
                            <h4 className="font-bold text-[10px] text-slate-800 dark:text-white leading-tight">{metrics.departments[2].name}</h4>
                            <p className="text-[8px] text-slate-550 dark:text-slate-405">{metrics.departments[2].desc}</p>
                          </div>
                        )}

                        {/* Small Bento Card 4 */}
                        {metrics.departments[3] && (
                          <div className="glass-card-premium p-4 rounded-2xl flex flex-col justify-center text-center items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-2xl">{metrics.departments[3].icon}</span>
                            <h4 className="font-bold text-[10px] text-slate-800 dark:text-white leading-tight">{metrics.departments[3].name}</h4>
                            <p className="text-[8px] text-slate-550 dark:text-slate-405">{metrics.departments[3].desc}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Emergency Arrival Protocol (Red Zone Box) */}
                    {(hospitalDetails.emergencyAvailable || selectedHospital.emergencyAvailable) && (
                      <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 border border-red-200 dark:border-red-900/50">
                        <div className="bg-white/40 dark:bg-red-900/20 p-4 rounded-full shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-red-650" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_home</span>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-extrabold text-sm md:text-base">Emergency Arrival Protocol</h3>
                            <p className="text-[10px] md:text-xs opacity-90 mt-0.5">Please execute these steps immediately if arriving with critical trauma:</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                            <div className="flex items-start gap-2">
                              <span className="bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">1</span>
                              <p className="leading-tight">Enter through Gate 4 (Red Zone). Activate hazard lights.</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">2</span>
                              <p className="leading-tight">Report to the Emergency Triage Desk immediately.</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">3</span>
                              <p className="leading-tight">Submit ID, allergies record, and active medications list.</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">4</span>
                              <p className="leading-tight">Accompanying family must wait in the Emergency Lounge.</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
                          <a 
                            href={`tel:${hospitalDetails.phone}`}
                            className="bg-red-600 hover:scale-[1.02] text-white text-[10px] font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 shadow"
                          >
                            <span className="material-symbols-outlined text-[14px]">call</span> Direct ER line
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Patient Experience Journey Timeline */}
                    <div className="space-y-6">
                      <h3 className="font-extrabold text-sm text-primary dark:text-emerald-400 uppercase tracking-wider text-center">
                        Patient Experience Timeline
                      </h3>
                      <div className="relative pt-2">
                        {/* Center Timeline Connector bar */}
                        <div className="absolute top-8 left-4 md:left-1/2 w-0.5 md:w-full h-[85%] md:h-0.5 bg-slate-100 dark:bg-slate-800 -translate-x-1/2 md:-translate-y-1/2"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10 pl-8 md:pl-0">
                          {metrics.journey.map((stepItem, idx) => (
                            <div key={idx} className="flex flex-col items-start md:items-center text-left md:text-center group">
                              <div className="absolute left-1.5 md:relative md:left-auto w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-primary dark:border-emerald-500 flex items-center justify-center mb-2 shadow group-hover:scale-105 transition-all">
                                <span className="text-[10px] font-extrabold text-primary dark:text-emerald-400">{idx + 1}</span>
                              </div>
                              <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">{stepItem.step}</h4>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 leading-normal max-w-xs">{stepItem.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Insurance & Billing accepted list */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Insurance &amp; Billing</h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Accepted cashless providers and welfare schemes</p>
                        </div>
                        <span className="text-primary dark:text-emerald-400 font-bold text-[10px] hover:underline cursor-pointer flex items-center gap-0.5">
                          Cost Estimator calculator <span className="material-symbols-outlined text-[12px]">arrow_right_alt</span>
                        </span>
                      </div>

                      {/* Cashless benefits list */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                          <span>100% Cashless Direct Billing</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                          <span>Government Health Schemes</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                          <span>Flexible 0% Interest EMIs</span>
                        </div>
                      </div>

                      {/* Accepted insurance list */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {['Aetna', 'BlueCross', 'Cigna', 'Medicare', 'UnitedHealth', 'Star Health', 'HDFC Ergo'].map((ins, i) => (
                          <span key={i} className="px-3 py-1 bg-surface-low dark:bg-slate-800/80 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-250/50 dark:border-slate-700/60">
                            🛡️ {ins}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Patient Experience & Reviews */}
                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Patient Experience & Reviews</h3>
                      <div className="space-y-4">
                        {hospitalDetails.reviews && hospitalDetails.reviews.length > 0 ? (
                          hospitalDetails.reviews.map((r, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-slate-850 dark:text-slate-200">{r.author}</span>
                                <span className="text-slate-450">{r.date}</span>
                              </div>
                              <div className="text-[9px] text-amber-500 font-bold">★ {r.rating}.0</div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed">{r.text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">No direct patient logs found.</p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Actions Footer Bar */}
                  <div className="border-t border-slate-200/60 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900/60 shrink-0 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-b-3xl">
                    <a 
                      href={`tel:${hospitalDetails.phone}`}
                      className="bg-primary hover:opacity-95 text-white py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow"
                    >
                      <span className="material-symbols-outlined text-[14px]">call</span> Call Facility
                    </a>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${selectedHospital.latitude},${selectedHospital.longitude}&travelmode=driving`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-slate-800 hover:bg-slate-950 text-white py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow"
                    >
                      <span className="material-symbols-outlined text-[14px]">directions</span> Directions
                    </a>
                    <a 
                      href={hospitalDetails.website}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-slate-350 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">language</span> Website
                    </a>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospitalDetails.name + ' ' + hospitalDetails.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-slate-350 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[14px]">near_me</span> Open Maps
                    </a>
                  </div>
                </>
              );
            })() : (
              <div className="flex items-center justify-center py-20 text-xs text-outline font-bold">
                Failed to load detailed profile.
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
