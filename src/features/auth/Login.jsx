
// src/features/auth/Login.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff, Sparkles } from 'lucide-react';
import { loginUser, clearError } from './authSlice';
import { showError } from '../../utils/toast';
import { useEffect } from 'react';
import diwaliScene from '../../assets/images/diwali-login-scene.jpg';
import aimantraLogo from '../../assets/aimantra.png';

const PATHAKE = [
  { left: '12%', top: '8%', color: '#ffd76a', delay: '0s', size: 160 },
  { left: '28%', top: '4%', color: '#ff6b6b', delay: '1.1s', size: 120 },
  { left: '48%', top: '10%', color: '#7cf0c2', delay: '0.5s', size: 140 },
  { left: '62%', top: '3%', color: '#f4c2ff', delay: '1.8s', size: 110 },
  { left: '8%', top: '22%', color: '#ffb347', delay: '2.4s', size: 90 },
  { left: '40%', top: '18%', color: '#9ad0ff', delay: '0.9s', size: 100 },
];

const Pathaka = ({ left, top, color, delay, size }) => (
  <span
    className="pathaka"
    style={{
      left,
      top,
      width: size,
      height: size,
      '--spark': color,
      animationDelay: delay,
    }}
  >
    {Array.from({ length: 14 }).map((_, i) => (
      <i key={i} style={{ '--i': i }} />
    ))}
  </span>
);

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      const role = sessionStorage.getItem('hrms_role');
      if (role === "HOD" || role === "ReportingHead") {
        navigate('/tl-projects');
      } else {
        navigate('/all-projects');
      }
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      showError(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      showError('Please fix the errors in the form');
      return;
    }

    dispatch(loginUser({
      email: formData.email.trim(),
      password: formData.password,
    }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <style>{`
        @keyframes pathakaBurst {
          0% { transform: scale(0.2); opacity: 0; }
          12% { opacity: 1; }
          70% { opacity: 1; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes pathakaSpark {
          0% { transform: rotate(calc(var(--i) * 25.7deg)) translateY(0); opacity: 1; height: 8px; }
          100% { transform: rotate(calc(var(--i) * 25.7deg)) translateY(-48px); opacity: 0; height: 18px; }
        }
        @keyframes lanternFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .pathaka {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          animation: pathakaBurst 3.2s ease-out infinite;
        }
        .pathaka i {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 2px;
          height: 12px;
          margin-left: -1px;
          border-radius: 999px;
          background: var(--spark);
          box-shadow: 0 0 8px var(--spark);
          transform-origin: center bottom;
          animation: pathakaSpark 3.2s ease-out infinite;
          animation-delay: inherit;
        }
        .lantern { animation: lanternFloat 4.5s ease-in-out infinite; }
      `}</style>

      <img
        src={diwaliScene}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1a4a]/55 via-transparent to-[#071433]/70" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {PATHAKE.map((burst, i) => (
          <Pathaka key={i} {...burst} />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col px-5 py-6 md:px-10 lg:px-16">
        <div className="flex items-center gap-3">
          <img src={aimantraLogo} alt="Ai Mantra" className="h-10 w-auto object-contain drop-shadow" />
          <div className="leading-tight">
            <p className="text-white font-semibold text-lg">Ai Mantra</p>
            <p className="text-white/70 text-[10px] tracking-wide">Innovation. Excellence. Together.</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center lg:text-left pt-8 lg:pt-0 lg:pl-6"
          >
            <p className="text-white/90 text-lg md:text-xl mb-2">
              Wishing you and your family a very
            </p>
            <h1
              className="text-6xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-600 drop-shadow-[0_8px_24px_rgba(251,191,36,0.45)]"
              style={{ fontFamily: "'Great Vibes', 'Segoe Script', cursive" }}
            >
              Happy Diwali
            </h1>
            <p className="mt-6 text-white/80 max-w-md mx-auto lg:mx-0 leading-relaxed">
              May this Festival of Lights bring happiness, prosperity and success in your life.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative w-full max-w-[420px] mx-auto lg:ml-auto"
          >
            <div className="relative rounded-2xl p-8 border border-white/35 bg-white/15 backdrop-blur-xl shadow-[0_20px_60px_rgba(8,16,48,0.35)]">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 relative w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                  <div className="absolute inset-0 rounded-2xl bg-white/20 blur-sm" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-1 drop-shadow">Welcome Back</h2>
                <p className="text-white/75 text-sm">Sign in to your Construction PMS account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onInput={(e) => {
                        e.target.value = e.target.value.toLowerCase().trim();
                      }}
                      placeholder="Enter your email"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 border text-white placeholder:text-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm ${errors.email ? 'border-red-400' : 'border-white/35'}`}
                      disabled={loading}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                  </div>
                  {errors.email && <p className="text-xs text-red-300 mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/20 border text-white placeholder:text-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm ${errors.password ? 'border-red-400' : 'border-white/35'}`}
                      disabled={loading}
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-300 mt-1">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/40 text-blue-600 focus:ring-blue-500 bg-white/20"
                    />
                    <span className="text-sm text-white/80">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-200 hover:text-white hover:underline"
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-xs text-center text-white/60">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-white/70">
              Use your company email and password
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
