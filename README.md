# Humphreys Hill House AttendPro

A premium GitHub Pages-ready attendance management system for conferences, meetings, trainings, workshops, AGMs, seminars, corporate events, university events and hotel-hosted activities.

## Highlights

- Premium hotel-branded UI
- Uses Humphreys Hill House hero image
- Event creation
- Participant registration
- QR code generation
- Camera QR check-in
- Manual check-in
- Duplicate check-in prevention
- Premium badge printing
- Live check-in feed
- Dashboard analytics
- CSV reports
- JSON backup
- Audit logs
- Consent recording
- Retention period fields
- PWA install support
- Offline cache support
- Local encrypted vault backup demo

## Compliance Position

This system is designed with ISO 27001-style and data protection principles in mind:
- Consent
- Access-level tagging
- Audit logs
- Data minimisation
- Retention controls
- Export and deletion
- Local encrypted backup demo

Important: this demo is not ISO certified by itself. Certification requires organizational policies, risk assessment, documented controls, audits, hosting controls, staff training and legal review.

## Run Locally

Open `index.html` in your browser.

## Run on GitHub Pages

1. Create a GitHub repository.
2. Upload all files and folders.
3. Go to Settings > Pages.
4. Select Deploy from branch.
5. Choose `main` and `/root`.
6. Save.
7. Open the generated GitHub Pages link.

## Production Upgrade

For a full production system, connect this front-end to:
- Firebase or Supabase
- Laravel, Django or Node API
- PostgreSQL/MySQL database
- Real login and role-based access control
- Server-side audit logs
- Data Processing Agreement and Privacy Notice
- HTTPS-only hosting
- Regular backups


## New Upgrade Added

### Login and Logout

Demo accounts:

- Admin: `admin` / `admin123`
- Check-in Officer: `scanner` / `scan123`

Admin can manage the whole system.  
Check-in Officer can only access the QR check-in area.

### Android Installation

After hosting on GitHub Pages:

1. Open the live system link using Chrome on Android.
2. Tap the three dots menu.
3. Tap **Install app** or **Add to Home screen**.
4. The system will appear like an Android app.

### Device Compatibility

The system has been upgraded for:

- Android phones
- Tablets
- Laptops
- Desktop screens
- Touch devices
- GitHub Pages hosting
- Offline-first PWA caching

### Security Note

This is still a front-end GitHub Pages demo. For real production security, the login should be moved to a secure backend such as Firebase Auth, Supabase Auth, Laravel, Django, or Node.js with encrypted database storage.
