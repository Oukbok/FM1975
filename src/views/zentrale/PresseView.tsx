import Icon from '../../components/Icon';
import { Game } from '../../game/state';
import { PageHead } from '../../ui/PageHead';

// --- PRESSE -----------------------------------------------------------------
export function PresseView({ g }: { g: Game }) {
  const items = g.messages.slice(0, 12);
  return (
    <div className="page">
      <PageHead icon="presse" title="Presse & Medien" />
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-title"><span className="ico"><Icon name="presse" /></span> Aktuelle Schlagzeilen</div>
        <div className="ticker mt8" style={{ maxHeight: 360 }}>
          {items.length ? items.map((msg) => (
            <div key={msg.id} className="ticker-item">
              <span className="dot">{msg.read ? '▹' : '▸'}</span>
              <span style={{ fontWeight: msg.read ? 400 : 700 }}>{msg.subject}</span>
            </div>
          )) : <div className="dim">Derzeit keine Meldungen.</div>}
        </div>
        <div className="dim2 mini mt12">Pressekonferenzen und Interviews folgen in einem späteren Ausbau.</div>
      </div>
    </div>
  );
}
