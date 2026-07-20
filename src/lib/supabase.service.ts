import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  constructor(private readonly config: ConfigService) {
    const supabaseKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are missing in env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getSignedUrl(bucketName: string, originalFileName: string) {
    try {
      const sanitizedName = originalFileName
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/[^a-zA-Z0-9._-]/g, ''); // remove special characters

      const filePath = `${Date.now()}-${sanitizedName}`;

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .createSignedUploadUrl(filePath);

      if (error) {
        throw new Error(`Supabase Storage Error: ${error.message}`);
      }

      return {
        signedUrl: data.signedUrl,
        filePath,
      };
    } catch (err) {
      throw new Error('Failed to generate SignedUrl: ', err);
    }
  }

  getPublicUrl(filePath: string, bucketName: string) {
    try {
      const data = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      return data.data.publicUrl;
    } catch (err) {
      throw new Error('Failed to get publicUrl: ', err);
    }
  }

  async deleteFile(bucketName: string, path: string) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .remove([path]);

      if (error) {
        throw new Error('Failed to delete file: ' + error.message);
      }
    } catch (err) {
      throw new Error('Failed to delete file: ' + err.message);
    }
  }
}
