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
    redirect_uri: `http://localhost:5173/auth/google`
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
          'http://localhost:5000/auth/google',
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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
      setUser(user)
    }
  }, [])

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
                  <p>{user.jwt_token}</p>
                  <button
                    onClick={() => {
                      localStorage.removeItem('user')
                      setUser(null)
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
