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
import { PhotoIcon } from "../icons/PhotoIcon";
import { CollapseIcon } from "../icons/CollapseIcon";
import { ExpandIcon } from "../icons/ExpandIcon";
import { ClockIcon } from "../icons/ClockIcon";
import { DownloadIcon } from "../icons/DownloadIcon";
import { CheckIcon } from "../icons/CheckIcon";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hideControls, setHideControls] = useQueryParam(
    "🪟",
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
      {images.length > 0 || image !== "" ? (
        <></>
      ) : (
        <>
          <h1 className="my-4 text-5xl text-indigo-700">image poem</h1>
          <p>upload an image, then write a poem</p>
          <div className="my-2 flex items-center ">
            <input
              type="file"
              id="file-upload"
              accept="image/*, image/heic"
              onChange={onImageChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              // TODO: accessibility
              // eslint-disable-next-line tailwindcss/no-custom-classname
            >
              <div className="ml-2 motion-safe:animate-ping">✨</div>
              <span
                className={`block rounded-full border-0 bg-violet-100 py-2 px-4 text-sm font-semibold text-violet-700 hover:bg-violet-200 hover:text-violet-800`}
              >
                <div className="motion-safe:animate-pulse">
                  <PhotoIcon />
                </div>
              </span>
              <div className="ml-10 motion-safe:animate-ping">✨</div>
            </label>
          </div>
          <p>vertical images work best</p>
        </>
      )}
      {imageURLS.map((imageURL, index) => (
        <div
          ref={cardRef}
          className={clsx(`relative z-10 grid aspect-[9/16] h-full`, {
            "grid-rows-[1.33333fr_6fr_1.33333fr_6fr_1.33333fr]": !collapsed,
            "grid-rows-[2fr_5fr_2fr_5fr_2fr]": collapsed,
          })}
          key={index}
        >
          {!hideControls && (
            <div className="absolute bottom-[8vh] left-2 flex w-full flex-row flex-wrap justify-center gap-2">
              <input
                type="file"
                id="file-upload"
                accept="image/*, image/heic"
                onChange={onImageChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                // eslint-disable-next-line tailwindcss/no-custom-classname
                className={`bg-violet-50 ${`text-[${textColor}]`} block rounded-full border-0 bg-violet-50 py-2 px-4 text-sm font-semibold hover:bg-violet-100`}
              >
                <PhotoIcon />
              </label>
              {image !== "" && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  // eslint-disable-next-line tailwindcss/no-custom-classname
                  className={`bg-violet-50 py-2 px-4 text-sm font-semibold ${`text-[${textColor}]`} rounded-full hover:bg-violet-100`}
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
                  // eslint-disable-next-line tailwindcss/no-custom-classname
                  className={`bg-violet-50 py-2 px-4 text-sm font-semibold ${`text-[${textColor}]`} rounded-full hover:bg-violet-100`}
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
            // eslint-disable-next-line tailwindcss/no-custom-classname
            className={`flex w-full justify-center text-center text-[4vh] font-semibold leading-none ${`text-[${textColor}]`} m-0 h-full bg-inherit outline-none`}
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
            // eslint-disable-next-line tailwindcss/no-custom-classname
            className={`flex w-full justify-center text-center text-[4vh] font-semibold leading-none ${`text-[${textColor}]`} m-0 h-full bg-inherit outline-none`}
            value={text[1] || ""}
            onChange={(event) => handleTextChange(event, 1)}
          ></input>
          <div className="overflow-hidden">
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
            // eslint-disable-next-line tailwindcss/no-custom-classname
            className={`flex w-full justify-center text-center text-[4vh] font-semibold leading-none ${`text-[${textColor}]`} m-0 h-full bg-inherit outline-none`}
            value={text[2] || ""}
            onChange={(event) => handleTextChange(event, 2)}
          ></input>
        </div>
      ))}
    </>
  );
};

export default Home;
