import type { NextPage } from "next";
import Head from "next/head";

import { ChangeEvent, useEffect, useState, useRef } from "react";
import { FastAverageColor } from "fast-average-color";
import heicToPngDataUrl from "../utils/heicToPngDataUrl";
import exportAsImage from "../utils/exportAsImage";
import {
  ArrayParam,
  BooleanParam,
  StringParam,
  useQueryParam,
  withDefault,
} from "next-query-params";
import { useRouter } from "next/router";
import clsx from "clsx";

const CollapseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-6 w-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
    />
  </svg>
);

const ExpandIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="h-6 w-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
      clipRule="evenodd"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

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

      <main className="flex h-screen w-screen flex-col items-center justify-center">
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
      const pngURL = await heicToPngDataUrl(base64Url);
      return pngURL;
    }
    return URL.createObjectURL(image);
  });
  return Promise.all(urls);
};

const UploadImages = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [text, setText] = useQueryParam(
    "🖋",
    withDefault(ArrayParam, ["write", "a", "poem"])
  );
  const [image, setImage] = useQueryParam("🖼", withDefault(StringParam, ""));
  const [images, setImages] = useState<Array<File>>([]);
  const [imageURLS, setImageURLs] = useState<Array<string>>([]);
  const [textColor, setTextColor] = useState<string>("#000");
  const [progress, setProgress] = useState<"" | "in-progress" | "finished">("");
  const [collapsed, setCollapsed] = useQueryParam(
    "↕",
    withDefault(BooleanParam, false)
  );

  useEffect(() => {
    if (images.length > 0) {
      processImageFilesToURLs(images).then((urls) => {
        setImageURLs(urls);
      });
    }
    if (images.length === 0 && image !== "") {
      const url = `https://res.cloudinary.com/jaronheard/image/upload/w_900,h_1200,c_fit/v1659900513/${image}.png`;
      setImageURLs([url]);
    }
  }, [image, images]);

  useEffect(() => {
    // reset progress on image or text change
    setProgress("");
  }, [text, image]);

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (files && files[0]) {
      setImages(Array.from(files));
      submitData(event, files[0]);
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

  const submitData = async (
    event: ChangeEvent<HTMLInputElement>,
    image: File
  ) => {
    event.preventDefault();

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      setImage(json.result.public_id);
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
          images.length > 0 || image !== ""
            ? "hidden"
            : `text-[${textColor}] bg-violet-50 file:text-[${textColor}] block rounded-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:py-2 file:px-4 file:text-sm file:font-semibold hover:bg-violet-100 file:hover:bg-violet-100`
        }
      />
      {imageURLS.map((imageURL, index) => (
        <div
          ref={cardRef}
          className={clsx(`relative z-10 grid aspect-[9/16] h-full`, {
            "grid-rows-[1.33333fr_6fr_1.33333fr_6fr_1.33333fr": !collapsed,
            "grid-rows-[2fr_5fr_2fr_5fr_2fr": collapsed,
          })}
          key={index}
        >
          {images.length > 0 && (
            <div className="absolute bottom-[8vh] left-2 flex w-full flex-row flex-wrap justify-center gap-2">
              <input
                type="file"
                accept="image/*, image/heic"
                onChange={onImageChange}
                className={`text-[${textColor}] bg-violet-50 file:text-[${textColor}] block rounded-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:py-2 file:px-4 file:text-sm file:font-semibold hover:bg-violet-100 file:hover:bg-violet-100`}
              />
              {image !== "" && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className={`bg-violet-50 py-2 px-4 text-sm font-semibold text-${textColor} rounded-full hover:bg-violet-100`}
                >
                  {collapsed ? <CollapseIcon /> : <ExpandIcon />}
                </button>
              )}
              {image !== "" && (
                <button
                  onClick={() =>
                    exportAsImage(
                      `https://api.apiflash.com/v1/urltoimage?access_key=3cdc3508085a4cf9a30283bb17f50a13&url=${encodeURIComponent(
                        `https://image-poem.vercel.app${router.asPath}`
                      )}&format=png&width=900&height=1600&fresh=true&wait_until=network_idle`,
                      `image-poem.png`,
                      setProgress
                    )
                  }
                  className={`bg-violet-50 py-2 px-4 text-sm font-semibold text-${textColor} rounded-full hover:bg-violet-100`}
                >
                  {progress === "in-progress" ? (
                    <ClockIcon />
                  ) : progress === "finished" ? (
                    <CheckIcon />
                  ) : (
                    <DownloadIcon />
                  )}
                </button>
              )}
            </div>
          )}
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
              className={clsx("h-full w-full object-cover object-top", {
                "aspect-[9/6]": !collapsed,
                "aspect-[9/5]": collapsed,
              })}
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
              className={clsx("h-full w-full object-cover object-bottom", {
                "aspect-[9/6]": !collapsed,
                "aspect-[9/5]": collapsed,
              })}
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
