import cv2
import json
from ultralytics import YOLO

model = YOLO("yolov8n.pt")
video_path = "WhatsApp Video 2026-02-20 at 09.48.47.mp4"

cap = cv2.VideoCapture(video_path)

events = []
person_in_frame = False
frame_count = 0
FRAME_SKIP = 5   # Process every 5th frame (important!)

def format_time(ms):
    seconds = int(ms / 1000)
    mins = seconds // 60
    secs = seconds % 60
    return f"{mins:02}:{secs:02}"

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1

    # Skip frames to stabilize detection
    if frame_count % FRAME_SKIP != 0:
        continue

    video_time_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
    timestamp = format_time(video_time_ms)

    results = model(frame, verbose=False)

    detected_now = False

    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])

            label = model.names[cls]

            # Confidence filter avoids flicker
            if label == "person" and conf > 0.5:
                detected_now = True

    # ---- STATE CHANGE LOGIC ----
    if detected_now and not person_in_frame:
        events.append({"time": timestamp, "event": "person_entered"})
        print(f"[EVENT] ENTERED at {timestamp}")

    if not detected_now and person_in_frame:
        events.append({"time": timestamp, "event": "person_left"})
        print(f"[EVENT] LEFT at {timestamp}")

    person_in_frame = detected_now

cap.release()

with open("../shared/events.json", "w") as f:
    json.dump(events, f, indent=4)

print("Events saved with stabilized detection.")