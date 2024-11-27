import React, { useState, useCallback } from 'react';
import { Upload, FileWarning, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateStudentPhoto } from '../lib/api'; // Assuming you have this API function.
import { useAuthStore } from '../store/authStore';

interface StudentPhotoData {
  externalCode: string;
  photoUrl: string;
}

interface UploadStatus {
  success: boolean;
  message: string;
}

function BulkUpdateStudentPhotos() {
  const token = useAuthStore((state) => state.token);
  const [students, setStudents] = useState<StudentPhotoData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<Record<number, UploadStatus>>({});

  // Validate the format of the externalCode (e.g., 5-digit code)
  const validateExternalCode = (code: string): boolean => {
    return /^\d{5}$/.test(code);
  };

  // Handle file upload and parsing
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

        // Check if the required columns are present
        const requiredHeaders = ['externalcode', 'photo'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
        }

        const parsedStudents = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            return {
              externalCode: values[headers.indexOf('externalcode')],
              photoUrl: values[headers.indexOf('photo')],
            };
          });

        // Validate each student
        const validStudents = parsedStudents.filter(student => {
          if (!validateExternalCode(student.externalCode)) {
            console.warn('Invalid external code:', student);
            return false;
          }
          return true;
        });

        if (validStudents.length === 0) {
          throw new Error('No valid student data found in the file');
        }

        setStudents(validStudents);
        toast.success(`Successfully parsed ${validStudents.length} valid students`);
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

  // Handle the submission of the students and update the photo URL
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
          // Call the API to update the student's photo
          await updateStudentPhoto(student.externalCode, student.photoUrl, token);

          newUploadStatuses[i] = {
            success: true,
            message: 'Successfully updated photo',
          };
        } catch (error) {
          newUploadStatuses[i] = {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update photo',
          };
        }
        setUploadStatuses({ ...newUploadStatuses });
      }

      const successCount = Object.values(newUploadStatuses).filter(status => status.success).length;

      if (successCount === students.length) {
        toast.success(`Successfully updated photos for ${successCount} students`);
        setStudents([]);
        setUploadError(null);
      } else {
        const message = `Updated photos for ${successCount} out of ${students.length} students`;
        toast.warning(message);
        setUploadError(message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update student photos';
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Student Photo Update</h1>
        <p className="text-gray-600">
          Upload a CSV file containing the `externalCode` and `photo` (URL) for students.
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo URL</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">{student.photoUrl}</td>
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
                  Updating Photos...
                </>
              ) : (
                'Update Photos'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkUpdateStudentPhotos;
