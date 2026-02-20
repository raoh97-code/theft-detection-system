# -------- One-Click Project Runner --------

Write-Host "Starting Theft Detection System..." -ForegroundColor Cyan

# Go to this script's directory (ensures correct path)

Set-Location $PSScriptRoot

# Activate virtual environment

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Verify Python path (for debugging)

Write-Host "Using Python from:" -ForegroundColor Green
where python

# Run detection script

Write-Host "Running multi-person detection..." -ForegroundColor Cyan
python multi_detect.py

Write-Host "Execution Finished." -ForegroundColor Green
Pause