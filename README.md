# EcoFootprint
Built for the 2026 Webathon by [Name 1] and [Name 2].

## The Project
We didn't want to build another "carbon calculator" that just tells you to turn off your lights. We wanted to build a tool that actually forces people to think about systemic policy changes (SDG 13) and local circular economies (SDG 12). 

EcoFootprint is a brutalist-styled dashboard designed for our school/local community to visualize grid intensity and participate in resource swapping.

## Why it exists
Most climate-tech is either too corporate or too simple. 
- **The Simulator:** We wanted to show that climate action is a series of trade-offs, not a simple "green vs. bad" choice. 
- **The Board:** We wanted to actually reduce waste in our hallways, not just talk about it.

## Features
- **Policy Simulator:** A decision-tree simulator that tracks your "sustainability score" based on government-level policy choices.
- **Give & Take Board:** A real-time Firestore-backed board for listing and claiming used items to keep them out of landfills.
- **Grid Intensity Meter:** Visualizes real-time carbon data so users can see exactly how dirty their local grid is.

## Tech Stack
- **Frontend:** HTML5, CSS3 (Neo-Brutalist design), Vanilla JavaScript (No frameworks, we wanted to keep the payload tiny and the DOM manipulation manual).
- **Backend/DB:** Firebase Firestore (for the real-time board and simulator score persistence).
- **Hosting:** GitHub Pages.

## How to run locally
1. Clone the repo:
   ```bash
   git clone [https://github.com/codegreens-dps/ecofootprint.git](https://github.com/codegreens-dps/ecofootprint.git)
