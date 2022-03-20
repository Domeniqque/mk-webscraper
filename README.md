# MK Web Scraper

A tool to extract product information of the Mary Kay's public site. 

It download product images and meta data like, price, description and product types.

Automatic upload each image and the final versioned `.json` file to your AWS S3 if you want it.


> We cannot be held responsible for how you will use this tool. 

> This tool was used for study purposes only.

## Instalation

First install the dependencies using `yarn install`. So, in the [src/config.ts](./src/config.ts) file, uncomment the product types you want to get the data.

Finally, run `yarn start:dev` to start the process.

The `.json` file with all the products will be saved in the output directory.

### Automatic Upload

If you want to upload the data to your AWS S3 bucket, you'll need to set your credentials in the `.env` file and change the `IMG_UPLOAD_TO_S3` variable to `true`.

```bash 
cp .env.example .env
```

Before the upload, all images will be optimized using the [sharp](https://github.com/lovell/sharp) package.  