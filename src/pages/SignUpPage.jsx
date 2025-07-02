import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust path as needed

export default function SignupPage() {
  const { signup, isLoading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signup(formData.email, formData.username, formData.password);
      
      if (result.success) {
        alert('Account created successfully!');
        
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: ''
        });
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // Handle specific error messages
        if (result.error.includes('User already exists') || result.error.includes('already exists')) {
          setErrors({ email: 'User with this email already exists' });
        } else if (result.error.includes('Password must be at least 8 characters')) {
          setErrors({ password: 'Password must be at least 8 characters long' });
        } else if (result.error.includes('All fields are required')) {
          setErrors({ 
            username: 'Username is required',
            email: 'Email is required',
            password: 'Password is required'
          });
        } else {
          // General error
          alert('Signup failed: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormLoading = isLoading || authLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-300">Join us today and get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-white focus:bg-white/10 transition-all duration-200 ${
                errors.username ? 'border-red-400' : 'border-gray-600'
              }`}
              placeholder="Enter your username"
              disabled={isFormLoading}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-white focus:bg-white/10 transition-all duration-200 ${
                errors.email ? 'border-red-400' : 'border-gray-600'
              }`}
              placeholder="Enter your email"
              disabled={isFormLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-white focus:bg-white/10 transition-all duration-200 ${
                errors.password ? 'border-red-400' : 'border-gray-600'
              }`}
              placeholder="Create a password"
              disabled={isFormLoading}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isFormLoading}
            className="w-full bg-white text-black py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 hover:shadow-lg focus:ring-4 focus:ring-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFormLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-300">
            Already have an account?{' '}
            <a href="#" className="text-white hover:text-gray-200 font-medium transition-colors underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}