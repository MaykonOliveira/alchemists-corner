/** Privacidade e termos em linguagem simples (pacote L). Exigido pelas lojas de app antes de qualquer cobrança. */
export function PrivacyDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-privacy" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
        <h2 id="privacy-title">Privacidade e termos</h2>
        <h3 className="mini-title">O que o jogo guarda</h3>
        <ul className="privacy-list">
          <li>A partida fica salva <b>só no seu navegador</b> (IndexedDB). Ninguém mais tem acesso a ela.</li>
          <li>Para entender os primeiros minutos de jogo, o jogo conta alguns marcos (primeira venda, fim do dia 1, se você voltou no dia seguinte). Esses números também ficam <b>só neste aparelho</b> e aparecem em Configurações → Números deste aparelho.</li>
          <li>Não há contas, cookies de rastreamento, anúncios nem envio de dados pessoais.</li>
          <li>Códigos de presente e de “levar a partida” contêm só dados do jogo (nome da loja, progresso) e só vão para quem você mandar.</li>
          <li>Lembretes são opcionais, desligados por padrão, e no máximo um por dia.</li>
        </ul>
        <h3 className="mini-title">Termos</h3>
        <ul className="privacy-list">
          <li>O jogo é gratuito. Os Cristais de luar e a decoração são ganhos jogando e não têm valor fora do jogo.</li>
          <li>Se um dia houver compras, elas serão só de itens visuais, mostrados antes da compra. Moedas, XP e vantagens nunca serão vendidos.</li>
          <li>Apagar os dados do site apaga a partida. Use “Levar a partida” para guardar uma cópia.</li>
        </ul>
        <button className="btn btn-primary" autoFocus onClick={onClose}>Entendi</button>
      </div>
    </div>
  );
}
