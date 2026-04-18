import React from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { Clock, LogOut, CheckCircle } from 'lucide-react';

export default function PendingApproval() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('authToken');
    router.push('/rider/login');
  };

  return (
    <div className="min-h-screen  flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated floating blobs */}
      <div className="absolute top-0 -left-40 w-80 h-80  rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-0 -right-40 w-80 h-80  rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-20 w-80 h-80  rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>

      <div className="bento-card w-full max-w-md  ">
        <div className="p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 bg-opacity-10 border border-amber-400 border-opacity-30">
              <Clock className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
          </div>

          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent mb-2">
            Approval Pending
          </h1>
          <p className="text-muted-foreground mb-8">
            Your account has been successfully created and is awaiting administrator approval.
          </p>

          <div className="glass-dark w-full rounded-xl p-5 mb-6 border border-blue-400 border-opacity-20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-blue-200 mb-1">What's next?</p>
                <p className="text-xs text-muted-foreground">
                  Our team will review your account and you'll receive an email notification once you're approved.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-dark w-full rounded-xl p-5 mb-6 border border-cyan-400 border-opacity-20">
            <p className="text-sm font-semibold text-cyan-200 mb-2">Typical approval time</p>
            <p className="text-base text-on-surface font-bold">24-48 hours</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 btn-primary"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>

          <p className="text-xs text-muted-foreground mt-6">
            If you have any questions, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
