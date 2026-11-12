import styles from './CasinoFingerprint.module.css'

const lines = ['using System.Runtime;', 'using System.Security;', 'namespace SecureConnection {', '  public class Bootstrapper {', '    private static readonly Stream connection;', '    public void Initialize() {', '      connection.Authenticate();', '      connection.ReadPacket();', '    }', '  }', '}']

/** postpart.mp4 time in seconds. Windows retain their stacking order. */
export function BootDesktop({ time: p }: { time: number }) {
  return <div className={styles.bootDesktop} aria-hidden="true">
    {p >= 3.8 && <div className={styles.bootRear} data-filled={p >= 7} data-flash={p >= 7 && p < 8.4}>
      {p >= 7 && <pre>{lines.join('\n')}</pre>}
    </div>}
    {p >= 0 && <div className={styles.bootExplorer} data-filled={p >= 9.4} data-flash={p >= 9.4 && p < 10.8}>
      {p >= 9.4 && <><header>Expander</header><nav>Device　 Fastboot　 AV Mode</nav><div className={styles.bootFileList}><aside>Quick access<br /><br />Devices<br />Recent<br />Shared<br />Offline<br />Storage</aside><pre>{'Name                 Type\n\nSystem               Directory\nLocal                Directory\nNetwork              Device\nRuntime              Directory\nCache                Directory'}</pre></div></>}
    </div>}
    {p >= 6.4 && <div className={styles.bootMap} data-flash={p >= 8.8 && p < 9.8}>
      <header>bash -3.1 &gt;&gt; fetch SCP -NVC</header>
      <div className={styles.bootContinent} /><pre>{lines.slice(2).join('\n')}</pre>
    </div>}
    {p >= 8 && <div className={styles.bootTopbar}>MODE　 CONNECTOR　 RESET　 SIGNAL　 ▥▥▥▥▥▥▥▥▥</div>}
    {p >= 8.9 && <div className={styles.bootBackOutline} />}
  </div>
}

