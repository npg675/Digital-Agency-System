import os
import shutil
import logging
from abc import ABC, abstractmethod
from fastapi import UploadFile

logger = logging.getLogger(__name__)

class BaseStorageService(ABC):
    @abstractmethod
    def upload(self, file: UploadFile, unique_filename: str) -> str:
        """Uploads a file and returns the public URL or relative file path."""

    @abstractmethod
    def delete(self, filepath: str) -> bool:
        """Deletes a file by its path or URL."""


class LocalStorageService(BaseStorageService):
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload(self, file: UploadFile, unique_filename: str) -> str:
        file_path = os.path.join(self.upload_dir, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        # Assuming frontend/backend serve this via static files. 
        # A more robust system would return a full URL.
        return file_path.replace("\\", "/")

    def delete(self, filepath: str) -> bool:
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
            return True
        except Exception as e:
            logger.error(f"Failed to delete local file {filepath}: {e}")
            return False


class S3StorageService(BaseStorageService):
    def __init__(self):
        import boto3
        from botocore.exceptions import ClientError
        self.bucket_name = os.getenv("S3_BUCKET_NAME")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        
        # Boto3 automatically picks up AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from env
        self.s3_client = boto3.client('s3', region_name=self.region)
        self.ClientError = ClientError

    def upload(self, file: UploadFile, unique_filename: str) -> str:
        try:
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket_name,
                unique_filename,
                ExtraArgs={
                    "ContentType": file.content_type or "application/octet-stream",
                    # "ACL": "public-read" # Uncomment if bucket allows public ACLs
                }
            )
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{unique_filename}"
        except Exception as e:
            logger.error(f"Failed to upload to S3: {e}")
            raise e

    def delete(self, filepath: str) -> bool:
        try:
            # Extract key from URL
            if "amazonaws.com/" in filepath:
                key = filepath.split(".amazonaws.com/")[-1]
            else:
                key = filepath
                
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            return True
        except self.ClientError as e:
            logger.error(f"Failed to delete from S3: {e}")
            return False


class GCSStorageService(BaseStorageService):
    def __init__(self):
        from google.cloud import storage
        self.bucket_name = os.getenv("GCS_BUCKET_NAME")
        # Ensure GOOGLE_APPLICATION_CREDENTIALS is set in the environment
        self.client = storage.Client()
        self.bucket = self.client.bucket(self.bucket_name)

    def upload(self, file: UploadFile, unique_filename: str) -> str:
        try:
            blob = self.bucket.blob(unique_filename)
            blob.upload_from_file(file.file, content_type=file.content_type)
            # Make the blob publicly viewable
            # blob.make_public() # Uncomment if bucket allows public ACLs
            return blob.public_url
        except Exception as e:
            logger.error(f"Failed to upload to GCS: {e}")
            raise e

    def delete(self, filepath: str) -> bool:
        try:
            # Extract object name from URL
            if "storage.googleapis.com/" in filepath:
                # url format: https://storage.googleapis.com/bucket-name/object-name
                key = filepath.split(f"storage.googleapis.com/{self.bucket_name}/")[-1]
            else:
                key = filepath
                
            blob = self.bucket.blob(key)
            blob.delete()
            return True
        except Exception as e:
            logger.error(f"Failed to delete from GCS: {e}")
            return False


def get_storage_service() -> BaseStorageService:
    provider = os.getenv("STORAGE_PROVIDER", "local").lower()
    
    if provider == "s3":
        return S3StorageService()
    elif provider == "gcs":
        return GCSStorageService()
    else:
        return LocalStorageService()
