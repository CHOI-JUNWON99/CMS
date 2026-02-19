/**
 * 이미지를 WebP 포맷으로 변환
 * @param file 원본 이미지 파일 (PNG, JPG 등)
 * @param quality WebP 품질 (0-1, 기본값 0.8)
 * @returns WebP Blob
 */
export async function convertToWebP(file: File, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 투명 배경 지원을 위해 먼저 클리어
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('WebP 변환 실패'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('이미지 로드 실패'));
    };

    // 파일을 Data URL로 읽어서 이미지에 로드
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 파일명에서 확장자를 webp로 변경
 */
export function changeExtensionToWebP(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return `${filename}.webp`;
  return `${filename.substring(0, lastDot)}.webp`;
}
