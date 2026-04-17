export default function Terms() {
  return (
    <main className="page">
      <div className="container">
        <h1>Terms of Service</h1>

        <p>
          By using this application, you agree to the following terms.
        </p>

        <h2>Usage</h2>
        <p>
          This app is intended for personal financial tracking only.
        </p>

        <h2>Account Responsibility</h2>
        <p>
          You are responsible for maintaining the security of your account.
        </p>

        <h2>Limitation</h2>
        <p>
          We are not responsible for any financial decisions made using this app.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms at any time.
        </p>
      </div>

      <style>{`
        .page {
          min-height: 100vh;
          background: #020617;
          color: white;
          padding: 40px;
        }

        .container {
          max-width: 800px;
          margin: auto;
        }

        h1 {
          font-size: 32px;
          margin-bottom: 20px;
        }

        h2 {
          margin-top: 20px;
          font-size: 20px;
        }

        p {
          color: #94a3b8;
          margin-top: 8px;
        }
      `}</style>
    </main>
  )
}