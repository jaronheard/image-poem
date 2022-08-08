import { Dispatch, SetStateAction } from "react";

const exportAsImage = async (
  url: string,
  fileName = "test.png",
  setProgress: Dispatch<SetStateAction<"" | "in-progress" | "finished">>
) => {
  setProgress("in-progress");
  return await fetch(url)
    .then((res) => res.blob())
    .then((blob) => {
      const imageURL = URL.createObjectURL(blob);
      downloadImage(imageURL, fileName);
    })
    .then(() => setProgress("finished"))
    .catch((err) => console.log(err));
};

const downloadImage = (url: string, fileName: string) => {
  const fakeLink = window.document.createElement("a");
  fakeLink.setAttribute("style", "display: none");
  fakeLink.download = fileName;

  fakeLink.href = url;

  document.body.appendChild(fakeLink);
  fakeLink.click();
  document.body.removeChild(fakeLink);

  fakeLink.remove();
};

export default exportAsImage;
