import React, { useRef } from 'react';

export interface ImageUpload {
  file: File;
  preview: string;
  caption: string;
}

interface ImageUploaderProps {
  images: ImageUpload[];
  onImagesChange: (images: ImageUpload[]) => void;
  existingImages?: string[];
  onExistingImageRemove?: (index: number) => void;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  existingImages = [],
  onExistingImageRemove,
  label = '이미지 (선택, 여러 장 가능)',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImageUpload[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          caption: '',
        });
      }
    });

    onImagesChange([...images, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...images];
    URL.revokeObjectURL(updated[index].preview);
    updated.splice(index, 1);
    onImagesChange(updated);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updated = [...images];
    updated[index].caption = caption;
    onImagesChange(updated);
  };

  return (
    <div>
      {/* 기존 이미지 표시 (수정 모드) */}
      {existingImages.length > 0 && onExistingImageRemove && (
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-200 mb-1">기존 이미지</label>
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-video rounded-lg overflow-hidden border border-slate-700"
              >
                <img src={url} alt="기존 이미지" className="w-full h-full object-cover" />
                <button
                  onClick={() => onExistingImageRemove(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="block text-xs font-bold text-slate-200 mb-1">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-dashed border-slate-600 text-slate-200 text-sm hover:border-slate-500 hover:text-slate-300 transition-all"
      >
        <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        클릭하여 이미지 선택
      </button>

      {/* 새 이미지 미리보기 */}
      {images.length > 0 && (
        <div className="mt-3 space-y-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-700"
            >
              <img src={img.preview} alt="미리보기" className="w-16 h-16 object-cover rounded" />
              <div className="flex-1">
                <input
                  type="text"
                  value={img.caption}
                  onChange={(e) => handleCaptionChange(idx, e.target.value)}
                  className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                  placeholder="캡션 (선택)"
                />
                <p className="text-[10px] text-slate-300 mt-1 truncate">{img.file.name}</p>
              </div>
              <button onClick={() => handleRemoveImage(idx)} className="text-red-400 hover:text-red-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
