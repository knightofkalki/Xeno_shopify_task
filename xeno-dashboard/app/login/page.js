'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { sendOTP, verifyOTP } = useAuth();
  const router = useRouter();

  const validateShopifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/validate-shopify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setUserInfo(data);
        setStep('confirmed');
        
        if (data.isShopifyCustomer) {
          setMessage(`✅ Verified Shopify customer! You've spent $${data.customerInfo.totalSpent} across ${data.customerInfo.ordersCount} orders.`);
        } else if (data.isStoreAdmin) {
          setMessage(`👑 Store administrator verified! Full dashboard access granted.`);
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to validate email with Shopify store.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    const result = await sendOTP(email, '1');

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
          <p className="text-gray-600 mt-2">Shopify-Verified Dashboard</p>
        </div>
        
        {step === 'email' && (
          <form onSubmit={validateShopifyEmail} className="space-y-6">
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
              <p className="text-xs text-gray-500 mt-1">We'll check if you're a customer or admin of this Shopify store</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Validating with Shopify...' : 'Validate Shopify Access'}
            </button>
          </form>
        )}

        {step === 'confirmed' && userInfo && (
          <div className="space-y-6">
            <div className="text-center">
              {userInfo.isShopifyCustomer ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-800 font-semibold mb-2">✅ Shopify Customer Verified</div>
                  <div className="text-sm text-green-700">
                    <p><strong>Name:</strong> {userInfo.customerInfo.firstName} {userInfo.customerInfo.lastName}</p>
                    <p><strong>Total Spent:</strong> ${userInfo.customerInfo.totalSpent}</p>
                    <p><strong>Orders:</strong> {userInfo.customerInfo.ordersCount}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-yellow-800 font-semibold mb-2">👑 Store Administrator</div>
                  <div className="text-sm text-yellow-700">
                    <p><strong>Store:</strong> {userInfo.storeInfo.name}</p>
                    <p><strong>Domain:</strong> {userInfo.storeInfo.domain}</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending Secure OTP...' : 'Send Dashboard Access OTP'}
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
              <div><strong>🏪 Store:</strong> {userInfo?.storeInfo?.name || userInfo?.authorizedTenants?.[0]?.name}</div>
              <div><strong>👤 Access:</strong> {userInfo?.isShopifyCustomer ? 'Customer' : 'Administrator'}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-digit OTP from Email
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
              {loading ? 'Verifying Access...' : 'Access Dashboard'}
            </button>
            
            <button
              type="button"
              onClick={() => setStep('confirmed')}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              ← Back
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
          <p className="text-sm font-medium text-gray-700 mb-2">🔒 Shopify Store Verification:</p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Only verified Shopify customers can access</p>
            <p>• Store administrators have full access</p>
            <p>• Email must exist in store records</p>
          </div>
        </div>
      </div>
    </div>
  );
}
