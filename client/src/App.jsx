import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'
import { useState, useEffect } from 'react'
import './App.css'
import { FaGoogle } from 'react-icons/fa'

function GoogleLoginButton() {
  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'redirect',
    redirect_uri: `${import.meta.env.VITE_APP_URL}/auth/google`
  })

  return (
    <button onClick={handleGoogleLogin} className='google-login-button'>
      <div className='google-login-content'>
        <FaGoogle className='google-icon' />
        <span className='google-text'>Login with Google</span>
      </div>
    </button>
  )
} 

function GoogleCallback() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('code')

    const handleGoogleLogin = async (code) => {
      console.log('Google login code:', code)
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_APP_API_URL}/auth/google`,
          null,
          {
            headers: {
              Authorization: `Bearer ${code}`
            }
          }
        )

        console.log('Login response:', response.data)
        const { jwt_token, user_name, user_email, user_image } = response.data
        if ((jwt_token, user_name, user_email, user_image)) {
          const user = {
            jwt_token,
            user_name,
            user_email,
            user_image
          }
          localStorage.setItem('user', JSON.stringify(user))
          window.location.href = '/'
        }
      } catch (error) {
        console.error('Login failed:', error)
      }
    }

    if (code) {
      handleGoogleLogin(code)
    }
  }, [])

  return (
    <div className='loading-container'>
      {loading && <p>Logging you in...</p>}
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [protectedData, setProtectedData] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
      setUser(user)
    }
  }, [])

  
  const testProtectedRoute = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user || !user.jwt_token) {
        alert('Please login first')
        return
      }

      const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${user.jwt_token}`
        }
      })

      setProtectedData(response.data.user_id)
    } catch (error) {
      console.error('Protected route error:', error)
      alert('Failed to access protected route')
    }
  }


  return (
    <Router>
      <Routes>
        <Route
          path='/'
          element={
            <div className='app-container'>
              {!user && (
                <div className='login-container'>
                  <h1>Let's login</h1>
                  <GoogleLoginButton />
                </div>
              )}
              {user && (
                <div className='user-info'>
                  <img
                    src={user.user_image}
                    alt='User'
                    className='user-image'
                  />
                  <h2>{user.user_name}</h2>
                  <p>{user.user_email}</p>
                  <p>Jwt Token: {user.jwt_token}</p>
                  {
                    protectedData === null &&
                    <button
                    onClick={testProtectedRoute}
                    className='protected-route-button'
                    >
                    Test Protected Route
                  </button>
                  }
                  {protectedData && (
                    <div className='protected-data'>
                      <h3>Protected Data:</h3>
                      <p>User ID: {protectedData}</p>
                    </div>
                  )}
                  <br />
                  <button
                    onClick={() => {
                      localStorage.removeItem('user')
                      setUser(null)
                      setProtectedData(null)
                      window.location.href = '/'
                    }}
                    className='logout-button'
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          }
        />
        <Route path='/auth/google' element={<GoogleCallback />} />
      </Routes>
    </Router>
  )
}

export default App
