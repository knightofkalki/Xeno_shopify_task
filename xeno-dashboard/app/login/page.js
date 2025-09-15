'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3005/api/auth/login-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Use the new tenant authentication data
        await login({
          email: data.user.email,
          tenantId: data.tenant.id,
          tenantName: data.tenant.name,
          tenantDomain: data.tenant.domain,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role
        });

        // Store token for API requests
        localStorage.setItem('token', data.token);

        router.push('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Same Dark Professional Navbar */}
      <nav style={{
        background: '#111827',
        color: 'white',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem' }}>
            {/* Logo Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                padding: '0.5rem',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                borderRadius: '0.75rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🛒</span>
              </div>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Xeno Analytics</h1>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>Professional Dashboard</p>
              </div>
            </div>

            {/* Right Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: '#D1D5DB', fontSize: '0.875rem' }}>
                <span>Multi-Store Access Portal</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Split Screen Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        minHeight: 'calc(100vh - 4rem)'
      }}>
        {/* Left Side - Branding */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Floating Particles Background */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '15%',
            width: '150px',
            height: '150px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
            borderRadius: '50%',
            filter: 'blur(50px)',
            animation: 'float 8s ease-in-out infinite reverse'
          }}></div>

          {/* Main Branding Content */}
          <div style={{ textAlign: 'center', zIndex: 2 }}>
            <div style={{ 
              fontSize: '5rem', 
              marginBottom: '2rem',
              animation: 'bounce 3s ease-in-out infinite'
            }}>
              🛒
            </div>
            
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #60A5FA, #A78BFA, #F472B6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
              lineHeight: 1.2
            }}>
              Xeno Analytics
            </h1>
            
            <p style={{
              fontSize: '1.25rem',
              color: '#D1D5DB',
              marginBottom: '2rem',
              opacity: 0.9
            }}>
              Professional Multi-Store Dashboard
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '1rem',
              padding: '2rem',
              marginTop: '3rem'
            }}>
              <h3 style={{
                color: '#F3F4F6',
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                🌟 Enterprise Features
              </h3>
              <div style={{ color: '#D1D5DB', fontSize: '0.875rem', textAlign: 'left' }}>
                <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✅</span> Multi-tenant data isolation
                </p>
                <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✅</span> Real-time Shopify integration
                </p>
                <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✅</span> Advanced analytics & reporting
                </p>
                <p style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✅</span> Secure tenant authentication
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            background: 'white',
            borderRadius: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '3rem',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            {/* Form Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '1.5rem'
              }}>
                🔐
              </div>
              <h2 style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: '#1f2937', 
                margin: 0,
                marginBottom: '0.5rem'
              }}>
                Welcome Back
              </h2>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
                Sign in to access your store dashboard
              </p>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* ✅ CLEANED: Removed Forgot Password Link */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '0.5rem' 
                }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                  color: 'white',
                  fontWeight: '600',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 20px 25px -5px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.3)';
                  }
                }}
              >
                {loading ? '🔄 Signing In...' : '🚀 Sign In'}
              </button>
            </form>

            {error && (
              <div style={{
                marginTop: '1rem',
                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                border: '2px solid #fca5a5',
                color: '#dc2626',
                padding: '0.875rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                <span style={{ marginRight: '0.5rem' }}>❌</span>
                {error}
              </div>
            )}

            {/* Registration Link */}
            <div style={{
              marginTop: '2rem',
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
              borderRadius: '1rem',
              border: '2px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem', margin: '0 0 0.75rem 0' }}>
                New to Xeno Analytics?
              </p>
              <Link
                href="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 10px 15px -3px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';
                }}
              >
                <span>🚀</span>
                Register your Shopify store here
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.05);
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0, -30px, 0);
          }
          70% {
            transform: translate3d(0, -15px, 0);
          }
          90% {
            transform: translate3d(0, -4px, 0);
          }
        }
      `}</style>
    </div>
  );
}
