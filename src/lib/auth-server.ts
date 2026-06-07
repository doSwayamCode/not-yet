import { cookies } from 'next/headers';
import { auth as clerkAuth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export interface IAuthSession {
  userId: string | null;
  role: 'user' | 'admin';
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isMock: boolean;
}

const MOCK_PROFILES = [
  {
    id: 'mock_student_1',
    email: 'student@notyet.com',
    username: 'persistent_coder',
    displayName: 'Aarav Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
    role: 'user',
  },
  {
    id: 'mock_admin_1',
    email: 'swayamgupta999@gmail.com',
    username: 'swayam_admin',
    displayName: 'Swayam Gupta (Admin)',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    role: 'admin',
  },
  {
    id: 'mock_founder_1',
    email: 'founder@notyet.com',
    username: 'pivot_master',
    displayName: 'Kabir Mehta',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    role: 'user',
  }
];

export async function getServerAuth(): Promise<IAuthSession> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_session_token')?.value;
  if (adminToken === 'notYET123') {
    return {
      userId: 'swayam_admin_session',
      role: 'admin',
      email: 'swayamgupta999@gmail.com',
      username: 'swayam_admin',
      displayName: 'Swayam Gupta (Admin)',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      isMock: false,
    };
  }

  if (isClerkEnabled) {
    try {
      const { userId, sessionClaims } = await clerkAuth();
      const user = await clerkCurrentUser();

      if (!userId) {
        return {
          userId: null,
          role: 'user',
          email: null,
          username: null,
          displayName: null,
          avatarUrl: null,
          isMock: false,
        };
      }

      const email = user?.emailAddresses[0]?.emailAddress ?? null;
      const role = email === 'swayamgupta999@gmail.com' ? 'admin' : 'user';
      return {
        userId,
        role,
        email,
        username: user?.username ?? email?.split('@')[0] ?? 'user',
        displayName: user?.fullName ?? user?.username ?? 'User',
        avatarUrl: user?.imageUrl ?? null,
        isMock: false,
      };
    } catch (e) {
      console.error('Clerk getServerAuth failed, attempting fallback.', e);
    }
  }

  // Fallback to Mock Auth cookie
  const mockUserIdCookie = cookieStore.get('mock_user_id');
  const mockUserId = mockUserIdCookie?.value;

  if (mockUserId) {
    const profile = MOCK_PROFILES.find((p) => p.id === mockUserId);
    if (profile) {
      return {
        userId: profile.id,
        role: profile.role as 'user' | 'admin',
        email: profile.email,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        isMock: true,
      };
    }
  }

  // No active mock user
  return {
    userId: null,
    role: 'user',
    email: null,
    username: null,
    displayName: null,
    avatarUrl: null,
    isMock: true,
  };
}

export async function requireAdmin(): Promise<IAuthSession> {
  const auth = await getServerAuth();
  if (!auth.userId || auth.role !== 'admin') {
    throw new Error('Unauthorized. Admin role required.');
  }
  return auth;
}
