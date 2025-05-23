import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !REDIRECT_URI) {
    console.error('Missing one or more required environment variables');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    // Exchange auth code for access token
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    if (!tokenRes.data.access_token) {
      return res.status(500).json({ error: 'No access token received' });
    }

    const accessToken = tokenRes.data.access_token;

    // Use access token to get accounts
    const accountRes = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!accountRes.data.accounts || accountRes.data.accounts.length === 0) {
      return res.status(404).json({ error: 'No business accounts found' });
    }

    // You can fetch locations and reviews here similarly if needed
    // For now, return the accounts list as JSON
    return res.status(200).json({ accounts: accountRes.data.accounts });

  } catch (error) {
    console.error('Error in OAuth flow:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.response?.data || error.message });
  }
}
