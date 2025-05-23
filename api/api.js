import axios from 'axios';

export default async function handler(req, res) {
  try {
    console.log('api entered');
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');
    console.log('missing code');
    

    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log('Requesting access token');
    const accessToken = tokenRes.data.access_token;

    res.status(200).json({ accessToken });
  } catch (err) {
    console.error('OAuth token exchange failed:', err.response?.data || err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.response?.data || err.message });
  }
}
