import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

interface SpacesConfig {
  endpoint: string;
  bucket: string;
  key: string;
  secret: string;
  region: string;
  cdnEndpoint?: string;
}

interface UploadedAsset {
  objectKey: string;
  publicUrl: string;
}

interface StoreImageInput {
  folder: string;
  file: Express.Multer.File;
}

function getSpacesConfig(): SpacesConfig | null {
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const bucket = process.env.DO_SPACES_BUCKET;
  const key = process.env.DO_SPACES_KEY;
  const secret = process.env.DO_SPACES_SECRET;
  const region = process.env.DO_SPACES_REGION;
  const cdnEndpoint = process.env.DO_SPACES_CDN_ENDPOINT;

  if (!endpoint || !bucket || !key || !secret || !region) {
    return null;
  }

  return {
    endpoint,
    bucket,
    key,
    secret,
    region,
    cdnEndpoint,
  };
}

const spacesConfig = getSpacesConfig();

const s3Client = spacesConfig
  ? new S3Client({
      region: spacesConfig.region,
      endpoint: buildSdkEndpoint(spacesConfig),
      credentials: {
        accessKeyId: spacesConfig.key,
        secretAccessKey: spacesConfig.secret,
      },
    })
  : null;

function normalizeEndpoint(endpoint: string) {
  return endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? endpoint
    : `https://${endpoint}`;
}

function endpointHost(endpoint: string) {
  return normalizeEndpoint(endpoint).replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function buildSdkEndpoint(config: SpacesConfig) {
  const host = endpointHost(config.endpoint);
  const bucketPrefix = `${config.bucket}.`;
  const sdkHost = host.startsWith(bucketPrefix) ? host.slice(bucketPrefix.length) : host;
  return `https://${sdkHost}`;
}

function buildBucketHost(config: SpacesConfig) {
  const host = endpointHost(config.endpoint);
  const bucketPrefix = `${config.bucket}.`;
  return host.startsWith(bucketPrefix) ? host : `${config.bucket}.${host}`;
}

function extensionForFile(file: Express.Multer.File) {
  const extFromName = path.extname(file.originalname).toLowerCase();
  if (extFromName) {
    return extFromName;
  }

  switch (file.mimetype) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

function buildObjectKey(folder: string, file: Express.Multer.File) {
  return `${folder}/${uuidv4()}${extensionForFile(file)}`;
}

function buildSpacesPublicUrl(objectKey: string) {
  if (!spacesConfig) {
    throw new Error("Spaces is not configured");
  }

  if (spacesConfig.cdnEndpoint) {
    const cdnHost = spacesConfig.cdnEndpoint.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${cdnHost}/${objectKey}`;
  }

  return `https://${buildBucketHost(spacesConfig)}/${objectKey}`;
}

async function storeLocally(objectKey: string, file: Express.Multer.File): Promise<UploadedAsset> {
  const filePath = path.join(UPLOAD_DIR, objectKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, file.buffer);

  return {
    objectKey,
    publicUrl: `${BASE_URL}/uploads/${objectKey}`,
  };
}

async function storeInSpaces(objectKey: string, file: Express.Multer.File): Promise<UploadedAsset> {
  if (!spacesConfig || !s3Client) {
    throw new Error("Spaces is not configured");
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: spacesConfig.bucket,
      Key: objectKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read" as ObjectCannedACL,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return {
    objectKey,
    publicUrl: buildSpacesPublicUrl(objectKey),
  };
}

export async function storeImage(input: StoreImageInput): Promise<UploadedAsset> {
  const objectKey = buildObjectKey(input.folder, input.file);

  if (spacesConfig) {
    return storeInSpaces(objectKey, input.file);
  }

  return storeLocally(objectKey, input.file);
}

export async function deleteStoredImage(objectKey: string): Promise<void> {
  if (spacesConfig && s3Client) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: spacesConfig.bucket,
        Key: objectKey,
      })
    );
    return;
  }

  const filePath = path.join(UPLOAD_DIR, objectKey);
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.warn(`Failed to delete file: ${filePath}`);
    }
  }
}

export function isSpacesEnabled() {
  return !!spacesConfig;
}

export function getImageStorageMode() {
  return isSpacesEnabled() ? "spaces" : "local";
}
