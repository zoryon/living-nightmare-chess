import nodemailer from "nodemailer";

// Configure the SMTP transporter for sending emails, using environment variables for credentials.
export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465, 
    secure: true, // Use SSL/TLS for secure connection
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

// Verifying the SMTP connection when the server starts.
transporter.verify((error) => {
    if (error) {
        console.error("SMTP connection error: ", error);
    } else {
        console.log("SMTP server is ready to send emails"); // If the connection is successful, log this message
    }
});
