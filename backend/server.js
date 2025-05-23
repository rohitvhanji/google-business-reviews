require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const qs = require('querystring');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = 'https://www.googleapis.com/auth/business.manage';

// Step 1: Redirect user to Google's OAuth 2.0 server
app.get('/auth/google', (req, res) => {
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

// Step 2: Handle the OAuth 2.0 server response
app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;

  try {
    // Step 3: Exchange authorization code for access token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const accessToken = tokenRes.data.access_token;

    // Step 4: Retrieve the user's business account
    const accountRes = await axios.get('https://mybusinessbusinessinformation.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const account = accountRes.data.accounts?.[0];
    if (!account) return res.send('No business accounts found.');

    // Step 5: Retrieve the locations for the account
    const locationRes = await axios.get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const location = locationRes.data.locations?.[0];
    if (!location) return res.send('No business locations found.');

    // Step 6: Retrieve the reviews for the location
    const reviewsRes = await axios.get(
      `https://mybusiness.googleapis.com/v4/${location.name}/reviews`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const reviews = reviewsRes.data.reviews || [];
    res.json({ reviews });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Error during OAuth or review fetching.');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
