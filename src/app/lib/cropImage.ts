export type CropAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("No se pudo cargar la imagen.")));
    img.src = src;
  });
}

/** Recorta a JPEG base64 cuadrado, redimensionado a `outputSize` px. */
export async function cropImageToDataUrl(
  imageSrc: string,
  crop: CropAreaPixels,
  outputSize = 512,
  quality = 0.88,
): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible.");

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outputSize, outputSize);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (!dataUrl || dataUrl === "data:,") {
    throw new Error("No se pudo generar la imagen recortada.");
  }
  return dataUrl;
}
