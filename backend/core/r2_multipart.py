"""
R2 Multipart Upload Service
Handles large file uploads (1GB+) using S3-compatible multipart upload API.
"""

import os
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from loguru import logger
from typing import Optional, List
import uuid

# R2 Configuration
R2_ENDPOINT = os.getenv("R2_ENDPOINT")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv("R2_BUCKET", "sigebim-files")


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
        region_name='auto'
    )


async def initiate_multipart_upload(filename: str, content_type: str = 'application/octet-stream') -> Optional[dict]:
    """
    Start a multipart upload session.
    Returns upload_id and file_key for subsequent parts.
    """
    client = get_r2_client()
    if not client:
        return None
    
    file_key = f"{uuid.uuid4()}/{filename}"
    
    try:
        response = client.create_multipart_upload(
            Bucket=R2_BUCKET,
            Key=file_key,
            ContentType=content_type
        )
        
        logger.info(f"Initiated multipart upload: {file_key}, UploadId: {response['UploadId']}")
        return {
            'upload_id': response['UploadId'],
            'file_key': file_key
        }
    except ClientError as e:
        logger.error(f"Failed to initiate multipart upload: {e}")
        return None


async def generate_part_upload_url(file_key: str, upload_id: str, part_number: int, expires_in: int = 3600) -> Optional[str]:
    """
    Generate presigned URL for uploading a specific part.
    Part numbers start at 1.
    """
    client = get_r2_client()
    if not client:
        return None
    
    try:
        url = client.generate_presigned_url(
            'upload_part',
            Params={
                'Bucket': R2_BUCKET,
                'Key': file_key,
                'UploadId': upload_id,
                'PartNumber': part_number
            },
            ExpiresIn=expires_in
        )
        return url
    except ClientError as e:
        logger.error(f"Failed to generate part upload URL: {e}")
        return None


async def complete_multipart_upload(file_key: str, upload_id: str, parts: List[dict]) -> bool:
    """
    Complete the multipart upload after all parts are uploaded.
    
    Args:
        parts: List of {'PartNumber': int, 'ETag': str}
    """
    client = get_r2_client()
    if not client:
        return False
    
    try:
        response = client.complete_multipart_upload(
            Bucket=R2_BUCKET,
            Key=file_key,
            UploadId=upload_id,
            MultipartUpload={'Parts': parts}
        )
        logger.info(f"Completed multipart upload: {file_key}")
        return True
    except ClientError as e:
        logger.error(f"Failed to complete multipart upload: {e}")
        return False


async def abort_multipart_upload(file_key: str, upload_id: str) -> bool:
    """
    Abort a multipart upload (cleanup).
    """
    client = get_r2_client()
    if not client:
        return False
    
    try:
        client.abort_multipart_upload(
            Bucket=R2_BUCKET,
            Key=file_key,
            UploadId=upload_id
        )
        logger.info(f"Aborted multipart upload: {file_key}")
        return True
    except ClientError as e:
        logger.error(f"Failed to abort multipart upload: {e}")
        return False
