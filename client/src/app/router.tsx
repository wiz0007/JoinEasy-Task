import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { RegisterPage } from '../features/auth/RegisterPage.js';
import { AppShell } from '../components/layout/AppShell.js';
import { DashboardPage } from '../features/dashboard/DashboardPage.js';
import { GroupsPage } from '../features/groups/GroupsPage.js';
import { AdminGroupsListPage } from '../features/groups/AdminGroupsListPage.js';
import { InvitationsPage } from '../features/invitations/InvitationsPage.js';
import { AssignmentsListPage } from '../features/assignments/AssignmentsListPage.js';
import { AssignmentDetailsPage } from '../features/assignments/AssignmentDetailsPage.js';
import { LoadingSpinner } from '../components/ui/LoadingSpinner.js';

const ProtectedRoute: React.FC<{ allowedRoles?: ('STUDENT' | 'ADMIN')[] }> = ({
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner message="Checking session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const PublicRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner message="Checking session..." />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const router = createBrowserRouter([
  // Public Routes
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  // Protected Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/groups', element: <GroupsPage /> },
          {
            path: '/admin/groups',
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [{ path: '', element: <AdminGroupsListPage /> }],
          },
          { path: '/invitations', element: <InvitationsPage /> },
          { path: '/assignments', element: <AssignmentsListPage /> },
          { path: '/assignments/:assignmentId', element: <AssignmentDetailsPage /> },
        ],
      },
    ],
  },
  // Catch all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
