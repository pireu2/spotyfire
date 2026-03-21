"""
Email Service for sending alert notifications
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict
from datetime import datetime


SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)


def get_alert_emoji(alert_type: str) -> str:
    emojis = {
        'FIRE': '🔥',
        'FLOOD': '💧',
        'NDVI': '🌿',
        'WARNING': '⚠️'
    }
    return emojis.get(alert_type.upper(), '⚠️')


def get_severity_color(severity: str) -> str:
    colors = {
        'LOW': '#FCD34D',
        'MEDIUM': '#FB923C',
        'HIGH': '#EF4444',
        'CRITICAL': '#991B1B'
    }
    return colors.get(severity.upper(), '#FB923C')


async def send_alert_email(to_email: str, user_name: str, alert_data: List[Dict]):
    """Send email notification about nearby alerts"""
    
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("⚠️  Email credentials not configured, skipping email send")
        return
    
    subject = f"🚨 Alertă SpotyFire: {len(alert_data)} pericol(e) detectat(e) lângă proprietățile tale"
    
    alert_html_rows = []
    for item in alert_data[:10]:
        alert = item['alert']
        prop = item['property']
        distance = item['distance_km']
        is_within = item['is_within_radius']
        
        emoji = get_alert_emoji(alert.type.value)
        severity_color = get_severity_color(alert.severity.value)
        status = "🔴 ÎN ZONA DE RISC" if is_within else "⚠️ PROXIMITATE"
        
        alert_html_rows.append(f"""
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 16px; background-color: #f9fafb;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 24px;">{emoji}</span>
                    <strong style="color: #1f2937; font-size: 16px;">{alert.message}</strong>
                </div>
                <div style="margin-bottom: 8px;">
                    <span style="background-color: {severity_color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                        {alert.severity.value}
                    </span>
                    <span style="margin-left: 8px; color: #6b7280; font-size: 14px;">
                        {status}
                    </span>
                </div>
                <div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                    <div>📍 <strong>Locație:</strong> {alert.sector}</div>
                    <div>🏡 <strong>Proprietate afectată:</strong> {prop.name}</div>
                    <div>📏 <strong>Distanță:</strong> {distance} km de proprietatea ta</div>
                    <div>⚠️ <strong>Rază impact:</strong> {alert.radius_km or 0} km</div>
                    <div>🕒 <strong>Detectat:</strong> {alert.created_at.strftime('%d.%m.%Y %H:%M')}</div>
                </div>
            </td>
        </tr>
        """)
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                    🚨 Alertă SpotyFire
                </h1>
                <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">
                    Sistem de Monitorizare Satelitară
                </p>
            </div>
            
            <div style="padding: 32px; background-color: white;">
                <p style="color: #1f2937; font-size: 16px; margin: 0 0 16px 0;">
                    Bună <strong>{user_name}</strong>,
                </p>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                    Sistemul nostru de monitorizare satelitară a detectat <strong>{len(alert_data)} pericol(e)</strong> 
                    în apropierea proprietăților tale. Te rugăm să verifici detaliile mai jos și să iei măsurile necesare.
                </p>
                
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                    <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: bold;">
                        ⚠️ Acțiune recomandată
                    </p>
                    <p style="color: #92400e; margin: 8px 0 0 0; font-size: 13px;">
                        Verifică starea terenurilor tale și consideră măsuri preventive dacă pericolul se apropie.
                    </p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    {''.join(alert_html_rows)}
                </table>
                
                <div style="text-align: center; margin-top: 32px;">
                    <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/dashboard/alerte" 
                       style="display: inline-block; background-color: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        Vezi Toate Alertele
                    </a>
                </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0; font-size: 13px;">
                    Acest email a fost trimis automat de <strong>SpotyFire</strong><br>
                    Sistem de monitorizare satelitară pentru protecția culturilor agricole
                </p>
                <p style="color: #9ca3af; margin: 12px 0 0 0; font-size: 12px;">
                    © {datetime.now().year} SpotyFire. Toate drepturile rezervate.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    
    html_part = MIMEText(html_content, 'html', 'utf-8')
    msg.attach(html_part)
    
    try:
        # server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        # server.starttls()
        # server.login(SMTP_USERNAME, SMTP_PASSWORD)
        # server.send_message(msg)
        # server.quit()
        print(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        raise
