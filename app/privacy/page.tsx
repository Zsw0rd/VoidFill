import Link from "next/link";
import { Brand } from "@/components/Brand";

export const metadata = { title: "Privacy notice · VoidFill" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Brand />
      <p className="eyebrow mt-12 mb-4">Your information</p>
      <h1>Privacy at VoidFill.</h1>
      <p className="mt-4 text-sm text-muted">Updated 1 November 2026</p>
      <div className="mt-9 space-y-8 text-sm leading-7 text-muted">
        <section>
          <h2 className="text-xl text-ink">
            Your account and learning activity
          </h2>
          <p>
            VoidFill uses your account email, profile details, career goals,
            assessment results and learning activity to provide your learning
            workspace. Signing in with Google shares basic account information
            such as your name, email address and profile picture. VoidFill does
            not request access to your Gmail or Google Drive.
          </p>
        </section>
        <section>
          <h2 className="text-xl text-ink">Where processing happens</h2>
          <p>
            Vercel hosts the website and learning processing. Supabase provides
            authentication, database and storage. The learning model retrieves
            existing educational material and questions. When you use the AI
            mentor, chat messages and relevant learning context are sent to
            Google Gemini to produce a response and check moderation.
          </p>
        </section>
        <section>
          <h2 className="text-xl text-ink">Resumes and conversations</h2>
          <p>
            Resume files are processed to extract text and suggest profile
            fields. The application does not retain the original file or
            complete extraction after processing. Profile fields are saved when
            you choose to apply them. Conversations and learning records are
            stored in Supabase; assigned mentors and authorized staff can access
            records needed for their roles, including moderation.
          </p>
        </section>
        <section>
          <h2 className="text-xl text-ink">Sessions and temporary demos</h2>
          <p>
            Cookies maintain sign-in and temporary demo sessions. Cloud demo
            records are encrypted, isolated by session and expire with their
            session lease. Expired records are removed during storage cleanup.
            Hosting providers may process operational logs and request metadata
            to operate their services. Do not include unnecessary sensitive
            information in resumes or chats.
          </p>
        </section>
        <section>
          <h2 className="text-xl text-ink">Your choices and requests</h2>
          <p>
            You can edit your profile, sign out, and revoke Google access in
            your Google Account settings. Revoking Google access does not delete
            existing VoidFill records. For questions or requests to access or
            delete account data, contact{" "}
            <a
              className="text-forest underline"
              href="mailto:alokdas30062005@gmail.com"
            >
              alokdas30062005@gmail.com
            </a>
            . External learning resources follow their own privacy practices.
          </p>
        </section>
      </div>
      <Link href="/auth/login" className="primary-link mt-10">
        Back to your workspace →
      </Link>
    </main>
  );
}
