import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export function uploadImage(path: string, id: string) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      path,
      { public_id: `image-poem/${id}`, tags: `image-poem` },
      (err, res) => {
        if (err) reject(err);
        resolve(res);
      }
    );
  });
}
