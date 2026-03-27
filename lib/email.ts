import nodemailer from "nodemailer";

function getMailer() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT ?? 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error("이메일 환경변수가 설정되지 않았습니다.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

function getFromAddress() {
  const user = process.env.EMAIL_USER;
  const name = process.env.NOTIFY_FROM_NAME ?? "협동조합 소이랩";
  if (!user) {
    throw new Error("EMAIL_USER가 설정되지 않았습니다.");
  }
  return `"${name}" <${user}>`;
}

export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getMailer();
  await transporter.sendMail({
    from: getFromAddress(),
    to: params.to,
    subject: params.subject,
    html: params.html
  });
}
