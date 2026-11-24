import React from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { StudentDashboard } from './StudentDashboard.js';
import { AdminDashboard } from './AdminDashboard.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
};
