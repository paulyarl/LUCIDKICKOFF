import { Metadata } from 'next';
import { ProfileForm } from '@/components/auth/ProfileForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your profile',
};

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="container py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and profile information.
            </p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <ProfileForm />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
