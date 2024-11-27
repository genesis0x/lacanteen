import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { createStudent } from '../lib/api';
import toast from 'react-hot-toast';

export default function CreateStudent() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cardId: '',
    firstName: '',
    lastName: '',
    grade: '1', // Default grade
    email: 'lacanteen@elitelac.com', // New email field
    externalCode: '',
  });

  const validateCardId = (cardId: string) => {
    return /^\d{10}$/.test(cardId);
  };

  const validateEmail = (email: string) => {
    // Basic email validation (you can improve this)
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCardId(formData.cardId)) {
      toast.error('Card ID must be exactly 10 digits');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error('Please provide a valid email');
      return;
    }

    setIsSubmitting(true);

    try {
      await createStudent({
        cardId: formData.cardId,
        name: `${formData.firstName} ${formData.lastName}`,
        grade: formData.grade,
        email: formData.email,  // Send email to the backend
        externalCode: formData.externalCode,
      }, token ?? '');

      toast.success('Student created successfully');
      navigate('/'); // Adjust the route as needed
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <UserPlus className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Register New Student
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter student details to create a new account
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="cardId" className="block text-sm font-medium text-gray-700">
                Card ID
              </label>
              <div className="mt-1">
                <input
                  id="cardId"
                  name="cardId"
                  type="text"
                  pattern="\d{10}"
                  required
                  value={formData.cardId}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter 10-digit card ID"
                />
              </div>
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="mt-1">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter first name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="mt-1">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* New email input field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                Grade
              </label>
              <div className="mt-1">
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <option key={grade} value={grade.toString()}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}