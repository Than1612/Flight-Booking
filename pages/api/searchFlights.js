import axios from 'axios';

async function getAccessToken() {
  const { AMADEUS_API_KEY, AMADEUS_API_SECRET } = process.env;
  const tokenUrl = 'https://test.api.amadeus.com/v1/security/oauth2/token';

  try {
    const response = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_API_KEY,
      client_secret: AMADEUS_API_SECRET,
    }));

    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching token:', error);
    throw new Error('Error fetching token');
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { origin, destination, departureDate } = req.body;

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ error: 'Missing required parameters: origin, destination, departureDate' });
    }

    try {
      const accessToken = await getAccessToken();
      console.log('Access Token:', accessToken);

      const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
        params: {
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate,
          adults: 1,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const flights = response.data.data.map(flight => {
        return {
          id: flight.id,
          segments: flight.itineraries[0].segments,
          seatsAvailable: flight.numberOfBookableSeats,
        };
      });

      res.status(200).json({ flights });
    } catch (error) {
      console.error('Error fetching flights:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Error fetching flights', details: error.response ? error.response.data : error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
