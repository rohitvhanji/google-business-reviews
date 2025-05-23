import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import qs from 'querystring';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = 'https://www.googleapis.com/auth/business.manage';

app.get('/api/auth/google', (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${qs.stringify({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })}`;
  res.redirect(authUrl);
});

app.get('/api', async (req, res) => {
  const code = req.query.code;
  try {
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const accessToken = tokenRes.data.access_token;
    const accountRes = await axios.get(
      'https://mybusinessbusinessinformation.googleapis.com/v1/accounts',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const account = accountRes.data.accounts?.[0];
    if (!account) return res.send('No business accounts found.');

    const locationRes = await axios.get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const location = locationRes.data.locations?.[0];
    if (!location) return res.send('No locations found.');

    const reviewsRes = await axios.get(
      `https://mybusiness.googleapis.com/v4/${location.name}/reviews`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const reviews = reviewsRes.data.reviews || [];
    res.json({ reviews });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error during OAuth or fetching reviews.');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
