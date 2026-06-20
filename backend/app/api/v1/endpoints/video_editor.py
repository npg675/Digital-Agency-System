import os
import tempfile
import subprocess
import json
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from typing import List, Optional
import imageio_ffmpeg

router = APIRouter()

@router.post("/render")
async def render_video(
    manifest: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Renders a video locally using native FFmpeg by taking inputs and arguments from the frontend.
    """
    try:
        manifest_data = json.loads(manifest)
        inputArgs = manifest_data.get("inputArgs", [])
        filter_complex = manifest_data.get("filter_complex", "")
        mapArgs = manifest_data.get("mapArgs", [])
        totalDuration = manifest_data.get("totalDuration", "10")
        has_audio = manifest_data.get("audioUrl", False)
        fps = manifest_data.get("fps", 30)
        crf = manifest_data.get("crf", 23)
        
        # Determine the number of visual inputs to know the audio mapping index
        validVideoClipsCount = manifest_data.get("validVideoClipsCount", 0)
        assetOverlaysCount = manifest_data.get("assetOverlaysCount", 0)
        tickerAssetsCount = manifest_data.get("tickerAssetsCount", 0)
        total_inputs = validVideoClipsCount + assetOverlaysCount + tickerAssetsCount

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid manifest JSON: {str(e)}")

    # Create a temporary directory
    temp_dir = tempfile.mkdtemp(prefix="video_editor_")

    try:
        # Save all uploaded files to the temp directory
        for file in files:
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        # Reconstruct the exact ffmpeg command
        output_file = "output.mp4"
        
        ffmpeg_cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-y"]
        ffmpeg_cmd.extend(inputArgs)
        
        if filter_complex:
            ffmpeg_cmd.extend(["-filter_complex", filter_complex])
            
        ffmpeg_cmd.extend(mapArgs)
        
        if has_audio:
            ffmpeg_cmd.extend(["-map", f"{total_inputs}:a:0", "-c:a", "aac", "-shortest"])
        else:
            ffmpeg_cmd.extend(["-map", "0:a?", "-c:a", "copy"])
            
        ffmpeg_cmd.extend(["-t", str(totalDuration), "-r", str(fps), "-c:v", "libx264", "-preset", "ultrafast", "-crf", str(crf), output_file])

        print("Executing FFmpeg command:", " ".join(ffmpeg_cmd))

        # Run FFmpeg synchronously
        process = subprocess.run(
            ffmpeg_cmd,
            cwd=temp_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if process.returncode != 0:
            stderr_snippet = process.stderr[-3000:] if process.stderr else "(no stderr)"
            print("FFmpeg Error Output:", process.stderr)
            raise HTTPException(status_code=500, detail=f"FFmpeg failed: {stderr_snippet}")

        output_path = os.path.join(temp_dir, output_file)
        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Rendered video file not found.")

        # Read the file data into memory so we can delete the temp directory immediately
        with open(output_path, "rb") as f:
            file_data = f.read()

        # Since we're sending bytes back, we can just use Response
        from fastapi import Response
        return Response(content=file_data, media_type="video/mp4", headers={
            "Content-Disposition": f"attachment; filename={output_file}"
        })

    except Exception as e:
        print("Error during video render:", str(e))
        raise HTTPException(status_code=500, detail=f"Render error: {str(e)}")

    finally:
        # Clean up temporary directory
        shutil.rmtree(temp_dir, ignore_errors=True)
