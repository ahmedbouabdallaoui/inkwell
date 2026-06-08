import json
import os
import traceback
import boto3
import psycopg2

DATABASE_URL = os.environ["DATABASE_URL"]
S3_PDFS_BUCKET = os.environ["S3_PDFS_BUCKET"]
PRESIGNED_EXPIRY = int(os.environ.get("PRESIGNED_URL_EXPIRY_SECONDS", "3600"))


def handler(event, context):
    for record in event["Records"]:
        body = json.loads(record["body"])
        job_id = body["job_id"]
        try:
            _process_job(job_id)
        except Exception as e:
            stack = traceback.format_exc()
            print(f"PDF job {job_id} failed: {stack}")
            _fail_job(job_id, f"Processing failed: {e}")


def _fail_job(job_id: str, error: str):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute(
            "UPDATE pdf_jobs SET status = 'failed', error = %s, updated_at = NOW() WHERE id = %s",
            (error, job_id),
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception:
        print(f"Failed to update job {job_id}: {error}")


def _process_job(job_id: str):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute(
        "UPDATE pdf_jobs SET status = 'processing', updated_at = NOW() WHERE id = %s",
        (job_id,),
    )
    conn.commit()

    cur.execute(
        """SELECT b.id, b.title, b.pages::text
           FROM pdf_jobs j JOIN books b ON j.book_id = b.id
           WHERE j.id = %s""",
        (job_id,),
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return

    book_id, title, pages_json = row
    pages = json.loads(pages_json)

    pdf_content = _generate_pdf(title, pages)

    s3 = boto3.client("s3")
    key = f"pdfs/{book_id}.pdf"
    s3.put_object(Bucket=S3_PDFS_BUCKET, Key=key, Body=pdf_content, ContentType="application/pdf")

    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_PDFS_BUCKET, "Key": key},
        ExpiresIn=PRESIGNED_EXPIRY,
    )

    cur.execute(
        "UPDATE pdf_jobs SET status = 'complete', download_url = %s, updated_at = NOW() WHERE id = %s",
        (url, job_id),
    )
    conn.commit()
    cur.close()
    conn.close()


def _generate_pdf(title: str, pages: list[str]) -> bytes:
    from io import BytesIO
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=24, spaceAfter=30)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=12, leading=20)

    elements = [Paragraph(title, title_style), Spacer(1, 20)]
    for page in pages:
        elements.append(Paragraph(page.replace("\n", "<br/>"), body_style))
        elements.append(Spacer(1, 12))

    doc.build(elements)
    return buffer.getvalue()
