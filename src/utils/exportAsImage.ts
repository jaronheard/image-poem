const exportAsImage = async (url: string, fileName = "test.jpeg") => {
  return await fetch(`/api/get-screenshot${url ? `?url=${url}` : ""}`)
    .then((res) => res.json())
    .then((res) => res.blob)
    .then((url) => {
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const imageURL = URL.createObjectURL(blob);
          downloadImage(imageURL, fileName);
        });
    })
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
