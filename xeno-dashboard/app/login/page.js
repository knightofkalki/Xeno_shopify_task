'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [availableStores, setAvailableStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { sendOTP, verifyOTP } = useAuth();
  const router = useRouter();

  const validateEmailAcrossStores = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/validate-email-all-stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success && data.authorizedStores.length > 0) {
        setAvailableStores(data.authorizedStores);
        setSelectedStore(data.authorizedStores[0].tenantId);
        setStep('storeSelection');
        
        if (data.multiStoreAccess) {
          setMessage(`🎉 Multi-store access! You have access to ${data.totalStores} stores in the organization.`);
        } else {
          setMessage(`✅ Store access verified for ${data.authorizedStores[0].storeName}`);
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to validate email across organization stores.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    const result = await sendOTP(email, selectedStore);

    if (result.success) {
      setStep('otp');
      setMessage(result.message);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await verifyOTP(email, otp);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🛒</div>
          <h2 className="text-3xl font-bold text-gray-800">Xeno Analytics</h2>
          <p className="text-gray-600 mt-2">Organization Multi-Store Access</p>
        </div>
        
        {step === 'email' && (
          <form onSubmit={validateEmailAcrossStores} className="space-y-6">
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
              <p className="text-xs text-gray-500 mt-1">We'll check your access across all organization stores</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Checking Organization Access...' : 'Find My Store Access'}
            </button>
          </form>
        )}

        {step === 'storeSelection' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800 font-semibold mb-2">✅ Organization Access Found</div>
              <div className="text-sm text-green-700">
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Authorized Stores:</strong> {availableStores.length}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Store to Access
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableStores.map(store => (
                  <option key={store.tenantId} value={store.tenantId}>
                    {store.storeName} ({store.role}) - {store.domain}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              {availableStores.find(s => s.tenantId === selectedStore) && (
                <div className="text-blue-800">
                  <p><strong>Selected:</strong> {availableStores.find(s => s.tenantId === selectedStore).storeName}</p>
                  <p><strong>Domain:</strong> {availableStores.find(s => s.tenantId === selectedStore).domain}</p>
                  <p><strong>Role:</strong> {availableStores.find(s => s.tenantId === selectedStore).role}</p>
                  {availableStores.find(s => s.tenantId === selectedStore).customerInfo && (
                    <p><strong>Customer Spent:</strong> ${availableStores.find(s => s.tenantId === selectedStore).customerInfo?.totalSpent?.toFixed(2)}</p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending Store OTP...' : 'Access Selected Store'}
            </button>
            
            <button
              onClick={() => setStep('email')}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              ← Use Different Email
            </button>
          </div>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="text-center text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg">
              <div><strong>📧 Email:</strong> {email}</div>
              <div><strong>🏪 Store:</strong> {availableStores.find(s => s.tenantId === selectedStore)?.storeName}</div>
              <div><strong>🌐 Domain:</strong> {availableStores.find(s => s.tenantId === selectedStore)?.domain}</div>
              <div><strong>🔑 Access:</strong> {availableStores.find(s => s.tenantId === selectedStore)?.role}</div>
              {availableStores.length > 1 && (
                <div><strong>🔥 Total Access:</strong> {availableStores.length} stores</div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-digit Organization OTP
              </label>
              <input
                type="text"
                required
                maxLength="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying Access...' : 'Access Store Dashboard'}
            </button>
            
            <button
              type="button"
              onClick={() => setStep('storeSelection')}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              ← Change Store Selection
            </button>
          </form>
        )}

        {message && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">🏢 Organization Stores:</p>
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
