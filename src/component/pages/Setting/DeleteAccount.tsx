export default function DeleteAccount() {
  return (
    <main className="page">
      <div className="container">
        <h1>Delete Account</h1>

        <p>
          If you wish to delete your account and all associated data, please contact us via email:
        </p>

        <h2>Email</h2>
        <p>chaniezfdw@gmail.com</p>

        <h2>Instructions</h2>
        <p>
          Send an email with the subject "Delete Account" and include your registered email.
          We will process your request within 3-5 business days.
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