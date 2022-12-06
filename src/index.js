import * as dotenv from "dotenv";
dotenv.config();
import AWS from "aws-sdk";
import { readFileSync } from "fs";

async function main() {
  const photo_source = "src/imgs/ref.jpeg";
  const photo_target = "src/imgs/1.jpeg";

  const source_s3_name = "onboard/d8d62558-e01f-4f3e-8cf7-023c9a2729a1.jpg";

  await compareSourceS3(source_s3_name, photo_target);

  await compareSourceBinary(photo_source, photo_target);
}

async function compareSourceS3(source_s3_name, photo_target) {
  const img_target = readFileSync(photo_target);

  const params = {
    SourceImage: {
      S3Object: {
        Bucket: process.env.S3_BUCKET_NAME,
        Name: source_s3_name,
      },
    },
    TargetImage: {
      Bytes: img_target,
    },
    SimilarityThreshold: 95,
  };

  console.time("compareSourceS3");
  await compareFaces(params);
  console.timeEnd("compareSourceS3");
}

async function compareSourceBinary(photo_source, photo_target) {
  const img_source = readFileSync(photo_source);
  const img_target = readFileSync(photo_target);

  const params = {
    SourceImage: {
      Bytes: img_source,
    },
    TargetImage: {
      Bytes: img_target,
    },
    SimilarityThreshold: 95,
  };

  console.time("compareSourceBinary");
  await compareFaces(params);
  console.timeEnd("compareSourceBinary");
}

async function compareFaces(params) {
  const config = new AWS.Config({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
  const client = new AWS.Rekognition(config);

  return new Promise((res, rej) => {
    client.compareFaces(params, function (err, response) {
      if (err) {
        console.log(err, err.stack);
        rej(err);
      } else {
        if (!response.FaceMatches?.length) console.log("No face matched");

        response.FaceMatches.forEach((data) => {
          let position = data.Face.BoundingBox;
          let similarity = data.Similarity;

          console.log(
            `The face at: ${position.Left}, ${position.Top} matches with ${similarity} % confidence`
          );

          res(response);
        });
      }
    });
  });
}

main();
