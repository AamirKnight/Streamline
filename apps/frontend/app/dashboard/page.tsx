'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.firstName || user?.username}!
            </h1>
            <p className="text-gray-600">
              Here&apos;s what&apos;s happening with your workspaces today.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workspaces</CardTitle>
                <CardDescription>Your active workspaces</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-gray-600 mt-2">No workspaces yet</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Total documents created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-gray-600 mt-2">Start creating</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collaborators</CardTitle>
                <CardDescription>Team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1</div>
                <p className="text-sm text-gray-600 mt-2">Just you for now</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with StreamLine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Create your first workspace</h3>
                  <p className="text-sm text-gray-600">
                    Workspaces help organize your documents and team
                  </p>
                </div>
                <Button>Create Workspace</Button>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Start a new document</h3>
                  <p className="text-sm text-gray-600">
                    Begin collaborating in real-time
                  </p>
                </div>
                <Button variant="outline">New Document</Button>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Invite team members</h3>
                  <p className="text-sm text-gray-600">
                    Collaborate with your team
                  </p>
                </div>
                <Button variant="outline">Invite</Button>
              </div>
            </CardContent>
          </Card>

          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="font-medium">{user?.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">First Name</p>
                  <p className="font-medium">{user?.firstName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Name</p>
                  <p className="font-medium">{user?.lastName || 'Not set'}</p>
                </div>
              </div>
              <div className="pt-4">
                <Button variant="outline">Edit Profile</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}