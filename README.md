# theft-detection-system

A theft detection system made for Hack.X hackathon.

Folder Structure
theft-detection-system/
│
├── ai-engine/                ← Python Vision System
│   ├── detect.py             ← Runs YOLO + OpenCV
│   ├── motion.py             ← Detect drawer movement
│   ├── event_generator.py    ← Creates event JSON
│   ├── requirements.txt
│   └── sample_video.mp4
│
├── pos-simulator/            ← Fake POS logs for demo
│   ├── pos_logs.json
│   └── generate_logs.js
│
├── backend/                  ← Node.js Logic Layer
│   ├── server.js
│   ├── anomalyDetector.js    ← Matches video vs POS logs
│   ├── routes/
│   └── package.json
│
├── client/                   ← React Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveFeed.js
│   │   │   ├── Alerts.js
│   │   │   └── Timeline.js
│   │   ├── App.js
│   │   └── socket.js
│   └── package.json
│
├── shared/                   ← Data exchanged between systems
│   ├── events.json           ← AI detected events
│   └── alerts.json
│
└── README.md