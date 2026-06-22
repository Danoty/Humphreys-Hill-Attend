from flask import Flask, render_template, request, redirect, url_for, flash, send_file
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import qrcode, os, csv
from io import StringIO, BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

app = Flask(__name__)
app.config["SECRET_KEY"] = "change-this-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///humphreys_attendance.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

QR_DIR = os.path.join("static", "qrcodes")
os.makedirs(QR_DIR, exist_ok=True)

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    venue = db.Column(db.String(150), default="Humphreys Hill House")
    start_date = db.Column(db.String(30), nullable=False)
    end_date = db.Column(db.String(30), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Participant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(50))
    organization = db.Column(db.String(150))
    position = db.Column(db.String(100))
    qr_code = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    event = db.relationship("Event", backref="participants")

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    participant_id = db.Column(db.Integer, db.ForeignKey("participant.id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)
    session_name = db.Column(db.String(150), default="Main Session")
    check_in_time = db.Column(db.DateTime, default=datetime.utcnow)
    participant = db.relationship("Participant")
    event = db.relationship("Event")

@app.route("/")
def index():
    events = Event.query.order_by(Event.created_at.desc()).all()
    return render_template("index.html", events=events)

@app.route("/events/new", methods=["GET", "POST"])
def new_event():
    if request.method == "POST":
        event = Event(
            title=request.form["title"],
            event_type=request.form["event_type"],
            venue=request.form.get("venue") or "Humphreys Hill House",
            start_date=request.form["start_date"],
            end_date=request.form["end_date"]
        )
        db.session.add(event)
        db.session.commit()
        flash("Event created successfully.")
        return redirect(url_for("index"))
    return render_template("new_event.html")

@app.route("/events/<int:event_id>")
def event_detail(event_id):
    event = Event.query.get_or_404(event_id)
    participants = Participant.query.filter_by(event_id=event_id).all()
    attendance = Attendance.query.filter_by(event_id=event_id).order_by(Attendance.check_in_time.desc()).all()
    return render_template("event_detail.html", event=event, participants=participants, attendance=attendance)

@app.route("/events/<int:event_id>/register", methods=["GET", "POST"])
def register_participant(event_id):
    event = Event.query.get_or_404(event_id)
    if request.method == "POST":
        participant = Participant(
            event_id=event.id,
            full_name=request.form["full_name"],
            email=request.form.get("email"),
            phone=request.form.get("phone"),
            organization=request.form.get("organization"),
            position=request.form.get("position")
        )
        db.session.add(participant)
        db.session.commit()

        qr_data = f"HHA-{event.id}-{participant.id}"
        qr_filename = f"participant_{participant.id}.png"
        qr_path = os.path.join(QR_DIR, qr_filename)
        img = qrcode.make(qr_data)
        img.save(qr_path)

        participant.qr_code = qr_filename
        db.session.commit()

        flash("Participant registered and QR badge generated.")
        return redirect(url_for("event_detail", event_id=event.id))
    return render_template("register.html", event=event)

@app.route("/scan", methods=["GET", "POST"])
def scan():
    if request.method == "POST":
        qr_value = request.form["qr_value"].strip()
        session_name = request.form.get("session_name") or "Main Session"

        try:
            _, event_id, participant_id = qr_value.split("-")
            event_id = int(event_id)
            participant_id = int(participant_id)
        except Exception:
            flash("Invalid QR code.")
            return redirect(url_for("scan"))

        participant = Participant.query.get(participant_id)
        event = Event.query.get(event_id)

        if not participant or not event or participant.event_id != event.id:
            flash("Participant or event not found.")
            return redirect(url_for("scan"))

        existing = Attendance.query.filter_by(
            participant_id=participant.id,
            event_id=event.id,
            session_name=session_name
        ).first()

        if existing:
            flash(f"{participant.full_name} already checked in for {session_name}.")
            return redirect(url_for("event_detail", event_id=event.id))

        record = Attendance(
            participant_id=participant.id,
            event_id=event.id,
            session_name=session_name
        )
        db.session.add(record)
        db.session.commit()
        flash(f"{participant.full_name} checked in successfully.")
        return redirect(url_for("event_detail", event_id=event.id))
    return render_template("scan.html")

@app.route("/events/<int:event_id>/export")
def export_csv(event_id):
    event = Event.query.get_or_404(event_id)
    records = Attendance.query.filter_by(event_id=event_id).all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Event", "Participant", "Phone", "Organization", "Session", "Check-in Time"])

    for r in records:
        writer.writerow([
            event.title,
            r.participant.full_name,
            r.participant.phone,
            r.participant.organization,
            r.session_name,
            r.check_in_time.strftime("%Y-%m-%d %H:%M:%S")
        ])

    mem = BytesIO()
    mem.write(output.getvalue().encode("utf-8"))
    mem.seek(0)

    return send_file(
        mem,
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"{event.title}_attendance.csv"
    )

@app.route("/participants/<int:participant_id>/certificate")
def certificate(participant_id):
    participant = Participant.query.get_or_404(participant_id)
    event = participant.event

    attended = Attendance.query.filter_by(participant_id=participant.id, event_id=event.id).first()
    if not attended:
        flash("Certificate cannot be generated because participant has not checked in.")
        return redirect(url_for("event_detail", event_id=event.id))

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawCentredString(width/2, height-120, "HUMPHREYS HILL ATTEND")
    pdf.setFont("Helvetica", 14)
    pdf.drawCentredString(width/2, height-150, "Certificate of Attendance")

    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(width/2, height-220, "This is to certify that")
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawCentredString(width/2, height-260, participant.full_name)
    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(width/2, height-300, f"attended {event.title}")
    pdf.drawCentredString(width/2, height-330, f"held at {event.venue}")
    pdf.drawCentredString(width/2, height-360, f"from {event.start_date} to {event.end_date}")

    pdf.setFont("Helvetica", 10)
    pdf.drawCentredString(width/2, 80, f"Certificate No: HHA-CERT-{event.id}-{participant.id}")
    pdf.showPage()
    pdf.save()

    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"{participant.full_name}_certificate.pdf", mimetype="application/pdf")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
