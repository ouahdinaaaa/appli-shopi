export default function SectionCard({ section, onAddToCart, onShowDemo }) {
  return (
    <div style={{
      border: "1px solid #eee",
      borderRadius: 12,
      padding: 24,
      width: 320,
      background: "#fff",
      boxShadow: "0 2px 8px #0001"
    }}>
      <img src={section.image} alt={section.name} style={{width: "100%", borderRadius: 8}} />
      <h3>{section.name}</h3>
      <p>{section.description}</p>
      <div style={{display: "flex", gap: 8, marginTop: 16}}>
        <button onClick={onShowDemo}>Démo</button>
        <button onClick={onAddToCart}>Ajouter au panier</button>
      </div>
    </div>
  );
}