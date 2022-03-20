import fetch from 'node-fetch'
import sharp from 'sharp';
import { basename, extname } from "path"
import AWS from 'aws-sdk'

import { AWS_CREDENTIALS, IMG_UPLOADER, SHOULD_UPLOAD_S3 } from '../config';

const S3 = new AWS.S3();

export const imageUploader = async (imgUrl: string) => {
  if (!SHOULD_UPLOAD_S3) {
    return imgUrl
  }
  
  const response = await fetch(imgUrl);

  if (!response.ok) {
    new Error(`Failed to fetch ${response.url}: ${response.status} ${response.statusText}`)
  }

  const imageKey = decodeURIComponent(imgUrl.split('/').pop() ?? '')
    .toLowerCase()
    .replace(/-/g, '')
    .replace(/(\s|_|\.)/g, '-')

  const imgBuffer = await response.buffer();
  // https://pimg.amr.marykaycdn.com/HeroZoom/10000/BR%20NUDE%20PASSIONE.jpg

  const optimized = await sharp(imgBuffer)
      .resize(IMG_UPLOADER.width, IMG_UPLOADER.height, { fit: "inside", withoutEnlargement: true, background: '#fff' })
      .toFormat("jpeg", { progressive: true, quality: IMG_UPLOADER.quality })
      .toBuffer();

  const { Location } = await S3.upload({
    Body: optimized,
    Bucket: AWS_CREDENTIALS.bucket as string,
    ContentType: "image/jpeg",
    Key: `compressed/${basename(imageKey, extname(imageKey))}.jpg`,
    ACL: "public-read"
  }).promise();
  
  console.log(Location)
  
  return Location;
}