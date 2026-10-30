
import React, { useState } from 'react';
import { UploadIcon } from './icons';

interface InspectorUpdateFormProps {
  onSubmit: (review: string, photoFile: File) => void;
  isSubmitting: boolean;
}

const InspectorUpdateForm: React.FC<InspectorUpdateFormProps> = ({ onSubmit, isSubmitting }) => {
  const [review, setReview] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (review.trim() && photoFile && !isSubmitting) {
      onSubmit(review.trim(), photoFile);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/50 p-4 rounded-lg space-y-4 border border-cyan-700/50 mt-6">
      <h3 className="text-lg font-semibold text-cyan-300">Submit Inspector's Review</h3>
      <div>
        <label htmlFor="inspector-review" className="block text-sm font-medium text-gray-400 mb-1">Review Notes</label>
        <textarea
          id="inspector-review"
          rows={4}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-cyan-500 focus:border-cyan-500"
          placeholder="Describe the work done or current status..."
          required
        />
      </div>
      <div>
        <label htmlFor="inspector-photo" className="block text-sm font-medium text-gray-400 mb-1">Upload Photo Evidence</label>
        <input id="inspector-photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" required />
        <label htmlFor="inspector-photo" className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-cyan-500 transition-colors flex flex-col items-center justify-center min-h-[120px]">
          {photoPreview ? (
            <img src={photoPreview} alt="Inspector preview" className="max-h-40 w-auto rounded-md object-contain" />
          ) : (
            <>
              <UploadIcon className="w-8 h-8 text-gray-500" />
              <span className="mt-2 text-sm text-gray-400">Click to upload a photo</span>
            </>
          )}
        </label>
      </div>
      <button
        type="submit"
        disabled={!review.trim() || !photoFile || isSubmitting}
        className="w-full px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default InspectorUpdateForm;