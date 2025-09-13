'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [availableTenants, setAvailableTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'tenantSelection'
  const { login } = useAuth();
  const router = useRouter();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/verify-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setAvailableTenants(data.tenants);
        setSelectedTenant(data.tenants[0]?.id || '1');
        setStep('tenantSelection');
      } else {
        setError(data.message || 'Access denied for this email');
      }
    } catch (error) {
      setError('Failed to verify access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const selectedTenantInfo = availableTenants.find(t => t.id === selectedTenant);
      
      // Set auth context with tenant info
      await login({
        email,
        tenantId: selectedTenant,
        tenantName: selectedTenantInfo?.name,
        tenantDomain: selectedTenantInfo?.domain
      });

      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🛒</div>
          <h2 className="text-3xl font-bold text-gray-800">Xeno Analytics</h2>
          <p className="text-gray-600 mt-2">Multi-Store Access Dashboard</p>
        </div>
        
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">We'll check your store access</p>  
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying Access...' : 'Check Store Access'}
            </button>
          </form>
        )}

        {step === 'tenantSelection' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-semibold mb-2">✅ Access Verified</div>
              <div className="text-sm text-green-700">
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Available Stores:</strong> {availableTenants.length}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Store to Access
              </label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableTenants.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} - {tenant.domain}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              {availableTenants.find(t => t.id === selectedTenant) && (
                <div className="text-blue-800">
                  <p><strong>Selected:</strong> {availableTenants.find(t => t.id === selectedTenant).name}</p>
                  <p><strong>Domain:</strong> {availableTenants.find(t => t.id === selectedTenant).domain}</p>
                  <p><strong>Tenant ID:</strong> {selectedTenant}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleTenantLogin}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Accessing Store...' : 'Access Dashboard'}
            </button>
            
            <button
              onClick={() => setStep('email')}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              ← Use Different Email
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">🏢 Available Stores:</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• techmart-dev-store (Main)</p>
            <p>• techmart-dev-store2 (Secondary)</p>
            <p>• Multi-tenant data isolation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
