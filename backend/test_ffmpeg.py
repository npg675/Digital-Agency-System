import subprocess
import os
import imageio_ffmpeg

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

for i in range(7):
    subprocess.run([ffmpeg_exe, "-y", "-f", "lavfi", "-i", "color=c=red:s=100x100", "-vframes", "1", f"overlay_{i}.png"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
subprocess.run([ffmpeg_exe, "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "5", "audio0.mp3"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

inputArgs = []
for i in range(7):
    inputArgs.extend(["-loop", "1", "-framerate", "30", "-i", f"overlay_{i}.png"])
inputArgs.extend(["-i", "audio0.mp3"])

finalFilter = "color=c=black:s=720x1280:d=10:r=30[base]"
lastOut = "[base]"
for i in range(7):
    assetFilter = f"[{i}:v]format=rgba,setpts=PTS-STARTPTS"
    nextOut = f"[vasset{i}]"
    finalFilter += f";{assetFilter}[prep_asset{i}];{lastOut}[prep_asset{i}]overlay=x='0':y='0':enable='between(t,0,10)'{nextOut}"
    lastOut = nextOut

finalFilter += f";{lastOut}format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2[vout]"
finalFilter += ";[7:a]atrim=start=0:end=5,asetpts=PTS-STARTPTS,adelay=1000|1000,volume=1[aud0];[aud0]anull[aout]"

cmd = [ffmpeg_exe, "-y"] + inputArgs + ["-filter_complex", finalFilter, "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-c:a", "aac", "output.mp4"]

print("Executing:")
print(" ".join(cmd))
res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
print("Return code:", res.returncode)
print(res.stderr[-3000:])
