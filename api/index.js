// pages/api/index.js
import axios from 'axios';

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  try {
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

    const accessToken = tokenRes.data.access_token;

    // You can now use accessToken to call Google APIs
    res.status(200).json({ token: accessToken });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Token exchange failed.');
  }
}
