import { getImage } from "../../utils/formidable";
import { uploadImage } from "../../utils/cloudinary";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const imageUploaded = await getImage(req);

  const imageData = await uploadImage(imageUploaded.path);

  res.json(imageData);
}
