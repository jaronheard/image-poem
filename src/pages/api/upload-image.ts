import { getImage } from "../../utils/formidable";
import { uploadImage } from "../../utils/cloudinary";
import { NextApiRequest, NextApiResponse } from "next";
import { nanoid } from "nanoid";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = nanoid();

  try {
    const imageUploaded = await getImage(req);

    const imageData = await uploadImage(imageUploaded.filepath, id);

    res.status(200).json({ result: imageData });
  } catch (err) {
    res.status(500).json({ error: "failed to upload image" });
  }
}
