import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { MapPin, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { formatApiError, login } from "../lib/api";
import { useAuth } from "../lib/auth";
import { getPostAuthRedirectPath } from "../lib/auth-routing";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { saveSession } = useAuth();
    const [showPassword, setShowPassword] = useState(false); //useState to toggle password visibility
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const redirectTo = getPostAuthRedirectPath(location.state);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const session = await login({
                uoftEmail: email,
                password,
            });

            saveSession(session);
            navigate(redirectTo, { replace: true });
        } catch (error) {
            setErrorMessage(formatApiError(error));
        } finally {
            setIsSubmitting(false);
        }
    }; // handleSubmit function to handle form submission and navigate to home page after login

    return (
        <div className="min-h-screen bg-gradient-to-tr from-blue-50 via-white to-blue-50 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
                {/* Logo and Header */} {/* Container with gradient background and centered content */}
                <div className = "text-center mb-8">
                    <div className = "inline-flex item-center gap-2 mb-6">
                        <MapPin className="w-10 h-10 text-blue-600" />
                        <span className="text-3xl font-bold text-gray-900">FindIt</span>  {/* Mappin pin icon and app name */}
                    </div>
                <h1 className = "text-2xl font-semibold text-gray-900 mb-2">Welcome Back!</h1>
                <p className = "text-gray-600">Sign In to your account and continue your journey with FindIt.</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2x1 shdaow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errorMessage ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {errorMessage}
                            </div>
                        ) : null}
                        {/* Email Input */} {/* Form with email and password inputs */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /> 
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="pl-10 h-12 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                                <button
                                    type="button"
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                > 
                                    Forgot password?
                                </button>
                             </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (<EyeOff className="w-5 h-5" />) : (<Eye className="w-5 h-5" />)}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me*/}
                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember me for 30 days</label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                state={location.state}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Sign up for free
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-8">
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700">
                        Privacy Policy
                    </a>
                </p>
            </div>
        </div>
    );
}
