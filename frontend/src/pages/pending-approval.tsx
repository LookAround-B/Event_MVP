import React from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { FiClock, FiLogOut } from 'react-icons/fi';

export default function PendingApproval() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('authToken');
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full">
              <FiClock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Approval Pending</h1>
          <p className="text-gray-600 mb-6">
            Your account has been successfully created, but it requires approval from an administrator before you can access the platform.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong>
              <br />
              An administrator will review your account and approve it. You'll receive an email notification once your account is approved.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Typical approval time:</strong>
            </p>
            <p className="text-gray-600">
              Usually within 24-48 hours
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiLogOut className="w-4 h-4" />
            Logout
          </button>

          <p className="text-xs text-gray-500 mt-6">
            If you have any questions, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
