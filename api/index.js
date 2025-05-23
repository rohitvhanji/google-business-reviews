import axios from 'axios';

export default async function handler(req, res) {
  try {
    console.log('Handler start');

    if (req.method !== 'GET') {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const code = req.query.code;
    if (!code) {
      console.log('Missing code in query');
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !REDIRECT_URI) {
      console.error('Env variables missing');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    console.log('Exchanging code for tokens');
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

    console.log('Token response:', tokenRes.data);

    if (!tokenRes.data.access_token) {
      console.log('No access token in response');
      return res.status(500).json({ error: 'No access token received' });
    }

    const accessToken = tokenRes.data.access_token;

    console.log('Fetching accounts with access token');
    const accountRes = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('Accounts response:', accountRes.data);

    if (!accountRes.data.accounts || accountRes.data.accounts.length === 0) {
      return res.status(404).json({ error: 'No business accounts found' });
    }

    res.status(200).json({ accounts: accountRes.data.accounts });

  } catch (err) {
    console.error('Error caught:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Internal Server Error', details: err.response?.data || err.message || err });
  }
}
