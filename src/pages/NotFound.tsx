
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="text-center space-y-6 max-w-lg animate-slideIn">
        <h1 className="text-7xl font-bold text-gradient-primary">404</h1>
        <h2 className="text-2xl font-semibold text-white">Page not found</h2>
        <p className="text-zinc-400">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button asChild className="bg-purple hover:bg-purple-dark">
          <Link to="/dashboard" className="inline-flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
