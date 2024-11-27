import React, { useState, useCallback } from 'react';
import { Upload, FileWarning, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { createStudent } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface StudentData {
  firstName: string;
  lastName: string;
  grade: string;
  externalCode: string;
}

interface UploadStatus {
  success: boolean;
  message: string;
}

function BulkStudentUpload() {
  const token = useAuthStore((state) => state.token);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<Record<number, UploadStatus>>({});

  const validateExternalCode = (code: string): boolean => {
    return /^\d{5}$/.test(code);
  };

  const normalizeGrade = (grade: string): string => {
    // Handle special cases for pre-nursery, nursery, and reception
    // if (grade.toLowerCase() === 'pre-nursery') {
    //   return 'Pre-Nursery';
    // }
    // if (grade.toLowerCase() === 'nursery') {
    //   return 'Nursery';
    // }
    // if (grade.toLowerCase() === 'reception') {
    //   return 'Reception';
    // }

    // Extract just the number from strings like "Grade 1", "1", etc.
    const match = grade.match(/\d+/);
    return match ? match[0] : '';
  };

  const validateStudent = (student: StudentData): boolean => {
    const normalizedGrade = normalizeGrade(student.grade);
    return Boolean(
      student.firstName?.trim() &&
      student.lastName?.trim() &&
      normalizedGrade &&
      Number(normalizedGrade) >= 1 &&
      Number(normalizedGrade) <= 12 &&
      validateExternalCode(student.externalCode)
    );
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadStatuses({});

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

        const requiredHeaders = ['firstname', 'lastname', 'grade', 'externalcode'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
        }

        const parsedStudents = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            return {
              firstName: values[headers.indexOf('firstname')],
              lastName: values[headers.indexOf('lastname')],
              grade: values[headers.indexOf('grade')],
              externalCode: values[headers.indexOf('externalcode')],
            };
          });

        // Validate each student
        const validStudents = parsedStudents.filter(student => {
          const isValid = validateStudent(student);
          if (!isValid) {
            console.warn('Invalid student data:', student);
          }
          return isValid;
        });

        if (validStudents.length === 0) {
          throw new Error('No valid student data found in the file');
        }

        if (validStudents.length !== parsedStudents.length) {
          toast.warning(`${parsedStudents.length - validStudents.length} invalid entries were skipped`);
        }

        // Normalize grades before setting state
        const normalizedStudents = validStudents.map(student => ({
          ...student,
          grade: normalizeGrade(student.grade)
        }));

        setStudents(normalizedStudents);
        toast.success(`Successfully parsed ${normalizedStudents.length} valid students`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to parse CSV file';
        setUploadError(message);
        toast.error(message);
        setStudents([]);
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError('Failed to read file');
      toast.error('Failed to read file');
      setIsUploading(false);
    };

    reader.readAsText(file);
  }, []);

  const handleSubmit = async () => {
    if (!token) {
      setUploadError('Authentication token not found. Please log in again.');
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    if (students.length === 0) {
      setUploadError('No students to submit');
      toast.error('No students to submit');
      return;
    }

    setIsUploading(true);
    const newUploadStatuses: Record<number, UploadStatus> = {};

    try {
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        try {
          await createStudent({
            cardId: student.externalCode, // Empty by default
            name: `${student.firstName} ${student.lastName}`.trim(),
            grade: student.grade,
            externalCode: student.externalCode,
            email: '',
          }, token);

          newUploadStatuses[i] = {
            success: true,
            message: 'Successfully added',
          };
        } catch (error) {
          newUploadStatuses[i] = {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to add student',
          };
        }
        setUploadStatuses({ ...newUploadStatuses });
      }

      const successCount = Object.values(newUploadStatuses).filter(status => status.success).length;

      if (successCount === students.length) {
        toast.success(`Successfully added all ${successCount} students`);
        setStudents([]);
        setUploadError(null);
      } else {
        const message = `Added ${successCount} out of ${students.length} students`;
        toast.warning(message);
        setUploadError(message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add students';
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Student Upload</h1>
        <p className="text-gray-600">
          Upload a CSV file containing student information. Required columns:
          firstName, lastName, grade (1-12 or "Grade 1-12"), and externalCode (5 digits).
        </p>
      </div>

      <div>
        <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
          <span className="flex flex-col items-center space-y-2 pt-5">
            <Upload className="w-6 h-6 text-gray-600" />
            <span className="font-medium text-gray-600">
              {isUploading ? 'Processing...' : 'Drop CSV file or click to upload'}
            </span>
            <span className="text-xs text-gray-500">CSV files only</span>
          </span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-50 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {students.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Preview ({students.length} students)</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">External Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={index} className={uploadStatuses[index]?.success === false ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {uploadStatuses[index] ? (
                        uploadStatuses[index].success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <FileWarning className="w-5 h-5 text-red-500" />
                        )
                      ) : (
                        <span className="w-5 h-5 block" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.externalCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.firstName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.lastName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">Grade {student.grade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {uploadStatuses[index]?.message || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isUploading || students.length === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Adding Students...
                </>
              ) : (
                'Add Students'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkStudentUpload;