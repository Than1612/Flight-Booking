import axios from 'axios';

export default async function handler(req, res) {
  const { AMADEUS_API_KEY, AMADEUS_API_SECRET } = process.env;
  const tokenUrl = 'https://test.api.amadeus.com/v1/security/oauth2/token';

  try {
    const response = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_API_KEY,
      client_secret: AMADEUS_API_SECRET,
    }));

    res.status(200).json({ access_token: response.data.access_token });
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Error fetching token' });
  }
}
