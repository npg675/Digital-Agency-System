import os
import tempfile
import subprocess
import json
import shutil
import re
from uuid import uuid4
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional
import imageio_ffmpeg

router = APIRouter()

# Global dictionary to track render jobs
# Structure: { job_id: {"status": "processing"|"completed"|"failed", "progress": 0, "file_path": str, "error": str, "temp_dir": str} }
render_jobs = {}

def process_ffmpeg_job(job_id: str, temp_dir: str, ffmpeg_cmd: list, total_duration: float):
    output_file = "output.mp4"
    output_path = os.path.join(temp_dir, output_file)
    
    try:
        print("Executing FFmpeg command:", " ".join(ffmpeg_cmd))
        
        # Run FFmpeg asynchronously and read stderr line by line
        process = subprocess.Popen(
            ffmpeg_cmd,
            cwd=temp_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        time_regex = re.compile(r"time=(\d{2}):(\d{2}):(\d{2}\.\d{2})")
        
        full_stderr = []
        for line in process.stderr:
            full_stderr.append(line)
            # Parse time=HH:MM:SS.ms to calculate progress
            match = time_regex.search(line)
            if match:
                hours, minutes, seconds = match.groups()
                current_time = int(hours) * 3600 + int(minutes) * 60 + float(seconds)
                if total_duration > 0:
                    progress = min(99, int((current_time / total_duration) * 100))
                    if job_id in render_jobs:
                        render_jobs[job_id]["progress"] = progress

        process.wait()

        if job_id not in render_jobs:
            return

        if process.returncode != 0:
            stderr_snippet = "".join(full_stderr)[-3000:]
            print("FFmpeg Error Output:", "".join(full_stderr))
            render_jobs[job_id]["status"] = "failed"
            render_jobs[job_id]["error"] = f"FFmpeg failed: {stderr_snippet}"
            return

        if not os.path.exists(output_path):
            render_jobs[job_id]["status"] = "failed"
            render_jobs[job_id]["error"] = "Rendered video file not found."
            return

        # Success!
        render_jobs[job_id]["status"] = "completed"
        render_jobs[job_id]["progress"] = 100
        render_jobs[job_id]["file_path"] = output_path

    except Exception as e:
        print("Error during video render thread:", str(e))
        if job_id in render_jobs:
            render_jobs[job_id]["status"] = "failed"
            render_jobs[job_id]["error"] = f"Render error: {str(e)}"

@router.post("/render/start")
async def start_render_video(
    background_tasks: BackgroundTasks,
    manifest: str = Form(...),
    files: List[UploadFile] = File(...)
):
    try:
        manifest_data = json.loads(manifest)
        inputArgs = manifest_data.get("inputArgs", [])
        filter_complex = manifest_data.get("filter_complex", "")
        mapArgs = manifest_data.get("mapArgs", [])
        totalDuration = float(manifest_data.get("totalDuration", 10))
        has_audio = manifest_data.get("audioUrl", False)
        has_custom_audio_map = manifest_data.get("hasCustomAudioMap", False)
        fps = manifest_data.get("fps", 30)
        crf = manifest_data.get("crf", 23)
        
        validVideoClipsCount = manifest_data.get("validVideoClipsCount", 0)
        assetOverlaysCount = manifest_data.get("assetOverlaysCount", 0)
        tickerAssetsCount = manifest_data.get("tickerAssetsCount", 0)
        total_inputs = validVideoClipsCount + assetOverlaysCount + tickerAssetsCount

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid manifest JSON: {str(e)}")

    temp_dir = tempfile.mkdtemp(prefix="video_editor_")

    try:
        for file in files:
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        output_file = "output.mp4"
        ffmpeg_cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-y"]
        ffmpeg_cmd.extend(inputArgs)
        
        if filter_complex:
            ffmpeg_cmd.extend(["-filter_complex", filter_complex])
            
        ffmpeg_cmd.extend(mapArgs)
        
        if has_custom_audio_map:
            ffmpeg_cmd.extend(["-c:a", "aac", "-shortest"])
        elif has_audio:
            ffmpeg_cmd.extend(["-map", f"{total_inputs}:a:0", "-c:a", "aac", "-shortest"])
        else:
            ffmpeg_cmd.extend(["-map", "0:a?", "-c:a", "copy"])
            
        ffmpeg_cmd.extend(["-t", str(totalDuration), "-r", str(fps), "-c:v", "libx264", "-preset", "ultrafast", "-crf", str(crf), "-threads", "0", output_file])

        job_id = str(uuid4())
        render_jobs[job_id] = {
            "status": "processing",
            "progress": 0,
            "file_path": None,
            "error": None,
            "temp_dir": temp_dir
        }

        # Start background job
        background_tasks.add_task(process_ffmpeg_job, job_id, temp_dir, ffmpeg_cmd, totalDuration)
        
        return {"job_id": job_id}

    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Failed to start render: {str(e)}")

@router.get("/render/status/{job_id}")
async def get_render_status(job_id: str):
    if job_id not in render_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = render_jobs[job_id]
    return {
        "status": job["status"],
        "progress": job["progress"],
        "error": job["error"]
    }

@router.get("/render/download/{job_id}")
async def download_rendered_video(job_id: str):
    if job_id not in render_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job = render_jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job is not completed yet")
        
    file_path = job["file_path"]
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=500, detail="Video file is missing")
    
    with open(file_path, "rb") as f:
        file_data = f.read()
        
    # Clean up
    shutil.rmtree(job["temp_dir"], ignore_errors=True)
    del render_jobs[job_id]
    
    from fastapi import Response
    return Response(content=file_data, media_type="video/mp4", headers={
        "Content-Disposition": f"attachment; filename=output.mp4"
    })


@router.post("/transcode")
async def transcode_video(
    file: UploadFile = File(...)
):
    """
    Transcodes an uploaded video file (e.g. .mov) to .mp4 using native FFmpeg.
    """
    temp_dir = tempfile.mkdtemp(prefix="video_transcode_")
    try:
        input_ext = os.path.splitext(file.filename)[1] if file.filename else ".mov"
        if not input_ext:
            input_ext = ".mov"
        input_filename = f"input{input_ext}"
        input_path = os.path.join(temp_dir, input_filename)
        
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = "output.mp4"
        output_path = os.path.join(temp_dir, output_filename)
        
        ffmpeg_cmd = [
            imageio_ffmpeg.get_ffmpeg_exe(),
            "-y",
            "-i", input_path
        ]
        
        ffmpeg_cmd.extend([
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "23",
            "-threads", "0"
        ])
            
        ffmpeg_cmd.extend([
            "-c:a", "aac",
            "-pix_fmt", "yuv420p",
            output_path
        ])
        
        print("Executing transcode command:", " ".join(ffmpeg_cmd))
        process = subprocess.run(
            ffmpeg_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if process.returncode != 0:
            stderr_snippet = process.stderr[-3000:] if process.stderr else "(no stderr)"
            print("Transcode FFmpeg Error:", process.stderr)
            raise HTTPException(status_code=500, detail=f"Transcode failed: {stderr_snippet}")
            
        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Transcoded output file not found.")
            
        with open(output_path, "rb") as f:
            file_data = f.read()
            
        from fastapi import Response
        return Response(content=file_data, media_type="video/mp4")
        
    except Exception as e:
        print("Error during video transcode:", str(e))
        raise HTTPException(status_code=500, detail=f"Transcode error: {str(e)}")
        
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

