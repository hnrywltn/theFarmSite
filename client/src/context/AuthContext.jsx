import { createContext, useContext, useState } from 'react'

const PASSWORD = 'farmPassword2026'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem('auth') === '1'
  )

  function login(password) {
    if (password === PASSWORD) {
      sessionStorage.setItem('auth', '1')
      setIsLoggedIn(true)
      return true
    }
    return false
  }

  function logout() {
    sessionStorage.removeItem('auth')
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
