import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

function getStored() {
  try {
    const token = sessionStorage.getItem('token')
    const user = JSON.parse(sessionStorage.getItem('user') || 'null')
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(getStored)

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error }
    sessionStorage.setItem('token', data.token)
    sessionStorage.setItem('user', JSON.stringify(data.user))
    setAuth({ token: data.token, user: data.user })
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setAuth({ token: null, user: null })
  }, [])

  const updateProfile = useCallback((updates) => {
    setAuth((prev) => {
      const newUser = { ...prev.user, ...updates }
      sessionStorage.setItem('user', JSON.stringify(newUser))
      return { ...prev, user: newUser }
    })
  }, [])

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, token, user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
