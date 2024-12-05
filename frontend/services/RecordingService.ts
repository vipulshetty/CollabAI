import { S3 } from 'aws-sdk';

export class RecordingService {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
  }

  async uploadRecording(file: File, meetingId: string) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: `recordings/${meetingId}/${file.name}`,
      Body: file,
      ContentType: file.type
    };

    try {
      const data = await this.s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      console.error('Error uploading recording:', error);
      throw error;
    }
  }
} 