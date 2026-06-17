import sys
import time
from google import genai
from google.genai import types

api_key = sys.argv[1]

try:
    client = genai.Client(api_key=api_key)
    print("Initiating video generation...")
    operation = client.models.generate_videos(
        model="veo-2.0-generate-001",
        prompt="A simple black background",
        config=types.GenerateVideosConfig(
            aspect_ratio="16:9",
        ),
    )
    print("Operation started:", operation.name)
    while not operation.done:
        time.sleep(5)
        operation = client.operations.get(operation=operation)
        print("Polling...")
    
    generated_video = operation.response.generated_videos[0]
    print("URI:", generated_video.video.uri)
except Exception as e:
    print("Error:", e)
