import qs from 'querystring';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = 'https://www.googleapis.com/auth/business.manage';

export default function handler(req, res) {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${qs.stringify({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })}`;
  res.writeHead(302, { Location: authUrl });
  res.end();
}
