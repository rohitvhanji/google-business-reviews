import axios from 'axios';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  try {
    // Exchange auth code for tokens
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // Get account info
    const accountRes = await axios.get(
      'https://mybusinessbusinessinformation.googleapis.com/v1/accounts',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const account = accountRes.data.accounts?.[0];
    if (!account) return res.send('No business accounts found.');

    // Get location info
    const locationRes = await axios.get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const location = locationRes.data.locations?.[0];
    if (!location) return res.send('No locations found.');

    // Get reviews
    const reviewsRes = await axios.get(
      `https://mybusiness.googleapis.com/v4/${location.name}/reviews`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const reviews = reviewsRes.data.reviews || [];
    res.status(200).json({ reviews });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error during OAuth or fetching reviews.');
  }
}
