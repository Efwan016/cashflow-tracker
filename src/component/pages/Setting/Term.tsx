import { useLanguage } from '../../providers/useLanguage'

export default function Terms() {
  const { t } = useLanguage()

  return (
    <main className="page">
      <div className="container">
        <h1>{t('Terms of Service')}</h1>

        <p>
          {t('By using this application, you agree to the following terms.')}
        </p>

        <h2>{t('Usage')}</h2>
        <p>
          {t('This app is intended for personal financial tracking only.')}
        </p>

        <h2>{t('Account Responsibility')}</h2>
        <p>
          {t('You are responsible for maintaining the security of your account.')}
        </p>

        <h2>{t('Limitation')}</h2>
        <p>
          {t('We are not responsible for any financial decisions made using this app.')}
        </p>

        <h2>{t('Changes')}</h2>
        <p>
          {t('We may update these terms at any time.')}
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
