import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import heroImage from '../../../assets/images/login-hero.jpg';
import heroImageSmall from '../../../assets/images/login-hero-sm.jpg';

// Hero photo: Troy Mortier on Unsplash (https://unsplash.com/photos/xkAIwD0hsbg), Unsplash License.

const REMEMBERED_EMAIL_KEY = 'anuradha_tms_remembered_email';

const SYSTEM_FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';

// Semi-transparent professional blue overlay (~50-60% opacity) that keeps the
// trucks and warehouse visible while giving the white tagline enough contrast.
const HERO_OVERLAY = 'linear-gradient(180deg, rgba(30, 91, 168, 0.50) 0%, rgba(16, 58, 118, 0.60) 100%)';

const loginSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: false }).required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Enter a valid email address',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
  remember: Joi.boolean(),
});

function readRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

function persistRememberedEmail(remember, email) {
  try {
    if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Storage may be unavailable (private mode); remembering is best-effort.
  }
}

const inputBase =
  'block w-full h-12 rounded-md border bg-white px-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 ' +
  'outline-none focus:border-[#1e5ba8] focus:ring-1 focus:ring-[#1e5ba8] disabled:bg-gray-50';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);

  const rememberedEmail = readRememberedEmail();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: joiResolver(loginSchema),
    defaultValues: { email: rememberedEmail, password: '', remember: !!rememberedEmail },
  });

  const onSubmit = async ({ email, password, remember }) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      persistRememberedEmail(remember, email);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col lg:flex-row" style={{ fontFamily: SYSTEM_FONT_STACK }}>
      {/* ---- Left: login panel ---- */}
      <main className="flex flex-1 flex-col bg-white px-6 py-8 sm:px-10 lg:w-1/2 lg:flex-none lg:px-16 lg:py-10">
        <Brand />

        <div className="flex flex-1 items-center justify-center py-10 lg:py-0">
          <div className="w-full max-w-[400px]">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-[15px] text-gray-500">Sign in to manage your trips, drivers and deliveries.</p>

            {serverError && (
              <div role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  disabled={submitting}
                  className={`${inputBase} ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    disabled={submitting}
                    className={`${inputBase} pr-12 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    aria-controls="password"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:text-[#1e5ba8] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#1e5ba8]"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember me + forgot password */}
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="remember" className="flex min-h-11 cursor-pointer select-none items-center gap-2.5 text-sm text-gray-700">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-[18px] w-[18px] cursor-pointer rounded border-gray-300 accent-[#1e5ba8] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#1e5ba8]"
                    {...register('remember')}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetHelp((s) => !s)}
                  aria-expanded={showResetHelp}
                  aria-controls="reset-help"
                  className="min-h-11 text-sm font-medium text-[#1e5ba8] hover:text-[#174a8a] hover:underline focus:outline-none focus-visible:underline"
                >
                  Forgot password?
                </button>
              </div>

              {showResetHelp && (
                <p id="reset-help" className="rounded-md border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-600">
                  Please contact your system administrator to reset your password.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center rounded-md bg-[#1e5ba8] text-[15px] font-semibold text-white hover:bg-[#174a8a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e5ba8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p className="hidden text-xs text-gray-400 lg:block">© {new Date().getFullYear()} Anuradha Transport. All rights reserved.</p>
      </main>

      {/* ---- Right (desktop) / bottom banner (mobile): hero image ---- */}
      <aside className="relative h-48 overflow-hidden sm:h-56 lg:h-auto lg:w-1/2">
        <picture>
          <source media="(min-width: 1024px)" srcSet={heroImage} />
          <img
            src={heroImageSmall}
            alt="Semi-trucks and trailers parked at a logistics warehouse"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-0" style={{ backgroundImage: HERO_OVERLAY }} aria-hidden="true" />

        <div className="relative flex h-full items-center justify-center px-6 text-center">
          <p className="max-w-md text-lg font-semibold leading-snug text-white sm:text-xl lg:text-[32px] lg:leading-tight">
            Moving Freight. Connecting Business.
            <span className="mt-1 block font-normal text-white/90 lg:mt-3 lg:text-xl">Smarter Transportation. Better Logistics.</span>
          </p>
        </div>
      </aside>

      <p className="bg-white px-6 py-4 text-center text-xs text-gray-400 lg:hidden">
        © {new Date().getFullYear()} Anuradha Transport. All rights reserved.
      </p>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1e5ba8] text-white" aria-hidden="true">
        <TruckIcon className="h-6 w-6" />
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold text-gray-900">Anuradha Transport</div>
        <div className="text-xs text-gray-500">Transport Management System</div>
      </div>
    </div>
  );
}

/* ---- Inline icons (no extra deps) ---- */
function TruckIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8 0h2m-6 0h4m4 0h1a1 1 0 001-1v-3.28a1 1 0 00-.684-.948l-2.658-.886a1 1 0 01-.632-.632l-.895-2.684A1 1 0 0016.28 8H13" />
    </svg>
  );
}

function EyeIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}
