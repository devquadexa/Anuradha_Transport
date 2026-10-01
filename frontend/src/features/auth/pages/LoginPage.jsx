import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: false }).required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Enter a valid email address',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: joiResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await login(values);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#eef1fb]">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-[0_30px_60px_-15px_rgba(13,71,161,0.25)] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[520px]">
          {/* ---- Left: form ---- */}
          <div className="relative z-10 px-8 sm:px-12 py-12 flex flex-col justify-center">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-gray-800">Hello!</h1>
              <p className="text-gray-500 mt-1">Sign in to your account</p>
            </div>

            {serverError && (
              <div className="mb-4 rounded-xl bg-red-50 text-red-600 text-sm px-4 py-2 border border-red-100">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
              {/* Email */}
              <div>
                <div
                  className={`flex items-center gap-3 rounded-full bg-white pl-4 pr-5 py-3 shadow-[0_8px_20px_-6px_rgba(13,71,161,0.25)] ring-1 transition ${
                    errors.email ? 'ring-red-300' : 'ring-transparent focus-within:ring-sky-300'
                  }`}
                >
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white shrink-0">
                    <MailIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="E-mail"
                    autoComplete="email"
                    className="grow bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 ml-4">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <div
                  className={`flex items-center gap-3 rounded-full bg-white pl-4 pr-5 py-3 shadow-[0_8px_20px_-6px_rgba(13,71,161,0.25)] ring-1 transition ${
                    errors.password ? 'ring-red-300' : 'ring-transparent focus-within:ring-sky-300'
                  }`}
                >
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-white shrink-0">
                    <LockIcon className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="grow bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-sky-600 hover:text-blue-700 transition"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-4">{errors.password.message}</p>}
              </div>

              {/* Remember + forgot */}
              <div className="flex items-center justify-between px-2 text-sm">
                <label className="flex items-center gap-2 text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" className="accent-blue-600 w-4 h-4 rounded" />
                  Remember me
                </label>
                <span className="text-blue-600/70 cursor-default">Forgot password?</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 self-center w-48 rounded-full py-3 font-semibold tracking-wide text-white bg-gradient-to-r from-sky-500 to-blue-700 shadow-[0_12px_24px_-8px_rgba(13,71,161,0.6)] hover:shadow-[0_16px_30px_-8px_rgba(13,71,161,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {submitting && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {submitting ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </form>
          </div>

          {/* ---- Right: gradient welcome panel with wavy edge ---- */}
          <div className="relative hidden md:flex flex-col overflow-hidden bg-gradient-to-br from-sky-500 via-blue-700 to-blue-900 text-white">
            {/* wavy divider that overlaps into the form side */}
            <svg
              className="absolute top-0 left-0 h-full w-24 -translate-x-[99%] text-sky-500 z-10"
              viewBox="0 0 100 800"
              preserveAspectRatio="none"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M100,0 C40,120 90,180 55,300 C25,410 85,470 45,600 C15,700 70,760 100,800 L100,0 Z" />
            </svg>

            {/* background route / road motif */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
              viewBox="0 0 400 520"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M-20 460 C120 420 60 300 200 260 C340 220 260 120 420 90"
                stroke="white"
                strokeWidth="3"
                strokeDasharray="14 12"
                strokeLinecap="round"
              />
              <circle cx="200" cy="260" r="9" fill="white" />
              <circle cx="200" cy="260" r="18" stroke="white" strokeWidth="2" />
            </svg>
            {/* decorative glow blobs */}
            <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 -left-6 w-48 h-48 rounded-full bg-sky-300/20 blur-2xl" />

            {/* Top brand lockup */}
            <div className="relative z-20 flex items-center gap-3 px-10 pt-9">
              <div className="grid place-items-center w-12 h-12 rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/25">
                <TruckIcon className="w-7 h-7" />
              </div>
              <div className="leading-tight">
                <div className="text-lg font-extrabold tracking-wide">ANURADHA</div>
                <div className="text-[11px] font-medium tracking-[0.35em] text-white/70">
                  TRANSPORT SERVICE
                </div>
              </div>
            </div>

            {/* Centre message */}
            <div className="relative z-20 flex-1 flex flex-col justify-center px-10">
              <h2 className="text-4xl font-extrabold mb-3">Welcome Back!</h2>
              <p className="text-white/80 leading-relaxed max-w-xs">
                Your fleet, trips and deliveries, tracked in real time from pickup to drop-off.
              </p>

              {/* feature highlights */}
              <ul className="mt-7 space-y-3.5 max-w-xs">
                <Feature icon={<PinIcon className="w-4 h-4" />} text="Live GPS trip tracking" />
                <Feature icon={<GaugeIcon className="w-4 h-4" />} text="Automatic mileage verification" />
                <Feature icon={<ChartIcon className="w-4 h-4" />} text="One-click delivery reports" />
              </ul>
            </div>

            {/* Bottom strip */}
            <div className="relative z-20 px-10 pb-8 text-xs text-white/60">
              Moving Sri Lanka forward, one delivery at a time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid place-items-center w-7 h-7 rounded-full bg-white/15 ring-1 ring-white/20 shrink-0">
        {icon}
      </span>
      <span className="text-sm text-white/90">{text}</span>
    </li>
  );
}

/* ---- Inline icons (no extra deps) ---- */
function TruckIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8 0h2m-6 0h4m4 0h1a1 1 0 001-1v-3.28a1 1 0 00-.684-.948l-2.658-.886a1 1 0 01-.632-.632l-.895-2.684A1 1 0 0016.28 8H13" />
    </svg>
  );
}

function MailIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function EyeIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function PinIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function GaugeIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l3.5-3.5M12 12a1 1 0 100-.001" />
    </svg>
  );
}

function ChartIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6m4 6V9m4 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
