import { Page, Card, Text, Button } from "@shopify/polaris";
import { useState, useEffect } from "react";

export default function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cart");
      setCart(saved ? JSON.parse(saved) : []);
    }
  }, []);

  const removeFromCart = (id) => {
    const newCart = cart.filter((item) => item.id !== id);
    setCart(newCart);
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(newCart));
    }
  };

  return (
    <Page title="Votre panier">
      <Card sectioned>
        <Text variant="headingXl" as="h2">Panier</Text>
        {cart.length === 0 ? (
          <Text color="subdued">Votre panier est vide.</Text>
        ) : (
          cart.map((section) => (
            <Card key={section.id} sectioned>
              <Text variant="headingMd" as="h3">{section.name}</Text>
              <Text color="subdued">{section.description}</Text>
              <Text>{section.price} €</Text>
              <Button destructive onClick={() => removeFromCart(section.id)}>
                Retirer du panier
              </Button>
            </Card>
          ))
        )}
      </Card>
    </Page>
  );
}
