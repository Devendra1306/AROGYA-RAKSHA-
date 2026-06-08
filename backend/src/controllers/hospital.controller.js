const https = require('https');
const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyBLJ5qa6rhnHG-DJSncGx0yZPDQdjpaKgI';

function httpPost(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseBody));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}. Status: ${res.statusCode}`));
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(JSON.stringify(data));
    req.end();
  });
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: headers
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse Google API response: ' + e.message));
        }
      });
    }).on('error', err => reject(err));
  });
}

const hospitalController = {
  getNearby: async (req, res) => {
    const { search, category, query } = req.query;
    const searchTerm = (search || query || '').toLowerCase().trim();
    const categoryFilter = (category || '').toLowerCase().trim();

    let googleQuery = '';
    const catText = categoryFilter && categoryFilter !== 'all' ? categoryFilter : 'Hospitals';

    if (searchTerm) {
      const medicalKeywords = ['hospital', 'clinic', 'pharmacy', 'doctor', 'physician', 'cardiologist', 'dermatologist', 'ent', 'pediat', 'dentist', 'eye', 'care', 'diagnostic', 'medplus', 'apollo', 'yashoda', 'care'];
      const hasMedicalKeyword = medicalKeywords.some(keyword => searchTerm.includes(keyword));

      if (!hasMedicalKeyword) {
        googleQuery = `${catText} in ${search || query}`;
      } else {
        googleQuery = search || query;
      }
    } else {
      googleQuery = `${catText} in Hyderabad`;
    }

    try {
      const url = 'https://places.googleapis.com/v1/places:searchText';
      const data = { textQuery: googleQuery };
      const headers = {
        'X-Goog-Api-Key': MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.regularOpeningHours,places.photos,places.types,places.nationalPhoneNumber,places.websiteUri'
      };

      const searchRes = await httpPost(url, data, headers);

      if (searchRes.error) {
        console.error('Google Places v1 Search returned error:', searchRes.error.message);
        return res.json([]);
      }

      if (!searchRes.places || searchRes.places.length === 0) {
        return res.json([]);
      }

      const mapped = searchRes.places.map(place => {
        const placeName = place.displayName?.text || 'Healthcare Facility';
        let categoryVal = 'Hospitals';
        if (place.types?.includes('pharmacy')) {
          categoryVal = 'Pharmacies';
        } else if (place.types?.includes('clinic') || place.types?.includes('doctor')) {
          categoryVal = 'Clinics';
        } else if (placeName.toLowerCase().includes('diagnostic') || placeName.toLowerCase().includes('lab') || placeName.toLowerCase().includes('pathology')) {
          categoryVal = 'Diagnostic Centers';
        }

        const firstPhotoName = place.photos && place.photos.length > 0 ? place.photos[0].name : null;
        const image = firstPhotoName
          ? `https://places.googleapis.com/v1/${firstPhotoName}/media?maxWidthPx=400&key=${MAPS_API_KEY}`
          : categoryVal === 'Pharmacies'
            ? 'https://images.unsplash.com/photo-1607619056574-7b8f304b3c93?w=600&auto=format&fit=crop&q=60'
            : categoryVal === 'Clinics'
              ? 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=600&auto=format&fit=crop&q=60'
              : categoryVal === 'Diagnostic Centers'
                ? 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=60'
                : 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=60';

        let services = ['Emergency Care', 'ICU', 'Pharmacy'];
        let departments = ['General Medicine', 'Emergency Medicine'];

        if (categoryVal === 'Pharmacies') {
          services = ['Prescription Pharmacy', 'Generic Medication', 'Home Delivery'];
          departments = ['General Medicine'];
        } else if (categoryVal === 'Clinics') {
          services = ['Outpatient Consults', 'General Checkup', 'Specialist Consultation'];
          departments = ['Family Medicine'];
        } else if (categoryVal === 'Diagnostic Centers') {
          services = ['Pathology Tests', 'Radiology (MRI, CT, X-Ray)', 'Blood Panels'];
          departments = ['Radiology'];
        }

        const nameLower = placeName.toLowerCase();
        if (nameLower.includes('cardiac') || nameLower.includes('heart') || nameLower.includes('cardio')) {
          departments.push('Cardiology');
        }
        if (nameLower.includes('skin') || nameLower.includes('derm')) {
          departments.push('Dermatology');
        }
        if (nameLower.includes('child') || nameLower.includes('pediatr')) {
          departments.push('Pediatrics');
        }

        departments = [...new Set(departments)];

        return {
          _id: place.id,
          place_id: place.id,
          name: placeName,
          address: place.formattedAddress || '',
          rating: place.rating || 0,
          reviewCount: place.userRatingCount || 0,
          isOpen: place.regularOpeningHours ? place.regularOpeningHours.openNow : null,
          image: image,
          category: categoryVal,
          services: services,
          departments: departments,
          phone: place.nationalPhoneNumber || 'N/A',
          website: place.websiteUri || 'N/A'
        };
      });

      res.json(mapped);
    } catch (err) {
      console.error('Google Places Search failed:', err.message);
      res.json([]);
    }
  },

  geocode: async (req, res) => {
    res.json({ lat: 0, lng: 0, label: 'Offline Directory Mode' });
  },

  getDetails: async (req, res) => {
    const { id } = req.params;

    try {
      const url = `https://places.googleapis.com/v1/places/${id}`;
      const headers = {
        'X-Goog-Api-Key': MAPS_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,regularOpeningHours,photos,types,nationalPhoneNumber,websiteUri,reviews'
      };

      const detailsRes = await httpGet(url, headers);

      if (detailsRes.error) {
        console.error('Google Place Details v1 returned error:', detailsRes.error.message);
        return res.status(404).json({ error: detailsRes.error.message });
      }

      const place = detailsRes;
      const placeName = place.displayName?.text || 'Healthcare Facility';

      const photos = place.photos 
        ? place.photos.slice(0, 5).map(p => `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=800&key=${MAPS_API_KEY}`) 
        : [];

      const reviews = place.reviews 
        ? place.reviews.slice(0, 5).map(r => ({
            author: r.authorAttribution?.displayName || 'Anonymous Patient',
            rating: r.rating,
            text: r.text?.text || '',
            date: r.publishTime ? new Date(r.publishTime).toLocaleDateString() : 'Recent',
            avatar: r.authorAttribution?.photoUri || ''
          })) 
        : [];

      let categoryVal = 'Hospitals';
      if (place.types?.includes('pharmacy')) {
        categoryVal = 'Pharmacies';
      } else if (place.types?.includes('clinic') || place.types?.includes('doctor')) {
        categoryVal = 'Clinics';
      } else if (placeName.toLowerCase().includes('diagnostic') || placeName.toLowerCase().includes('lab') || placeName.toLowerCase().includes('pathology')) {
        categoryVal = 'Diagnostic Centers';
      }

      let services = ['Emergency Care', 'ICU', 'Pharmacy'];
      let departments = ['General Medicine', 'Emergency Medicine'];

      if (categoryVal === 'Pharmacies') {
        services = ['Prescription Pharmacy', 'Generic Medication', 'Home Delivery'];
        departments = ['General Medicine'];
      } else if (categoryVal === 'Clinics') {
        services = ['Outpatient Consults', 'General Checkup', 'Specialist Consultation'];
        departments = ['Family Medicine'];
      } else if (categoryVal === 'Diagnostic Centers') {
        services = ['Pathology Tests', 'Radiology (MRI, CT, X-Ray)', 'Blood Panels'];
        departments = ['Radiology'];
      }

      const nameLower = placeName.toLowerCase();
      if (nameLower.includes('cardiac') || nameLower.includes('heart') || nameLower.includes('cardio')) {
        departments.push('Cardiology');
      }
      if (nameLower.includes('neuro') || nameLower.includes('brain')) {
        departments.push('Neurology');
      }
      if (nameLower.includes('ortho') || nameLower.includes('bone')) {
        departments.push('Orthopedics');
      }
      if (nameLower.includes('pediatr') || nameLower.includes('child')) {
        departments.push('Pediatrics');
      }
      if (nameLower.includes('derm') || nameLower.includes('skin')) {
        departments.push('Dermatology');
      }
      if (nameLower.includes('ent')) {
        departments.push('ENT');
      }

      departments = [...new Set(departments)];

      const details = {
        _id: place.id,
        place_id: place.id,
        name: placeName,
        address: place.formattedAddress || '',
        phone: place.nationalPhoneNumber || 'N/A',
        website: place.websiteUri || 'N/A',
        rating: place.rating || 0,
        reviewCount: place.userRatingCount || 0,
        openingHours: place.regularOpeningHours ? (place.regularOpeningHours.weekdayDescriptions ? place.regularOpeningHours.weekdayDescriptions.join('\n') : 'Open Now') : '24 Hours',
        isOpen: place.regularOpeningHours ? place.regularOpeningHours.openNow : true,
        reviews: reviews,
        photos: photos,
        services: services,
        departments: departments,
        category: categoryVal
      };

      res.json(details);
    } catch (err) {
      console.error('Google Places Details failed:', err.message);
      res.status(500).json({ error: err.message });
    }
  },

  aiSearch: async (req, res) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required.' });
    }

    try {
      const googleQuery = `Hospitals for ${query}`;
      const url = 'https://places.googleapis.com/v1/places:searchText';
      const data = { textQuery: googleQuery };
      const headers = {
        'X-Goog-Api-Key': MAPS_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.regularOpeningHours,places.photos,places.types,places.nationalPhoneNumber,places.websiteUri'
      };

      const searchRes = await httpPost(url, data, headers);

      if (searchRes.error || !searchRes.places) {
        return res.json({ filters: { searchKeyword: query }, results: [] });
      }

      const results = searchRes.places.map(place => {
        const placeName = place.displayName?.text || 'Healthcare Facility';
        let categoryVal = 'Hospitals';
        if (place.types?.includes('pharmacy')) {
          categoryVal = 'Pharmacies';
        } else if (place.types?.includes('clinic') || place.types?.includes('doctor')) {
          categoryVal = 'Clinics';
        }

        const photoRef = place.photos && place.photos.length > 0 ? place.photos[0].name : null;
        const image = photoRef 
          ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${MAPS_API_KEY}`
          : 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=60';

        return {
          _id: place.id,
          place_id: place.id,
          name: placeName,
          address: place.formattedAddress || '',
          rating: place.rating || 0,
          reviewCount: place.userRatingCount || 0,
          isOpen: place.regularOpeningHours ? place.regularOpeningHours.openNow : null,
          image: image,
          category: categoryVal,
          services: ['Emergency Care', 'Outpatient Consults'],
          departments: ['General Medicine']
        };
      });

      res.json({
        filters: { searchKeyword: query },
        results
      });
    } catch (err) {
      console.error('AI search failed:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = hospitalController;
