# SXC Attendance PWA — GitHub Pages Setup Guide

## Files in this folder
- `index.html` — the main app
- `manifest.json` — makes it installable as an Android app
- `sw.js` — service worker for offline support
- `icon-192.png` — app icon (small)
- `icon-512.png` — app icon (large)

---

## Step-by-Step: Deploy to GitHub Pages

### Step 1 — Create a GitHub account
Go to https://github.com and sign up (free).

### Step 2 — Create a new repository
1. Click the **+** button → **New repository**
2. Name it: `sxc-attendance`
3. Set it to **Public**
4. Click **Create repository**

### Step 3 — Upload the files
1. On your new repo page, click **"uploading an existing file"**
2. Drag and drop ALL files from this folder:
   - index.html
   - manifest.json
   - sw.js
   - icon-192.png
   - icon-512.png
3. Click **Commit changes**

### Step 4 — Enable GitHub Pages
1. Go to your repo → **Settings** tab
2. Scroll down to **Pages** (left sidebar)
3. Under **Source**, select **main** branch → **/ (root)**
4. Click **Save**
5. Wait 1–2 minutes

### Step 5 — Your app URL
Your app will be live at:
```
https://YOUR_GITHUB_USERNAME.github.io/sxc-attendance/
```

---

## Install on Android as an App

1. Open the URL above in **Chrome** on your Android phone
2. Tap the **3-dot menu** (top right)
3. Tap **"Add to Home Screen"**
4. Tap **"Install"**
5. The app icon appears on your home screen — tap to open!

It works exactly like a real Android app. 🎉

---

## Usage
- Enter your **Form No. / Exam Roll No.**
- Select your **Semester**
- Choose **Overall / Monthly / Daily**
- Tap **Check Attendance**
- 🟢 Green = ≥75% | 🟡 Yellow = 60–74% | 🔴 Red = <60%
- ⚠️ Low attendance warning shows automatically

---

## Troubleshooting
- **No data found**: Double-check your roll number and semester
- **Network error**: Make sure you have internet connection
- **App not installing**: Make sure you're using Chrome browser
