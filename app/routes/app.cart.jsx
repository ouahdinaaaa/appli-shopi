import { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { useNavigate } from "react-router-dom";
import {
  Page,
  Card,
  Text,
  Button,
  Badge,
  Layout,
  BlockStack,
  Select,
  Banner,
  FormLayout,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

// Catégories
const categories = [
  { name: "Bannières", slug: "bannieres", image: "/images/banner.jpg" },
  { name: "Sliders", slug: "sliders", image: "/images/slider.jpg" },
  { name: "Before/After", slug: "before-after", image: "/images/beforeafter.jpg" },
  { name: "Comparatifs", slug: "comparatifs", image: "/images/comparatif.jpg" },
];

// 🛒 SlideCart
function SlideCart({ cart, onClose, removeFromCart }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 380,
        height: "100vh",
        background: "#fff",
        boxShadow: "-4px 0 30px rgba(0,0,0,0.2)",
        zIndex: 1000,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        borderLeft: "2px solid #f2f2f2",
        animation: "slideIn 0.3s ease-out",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>
        {`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}
      </style>

      <Button plain onClick={onClose} style={{ alignSelf: "flex-end", marginBottom: 16 }}>
        ✕
      </Button>

      <Text variant="headingXl" as="h2" fontWeight="bold" style={{ marginBottom: 16 }}>
        🛒 Votre panier
      </Text>

      {cart.length === 0 ? (
        <Text color="subdued">Votre panier est vide.</Text>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
          {cart.map((item) => (
            <Card key={item.id} sectioned>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <Text variant="headingMd">{item.name}</Text>
                  <Text color="subdued">{item.price} €</Text>
                </div>
                <Button destructive onClick={() => removeFromCart(item.id)}>
                  Retirer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <Button fullWidth primary style={{ marginTop: 16 }}>
          Procéder au paiement
        </Button>
      )}
    </div>
  );
}

// 🎨 Modal de démo stylé
function DemoModal({ section, onClose }) {
  if (!section) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        zIndex: 1500,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes zoomIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "90%",
          maxWidth: 900,
          padding: 24,
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
          animation: "zoomIn 0.3s ease",
          position: "relative",
        }}
      >
        <Button plain onClick={onClose} style={{ position: "absolute", top: 16, right: 16 }}>
          ✕
        </Button>

        <Text variant="headingLg" as="h3" fontWeight="bold" style={{ marginBottom: 16 }}>
          Aperçu : {section.name}
        </Text>

        {/* IFRAME DE PRÉVISUALISATION */}
        <iframe
          title="Demo preview"
          srcDoc={section.demoHTML}
          style={{
            width: "100%",
            height: 400,
            border: "1px solid #e5e5e5",
            borderRadius: 12,
          }}
        ></iframe>
      </div>
    </div>
  );
}

// 🌈 Catégories
function CategoryCarousel({ categories, navigate }) {
  const carouselRef = useRef(null);
  const scroll = (dir) => {
    carouselRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  const routes = {
    bannieres: "/app/bannieres",
    sliders: "/app/sliders",
    "before-after": "/app/before-after",
    comparatifs: "/app/comparatifs",
  };

  return (
    <div style={{ position: "relative", marginBottom: 40 }}>
      <Button plain onClick={() => scroll(-1)} style={{ position: "absolute", left: 0, top: "40%", zIndex: 10 }}>
        ◀
      </Button>
      <div
        ref={carouselRef}
        style={{
          display: "flex",
          overflowX: "auto",
          gap: 24,
          padding: "1rem 2rem",
          scrollBehavior: "smooth",
        }}
      >
        {categories.map((cat) => (
          <div
            key={cat.slug}
            onClick={() => navigate(routes[cat.slug])}
            style={{
              flex: "0 0 140px",
              cursor: "pointer",
              textAlign: "center",
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              background: "#fff",
              padding: "1rem",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img
              src={cat.image}
              alt={cat.name}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: 8,
              }}
            />
            <Text variant="bodyMd">{cat.name}</Text>
          </div>
        ))}
      </div>
      <Button plain onClick={() => scroll(1)} style={{ position: "absolute", right: 0, top: "40%", zIndex: 10 }}>
        ▶
      </Button>
    </div>
  );
}

// 🧠 Page principale
export default function Index() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [demoSection, setDemoSection] = useState(null);

  const sectionItems = [
    {
      id: "section1",
      name: "Scroll Text Color",
      description: "Une section moderne qui change la couleur du texte au scroll",
      filename: "scroll-text-color.liquid",
      price: 9,
      image: "/images/banner.jpg",
      demoHTML: `
        <style>
          body { font-family: sans-serif; margin: 0; padding: 0; text-align: center; }
          h1 { font-size: 2.5rem; margin-top: 100px; animation: colorShift 5s infinite alternate; }
          @keyframes colorShift {
            0% { color: #4f46e5; }
            100% { color: #ec4899; }
          }
        </style>
        <h1>Scroll Text Color Demo ✨</h1>
        <p>Défilez pour voir la magie...</p>
      `,
    },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    setCart(saved ? JSON.parse(saved) : []);
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (section) => {
    if (!cart.find((i) => i.id === section.id)) setCart([...cart, section]);
  };

  const removeFromCart = (id) => setCart(cart.filter((i) => i.id !== id));

  return (
    <Page fullWidth>
      <TitleBar title="Section Addict" />

      {/* Bouton panier */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button onClick={() => setShowCart(true)}>
          Panier <Badge status="info">{cart.length}</Badge>
        </Button>
      </div>

      {/* SlideCart */}
      {showCart && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 999,
          }}
          onClick={() => setShowCart(false)}
        >
          <SlideCart cart={cart} onClose={() => setShowCart(false)} removeFromCart={removeFromCart} />
        </div>
      )}

      {/* Section Hero */}
      <Card sectioned>
        <div
          style={{
            background: "linear-gradient(135deg, #4f46e5, #ec4899)",
            color: "#fff",
            borderRadius: 16,
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <Text variant="heading2xl" as="h1" fontWeight="bold" style={{ marginBottom: 16 }}>
            Créez une boutique Shopify unique
          </Text>
          <p style={{ fontSize: 18, marginBottom: 24 }}>
            Découvrez des sections prêtes à l'emploi pour booster votre design : bannières, sliders, comparatifs et plus encore.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Button primary size="large" onClick={() => navigate("#catalog")}>
              Explorer le catalogue
            </Button>
          </div>
        </div>
      </Card>

      {/* Carrousel de catégories */}
      <Text
        variant="headingXl"
        as="h2"
        fontWeight="bold"
        style={{ margin: "40px 0 16px", textAlign: "center" }}
      >
        Catégories populaires
      </Text>
      <CategoryCarousel categories={categories} navigate={navigate} />

      {/* Catalogue */}
      <div id="catalog" style={{ marginTop: 48 }}>
        <Text
          variant="headingXl"
          as="h2"
          fontWeight="bold"
          style={{ marginBottom: 24, textAlign: "center" }}
        >
          Catalogue des sections
        </Text>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {sectionItems.map((section) => (
            <Card key={section.id} sectioned>
              <div style={{ textAlign: "center" }}>
                <img
                  src={section.image}
                  alt={section.name}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                />
                <Text variant="headingMd">{section.name}</Text>
                <Text color="subdued">{section.description}</Text>
                <Text style={{ fontWeight: "bold", margin: "8px 0" }}>{section.price} €</Text>

                <div style={{ display: "flex", gap: 8 }}>
                  <Button onClick={() => addToCart(section)} fullWidth>
                    Ajouter
                  </Button>
                  <Button outline onClick={() => setDemoSection(section)} fullWidth>
                    Démo
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de démo */}
      {demoSection && <DemoModal section={demoSection} onClose={() => setDemoSection(null)} />}
    </Page>
  );
}
