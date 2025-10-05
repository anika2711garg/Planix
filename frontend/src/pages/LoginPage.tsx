import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginMode) {
      // Your login logic would go here
      console.log('Logging in with:', { email, password });
      navigate('/dashboard');
    } else {
      // Your sign-up logic would go here
      if (password !== confirmPassword) {
        // In a real app, you'd show a more elegant error message
        alert("Passwords don't match!");
        return;
      }
      console.log('Signing up with:', { name, email, password });
      navigate('/dashboard');
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    // Reset all form fields when switching modes
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-900">
      {/* Animated Gradient Background */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-black/30 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10">
          
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl mr-4 shadow-lg">
                <Zap className="text-white" size={32} />
              </div>
              <h1 className="text-4xl font-bold text-white tracking-wider">
                {isLoginMode ? 'Planix' : 'Create Account'}
              </h1>
            </div>
            <p className="text-gray-400">
              {isLoginMode ? 'Welcome back! Please login to continue.' : 'Join us and start optimizing your sprints!'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input (Sign Up only) */}
            {!isLoginMode && (
              <div className="relative">
                <User className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-b-2 border-gray-600 rounded-none text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors duration-300"
                  placeholder="Your Name"
                  required
                />
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-transparent border-b-2 border-gray-600 rounded-none text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors duration-300"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-transparent border-b-2 border-gray-600 rounded-none text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors duration-300"
                placeholder="Password"
                required
              />
            </div>

            {/* Confirm Password Input (Sign Up only) */}
            {!isLoginMode && (
               <div className="relative">
                <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border-b-2 border-gray-600 rounded-none text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors duration-300"
                  placeholder="Confirm Password"
                  required
                />
              </div>
            )}
            
            <div className="text-right text-sm h-5">
              {isLoginMode && (
                <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200">
                  Forgot Password?
                </a>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {isLoginMode ? 'Secure Login' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-400">
            <p>
              {isLoginMode ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button 
                type="button" 
                onClick={toggleMode} 
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors duration-200 bg-transparent border-none cursor-pointer p-0"
              >
                {isLoginMode ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
