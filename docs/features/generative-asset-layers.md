"""# **Feature Plan: Generative Asset Layers**

## **1. Executive Summary**

This document details the plan to implement a multi-step, generative asset creation tool. The feature will allow users to first generate a base "lens" and then overlay one or more thematic "elements" (e.g., a circuit board pattern, an eyeball iris). Generation will be powered by the **Gemini Flash image generator** (referred to as "Nano Banana"), with "creative clamps" (structured prompts) to ensure the output is consistent and usable within the application's radial design. This V1 focuses on establishing the core architecture for generating a base lens and one overlay element, with secure client-side API key management.

## **2. Goals & Scope**

### **In Scope (Version 1.0)**

*   **API Key Management:** A secure method for users to input and persist their own Gemini API key on the client-side.
*   **Configurable Generation Service:** A single, scalable service capable of generating different categories of assets.
*   **Asset Categories:**
    *   One `lens` category for the base layer.
    *   Two `element` categories (`element-circuit`, `element-iris`) for the overlay.
*   **Generation UI:** A new UI panel (`AssetGeneratorPanel.tsx`) for selecting categories, entering prompts, and triggering generation.
*   **Layering:** The ability to generate a base lens and then generate one element to be layered on top.
*   **State Integration:** The generated assets will be integrated into the existing `useLayerManagement` state.

### **Out of Scope (Version 1.0)**

*   Saving, storing, or sharing of generated assets.
*   A history of generated assets.
*   Layering more than one element.
*   Advanced UI modifiers like sliders or color pickers.
*   User-facing cost management or credit system.

## **3. User Experience (UX) Flow**

1.  The user opens the new "Asset Generator" panel.
2.  If no API key is stored, a modal prompts the user to enter one. The key is then saved to `localStorage`.
3.  The panel defaults to the `lens` category. The user types a prompt (e.g., "cracked and smoky") and clicks "Generate".
4.  A loading indicator appears. After a few seconds, the main visualizer updates to show the newly generated base lens.
5.  The user then selects an `element` category from a dropdown, for example, `element-circuit`.
6.  They type a new prompt for the element (e.g., "glowing gold and silver") and click "Generate".
7.  The visualizer updates again, now showing the generated circuit pattern overlaid on top of the base lens.

## **4. API Key Management**

### **4.1. Security Consideration**

Storing API keys on the client-side requires a trade-off between convenience and security.

*   **`localStorage`**: The key will be stored in the browser's `localStorage`. This is convenient as it persists when the user closes their browser. However, this data is accessible to any JavaScript running on the same domain (e.g., through an XSS attack).
*   **In-Memory**: While the app is running, the key will be held in React's state, which is secure from direct inspection.
*   **Conclusion**: For a local-first developer tool, `localStorage` is a common and generally accepted practice. We are proceeding with the understanding that this is not as secure as a server-side solution but is appropriate for this application's context. We will **never** check the key into version control.

### **4.2. Implementation**

The system will use a combination of React Context for in-memory state management, `localStorage` for persistence, and a modal for user input.

## **5. Technical Architecture & Design**

The architecture is designed to be modular and scalable, centered around a configuration-driven service.

### **5.1. Core Components**

1.  **`src/context/ApiKeyContext.tsx`**: A new React context to manage the API key state globally.
2.  **`src/components/modals/ApiKeyModal.tsx`**: A new modal component for users to input their API key.
3.  **`src/config/assetGenerationConfig.ts`**: A configuration file defining the prompt rules ("clamps") for each asset category.
4.  **`src/services/assetGenerationService.ts`**: A generic service that takes an asset category, user prompt, and API key to return an image URL.
5.  **`src/components/controls/AssetGeneratorPanel.tsx`**: A new UI component for user interaction.
6.  **`src/hooks/useLayerManagement.ts`**: The existing hook, which will be modified to accept image URLs for layers.

### **5.2. Component Breakdown (In & Out Points)**

---

#### **A. `ApiKeyContext.tsx` (New)**
*   **Purpose:** To manage the API key state, handle persistence to `localStorage`, and control the visibility of the API key modal.
*   **OUT:** Provides `apiKey`, `setApiKey`, `isApiKeyModalOpen`, `setIsApiKeyModalOpen`.
*   **Code Snippet:**
    ```typescript
    // src/context/ApiKeyContext.tsx
    import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

    interface ApiKeyContextType {
      apiKey: string | null;
      setApiKey: (key: string) => void;
      isApiKeyModalOpen: boolean;
      setIsApiKeyModalOpen: (isOpen: boolean) => void;
    }

    const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

    export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
      const [apiKey, setApiKeyState] = useState<string | null>(null);
      const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

      useEffect(() => {
        const storedKey = localStorage.getItem('generation-api-key');
        if (storedKey) {
          setApiKeyState(storedKey);
        }
      }, []);

      const setApiKey = (key: string) => {
        setApiKeyState(key);
        localStorage.setItem('generation-api-key', key);
        setIsApiKeyModalOpen(false);
      };

      return (
        <ApiKeyContext.Provider value={{ apiKey, setApiKey, isApiKeyModalOpen, setIsApiKeyModalOpen }}>
          {children}
        </ApiKeyContext.Provider>
      );
    };

    export const useApiKey = () => {
      const context = useContext(ApiKeyContext);
      if (context === undefined) {
        throw new Error('useApiKey must be used within an ApiKeyProvider');
      }
      return context;
    };
    ```

---

#### **B. `ApiKeyModal.tsx` (New)**
*   **Purpose:** To capture the user's API key when it's missing.
*   **Code Snippet:**
    ```typescript
    // src/components/modals/ApiKeyModal.tsx
    import React, { useState } from 'react';
    import { useApiKey } from '../../context/ApiKeyContext';

    export const ApiKeyModal = () => {
      const { isApiKeyModalOpen, setApiKey } = useApiKey();
      const [inputValue, setInputValue] = useState('');

      if (!isApiKeyModalOpen) return null;

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
          setApiKey(inputValue.trim());
        }
      };

      return (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Enter Gemini API Key</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Your Gemini API Key"
              />
              <button type="submit">Save Key</button>
            </form>
          </div>
        </div>
      );
    };
    ```

---

#### **C. `assetGenerationConfig.ts` (New)**
*   **Purpose:** To centralize and define the prompt engineering rules for all asset types.
*   **OUT:** Exports a constant configuration object `assetClamps`.
*   **Code Snippet:**
    ```typescript
    // src/config/assetGenerationConfig.ts
    export const assetClamps = {
      'lens': {
        basePrompt: 'A photorealistic, circular, intricate glass lens object on a pure black background with these characteristics: {USER_PROMPT}.',
        negativePrompt: 'square, rectangle, border, frame, text, watermark, person, animal',
      },
      'element-circuit': {
        basePrompt: 'A glowing, radial, circular circuit board pattern on a transparent background with these characteristics: {USER_PROMPT}.',
        negativePrompt: 'square, rectangle, border, text, watermark, organic, flesh',
      },
      'element-iris': {
        basePrompt: 'A photorealistic, detailed eyeball iris, centered with a dark pupil, on a transparent background with these features: {USER_PROMPT}.',
        negativePrompt: 'full eye, eyelashes, skin, square, border, text, mechanical',
      },
    };
    ```

---

#### **D. `assetGenerationService.ts` (New)**
*   **Purpose:** To abstract all communication with the Gemini Flash image generator.
*   **IN:** `assetCategory`, `userPrompt`, `apiKey`.
*   **OUT:** `Promise<string>` (the image URL).
*   **Code Snippet:**
    ```typescript
    // src/services/assetGenerationService.ts
    import { assetClamps } from '../config/assetGenerationConfig';

    // NOTE: This is a conceptual endpoint. The actual Gemini API endpoint and request body
    // will need to be confirmed from the official documentation.
    const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1/images:generate";

    export async function generateAsset(
      assetCategory: string,
      userPrompt: string,
      apiKey: string
    ): Promise<string> {
      const config = assetClamps[assetCategory];
      if (!config) throw new Error(`Invalid asset category: ${assetCategory}`);

      const finalPrompt = config.basePrompt.replace('{USER_PROMPT}', userPrompt);
      
      const response = await fetch(GEMINI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt: finalPrompt,
            negative_prompt: config.negativePrompt,
            output_format: "png", // Requesting PNG for transparency
            // ... other Gemini-specific parameters like aspect_ratio, etc.
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const { imageUrl } = await response.json(); // This will depend on the actual API response structure
      return imageUrl;
    }
    ```

---

#### **E. `AssetGeneratorPanel.tsx` (New)**
*   **Purpose:** The UI for the user to select categories, write prompts, and initiate generation.
*   **IN (Props):** `baseLayerId`, `elementLayerId`.
*   **OUT (Actions):** Calls `updateLayerImageSource` from `useLayerManagement` and `setIsApiKeyModalOpen` from `useApiKey`.
*   **Code Snippet:**
    ```typescript
    // src/components/controls/AssetGeneratorPanel.tsx
    import React, { useState } from 'react';
    import { useLayerManagement } from '../../hooks/useLayerManagement';
    import { useApiKey } from '../../context/ApiKeyContext';
    import { generateAsset } from '../../services/assetGenerationService';

    export const AssetGeneratorPanel = ({ baseLayerId, elementLayerId }) => {
      const { apiKey, setIsApiKeyModalOpen } = useApiKey();
      const { updateLayerImageSource } = useLayerManagement();
      const [isLoading, setIsLoading] = useState(false);
      const [prompt, setPrompt] = useState('');
      const [category, setCategory] = useState('lens');

      const handleGenerate = async () => {
        if (!apiKey) {
          setIsApiKeyModalOpen(true);
          return;
        }

        setIsLoading(true);
        try {
          const imageUrl = await generateAsset(category, prompt, apiKey);
          const targetLayer = category === 'lens' ? baseLayerId : elementLayerId;
          updateLayerImageSource(targetLayer, imageUrl);
        } catch (error) {
          console.error("Generation failed", error);
        } finally {
          setIsLoading(false);
        }
      };

      // ... JSX for dropdown, input, button ...
    };
    ```

---

#### **F. `useLayerManagement.ts` (Integration)**
*   **Purpose:** To manage the state of all visual layers.
*   **Function to Add:** `updateLayerImageSource(layerId: string, imageUrl: string): void`
*   **Code Snippet (Conceptual):**
    ```typescript
    // src/hooks/useLayerManagement.ts
    // ...
    const updateLayerImageSource = (layerId: string, imageUrl: string) => {
      setLayers(currentLayers =>
        currentLayers.map(layer =>
          layer.id === layerId
            ? { ...layer, source: imageUrl, type: 'image' }
            : layer
        )
      );
    };
    // ...
    // return { layers, updateLayerImageSource, ... };
    ```

## **6. Implementation Steps**

1.  **Environment Setup:** Ensure developers know to create a `.env` file for local development if they wish, but the primary mechanism will be the UI-based key entry. Add `.env` to `.gitignore`.
2.  **Create Context:** Create `src/context/ApiKeyContext.tsx`.
3.  **Create Modal:** Create `src/components/modals/ApiKeyModal.tsx` and associated basic styles.
4.  **Wrap App:** In `src/App.tsx`, import and wrap the main component tree with `<ApiKeyProvider>` and include `<ApiKeyModal />`.
5.  **Create Config:** Create and populate `src/config/assetGenerationConfig.ts`.
6.  **Create Service:** Create `src/services/assetGenerationService.ts`.
7.  **Update Hook:** Add the `updateLayerImageSource` function to `useLayerManagement.ts`.
8.  **Create UI Panel:** Create the `AssetGeneratorPanel.tsx` component.
9.  **Add to App Layout:** Place the `<AssetGeneratorPanel />` in the main application layout, providing it with the correct layer IDs.
10. **Styling:** Add CSS for loading overlays, disabled buttons, and error messages.

## **7. Open Questions & Risks**

*   **API Choice:** This has been decided. We will use the **Gemini Flash image generator**. The `generateAsset` implementation will need to be tailored to its specific API request/response structure.
*   **Cost Management:** API costs are a significant risk. V2 should consider a credit system or user-level monitoring.
*   **Performance:** Generation can be slow. The UI must provide clear, persistent feedback to the user during the wait.
*   **Error Handling:** The UI needs to gracefully handle and display errors from the API (e.g., rate limits, content moderation, invalid key).

## **8. Developer Usage and Integration Guide**

This section provides instructions for developers on how to integrate and use the components defined in this plan once they are built.

### **8.1. Prerequisites**

*   Ensure you have a valid Gemini API key for image generation.
*   Run `npm run diagnose:gemini -- --images` to confirm the key sees image-capable models before wiring the UI.
*   The application must be wrapped in the `ApiKeyProvider`.
*   Adjust `DEFAULT_GEMINI_IMAGE_MODEL` in `src/services/geminiService.ts` if Google renames the Flash image model you are targeting.

### **8.2. Core Integration**

1.  **Wrap the App:** In your main application entry point (e.g., `App.tsx` or `main.tsx`), ensure the component tree is wrapped with the `ApiKeyProvider`.

    ```typescript
    // Example in App.tsx
    import { ApiKeyProvider } from './context/ApiKeyContext';
    import { ApiKeyModal } from './components/modals/ApiKeyModal';

    function App() {
      return (
        <ApiKeyProvider>
          {/* Rest of your application */}
          <ApiKeyModal />
        </ApiKeyProvider>
      );
    }
    ```

2.  **Add the Generator Panel:** Place the `AssetGeneratorPanel` component in your UI where you want the generation controls to appear. You must provide it with the `baseLayerId` and `elementLayerId` which correspond to the layers you want to target in `useLayerManagement`.

    ```typescript
    // Example in your main layout component
    import { AssetGeneratorPanel } from './components/controls/AssetGeneratorPanel';

    function MainLayout() {
      // Assuming these IDs are managed elsewhere or are static
      const BASE_LAYER_ID = 'base-lens-layer';
      const ELEMENT_LAYER_ID = 'element-overlay-layer';

      return (
        <div>
          {/* Other UI components */}
          <AssetGeneratorPanel
            baseLayerId={BASE_LAYER_ID}
            elementLayerId={ELEMENT_LAYER_ID}
          />
        </div>
      );
    }
    ```

### **8.3. Triggering the API Key Modal**

The `ApiKeyModal` will appear automatically if a generation is triggered without a key. However, you can also open it programmatically from any component.

```typescript
import { useApiKey } from './context/ApiKeyContext';

function SomeComponent() {
  const { setIsApiKeyModalOpen } = useApiKey();

  return (
    <button onClick={() => setIsApiKeyModalOpen(true)}>
      Set API Key
    </button>
  );
}
```

### **8.4. Extending with New Asset Types**

To add a new generative asset category (e.g., a new type of element):

1.  **Update the Config:** Add a new entry to the `assetClamps` object in `src/config/assetGenerationConfig.ts`. Define its `basePrompt` and `negativePrompt`.

    ```typescript
    // src/config/assetGenerationConfig.ts
    export const assetClamps = {
      'lens': { /* ... */ },
      'element-circuit': { /* ... */ },
      'element-iris': { /* ... */ },
      // New element type
      'element-nebula': {
        basePrompt: 'A vibrant, colorful nebula in a circular shape on a transparent background with these characteristics: {USER_PROMPT}.',
        negativePrompt: 'square, rectangle, border, text, watermark, hard edges',
      },
    };
    ```

2.  **Update the UI:** Add the new category key (`element-nebula`) to the dropdown options within `AssetGeneratorPanel.tsx`. The `generateAsset` service will automatically pick up the new configuration.

### **8.5. Direct Service Usage**

You can also call the `generateAsset` service directly from other parts of the application if needed.

```typescript
import { generateAsset } from './services/assetGenerationService';

async function generateCustomAsset(prompt: string, apiKey: string) {
  try {
    const imageUrl = await generateAsset('lens', prompt, apiKey);
    // Do something with the imageUrl
    console.log('Generated Asset URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Failed to generate asset:', error);
  }
}
```
""
