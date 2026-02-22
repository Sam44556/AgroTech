'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, CheckCircle, Leaf, AlertCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email'
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const handleResendEmail = async () => {
    setResending(true)
    setResendMessage('')
    
    try {
      // Call your resend verification endpoint
      const response = await fetch('http://localhost:5000/api/auth-utils/resend-verification', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        setResendMessage('Verification email sent! Please check your inbox.')
      } else {
        const data = await response.json()
        setResendMessage(data.message || 'Failed to resend email. Please try again.')
      }
    } catch (error) {
      setResendMessage('Network error. Please try again later.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AgroLink</h1>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Verify Your Email
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            We've sent a verification link to <span className="font-semibold text-gray-900">{email}</span>
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Return here to login to your account</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Resend Message */}
          {resendMessage && (
            <div className={`rounded-lg p-4 mb-4 ${
              resendMessage.includes('sent') 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                resendMessage.includes('sent') ? 'text-green-800' : 'text-red-800'
              }`}>
                {resendMessage}
              </p>
            </div>
          )}

          {/* Resend Button */}
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm mb-3">Didn't receive the email?</p>
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="text-green-600 font-medium hover:text-green-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>

          {/* Login Button */}
          <Link
            href="/auth/login"
            className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-center"
          >
            Go to Login
          </Link>

          {/* Additional Help */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Email Protection Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Check your spam/junk folder</li>
                  <li>• Add our email to your contacts</li>
                  <li>• Verification link expires in 24 hours</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Need help?{' '}
          <Link href="/support" className="text-green-600 hover:text-green-700 underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}
