import { Card, ResourceList, Button, Toast, Select } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "react-router";

export function SectionCatalog() {
  const { sections, themes } = useLoaderData();
  const fetcher = useFetcher();
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("");

  // Initialiser le thème sélectionné avec le thème principal par défaut
  useEffect(() => {
    if (themes && themes.length > 0 && !selectedTheme) {
      const mainTheme = themes.find(theme => theme.role === 'main');
      setSelectedTheme(mainTheme ? mainTheme.id : themes[0].id);
    }
  }, [themes, selectedTheme]);

  const handleInstall = async (section) => {
    if (!selectedTheme) {
      setToastMessage("Veuillez sélectionner un thème");
      setToastError(true);
      setToastActive(true);
      return;
    }

    const formData = new FormData();
    formData.append('sectionId', section.id);
    formData.append('filename', section.filename);
    formData.append('themeId', selectedTheme);

    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/install-section'
    });
  };

  // Préparer les options pour le sélecteur de thème
  const themeOptions = themes ? themes.map(theme => ({
    label: `${theme.name}${theme.role === 'main' ? ' (Principal)' : ''}`,
    value: theme.id
  })) : [];

  // Utiliser useEffect au lieu de conditions dans le rendu
  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      if (fetcher.data.success) {
        setToastMessage("Section installée avec succès !");
        setToastError(false);
      } else {
        setToastMessage(fetcher.data.message || "Erreur lors de l'installation");
        setToastError(true);
      }
      setToastActive(true);
    }
  }, [fetcher.data, fetcher.state]);

  const sectionsByCategory = {
    "Bannières": sections.filter(section => section.type === 'banner'),
    "Sliders": sections.filter(section => section.type === 'slider'),
    // Ajouter d'autres catégories si nécessaire
  };

  return (
    <>
      {themeOptions.length > 0 && (
        <Card sectioned>
          <Select
            label="Sélectionnez le thème où installer la section"
            options={themeOptions}
            onChange={setSelectedTheme}
            value={selectedTheme}
            placeholder="Choisissez un thème"
          />
        </Card>
      )}
      
      {Object.entries(sectionsByCategory).map(([category, sections]) => (
        <Card key={category} title={category} sectioned>
          <ResourceList
            items={sections}
            renderItem={(section) => (
              <ResourceList.Item
                id={section.id}
                accessibilityLabel={`Installer ${section.name}`}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem'}}>
                  <div>
                    <h3 style={{fontWeight: 'bold'}}>{section.name}</h3>
                    <p>{section.description}</p>
                  </div>
                  <Button 
                    onClick={() => handleInstall(section)}
                    loading={fetcher.state === 'submitting'}
                    disabled={!selectedTheme}
                  >
                    Installer la section
                  </Button>
                </div>
              </ResourceList.Item>
            )}
          />
        </Card>
      ))}

      {toastActive && (
        <Toast
          content={toastMessage}
          error={toastError}
          onDismiss={() => setToastActive(false)}
        />
      )}
    </>
  );
}