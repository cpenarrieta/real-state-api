import aws from "aws-sdk";
import { MyContext } from "../context";

enum FileType {
  PDF = "application/pdf",
}

export const signS3 = async (
  parent: object,
  args: {
    filename: string;
    filetype: FileType;
  },
  ctx: MyContext
) => {
  const s3Bucket = "real-state-app";
  const { filename, filetype } = args;

  const s3 = new aws.S3({
    signatureVersion: "v4",
    region: "us-west-2",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  const s3Params = {
    Bucket: s3Bucket,
    Key: filename,
    Expires: 60,
    ContentType: filetype,
    ACL: "public-read",
  };

  const signedRequest = await s3.getSignedUrl("putObject", s3Params);
  const url = `https://${s3Bucket}.s3.amazonaws.com/${filename}`;

  return {
    signedRequest,
    url,
  };
};
