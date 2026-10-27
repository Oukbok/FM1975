import Icon, { type IconName } from '../components/Icon';
import { type ReactNode } from 'react';

// --- Kleine Helferkomponente für rudimentäre Seiten -------------------------
// --- GEMEINSAMER SEITENKOPF -------------------------------------------------
// Einheitlicher Kopf fuer alle Content-Seiten, optisch am Dashboard (.dxh)
// orientiert. Standardformate liegen zentral in index.css (:root-Tokens +
// .page/.page-head). Entweder `icon` (IconName) ODER `left` (z.B. <ClubCrest/>)
// als linkes Symbol; `right` nimmt Meta-Infos/Buttons auf.
export function PageHead({ icon, left, title, right }: { icon?: IconName; left?: ReactNode; title: ReactNode; right?: ReactNode }) {
  return (
    <div className="page-head">
      {left ? (
        <span className="page-head-ico">{left}</span>
      ) : icon ? (
        <span className="page-head-ico"><Icon name={icon} /></span>
      ) : null}
      <div className="page-head-title">{title}</div>
      {right != null ? <div className="page-head-right">{right}</div> : null}
    </div>
  );
}

export function PagePlaceholder({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <div className="page">
      <PageHead icon={icon} title={title} />
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-title"><span className="ico"><Icon name={icon} /></span> {title}</div>
        <div className="dim mt8" style={{ lineHeight: 1.6 }}>{children}</div>
        <div className="pill mt16" style={{ display: 'inline-block' }}>In Arbeit</div>
      </div>
    </div>
  );
}
