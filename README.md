# Node.js Google Auth Template 🚀

> A template for setting up Google Login using **Node.js** and **React**.

🌐 **Hosted URL**: [https://nodejs-google-auth-template-ui.vercel.app](https://nodejs-google-auth-template-ui.vercel.app)

**⭐ Please leave a star if you find it useful!**

---

## 🔐 Authentication Flow

This project implements **Google OAuth2 Authentication** using the `auth-code` flow with `@react-oauth/google` on the frontend and Node.js on the backend.

---

### 1. **Frontend (React)**

We use the `@react-oauth/google` package to initiate login:

```js
import { useGoogleLogin } from '@react-oauth/google';

const handleGoogleLogin = useGoogleLogin({
  flow: 'auth-code',
  ux_mode: 'redirect',
  redirect_uri: `${import.meta.env.VITE_APP_URL}/auth/google`,
});
```
This redirects the user to Google’s OAuth consent screen. Upon successful login, Google returns an authorization code to the redirect URI.

### 2. **Handling Redirect with Authorization Code**

After Google redirects back to our app (to `/auth/google`), we capture the `code` from the URL parameters in a component like `GoogleCallback`:
```js
useEffect(() => {
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get('code');

  if (code) {
    handleGoogleLogin(code); // send code to backend
  }
}, []);
```
We then send this code to our backend server (`handleGoogleLogin`):
```js
const response = await axios.post(
  `${import.meta.env.VITE_APP_API_URL}/auth/google`,
  null,
  {
    headers: {
      Authorization: `Bearer ${code}`
    }
  }
);
```
If login is successful, we store the returned JWT and user details in `localStorage` and redirect the app to home page:
```js
const { jwt_token, user_name, user_email, user_image } = response.data;
localStorage.setItem('user', JSON.stringify({ jwt_token, user_name, user_email, user_image }));
window.location.href = '/';
```

This component (`GoogleCallback`) is rendered at the redirect URI (`/auth/google`) and handles finalizing the authentication by exchanging the code for tokens and storing them.

---

### 1. **Backend (Node.js + Express)**
On receiving the code, the server does the following:

🔁 Exchange the auth code for an `id_token`:
```js
const tokenRequestData = {
  code,
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  grant_type: 'authorization_code',
};

const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', tokenRequestData);
const { id_token } = tokenResponse.data;
```

🧾 Decode the `id_token` to get user details:
```js
const decoded = jwt.decode(id_token, { complete: true });
const { sub: userId, email: user_email, name: user_name, picture: user_image } = decoded.payload;
```

📦 Store user in DB if not already present:
```js
let user = await User.findOne({ userId });
if (!user) {
  user = new User({ userId, email: user_email });
  await user.save();
}
```

🔐 Generate a custom JWT for session with user info:
```js
const jwtPayload = {
  user_id: userId,
  user_email,
  exp: Math.floor(Date.now() / 1000) + 60 * 500, // 500 minutes
};

const jwt_token = jwt.sign(jwtPayload, process.env.JWT_SECRET);
```

✅ Send response back to client:
```js
return res.status(200).json({
  jwt_token,
  user_name,
  user_email,
  user_image,
});
```
---

✅ The client stores this `jwt_token` and uses it to access protected routes.

---

### 1. **🛠 Tech Stack**
- Frontend: React + Vite + @react-oauth/google

- Backend: Node.js + Express

- Auth: Google OAuth2 + JWT

- Database: MongoDB (Mongoose)

















