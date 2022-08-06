import type { NextPage } from "next";
import Head from "next/head";
import { ChangeEvent, useEffect, useState, useRef } from "react";
import { FastAverageColor } from "fast-average-color";
import heicToJpegDataUrl from "../utils/heicToJpegDataUrl";
import exportAsImage from "../utils/exportAsImage";
import { trpc } from "../utils/trpc";
import { ArrayParam, useQueryParam, withDefault } from "next-query-params";

type DownloadScreenShotProps = {
  url: string;
};

const DownloadScreenShot = ({ url }: DownloadScreenShotProps) => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  return (
    <button
      className="absolute bottom-2 right-2 z-20 mr-4 block rounded-full border-0 bg-violet-50 py-2 px-4 text-sm font-semibold text-violet-700 hover:file:bg-violet-100"
      onClick={() => {
        setStatus("loading");
        exportAsImage(url, "test")
          .then(() => {
            setStatus("success");
          })
          .catch(() => {
            setStatus("error");
          });
      }}
    >
      {status === "idle"
        ? "Download"
        : status === "success"
        ? "Downloaded"
        : status === "loading"
        ? "Loading"
        : "Error"}
    </button>
  );
};

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>image poem</title>
        <meta name="description" content="a poetic image generator" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎨</text></svg>"
        />
      </Head>

      <main className="container mx-auto flex h-screen flex-col items-center justify-center">
        <UploadImages />
      </main>
    </>
  );
};

const processImageFilesToURLs = async (images: File[]): Promise<string[]> => {
  const urls = images.map(async (image) => {
    if (image.type === "image/heic") {
      const base64Url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.addEventListener("loadend", () => {
          resolve(reader.result);
        });
        reader.addEventListener("error", reject);
      });
      const jpegURL = await heicToJpegDataUrl(base64Url);
      return jpegURL;
    }
    return URL.createObjectURL(image);
  });
  return Promise.all(urls);
};

const UploadImages = () => {
  const hello = trpc.useQuery(["example.hello", { text: "from tRPC" }]);
  const cardRef = useRef<HTMLDivElement>(null);

  const [text, setText] = useQueryParam(
    "🖋",
    withDefault(ArrayParam, ["write", "a", "poem"])
  );
  const [images, setImages] = useState<Array<File>>([]);
  const [imageURLS, setImageURLs] = useState<Array<string>>([]);
  const [textColor, setTextColor] = useState<string>("#000");

  useEffect(() => {
    processImageFilesToURLs(images).then((urls) => {
      setImageURLs(urls);
    });
  }, [images]);

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files && files.length > 0) {
      setImages(Array.from(files));
      submitData(event);
    }
  };

  const setBackgroundColor = (imageURL: string) => {
    const fac = new FastAverageColor();
    const card = cardRef.current;

    fac.getColorAsync(imageURL).then((color) => {
      if (card) {
        card.style.backgroundColor = color.rgba;
        setTextColor(color.isDark ? "#fff" : "#000");
      }
    });
  };

  const setTextAtIndex = (newText: string, index: number) => {
    setText([...text.slice(0, index), newText, ...text.slice(index + 1)]);
  };

  const handleTextChange = (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { value } = event.target;
    setTextAtIndex(value, index);
  };

  const submitData = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    const image = images[0];
    if (!image) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", image);

      await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*, image/heic"
        onChange={onImageChange}
        className={
          images.length > 0
            ? "absolute top-0 bottom-0 left-0 right-0 z-0 opacity-0"
            : "block text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
        }
      />
      {hello.data ? <p>{hello.data.greeting}</p> : <p>Loading..</p>}
      {images.length > 0 && (
        <DownloadScreenShot url="https://image-poem.vercel.app" />
      )}
      {imageURLS.map((imageURL, index) => (
        <div
          ref={cardRef}
          className="grid-rows-[1.33333fr_6fr_1.33333fr_6fr_1.33333fr z-10 grid aspect-[9/16] h-full"
          key={index}
        >
          <input
            className={`flex w-full justify-center text-center text-[4vh] font-semibold leading-none text-[${textColor}] m-0 h-full bg-inherit outline-none`}
            value={text[0] || ""}
            onChange={(event) => handleTextChange(event, 0)}
          ></input>
          <div className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageURL}
              alt={`uploaded image`}
              className="aspect-[9/6] h-full w-full object-cover object-bottom"
              onLoad={() => setBackgroundColor(imageURL)}
            />
          </div>
          <input
            className={`flex w-full justify-center text-center text-[4vh] font-semibold leading-none text-[${textColor}] m-0 h-full bg-inherit outline-none`}
            value={text[1] || ""}
            onChange={(event) => handleTextChange(event, 1)}
          ></input>
          <div className="overflow-hiddn">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageURL}
              alt={`uploaded image`}
              className="aspect-[9/6] h-full w-full object-cover object-bottom"
              onLoad={() => setBackgroundColor(imageURL)}
            />
          </div>
          <input
            className={`flex w-full justify-center text-center text-[4vh] font-semibold leading-none text-[${textColor}] m-0 h-full bg-inherit outline-none`}
            value={text[2] || ""}
            onChange={(event) => handleTextChange(event, 2)}
          ></input>
        </div>
      ))}
    </>
  );
};

export default Home;
