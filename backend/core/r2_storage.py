"""
Cloudflare R2 Storage Service
S3-compatible object storage with zero egress fees.
"""

import os
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from loguru import logger
from typing import Optional, BinaryIO
import uuid

# R2 Configuration
R2_ENDPOINT = os.getenv("R2_ENDPOINT")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv("R2_BUCKET", "sigebim-files")

# Initialize S3 client (R2 is S3-compatible)
def get_r2_client():
    """Get configured R2 client."""
    if not all([R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY]):
        logger.warning("R2 credentials not configured")
        return None
    
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(
            signature_version='s3v4',
            s3={'addressing_style': 'path'}
        ),
        region_name='auto'  # R2 uses 'auto'
    )


async def generate_upload_url(filename: str, content_type: str = 'application/octet-stream', expires_in: int = 3600) -> Optional[dict]:
    """
    Generate a presigned URL for direct browser upload.
    
    Returns:
        dict with 'upload_url' and 'file_key'
    """
    client = get_r2_client()
    if not client:
        return None
    
    # Generate unique file key
    file_key = f"{uuid.uuid4()}/{filename}"
    
    try:
        upload_url = client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': R2_BUCKET,
                'Key': file_key,
                'ContentType': content_type
            },
            ExpiresIn=expires_in
        )
        
        logger.info(f"Generated upload URL for: {file_key}")
        return {
            'upload_url': upload_url,
            'file_key': file_key
        }
    except ClientError as e:
        logger.error(f"Failed to generate upload URL: {e}")
        return None


async def generate_download_url(file_key: str, expires_in: int = 3600) -> Optional[str]:
    """
    Generate a presigned URL for downloading a file.
    """
    client = get_r2_client()
    if not client:
        return None
    
    try:
        download_url = client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': R2_BUCKET,
                'Key': file_key
            },
            ExpiresIn=expires_in
        )
        return download_url
    except ClientError as e:
        logger.error(f"Failed to generate download URL: {e}")
        return None


async def delete_file(file_key: str) -> bool:
    """
    Delete a file from R2.
    """
    client = get_r2_client()
    if not client:
        return False
    
    try:
        client.delete_object(Bucket=R2_BUCKET, Key=file_key)
        logger.info(f"Deleted file: {file_key}")
        return True
    except ClientError as e:
        logger.error(f"Failed to delete file: {e}")
        return False


async def upload_file_from_bytes(file_bytes: bytes, filename: str, content_type: str = 'application/octet-stream') -> Optional[str]:
    """
    Upload a file directly from bytes (for server-side processing).
    
    Returns:
        file_key on success, None on failure
    """
    client = get_r2_client()
    if not client:
        return None
    
    file_key = f"{uuid.uuid4()}/{filename}"
    
    try:
        client.put_object(
            Bucket=R2_BUCKET,
            Key=file_key,
            Body=file_bytes,
            ContentType=content_type
        )
        logger.info(f"Uploaded file: {file_key}")
        return file_key
    except ClientError as e:
        logger.error(f"Failed to upload file: {e}")
        return None
