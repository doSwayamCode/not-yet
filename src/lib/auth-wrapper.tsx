'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClerkProvider, SignInButton as ClerkSignInButton, SignUpButton as ClerkSignUpButton, UserButton as ClerkUserButton, useUser as useClerkUser, useAuth as useClerkAuth } from '@clerk/nextjs';

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export interface IMockUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: 'user' | 'admin';
  persistenceScore: number;
}

export const MOCK_USERS: IMockUser[] = [
  {
    id: 'mock_student_1',
    email: 'student@notyet.com',
    username: 'persistent_coder',
    displayName: 'Aarav Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
    role: 'user',
    persistenceScore: 180,
  },
  {
    id: 'mock_admin_1',
    email: 'swayamgupta999@gmail.com',
    username: 'swayam_admin',
    displayName: 'Swayam Gupta (Admin)',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    role: 'admin',
    persistenceScore: 999,
  },
  {
    id: 'mock_founder_1',
    email: 'founder@notyet.com',
    username: 'pivot_master',
    displayName: 'Kabir Mehta',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    role: 'user',
    persistenceScore: 350,
  }
];

interface AuthContextType {
  isSignedIn: boolean;
  userId: string | null;
  user: IMockUser | null;
  loginAsMockUser: (id: string) => void;
  logoutMock: () => void;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  userId: null,
  user: null,
  loginAsMockUser: () => {},
  logoutMock: () => {},
  isMock: true,
});

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<IMockUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('notyet_mock_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
      } catch (e) {
        // Clear corrupt state
        localStorage.removeItem('notyet_mock_user');
      }
    }
    setLoaded(true);
  }, []);

  const loginAsMockUser = (id: string) => {
    const found = MOCK_USERS.find((u) => u.id === id);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('notyet_mock_user', JSON.stringify(found));
      // Write a cookie for server-side endpoints to read mock session
      document.cookie = `mock_user_id=${found.id}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  const logoutMock = () => {
    setCurrentUser(null);
    localStorage.removeItem('notyet_mock_user');
    document.cookie = 'mock_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#A3A3A3]">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <span className="text-sm font-medium tracking-wider">notYET loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: !!currentUser,
        userId: currentUser ? currentUser.id : null,
        user: currentUser,
        loginAsMockUser,
        logoutMock,
        isMock: true,
      }}
    >
      {children}
      {/* Mock login drawer in dev or when Clerk is absent */}
      {!isClerkEnabled && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#0F0F0F] border border-neutral-800 rounded-lg p-3 shadow-xl max-w-sm">
          <div className="text-xs font-bold text-amber-500 mb-2 uppercase tracking-widest flex items-center justify-between">
            <span>Mock Auth Mode</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          {currentUser ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  className="w-7 h-7 rounded-full border border-neutral-700 object-cover"
                />
                <div>
                  <div className="text-xs font-semibold text-white leading-tight">{currentUser.displayName}</div>
                  <div className="text-[10px] text-neutral-400">@{currentUser.username} ({currentUser.role})</div>
                </div>
              </div>
              <button
                onClick={logoutMock}
                className="w-full text-center py-1 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded transition"
              >
                Switch User / Log Out
              </button>
            </div>
          ) : (
            <div>
              <div className="text-[10px] text-neutral-400 mb-2">
                Clerk credentials not configured. Choose a mock profile to explore all actions:
              </div>
              <div className="flex flex-col gap-1.5">
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => loginAsMockUser(user.id)}
                    className="flex items-center gap-2 w-full text-left p-1.5 rounded hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition"
                  >
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{user.displayName}</div>
                      <div className="text-[9px] text-neutral-500 truncate">@{user.username} • {user.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isClerkEnabled) {
    return (
      <ClerkProvider
        appearance={{
          variables: {
            colorPrimary: '#f59e0b', // amber-500
            colorText: '#f5f5f5', // neutral-100
            colorTextSecondary: '#a3a3a3', // neutral-400
            colorBackground: '#0c0c0c', // neutral-950
            colorInputBackground: '#171717', // neutral-900
            colorInputText: '#f5f5f5',
            colorBorder: '#262626', // neutral-800
          },
          elements: {
            card: 'bg-[#0f0f0f] border border-neutral-800 shadow-2xl rounded-xl',
            headerTitle: 'text-2xl font-black text-white',
            headerSubtitle: 'text-sm text-neutral-400',
            formButtonPrimary: 'bg-amber-500 hover:bg-amber-400 text-black font-semibold transition',
            formFieldInput: 'bg-neutral-900 border border-neutral-800 text-white rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500',
            footerActionText: 'text-neutral-400',
            footerActionLink: 'text-amber-500 hover:text-amber-400',
            dividerText: 'text-neutral-500',
            dividerLine: 'bg-neutral-800',
          }
        }}
      >
        {children}
      </ClerkProvider>
    );
  }
  return <MockAuthProvider>{children}</MockAuthProvider>;
}

export function useAppUser() {
  const mockAuth = useContext(AuthContext);

  if (!isClerkEnabled) {
    return {
      isSignedIn: mockAuth.isSignedIn,
      isLoaded: true,
      user: mockAuth.user,
      isMock: true,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerkUser = useClerkUser();

  return {
    isSignedIn: clerkUser.isSignedIn ?? false,
    isLoaded: clerkUser.isLoaded,
    user: clerkUser.user ? {
      id: clerkUser.user.id,
      email: clerkUser.user.emailAddresses[0]?.emailAddress ?? '',
      username: clerkUser.user.username ?? clerkUser.user.emailAddresses[0]?.emailAddress.split('@')[0] ?? 'user',
      displayName: clerkUser.user.fullName ?? clerkUser.user.username ?? 'User',
      avatarUrl: clerkUser.user.imageUrl,
      role: clerkUser.user.emailAddresses[0]?.emailAddress === 'swayamgupta999@gmail.com' ? 'admin' : 'user',
      persistenceScore: (clerkUser.user.publicMetadata?.persistenceScore as number) ?? 0,
    } : null,
    isMock: false,
  };
}

export function useAppAuth() {
  const mockAuth = useContext(AuthContext);

  if (!isClerkEnabled) {
    return {
      isSignedIn: mockAuth.isSignedIn,
      userId: mockAuth.userId,
      isLoaded: true,
      getToken: async () => 'mock-token',
      isMock: true,
      loginAsMockUser: mockAuth.loginAsMockUser,
      logoutMock: mockAuth.logoutMock,
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerkAuth = useClerkAuth();

  return {
    isSignedIn: clerkAuth.isSignedIn ?? false,
    userId: clerkAuth.userId,
    isLoaded: clerkAuth.isLoaded,
    getToken: clerkAuth.getToken,
    isMock: false,
    loginAsMockUser: () => {},
    logoutMock: () => {},
  };
}

export function SignInButton({ children, ...props }: any) {
  const mockAuth = useContext(AuthContext);
  if (isClerkEnabled) {
    return <ClerkSignInButton {...props}>{children}</ClerkSignInButton>;
  }
  return (
    <button
      onClick={() => {
        // Automatically sign in as Aarav (student) if no one is logged in
        mockAuth.loginAsMockUser(MOCK_USERS[0].id);
      }}
      className={props.className}
    >
      {children || 'Sign In'}
    </button>
  );
}

export function SignUpButton({ children, ...props }: any) {
  if (isClerkEnabled) {
    return <ClerkSignUpButton {...props}>{children}</ClerkSignUpButton>;
  }
  return <SignInButton {...props}>{children}</SignInButton>;
}

function ClerkUserButtonWrapper() {
  return <ClerkUserButton />;
}

export function UserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  const { isSignedIn, user, isMock } = useAppUser();
  const mockAuth = useContext(AuthContext);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-neutral-900/50 animate-pulse"></div>;
  }

  if (isClerkEnabled) {
    return (
      <div className="flex items-center">
        {isSignedIn ? (
          <ClerkUserButtonWrapper />
        ) : (
          <SignInButton className="text-xs px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition font-medium">
            Sign In
          </SignInButton>
        )}
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <SignInButton className="text-xs px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition font-medium">
        Sign In
      </SignInButton>
    );
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 p-1 rounded-full hover:bg-neutral-900 border border-neutral-800 transition">
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          className="w-8 h-8 rounded-full object-cover"
        />
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-[#0F0F0F] border border-neutral-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition duration-200 z-50 p-1">
        <div className="px-3 py-2 border-b border-neutral-800">
          <div className="text-xs font-semibold text-white truncate">{user.displayName}</div>
          <div className="text-[10px] text-neutral-400 truncate">@{user.username}</div>
        </div>
        <button
          onClick={mockAuth.logoutMock}
          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-neutral-900 rounded transition"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
