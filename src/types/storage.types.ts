export interface ImageMetadata {
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  title?: string;
  description?: string;
  tags?: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    name?: string;
  };
  exif?: {
    camera?: string;
    lens?: string;
    focalLength?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    takenAt?: string;
  };
  customFields?: Record<string, string | number | boolean>;
}

export interface StorageError {
  message: string;
  code?: string;
  details?: string;
} 