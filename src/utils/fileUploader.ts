import AWS from 'aws-sdk'
import { basename, extname } from 'path'
import { AWS_CREDENTIALS } from '../config';

const S3 = new AWS.S3();

export const fileUploader = async ({ 
  fileJson = '',
  fileName = ''
}) => {
  const fileBuffer = Buffer.from(fileJson);

  const { Location } = await S3.upload({
    Body: fileBuffer,
    Bucket: AWS_CREDENTIALS.bucket as string,
    ContentType: "application/json",
    Key: `mk-scraper/${basename(fileName, extname(fileName))}.json`,
  }).promise();

  return Location;
}