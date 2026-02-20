import cv2
import json
from ultralytics import YOLO


model = YOLO("yolov8n.pt")

video_path = "Screen Recording 2026-02-20 135222.mp4"
cap = cv2.VideoCapture(video_path)

events = []

frame_count = 0
FRAME_SKIP = 5 

active_people = set()

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

    
    if frame_count % FRAME_SKIP != 0:
        continue

    video_time_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
    timestamp = format_time(video_time_ms)

    
    results = model.track(frame, persist=True, verbose=False)

    current_people = set()

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])

            label = model.names[cls]

            # Only track confident PERSON detections
            if label == "person" and conf > 0.5:
                track_id = int(box.id[0]) if box.id is not None else None

                if track_id is not None:
                    current_people.add(track_id)

    # ---- FIND NEW ENTRIES ----
    entered = current_people - active_people
    for pid in entered:
        events.append({"time": timestamp, "event": "entered", "person_id": pid})
        print(f"[EVENT] Person {pid} ENTERED at {timestamp}")

    # ---- FIND EXITS ----
    left = active_people - current_people
    for pid in left:
        events.append({"time": timestamp, "event": "left", "person_id": pid})
        print(f"[EVENT] Person {pid} LEFT at {timestamp}")

    # Update state
    active_people = current_people

cap.release()

with open("../shared/events.json", "w") as f:
    json.dump(events, f, indent=4)

print("Multi-person tracking events saved.")