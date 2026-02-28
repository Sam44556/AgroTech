'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Leaf, User, ShoppingCart, GraduationCap, Shield, CheckCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export default function SignUpPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    agreeToTerms: false
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    if (!selectedRole) {
      setError('Please select your role!')
      return
    }
    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions!')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Use Better Auth client to sign up
      const result = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        phone: formData.phone,
        role: selectedRole.toUpperCase(),
        location: formData.location
      } as any)

      if (result.error) {
        const errorMsg = result.error.message || '';
        // Better Auth handles generic creation failures with obscure messages if database unique constraint fails
        if (errorMsg.toLowerCase().includes('phone') && (errorMsg.toLowerCase().includes('unique') || errorMsg.toLowerCase().includes('already exists'))) {
          setError('This phone number is already registered. Please try logging in or use another number.')
        } else if (result.error.code === "USER_ALREADY_EXISTS" || result.error.code === "EMAIL_ALREADY_EXISTS") {
          setError('This email address is already registered. Please try logging in.')
        } else if (errorMsg.includes('P2002') && errorMsg.includes('phone')) {
          // This catches Prisma specific unique constraint codes if they bubble up
          setError('This phone number is already registered.')
        } else {
          setError(result.error.message || 'Failed to create account. Please try again.')
        }
        return
      }

      // Success! Account created and verification email sent
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      console.error('Signup error:', err)
    } finally {
      setIsLoading(false)
    }
  }



  const roles = [
    {
      id: 'farmer',
      name: 'Farmer',
      description: 'Sell produce, get market prices, connect with buyers',
      icon: Leaf,
      color: 'green'
    },
    {
      id: 'buyer',
      name: 'Buyer/Retailer',
      description: 'Purchase directly from farmers, negotiate fair prices',
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      id: 'expert',
      name: 'Agronomist/Expert',
      description: 'Provide advisory services to farmers',
      icon: GraduationCap,
      color: 'purple'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AgroLink</h1>
              <p className="text-green-600 font-medium">Join the Agricultural Revolution</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-2">

            {/* Left Side - Role Selection */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Choose Your Role</h2>
              <p className="text-green-100 mb-8">Select how you want to participate in the AgroLink ecosystem</p>

              <div className="space-y-4">
                {roles.map((role) => {
                  const IconComponent = role.icon
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedRole === role.id
                          ? 'border-white bg-white/10 shadow-lg'
                          : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                        }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRole === role.id ? 'bg-white text-green-600' : 'bg-white/20 text-white'
                          }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{role.name}</h3>
                            {selectedRole === role.id && (
                              <CheckCircle className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <p className={`text-sm ${selectedRole === role.id ? 'text-green-100' : 'text-white/80'
                            }`}>
                            {role.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>


            </div>

            {/* Right Side - Sign Up Form */}
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
                <p className="text-gray-600">Fill in your information to get started</p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="+251 9XX XXX XXX"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location (City/Region)
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    required
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="e.g., Addis Ababa, Oromia"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors pr-10"
                        placeholder="Create password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors pr-10"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    required
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="agreeToTerms" className="text-sm text-gray-600 leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" className="text-green-600 hover:text-green-700 underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-green-600 hover:text-green-700 underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>

                </div>


              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-green-600 font-medium hover:text-green-700">
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}