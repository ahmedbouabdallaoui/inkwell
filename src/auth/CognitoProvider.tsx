import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Amplify } from 'aws-amplify'
import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth'
import type { User } from '../types'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId:       import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        oauth: {
          domain:            import.meta.env.VITE_COGNITO_DOMAIN,
          scopes:            ['openid', 'email', 'profile'],
          redirectSignIn:    [window.location.origin],
          redirectSignOut:   [window.location.origin],
          responseType:      'code',
        },
      },
    },
  },
})

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function CognitoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser({ id: u.userId, email: u.signInDetails?.loginId ?? '', name: u.username }))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login:  () => signInWithRedirect(),
      logout: () => signOut(),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
