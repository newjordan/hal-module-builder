import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { AssetGeneratorPanel } from "../AssetGeneratorPanel";
import * as ApiKeyContext from "../../../context/ApiKeyContext";
import * as LayerManagementHook from "../../../hooks/useLayerManagement";
import * as AssetGenerationService from "../../../services/assetGenerationService";

// Mock hooks and services
const useApiKeyMock = jest.spyOn(ApiKeyContext, "useApiKey");
const useLayerManagementMock = jest.spyOn(
  LayerManagementHook,
  "useLayerManagement"
);
const generateAssetMock = jest.spyOn(AssetGenerationService, "generateAsset");

describe("AssetGeneratorPanel", () => {
  const mockSetIsApiKeyModalOpen = jest.fn();
  const mockUpdateLayerImageSource = jest.fn();
  const mockLayers = [
    {
      id: "base",
      name: "Base Image",
      type: "image",
      visible: true,
      opacity: 1,
      blendMode: "normal",
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      src: "",
    },
    {
      id: "element",
      name: "Element Image",
      type: "image",
      visible: true,
      opacity: 1,
      blendMode: "normal",
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      src: "",
    },
  ] as any;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    useLayerManagementMock.mockReturnValue({
      updateLayerImageSource: mockUpdateLayerImageSource,
    } as any);
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders correctly", () => {
    useApiKeyMock.mockReturnValue({
      apiKey: "test-key",
      setIsApiKeyModalOpen: mockSetIsApiKeyModalOpen,
    } as any);

    render(
      <AssetGeneratorPanel
        layer={mockLayers[0]}
        layers={mockLayers}
        onUpdate={jest.fn()}
        theme="frost_light"
      />
    );

    expect(screen.getByText("Asset Generator")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Prompt")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate" })
    ).toBeInTheDocument();
  });

  it("opens the API key modal if the key is missing when generate is clicked", () => {
    useApiKeyMock.mockReturnValue({
      apiKey: null,
      setIsApiKeyModalOpen: mockSetIsApiKeyModalOpen,
    } as any);

    render(
      <AssetGeneratorPanel
        layer={mockLayers[0]}
        layers={mockLayers}
        onUpdate={jest.fn()}
        theme="frost_light"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(mockSetIsApiKeyModalOpen).toHaveBeenCalledWith(true);
    expect(generateAssetMock).not.toHaveBeenCalled();
  });

  it("calls generateAsset and updates layer on successful generation", async () => {
    useApiKeyMock.mockReturnValue({
      apiKey: "test-key",
      setIsApiKeyModalOpen: mockSetIsApiKeyModalOpen,
    } as any);
    generateAssetMock.mockResolvedValue("http://example.com/new-image.png");

    render(
      <AssetGeneratorPanel
        layer={mockLayers[0]}
        layers={mockLayers}
        onUpdate={jest.fn()}
        theme="frost_light"
      />
    );

    fireEvent.change(screen.getByLabelText("Prompt"), {
      target: { value: "a cool image" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    expect(
      screen.getByRole("button", { name: "Generating..." })
    ).toBeDisabled();

    await waitFor(() => {
      expect(generateAssetMock).toHaveBeenCalledWith(
        "lens",
        "a cool image",
        "test-key",
        ""
      );
    });

    await waitFor(() => {
      expect(mockUpdateLayerImageSource).toHaveBeenCalledWith(
        "base",
        "http://example.com/new-image.png"
      );
    });
  });

  it("logs and surfaces an error when generation fails", async () => {
    useApiKeyMock.mockReturnValue({
      apiKey: "test-key",
      setIsApiKeyModalOpen: mockSetIsApiKeyModalOpen,
    } as any);
    const failure = new Error("API Error");
    generateAssetMock.mockRejectedValue(failure);

    render(
      <AssetGeneratorPanel
        layer={mockLayers[0]}
        layers={mockLayers}
        onUpdate={jest.fn()}
        theme="frost_light"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => {
      expect(generateAssetMock).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Generation failed", failure);
    });
  });
});
